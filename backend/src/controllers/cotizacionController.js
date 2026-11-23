import pool from '../config/db.js';
import { validarFecha, validarMonto } from '../utils/validaciones.js';

/**
 * Crea una nueva cotización para un cliente de la empresa autenticada.
 *
 * Aislamiento SaaS: empresa_id proviene exclusivamente del JWT.
 * RBAC: Administrador (1), Gerente (2) y Trabajador (3) pueden crear.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
export const crearCotizacion = async (req, res) => {
  const empresa_id = req.user.empresa_id;
  const { cliente_id, paquete_id, fecha_estimada_evento, total_calculado, servicios_ids, tipo_evento, num_invitados } = req.body;

  try {
    // --- Validación de campos obligatorios ---
    if (!cliente_id || !fecha_estimada_evento) {
      return res.status(400).json({
        success: false,
        message: 'Los campos cliente_id y fecha_estimada_evento son obligatorios.',
      });
    }

    const errorFecha = validarFecha(fecha_estimada_evento, 'fecha estimada del evento');
    if (errorFecha) {
      return res.status(400).json({ success: false, message: errorFecha });
    }

    const tieneTotal = total_calculado !== undefined && total_calculado !== null && total_calculado !== '';
    const errorTotal = tieneTotal ? validarMonto(total_calculado, { permitirCero: true, etiqueta: 'total_calculado' }) : null;
    if (errorTotal) {
      return res.status(400).json({ success: false, message: errorTotal });
    }
    const idsServicios = Array.isArray(servicios_ids) ? [...new Set(servicios_ids.map(String))] : [];
    if (idsServicios.length > 50) {
      return res.status(400).json({ success: false, message: 'Una cotización admite hasta 50 servicios.' });
    }
    if (!paquete_id && !tieneTotal && idsServicios.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debes indicar un paquete_id, servicios o un total_calculado.',
      });
    }
    const invitados = num_invitados === undefined || num_invitados === null || num_invitados === '' ? null : Number(num_invitados);
    if (invitados !== null && (!Number.isInteger(invitados) || invitados < 1 || invitados > 100000)) {
      return res.status(400).json({ success: false, message: 'El número de invitados debe ser un entero entre 1 y 100000.' });
    }

    // --- Blindaje SaaS Multi-tenant (Anti-IDOR) ---
    // 1. Validar que el cliente exista y pertenezca a la empresa en sesión
    const clienteCheck = await pool.query(
      'SELECT id, estado_activo FROM clientes WHERE id = $1 AND empresa_id = $2',
      [cliente_id, empresa_id]
    );

    if (clienteCheck.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'El cliente especificado no existe o no pertenece a su empresa.',
      });
    }
    if (clienteCheck.rows[0].estado_activo === false) {
      return res.status(400).json({ success: false, message: 'El cliente está desactivado. Reactívalo antes de cotizar.' });
    }

    // 2. Si se especifica paquete_id, validar que pertenezca a la empresa en sesión
    let totalFinal = tieneTotal ? Number(total_calculado) : 0;
    let precioPaquete = 0;
    if (paquete_id) {
      const paqueteCheck = await pool.query(
        'SELECT id, precio_total, estado_activo FROM paquetes WHERE id = $1 AND empresa_id = $2',
        [paquete_id, empresa_id]
      );

      if (paqueteCheck.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'El paquete especificado no existe o no pertenece a su empresa.',
        });
      }
      // El total nunca puede ser menor al precio del paquete: lo fija el servidor.
      if (paqueteCheck.rows[0].estado_activo === false) {
        return res.status(400).json({ success: false, message: 'El paquete seleccionado ya no está disponible.' });
      }
      precioPaquete = Number(paqueteCheck.rows[0].precio_total) || 0;
      totalFinal = Math.max(totalFinal, precioPaquete);
    }

    // 3. Servicios elegidos: deben ser de la empresa y el total lo calcula el servidor
    //    (precio del paquete + precio_base de cada servicio), ignorando el total del cliente.
    let serviciosFilas = [];
    if (idsServicios.length > 0) {
      const serviciosCheck = await pool.query(
        'SELECT id, precio_base FROM servicios WHERE id = ANY($1::uuid[]) AND empresa_id = $2 AND estado_activo = true',
        [idsServicios, empresa_id]
      );
      serviciosFilas = serviciosCheck.rows || [];
      if (serviciosFilas.length !== idsServicios.length) {
        return res.status(404).json({
          success: false,
          message: 'Alguno de los servicios seleccionados no existe, está inactivo o no pertenece a su empresa.',
        });
      }
      totalFinal = precioPaquete + serviciosFilas.reduce((suma, s) => suma + (Number(s.precio_base) || 0), 0);
    }

    // --- Insertar cotización (SQL parametrizado) ---
    // paquete_id puede ser null (cotización sin paquete base)
    if (!(totalFinal > 0)) {
      return res.status(400).json({
        success: false,
        message: 'La cotización debe tener un total mayor a $0: elige un paquete o al menos un servicio.',
      });
    }

    const result = await pool.query(
      `INSERT INTO cotizaciones (empresa_id, cliente_id, paquete_id, fecha_estimada_evento, total_calculado, tipo_evento, num_invitados)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, empresa_id, cliente_id, paquete_id, fecha_estimada_evento,
                 total_calculado, estado, fecha_creacion, tipo_evento, num_invitados`,
      [empresa_id, cliente_id, paquete_id || null, fecha_estimada_evento, totalFinal,
       typeof tipo_evento === 'string' && tipo_evento.trim() ? tipo_evento.trim().slice(0, 60) : null, invitados]
    );

    // Guardar los servicios elegidos con su precio al momento de cotizar
    for (const s of serviciosFilas) {
      await pool.query(
        'INSERT INTO cotizacion_servicios (cotizacion_id, servicio_id, precio_unitario) VALUES ($1, $2, $3)',
        [result.rows[0].id, s.id, s.precio_base]
      );
    }

    return res.status(201).json({
      success: true,
      message: 'Cotización creada exitosamente.',
      data: result.rows[0],
    });

  } catch (error) {
    // Violación de FK: cliente_id o paquete_id no existen
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'El cliente_id o paquete_id proporcionado no existe o no es válido.',
      });
    }
    console.error('[cotizacionController] Error en crearCotizacion:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al crear la cotización.',
    });
  }
};

/**
 * Obtiene todas las cotizaciones de la empresa del usuario autenticado,
 * enriquecidas con datos del cliente y del paquete mediante JOINs.
 *
 * Aislamiento SaaS: filtra estrictamente por cotizaciones.empresa_id.
 * LEFT JOIN con paquetes para incluir cotizaciones sin paquete asignado.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
export const obtenerCotizaciones = async (req, res) => {
  const empresa_id = req.user.empresa_id;
  const emailCliente = Number(req.user.rol_id) === 4 ? req.user.email : null; // Cliente: solo sus datos

  try {
    const result = await pool.query(
      `SELECT
         c.id,
         c.empresa_id,
         c.fecha_estimada_evento,
         c.total_calculado,
         c.estado,
         c.fecha_creacion,
         c.tipo_evento,
         c.num_invitados,
         COALESCE((SELECT json_agg(json_build_object('id', sv.id, 'nombre', sv.nombre, 'precio', cs.precio_unitario))
                   FROM cotizacion_servicios cs JOIN servicios sv ON sv.id = cs.servicio_id
                   WHERE cs.cotizacion_id = c.id), '[]'::json) AS servicios,
         -- Datos del cliente
         cl.id           AS cliente_id,
         cl.nombres      AS cliente_nombres,
         cl.apellidos    AS cliente_apellidos,
         cl.email        AS cliente_email,
         -- Datos del paquete (puede ser NULL)
         p.id            AS paquete_id,
         p.nombre        AS paquete_nombre,
         p.precio_total  AS paquete_precio_total
       FROM cotizaciones c
       INNER JOIN clientes cl ON c.cliente_id = cl.id
       LEFT  JOIN paquetes  p  ON c.paquete_id = p.id
       WHERE c.empresa_id = $1
         AND ($2::text IS NULL OR LOWER(cl.email) = LOWER($2))
       ORDER BY c.fecha_creacion DESC`,
      [empresa_id, emailCliente]
    );

    return res.status(200).json({
      success: true,
      total: result.rowCount,
      data: result.rows,
    });

  } catch (error) {
    console.error('[cotizacionController] Error en obtenerCotizaciones:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener las cotizaciones.',
    });
  }
};

const ESTADOS_COTIZACION = ['Pendiente', 'Aprobada', 'Rechazada', 'Completada'];

/**
 * GET /api/cotizaciones/:id — detalle de una cotización de la empresa.
 */
export const obtenerCotizacionPorId = async (req, res) => {
  const empresa_id = req.user.empresa_id;
  const emailCliente = Number(req.user.rol_id) === 4 ? req.user.email : null; // Cliente: solo sus datos
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT c.id, c.empresa_id, c.fecha_estimada_evento, c.total_calculado, c.estado, c.fecha_creacion,
              c.tipo_evento, c.num_invitados,
              COALESCE((SELECT json_agg(json_build_object('id', sv.id, 'nombre', sv.nombre, 'precio', cs.precio_unitario))
                        FROM cotizacion_servicios cs JOIN servicios sv ON sv.id = cs.servicio_id
                        WHERE cs.cotizacion_id = c.id), '[]'::json) AS servicios,
              cl.id AS cliente_id, cl.nombres AS cliente_nombres, cl.apellidos AS cliente_apellidos,
              cl.email AS cliente_email,
              p.id AS paquete_id, p.nombre AS paquete_nombre, p.precio_total AS paquete_precio_total
       FROM cotizaciones c
       INNER JOIN clientes cl ON c.cliente_id = cl.id
       LEFT JOIN paquetes p ON c.paquete_id = p.id
       WHERE c.id = $1 AND c.empresa_id = $2
         AND ($3::text IS NULL OR LOWER(cl.email) = LOWER($3))`,
      [id, empresa_id, emailCliente]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Cotización no encontrada.' });
    }
    return res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    if (error.code === '22P02') {
      return res.status(400).json({ success: false, message: 'Identificador de cotización inválido.' });
    }
    console.error('[cotizacionController] Error en obtenerCotizacionPorId:', error.message);
    return res.status(500).json({ success: false, message: 'Error interno del servidor al obtener la cotización.' });
  }
};

/**
 * PATCH /api/cotizaciones/:id/estado — aprueba, rechaza o completa una cotización.
 * Transiciones: Pendiente -> Aprobada | Rechazada; Aprobada -> Completada | Rechazada.
 */
export const actualizarEstadoCotizacion = async (req, res) => {
  const empresa_id = req.user.empresa_id;
  const { id } = req.params;
  const { estado } = req.body;

  const TRANSICIONES = {
    Pendiente: ['Aprobada', 'Rechazada'],
    Aprobada: ['Completada', 'Rechazada'],
    Rechazada: [],
    Completada: [],
  };

  try {
    if (!estado || !ESTADOS_COTIZACION.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: `El estado debe ser uno de: ${ESTADOS_COTIZACION.join(', ')}.`,
      });
    }

    const actual = await pool.query(
      'SELECT estado FROM cotizaciones WHERE id = $1 AND empresa_id = $2',
      [id, empresa_id]
    );
    if (actual.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Cotización no encontrada.' });
    }

    const estadoActual = actual.rows[0].estado || 'Pendiente';
    if (!(TRANSICIONES[estadoActual] || []).includes(estado)) {
      return res.status(409).json({
        success: false,
        message: `No se puede pasar una cotización de "${estadoActual}" a "${estado}".`,
      });
    }

    const result = await pool.query(
      `UPDATE cotizaciones SET estado = $1 WHERE id = $2 AND empresa_id = $3
       RETURNING id, estado, total_calculado`,
      [estado, id, empresa_id]
    );
    return res.status(200).json({
      success: true,
      message: `Cotización marcada como ${estado}.`,
      data: result.rows[0],
    });
  } catch (error) {
    if (error.code === '22P02') {
      return res.status(400).json({ success: false, message: 'Identificador de cotización inválido.' });
    }
    console.error('[cotizacionController] Error en actualizarEstadoCotizacion:', error.message);
    return res.status(500).json({ success: false, message: 'Error interno del servidor al actualizar la cotización.' });
  }
};
