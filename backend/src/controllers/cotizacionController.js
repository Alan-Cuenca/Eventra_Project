import pool from '../config/db.js';

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
  const { cliente_id, paquete_id, fecha_estimada_evento, total_calculado } = req.body;

  try {
    // --- Validación de campos obligatorios ---
    if (!cliente_id || !fecha_estimada_evento) {
      return res.status(400).json({
        success: false,
        message: 'Los campos cliente_id y fecha_estimada_evento son obligatorios.',
      });
    }

    const tieneTotal = total_calculado !== undefined && total_calculado !== null && total_calculado !== '';
    if (tieneTotal && (isNaN(total_calculado) || Number(total_calculado) < 0)) {
      return res.status(400).json({
        success: false,
        message: 'El total_calculado debe ser un número positivo.',
      });
    }
    if (!paquete_id && !tieneTotal) {
      return res.status(400).json({
        success: false,
        message: 'Debes indicar un paquete_id o un total_calculado.',
      });
    }

    // --- Blindaje SaaS Multi-tenant (Anti-IDOR) ---
    // 1. Validar que el cliente exista y pertenezca a la empresa en sesión
    const clienteCheck = await pool.query(
      'SELECT id FROM clientes WHERE id = $1 AND empresa_id = $2',
      [cliente_id, empresa_id]
    );

    if (clienteCheck.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'El cliente especificado no existe o no pertenece a su empresa.',
      });
    }

    // 2. Si se especifica paquete_id, validar que pertenezca a la empresa en sesión
    let totalFinal = tieneTotal ? Number(total_calculado) : 0;
    if (paquete_id) {
      const paqueteCheck = await pool.query(
        'SELECT id, precio_total FROM paquetes WHERE id = $1 AND empresa_id = $2',
        [paquete_id, empresa_id]
      );

      if (paqueteCheck.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'El paquete especificado no existe o no pertenece a su empresa.',
        });
      }
      // El total nunca puede ser menor al precio del paquete: lo fija el servidor.
      const precioPaquete = Number(paqueteCheck.rows[0].precio_total) || 0;
      totalFinal = Math.max(totalFinal, precioPaquete);
    }

    // --- Insertar cotización (SQL parametrizado) ---
    // paquete_id puede ser null (cotización sin paquete base)
    const result = await pool.query(
      `INSERT INTO cotizaciones (empresa_id, cliente_id, paquete_id, fecha_estimada_evento, total_calculado)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, empresa_id, cliente_id, paquete_id, fecha_estimada_evento,
                 total_calculado, estado, fecha_creacion`,
      [empresa_id, cliente_id, paquete_id || null, fecha_estimada_evento, totalFinal]
    );

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
