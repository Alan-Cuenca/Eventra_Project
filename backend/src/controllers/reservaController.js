import pool from '../config/db.js';

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
export const crearReserva = async (req, res) => {
  const empresa_id = req.user.empresa_id;
  const { cotizacion_id, salon_o_lugar, fecha_evento, hora_inicio, hora_fin } = req.body;

  try {
    // --- Validación de campos obligatorios ---
    if (!cotizacion_id || !salon_o_lugar || !fecha_evento || !hora_inicio || !hora_fin) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son obligatorios: cotizacion_id, salon_o_lugar, fecha_evento, hora_inicio, hora_fin.',
      });
    }

    // --- Control de concurrencia (Capa 1: Aplicación) ---
    // Verifica si ya existe una reserva CONFIRMADA para ese salón y fecha
    const conflicto = await pool.query(
      `SELECT COUNT(*) AS total
       FROM reservas
       WHERE empresa_id   = $1
         AND salon_o_lugar = $2
         AND fecha_evento  = $3
         AND estado        = 'Confirmada'`,
      [empresa_id, salon_o_lugar, fecha_evento]
    );

    if (parseInt(conflicto.rows[0].total, 10) > 0) {
      return res.status(409).json({
        success: false,
        message: `Conflicto: El salón "${salon_o_lugar}" ya se encuentra reservado para la fecha ${fecha_evento}.`,
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
  const empresa_id = req.user.empresa_id;

  try {
    const result = await pool.query(
      `SELECT
         r.id,
         r.salon_o_lugar,
         r.fecha_evento,
         r.hora_inicio,
         r.hora_fin,
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
         cl.email          AS cliente_email
       FROM reservas r
       INNER JOIN cotizaciones c  ON r.cotizacion_id = c.id
       INNER JOIN clientes     cl ON c.cliente_id    = cl.id
       WHERE r.empresa_id = $1
       ORDER BY r.fecha_evento ASC, r.hora_inicio ASC`,
      [empresa_id]
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
