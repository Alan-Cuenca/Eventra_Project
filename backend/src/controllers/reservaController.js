import pool from '../config/db.js';
import { validarFecha, validarHora } from '../utils/validaciones.js';

/**
 * Crea una nueva reserva de salón/lugar para un evento.
 *
 * Protección de concurrencia (doble capa):
 *  1. [Aplicación] SELECT COUNT(*) verifica disponibilidad antes de insertar.
 *  2. [Base de datos] UNIQUE(empresa_id, salon_o_lugar, fecha_evento) actúa
 *     como última barrera ante condiciones de carrera entre peticiones simultáneas.
 *
 * Aislamiento SaaS: empresa_id proviene del JWT, nunca del body.
 * RBAC: Admin (1), Gerente (2) y Trabajador (3) pueden crear reservas.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
/**
 * Cuenta reservas activas (no canceladas) del mismo salón que se solapan en el tiempo
 * con el bloque [fecha + hora_inicio, fecha + hora_fin). Soporta bloques nocturnos
 * (hora_fin <= hora_inicio se interpreta como día siguiente) y compara el salón sin
 * distinguir mayúsculas ni espacios sobrantes.
 */
const CONTAR_SOLAPAMIENTOS_SQL = `
  SELECT COUNT(*) AS total
  FROM reservas
  WHERE empresa_id = $1
    AND LOWER(TRIM(salon_o_lugar)) = LOWER(TRIM($2))
    AND estado <> 'Cancelada'
    AND ($6::uuid IS NULL OR id <> $6::uuid)
    AND fecha_evento BETWEEN ($3::date - 1) AND ($3::date + 1)
    AND (fecha_evento + hora_inicio) <
        (($3::date + $4::time) + CASE WHEN $5::time > $4::time THEN ($5::time - $4::time) ELSE ($5::time - $4::time + INTERVAL '24 hours') END)
    AND ($3::date + $4::time) <
        ((fecha_evento + hora_inicio) + CASE WHEN hora_fin > hora_inicio THEN (hora_fin - hora_inicio) ELSE (hora_fin - hora_inicio + INTERVAL '24 hours') END)
`;

/** Columnas comunes de listado y detalle de reservas (con cotización, cliente y evento). */
const SELECT_RESERVAS = `
  SELECT
    r.id,
    r.salon_o_lugar,
    r.salon_o_lugar AS salon,
    r.fecha_evento,
    r.fecha_evento  AS fecha,
    TO_CHAR(r.fecha_evento, 'YYYY-MM-DD') AS fecha_iso,
    r.hora_inicio,
    r.hora_fin,
    CONCAT(TO_CHAR(r.hora_inicio, 'HH24:MI'), ' - ', TO_CHAR(r.hora_fin, 'HH24:MI')) AS horario,
    r.estado,
    r.fecha_creacion,
    -- Datos de la cotización
    c.id              AS cotizacion_id,
    c.total_calculado AS cotizacion_total,
    c.estado          AS cotizacion_estado,
    -- Datos del cliente (a través de la cotización)
    cl.id             AS cliente_id,
    cl.nombres        AS cliente_nombres,
    cl.apellidos      AS cliente_apellidos,
    CONCAT(cl.nombres, ' ', cl.apellidos) AS cliente_nombre,
    cl.email          AS cliente_email,
    -- Datos del evento asociado
    e.id              AS evento_id,
    COALESCE(e.titulo, 'Evento agendado') AS evento_titulo
  FROM reservas r
  INNER JOIN cotizaciones c  ON r.cotizacion_id = c.id
  INNER JOIN clientes     cl ON c.cliente_id    = cl.id
  LEFT  JOIN eventos      e  ON e.reserva_id     = r.id
`;

export const crearReserva = async (req, res) => {
  const empresa_id = req.user.empresa_id;
  const { cotizacion_id, salon_o_lugar, fecha_evento, hora_inicio, hora_fin } = req.body;

  try {
    // --- Validación de campos obligatorios ---
    const errorFormato = (fecha_evento && validarFecha(fecha_evento)) || (hora_inicio && validarHora(hora_inicio, 'hora de inicio')) || (hora_fin && validarHora(hora_fin, 'hora de fin'));
    if (errorFormato) {
      return res.status(400).json({ success: false, message: errorFormato });
    }
    if (typeof salon_o_lugar === 'string' && salon_o_lugar.length > 150) {
      return res.status(400).json({ success: false, message: 'El nombre del salón no puede superar los 150 caracteres.' });
    }
    if (fecha_evento && String(fecha_evento).slice(0, 10) < new Date().toISOString().slice(0, 10)) {
      return res.status(400).json({ success: false, message: 'La fecha del evento no puede estar en el pasado.' });
    }

    if (!cotizacion_id || !salon_o_lugar || !fecha_evento || !hora_inicio || !hora_fin) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son obligatorios: cotizacion_id, salon_o_lugar, fecha_evento, hora_inicio, hora_fin.',
      });
    }

    // --- Blindaje SaaS Multi-tenant (Anti-IDOR) ---
    // Validar que la cotización pertenezca estrictamente a la empresa en sesión
    const cotizacionCheck = await pool.query(
      `SELECT c.id, c.estado,
              EXISTS (SELECT 1 FROM reservas r WHERE r.cotizacion_id = c.id AND r.estado <> 'Cancelada') AS tiene_reserva
       FROM cotizaciones c WHERE c.id = $1 AND c.empresa_id = $2`,
      [cotizacion_id, empresa_id]
    );

    if (cotizacionCheck.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'La cotización especificada no existe o no pertenece a su empresa.',
      });
    }

    // Regla de negocio: solo se reserva sobre una cotización aprobada y que aún no tenga reserva activa
    const cot = cotizacionCheck.rows[0];
    if (cot.estado !== 'Aprobada') {
      return res.status(409).json({
        success: false,
        message: `La cotización debe estar Aprobada para reservar (estado actual: ${cot.estado || 'Pendiente'}).`,
      });
    }
    if (cot.tiene_reserva) {
      return res.status(409).json({
        success: false,
        message: 'Esta cotización ya tiene una reserva activa. Cancélala antes de crear otra.',
      });
    }

    // --- Control de concurrencia (Capa 1: Aplicación) ---
    // Verifica si el salón ya tiene una reserva activa que se solape en fecha y horario
    if (hora_inicio === hora_fin) {
      return res.status(400).json({
        success: false,
        message: 'La hora de inicio y la hora de fin no pueden ser iguales.',
      });
    }

    const conflicto = await pool.query(CONTAR_SOLAPAMIENTOS_SQL, [
      empresa_id, salon_o_lugar, fecha_evento, hora_inicio, hora_fin, null,
    ]);

    if (parseInt(conflicto.rows[0].total, 10) > 0) {
      return res.status(409).json({
        success: false,
        message: `Conflicto: El salón "${salon_o_lugar}" ya se encuentra reservado en esa fecha y horario (${fecha_evento}).`,
      });
    }

    // --- Insertar reserva (SQL parametrizado) ---
    const result = await pool.query(
      `INSERT INTO reservas (empresa_id, cotizacion_id, salon_o_lugar, fecha_evento, hora_inicio, hora_fin)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, empresa_id, cotizacion_id, salon_o_lugar,
                 fecha_evento, hora_inicio, hora_fin, estado, fecha_creacion`,
      [empresa_id, cotizacion_id, salon_o_lugar, fecha_evento, hora_inicio, hora_fin]
    );

    return res.status(201).json({
      success: true,
      message: 'Reserva creada exitosamente.',
      data: result.rows[0],
    });

  } catch (error) {
    // Capa 2: La BD captura duplicados ante condiciones de carrera
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: `Conflicto: El salón ya fue reservado para esa fecha por otra solicitud simultánea.`,
      });
    }
    // FK inválida: cotizacion_id no existe
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'El cotizacion_id proporcionado no existe o no es válido.',
      });
    }
    console.error('[reservaController] Error en crearReserva:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al crear la reserva.',
    });
  }
};

/**
 * Obtiene todas las reservas de la empresa del usuario autenticado,
 * enriquecidas con datos de la cotización y el cliente mediante JOINs.
 *
 * Aislamiento SaaS: filtra estrictamente por reservas.empresa_id.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
export const obtenerReservas = async (req, res) => {
  const emailCliente = Number(req.user.rol_id) === 4 ? req.user.email : null; // Cliente: solo sus datos
  const empresa_id = req.user.empresa_id;

  try {
    const result = await pool.query(
      `${SELECT_RESERVAS}
       WHERE r.empresa_id = $1
         AND ($2::text IS NULL OR LOWER(cl.email) = LOWER($2))
       ORDER BY r.fecha_evento ASC, r.hora_inicio ASC`,
      [empresa_id, emailCliente]
    );

    return res.status(200).json({
      success: true,
      total: result.rowCount,
      data: result.rows,
    });

  } catch (error) {
    console.error('[reservaController] Error en obtenerReservas:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener las reservas.',
    });
  }
};

/**
 * GET /api/reservas/:id — detalle de una reserva (precarga el formulario de edición).
 * Aislamiento SaaS por empresa_id; el Cliente solo puede ver las suyas.
 */
export const obtenerReservaPorId = async (req, res) => {
  const emailCliente = Number(req.user.rol_id) === 4 ? req.user.email : null;
  const empresa_id = req.user.empresa_id;
  const { id } = req.params;

  try {
    const result = await pool.query(
      `${SELECT_RESERVAS}
       WHERE r.id = $1 AND r.empresa_id = $2
         AND ($3::text IS NULL OR LOWER(cl.email) = LOWER($3))`,
      [id, empresa_id, emailCliente]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Reserva no encontrada.' });
    }
    return res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('[reservaController] Error en obtenerReservaPorId:', error.message);
    return res.status(500).json({ success: false, message: 'Error interno del servidor al obtener la reserva.' });
  }
};

/**
 * Actualiza los datos de una reserva (estado, horas, etc).
 */
export const actualizarReserva = async (req, res) => {
  const { id } = req.params;
  const empresa_id = req.user.empresa_id;
  const { salon_o_lugar, fecha_evento, hora_inicio, hora_fin, estado } = req.body;
  const ESTADOS_RESERVA = ['Confirmada', 'Cancelada'];

  try {
    if (estado !== undefined && estado !== null && !ESTADOS_RESERVA.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: `El estado debe ser uno de: ${ESTADOS_RESERVA.join(', ')}.`,
      });
    }

    // Verificar colisión con el resultado final de la edición (excluyendo esta misma reserva)
    const actual = await pool.query(
      `SELECT salon_o_lugar, TO_CHAR(fecha_evento, 'YYYY-MM-DD') AS fecha_evento,
              TO_CHAR(hora_inicio, 'HH24:MI:SS') AS hora_inicio,
              TO_CHAR(hora_fin, 'HH24:MI:SS') AS hora_fin, estado
       FROM reservas WHERE id = $1 AND empresa_id = $2`,
      [id, empresa_id]
    );
    if (actual.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Reserva no encontrada.' });
    }
    const previa = actual.rows[0];
    const final = {
      salon: salon_o_lugar || previa.salon_o_lugar,
      fecha: fecha_evento || previa.fecha_evento,
      inicio: hora_inicio || previa.hora_inicio,
      fin: hora_fin || previa.hora_fin,
      estado: estado || previa.estado,
    };
    if (String(final.inicio).slice(0, 5) === String(final.fin).slice(0, 5)) {
      return res.status(400).json({
        success: false,
        message: 'La hora de inicio y la hora de fin no pueden ser iguales.',
      });
    }
    if (final.estado !== 'Cancelada') {
      const conflicto = await pool.query(CONTAR_SOLAPAMIENTOS_SQL, [
        empresa_id, final.salon, final.fecha, final.inicio, final.fin, id,
      ]);
      if (parseInt(conflicto.rows[0].total, 10) > 0) {
        return res.status(409).json({
          success: false,
          message: `Conflicto: El salón "${final.salon}" ya se encuentra reservado en esa fecha y horario.`,
        });
      }
    }

    const result = await pool.query(
      `UPDATE reservas 
       SET salon_o_lugar = COALESCE($1, salon_o_lugar),
           fecha_evento = COALESCE($2, fecha_evento),
           hora_inicio = COALESCE($3, hora_inicio),
           hora_fin = COALESCE($4, hora_fin),
           estado = COALESCE($5, estado)
       WHERE id = $6 AND empresa_id = $7
       RETURNING id, salon_o_lugar, fecha_evento, hora_inicio, hora_fin, estado`,
      [salon_o_lugar, fecha_evento, hora_inicio, hora_fin, estado, id, empresa_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Reserva no encontrada.' });
    }

    return res.status(200).json({ success: true, message: 'Reserva actualizada.', data: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ success: false, message: 'Conflicto: ya existe una reserva activa para ese salón, fecha y hora.' });
    }
    console.error('[reservaController] Error en actualizarReserva:', error.message);
    return res.status(500).json({ success: false, message: 'Error interno al actualizar.' });
  }
};

/**
 * Elimina una reserva (o la cancela).
 */
export const eliminarReserva = async (req, res) => {
  const { id } = req.params;
  const empresa_id = req.user.empresa_id;

  try {
    const result = await pool.query(
      `UPDATE reservas SET estado = 'Cancelada' WHERE id = $1 AND empresa_id = $2 RETURNING id`,
      [id, empresa_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Reserva no encontrada.' });
    }

    // Coherencia: cancelar la reserva cancela su evento (salvo que ya esté finalizado)
    await pool.query(
      `UPDATE eventos SET estado_progreso = 'Cancelado'
       WHERE reserva_id = $1 AND empresa_id = $2 AND estado_progreso NOT IN ('Finalizado', 'Cancelado')`,
      [id, empresa_id]
    ).catch((err) => console.error('[reservaController] No se pudo cancelar el evento de la reserva:', err.message));

    return res.status(200).json({ success: true, message: 'Reserva cancelada. Su evento, si existía, quedó cancelado.' });
  } catch (error) {
    console.error('[reservaController] Error en eliminarReserva:', error.message);
    return res.status(500).json({ success: false, message: 'Error interno al cancelar la reserva.' });
  }
};
