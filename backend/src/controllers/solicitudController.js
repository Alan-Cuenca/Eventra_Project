import pool from '../config/db.js';

// Estados válidos del ciclo de vida de una solicitud
const ESTADOS_VALIDOS = ['Pendiente', 'Aprobada', 'Rechazada'];

/**
 * Registra una nueva solicitud de modificación sobre un evento.
 *
 * Accesible por cualquier usuario autenticado (Clientes, Trabajadores,
 * Admin o Gerente pueden solicitar cambios formalmente).
 * Aislamiento SaaS: empresa_id proviene del JWT.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
export const crearSolicitud = async (req, res) => {
  const empresa_id = req.user.empresa_id;
  const { evento_id, cliente_id, descripcion_cambio } = req.body;

  try {
    // --- Validación de campos obligatorios ---
    if (!evento_id || !descripcion_cambio) {
      return res.status(400).json({
        success: false,
        message: 'Los campos evento_id y descripcion_cambio son obligatorios.',
      });
    }

    // --- Insertar solicitud (SQL parametrizado) ---
    const result = await pool.query(
      `INSERT INTO solicitudes_modificacion
         (empresa_id, evento_id, cliente_id, descripcion_cambio)
       VALUES ($1, $2, $3, $4)
       RETURNING id, empresa_id, evento_id, cliente_id,
                 descripcion_cambio, estado, fecha_solicitud`,
      [empresa_id, evento_id, cliente_id || null, descripcion_cambio]
    );

    return res.status(201).json({
      success: true,
      message: 'Solicitud de modificación registrada exitosamente.',
      data: result.rows[0],
    });

  } catch (error) {
    // FK inválida: evento_id o cliente_id no existen
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'El evento_id o cliente_id proporcionado no existe o no es válido.',
      });
    }
    console.error('[solicitudController] Error en crearSolicitud:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al registrar la solicitud.',
    });
  }
};

/**
 * Obtiene todas las solicitudes de modificación de la empresa autenticada,
 * enriquecidas con el título del evento mediante JOIN.
 *
 * Aislamiento SaaS: filtra estrictamente por empresa_id del JWT.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
export const obtenerSolicitudes = async (req, res) => {
  const empresa_id = req.user.empresa_id;

  try {
    const result = await pool.query(
      `SELECT
         s.id,
         s.empresa_id,
         s.cliente_id,
         s.descripcion_cambio,
         s.estado,
         s.fecha_solicitud,
         -- Contexto del evento asociado
         e.id     AS evento_id,
         e.titulo AS evento_titulo,
         e.estado_progreso AS evento_estado
       FROM solicitudes_modificacion s
       INNER JOIN eventos e ON s.evento_id = e.id
       WHERE s.empresa_id = $1
       ORDER BY s.fecha_solicitud DESC`,
      [empresa_id]
    );

    return res.status(200).json({
      success: true,
      total: result.rowCount,
      data: result.rows,
    });

  } catch (error) {
    console.error('[solicitudController] Error en obtenerSolicitudes:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener las solicitudes.',
    });
  }
};

/**
 * Actualiza el estado de una solicitud de modificación.
 *
 * Solo Admin (1) y Gerente (2) pueden aprobar o rechazar.
 * Doble filtro (id + empresa_id) garantiza aislamiento SaaS en el UPDATE.
 *
 * @param {import('express').Request}  req  — Parámetro :id en la URL
 * @param {import('express').Response} res
 */
export const actualizarEstadoSolicitud = async (req, res) => {
  const empresa_id = req.user.empresa_id;
  const { id } = req.params;
  const { estado } = req.body;

  try {
    // --- Validar estado recibido ---
    if (!estado) {
      return res.status(400).json({
        success: false,
        message: 'El campo estado es obligatorio.',
      });
    }

    if (!ESTADOS_VALIDOS.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: `Estado inválido. Los valores permitidos son: ${ESTADOS_VALIDOS.join(', ')}.`,
      });
    }

    // --- UPDATE con doble filtro (id + empresa_id) ---
    const result = await pool.query(
      `UPDATE solicitudes_modificacion
       SET estado = $1
       WHERE id          = $2
         AND empresa_id  = $3
       RETURNING id, empresa_id, evento_id, cliente_id,
                 descripcion_cambio, estado, fecha_solicitud`,
      [estado, id, empresa_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada o no pertenece a tu empresa.',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Estado de la solicitud actualizado a "${estado}".`,
      data: result.rows[0],
    });

  } catch (error) {
    console.error('[solicitudController] Error en actualizarEstadoSolicitud:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al actualizar la solicitud.',
    });
  }
};
