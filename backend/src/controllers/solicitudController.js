import pool from '../config/db.js';
import { notificarModificacion } from '../services/emailService.js';

// Estados válidos del ciclo de vida de una solicitud
const ESTADOS_VALIDOS = ['Pendiente', 'Aprobada', 'Rechazada'];

/**
 * Registra una nueva solicitud de modificación sobre un evento.
 *
 * Accesible por Clientes (rol 4) y usuarios de la empresa (Admin, Gerente, Trabajador).
 * Aislamiento SaaS: empresa_id proviene estrictamente del JWT.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
export const crearSolicitud = async (req, res) => {
  const empresa_id = req.user.empresa_id;
  const { evento_id, cliente_id: bodyClienteId, descripcion, descripcion_cambio } = req.body;
  const descripcionFinal = (descripcion || descripcion_cambio || '').trim();

  try {
    // --- Validación de campos obligatorios ---
    if (!evento_id || !descripcionFinal) {
      return res.status(400).json({
        success: false,
        message: 'Los campos evento_id y descripcion (o descripcion_cambio) son obligatorios.',
      });
    }

    // --- Blindaje SaaS Multi-tenant (Anti-IDOR) ---
    // 1. Validar que el evento pertenezca a la empresa en sesión
    const eventoCheck = await pool.query(
      'SELECT id, titulo FROM eventos WHERE id = $1 AND empresa_id = $2',
      [evento_id, empresa_id]
    );

    if (eventoCheck.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'El evento especificado no existe o no pertenece a su empresa.',
      });
    }

    let resolvedClienteId = bodyClienteId || null;

    // 2. Si el usuario es Cliente (rol 4), validar pertenencia estricta del evento
    const esCliente = Number(req.user.rol_id) === 4 || req.user.rol === 'Cliente';
    if (esCliente) {
      // Obtener el registro de cliente asociado al email del usuario
      const clienteRes = await pool.query(
        'SELECT id FROM clientes WHERE empresa_id = $1 AND LOWER(email) = LOWER($2) LIMIT 1',
        [empresa_id, req.user.email]
      );

      resolvedClienteId = clienteRes.rows.length > 0 ? clienteRes.rows[0].id : null;

      // Verificar que el evento pertenezca a este cliente mediante reserva/cotización
      const pertenenciaCheck = await pool.query(
        `SELECT e.id
         FROM eventos e
         JOIN reservas r ON e.reserva_id = r.id
         JOIN cotizaciones c ON r.cotizacion_id = c.id
         JOIN clientes cl ON c.cliente_id = cl.id
         WHERE e.id = $1 AND e.empresa_id = $2
           AND (cl.id = $3 OR LOWER(cl.email) = LOWER($4))`,
        [evento_id, empresa_id, resolvedClienteId, req.user.email]
      );

      if (pertenenciaCheck.rowCount === 0) {
        return res.status(403).json({
          success: false,
          message: 'No tienes autorización para solicitar modificaciones en este evento o no pertenece a tu cuenta.',
        });
      }
    } else if (bodyClienteId) {
      // Para usuarios administrativos, validar que el cliente proporcionado pertenezca a la empresa
      const clienteCheck = await pool.query(
        'SELECT id FROM clientes WHERE id = $1 AND empresa_id = $2',
        [bodyClienteId, empresa_id]
      );

      if (clienteCheck.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'El cliente especificado no pertenece a su empresa.',
        });
      }
    }

    // --- Insertar solicitud (SQL parametrizado) ---
    const result = await pool.query(
      `INSERT INTO solicitudes_modificacion
         (empresa_id, evento_id, cliente_id, descripcion_cambio)
       VALUES ($1, $2, $3, $4)
       RETURNING id, empresa_id, evento_id, cliente_id,
                 descripcion_cambio, descripcion_cambio AS descripcion, estado, fecha_solicitud`,
      [empresa_id, evento_id, resolvedClienteId, descripcionFinal]
    );

    return res.status(201).json({
      success: true,
      message: 'Solicitud de modificación registrada exitosamente.',
      data: result.rows[0],
    });

  } catch (error) {
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
 * Obtiene todas las solicitudes de modificación.
 *
 * Filtro SaaS y RBAC:
 * - Clientes (rol 4): solo ven su propio historial de solicitudes.
 * - Admin/Gerente/Trabajador: ven todas las solicitudes de la empresa.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
export const obtenerSolicitudes = async (req, res) => {
  const empresa_id = req.user.empresa_id;
  const esCliente = Number(req.user.rol_id) === 4 || req.user.rol === 'Cliente';

  try {
    let result;

    if (esCliente) {
      result = await pool.query(
        `SELECT
           s.id,
           s.empresa_id,
           s.cliente_id,
           s.descripcion_cambio,
           s.descripcion_cambio AS descripcion,
           s.estado,
           s.fecha_solicitud,
           e.id     AS evento_id,
           e.titulo AS evento_titulo,
           e.estado_progreso AS evento_estado,
           r.fecha_evento,
           CONCAT(cl.nombres, ' ', cl.apellidos) AS cliente,
           cl.email AS cliente_email
         FROM solicitudes_modificacion s
         INNER JOIN eventos e ON s.evento_id = e.id
         LEFT  JOIN reservas r ON e.reserva_id = r.id
         LEFT  JOIN clientes cl ON s.cliente_id = cl.id
         WHERE s.empresa_id = $1
           AND (
             s.cliente_id IN (SELECT id FROM clientes WHERE empresa_id = $1 AND LOWER(email) = LOWER($2))
             OR LOWER(cl.email) = LOWER($2)
           )
         ORDER BY s.fecha_solicitud DESC`,
        [empresa_id, req.user.email]
      );
    } else {
      result = await pool.query(
        `SELECT
           s.id,
           s.empresa_id,
           s.cliente_id,
           s.descripcion_cambio,
           s.descripcion_cambio AS descripcion,
           s.estado,
           s.fecha_solicitud,
           e.id     AS evento_id,
           e.titulo AS evento_titulo,
           e.estado_progreso AS evento_estado,
           r.fecha_evento,
           CONCAT(cl.nombres, ' ', cl.apellidos) AS cliente,
           cl.email AS cliente_email,
           cl.telefono AS cliente_telefono
         FROM solicitudes_modificacion s
         INNER JOIN eventos e ON s.evento_id = e.id
         LEFT  JOIN reservas r ON e.reserva_id = r.id
         LEFT  JOIN clientes cl ON s.cliente_id = cl.id
         WHERE s.empresa_id = $1
         ORDER BY s.fecha_solicitud DESC`,
        [empresa_id]
      );
    }

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
 * Actualiza el estado de una solicitud de modificación (Aprobar / Rechazar).
 *
 * RBAC: Solo Administrador (1) y Gerente (2).
 * Trazabilidad SaaS: dispara automáticamente la notificación por correo al cliente.
 *
 * @param {import('express').Request}  req  — Parámetro :id en la URL
 * @param {import('express').Response} res
 */
export const actualizarEstadoSolicitud = async (req, res) => {
  const empresa_id = req.user.empresa_id;
  const { id } = req.params;
  const { estado } = req.body;

  try {
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

    // UPDATE atómico con doble filtro id + empresa_id
    const result = await pool.query(
      `UPDATE solicitudes_modificacion
       SET estado = $1
       WHERE id          = $2
         AND empresa_id  = $3
       RETURNING id, empresa_id, evento_id, cliente_id,
                 descripcion_cambio, descripcion_cambio AS descripcion, estado, fecha_solicitud`,
      [estado, id, empresa_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada o no pertenece a tu empresa.',
      });
    }

    const solicitudActualizada = result.rows[0];

    // Disparar notificación por correo de forma asíncrona y desacoplada
    try {
      const infoQuery = await pool.query(
        `SELECT
           s.descripcion_cambio,
           e.titulo AS evento_titulo,
           cl.email AS cliente_email,
           CONCAT(cl.nombres, ' ', cl.apellidos) AS cliente_nombre
         FROM solicitudes_modificacion s
         INNER JOIN eventos e ON s.evento_id = e.id
         LEFT  JOIN clientes cl ON s.cliente_id = cl.id
         WHERE s.id = $1 AND s.empresa_id = $2`,
        [id, empresa_id]
      );

      if (infoQuery.rows.length > 0 && infoQuery.rows[0].cliente_email) {
        const { cliente_email, cliente_nombre, evento_titulo, descripcion_cambio } = infoQuery.rows[0];
        notificarModificacion(cliente_email, estado, {
          eventoNombre: evento_titulo,
          clienteNombre: cliente_nombre,
          descripcionCambio: descripcion_cambio,
        }).catch((emailErr) => {
          console.error('[solicitudController] Falló envío de correo para solicitud:', emailErr.message);
        });
      }
    } catch (notifErr) {
      console.error('[solicitudController] Error preparando notificación de cambio:', notifErr.message);
    }

    return res.status(200).json({
      success: true,
      message: `Estado de la solicitud actualizado a "${estado}".`,
      data: solicitudActualizada,
    });

  } catch (error) {
    console.error('[solicitudController] Error en actualizarEstadoSolicitud:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al actualizar la solicitud.',
    });
  }
};
