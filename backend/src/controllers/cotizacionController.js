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
    if (!cliente_id || !fecha_estimada_evento || total_calculado === undefined || total_calculado === null) {
      return res.status(400).json({
        success: false,
        message: 'Los campos cliente_id, fecha_estimada_evento y total_calculado son obligatorios.',
      });
    }

    if (isNaN(total_calculado) || Number(total_calculado) < 0) {
      return res.status(400).json({
        success: false,
        message: 'El total_calculado debe ser un número positivo.',
      });
    }

    // --- Insertar cotización (SQL parametrizado) ---
    // paquete_id puede ser null (cotización sin paquete base)
    const result = await pool.query(
      `INSERT INTO cotizaciones (empresa_id, cliente_id, paquete_id, fecha_estimada_evento, total_calculado)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, empresa_id, cliente_id, paquete_id, fecha_estimada_evento,
                 total_calculado, estado, fecha_creacion`,
      [empresa_id, cliente_id, paquete_id || null, fecha_estimada_evento, total_calculado]
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
       ORDER BY c.fecha_creacion DESC`,
      [empresa_id]
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
