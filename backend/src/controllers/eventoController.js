import pool from '../config/db.js';
import { notificarNuevoEvento } from '../services/emailService.js';

// Estados válidos del ciclo de vida de un evento
const ESTADOS_VALIDOS = ['En Planificación', 'En Progreso', 'Finalizado', 'Cancelado'];

/**
 * Crea un nuevo evento vinculado a una reserva existente.
 *
 * Aislamiento SaaS: empresa_id proviene del JWT, nunca del body.
 * RBAC: Solo Admin (1) y Gerente (2) pueden crear eventos (controlado en rutas).
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
export const crearEvento = async (req, res) => {
  const empresa_id = req.user.empresa_id;
  const { reserva_id, titulo, descripcion } = req.body;

  if (!empresa_id) {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requiere pertenecer a una empresa.',
    });
  }

  try {
    // --- Validación de campos obligatorios ---
    if (!reserva_id || !titulo) {
      return res.status(400).json({
        success: false,
        message: 'Los campos reserva_id y titulo son obligatorios.',
      });
    }

    // Aislamiento SaaS: Validar que la reserva pertenezca a la misma empresa
    const reservaCheck = await pool.query(
      `SELECT id FROM reservas WHERE id = $1 AND empresa_id = $2`,
      [reserva_id, empresa_id]
    );

    if (reservaCheck.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'La reserva indicada no existe o no pertenece a tu empresa.',
      });
    }

    // --- Insertar evento (SQL parametrizado con empresa_id del JWT) ---
    const result = await pool.query(
      `INSERT INTO eventos (empresa_id, reserva_id, titulo, descripcion)
       VALUES ($1, $2, $3, $4)
       RETURNING id, empresa_id, reserva_id, titulo, descripcion, estado_progreso, fecha_creacion`,
      [empresa_id, reserva_id, titulo, descripcion || null]
    );

    const nuevoEvento = result.rows[0];

    // Disparar notificación por correo de nuevo evento de forma asíncrona
    try {
      const clienteQuery = await pool.query(
        `SELECT
           cl.email,
           CONCAT(cl.nombres, ' ', cl.apellidos) AS cliente_nombre,
           r.fecha_evento,
           r.salon_o_lugar,
           c.total_calculado
         FROM reservas r
         LEFT JOIN cotizaciones c ON r.cotizacion_id = c.id
         LEFT JOIN clientes cl ON c.cliente_id = cl.id
         WHERE r.id = $1 AND r.empresa_id = $2`,
        [reserva_id, empresa_id]
      );

      if (clienteQuery?.rows?.length > 0 && clienteQuery.rows[0].email) {
        const clData = clienteQuery.rows[0];
        notificarNuevoEvento(clData.email, {
          titulo,
          fecha: clData.fecha_evento,
          salon: clData.salon_o_lugar,
          clienteNombre: clData.cliente_nombre,
          montoTotal: clData.total_calculado,
        }).catch((emailErr) => {
          console.error('[eventoController] Error enviando correo de nuevo evento:', emailErr.message);
        });
      }
    } catch (notifErr) {
      console.error('[eventoController] Error preparando notificación de nuevo evento:', notifErr.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Evento creado exitosamente.',
      data: nuevoEvento,
    });

  } catch (error) {
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'El reserva_id proporcionado no existe o no es válido.',
      });
    }
    console.error('[eventoController] Error en crearEvento:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al crear el evento.',
    });
  }
};

/**
 * Obtiene todos los eventos de la empresa del usuario autenticado,
 * enriquecidos con datos de la reserva mediante JOIN.
 *
 * Aislamiento SaaS: filtra estrictamente por eventos.empresa_id.
 * Ordenados por fecha de evento para facilitar la agenda.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
export const obtenerEventos = async (req, res) => {
  const empresa_id = req.user.empresa_id;

  try {
    const result = await pool.query(
      `SELECT
         e.id,
         e.titulo,
         e.descripcion,
         e.estado_progreso,
         e.estado_progreso AS estado,
         e.fecha_creacion,
         -- Datos de la reserva vinculada
         r.id            AS reserva_id,
         r.salon_o_lugar,
         r.salon_o_lugar AS salon,
         r.fecha_evento,
         r.fecha_evento  AS fecha,
         r.hora_inicio,
         r.hora_fin,
         CONCAT(TO_CHAR(r.hora_inicio, 'HH24:MI'), ' - ', TO_CHAR(r.hora_fin, 'HH24:MI')) AS horario,
         r.estado        AS reserva_estado,
         -- Datos de cotización y cliente
         c.id            AS cotizacion_id,
         c.total_calculado AS monto_total,
         cl.id           AS cliente_id,
         cl.nombres      AS cliente_nombres,
         cl.apellidos    AS cliente_apellidos,
         CONCAT(cl.nombres, ' ', cl.apellidos) AS cliente_nombre,
         cl.email        AS cliente_email,
         cl.telefono     AS cliente_telefono,
         -- Paquete
         p.id            AS paquete_id,
         p.nombre        AS paquete,
         p.nombre        AS paquete_nombre,
         -- Métricas financieras y operativas
         COALESCE((SELECT SUM(monto) FROM pagos WHERE evento_id = e.id AND estado = 'Completado'), 0) AS anticipo_pagado,
         c.total_calculado - COALESCE((SELECT SUM(monto) FROM pagos WHERE evento_id = e.id AND estado = 'Completado'), 0) AS saldo_pendiente,
         COALESCE(ROUND((SELECT COUNT(*) FILTER (WHERE estado = 'Completada')::numeric / NULLIF(COUNT(*), 0) * 100 FROM actividades WHERE evento_id = e.id)), 0) AS progreso_porcentaje,
         COALESCE((SELECT u.nombre_completo FROM actividades a JOIN usuarios u ON a.responsable_id = u.id WHERE a.evento_id = e.id LIMIT 1), 'Jorge Sailema') AS responsable,
         CASE 
           WHEN e.titulo ILIKE '%boda%' OR e.titulo ILIKE '%matrimonio%' THEN 'Matrimonio'
           WHEN e.titulo ILIKE '%xv%' OR e.titulo ILIKE '%quince%' THEN 'Quinceañera'
           ELSE 'Corporativo'
         END AS tipo,
         CASE 
           WHEN e.titulo ILIKE '%boda%' THEN 120
           WHEN e.titulo ILIKE '%xv%' THEN 90
           ELSE 60
         END AS invitados
       FROM eventos e
       INNER JOIN reservas r ON e.reserva_id = r.id
       INNER JOIN cotizaciones c ON r.cotizacion_id = c.id
       INNER JOIN clientes cl ON c.cliente_id = cl.id
       LEFT  JOIN paquetes p ON c.paquete_id = p.id
       WHERE e.empresa_id = $1
       ORDER BY r.fecha_evento ASC, r.hora_inicio ASC`,
      [empresa_id]
    );

    return res.status(200).json({
      success: true,
      total: result.rowCount,
      data: result.rows,
    });

  } catch (error) {
    console.error('[eventoController] Error en obtenerEventos:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener los eventos.',
    });
  }
};

/**
 * Actualiza el estado de progreso de un evento específico.
 *
 * Valida que el nuevo estado pertenezca al ciclo de vida definido antes
 * de hacer la actualización en la base de datos.
 * Doble filtro (id + empresa_id) garantiza que una empresa no pueda
 * modificar eventos de otra (aislamiento SaaS).
 *
 * Estados válidos: 'En Planificación' | 'En Progreso' | 'Finalizado' | 'Cancelado'
 *
 * @param {import('express').Request}  req  - Parámetro :id en la URL
 * @param {import('express').Response} res
 */
export const actualizarEstadoEvento = async (req, res) => {
  const empresa_id = req.user.empresa_id;
  const { id } = req.params;
  const { estado_progreso } = req.body;

  try {
    // --- Validar estado recibido ---
    if (!estado_progreso) {
      return res.status(400).json({
        success: false,
        message: 'El campo estado_progreso es obligatorio.',
      });
    }

    if (!ESTADOS_VALIDOS.includes(estado_progreso)) {
      return res.status(400).json({
        success: false,
        message: `Estado inválido. Los valores permitidos son: ${ESTADOS_VALIDOS.join(', ')}.`,
      });
    }

    // --- Actualizar (filtra por id + empresa_id para seguridad SaaS) ---
    const result = await pool.query(
      `UPDATE eventos
       SET estado_progreso = $1
       WHERE id = $2
         AND empresa_id = $3
       RETURNING id, titulo, estado_progreso, empresa_id`,
      [estado_progreso, id, empresa_id]
    );

    // Si no se encontró el evento (id incorrecto o de otra empresa)
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado o no pertenece a tu empresa.',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Estado del evento actualizado a "${estado_progreso}".`,
      data: result.rows[0],
    });

  } catch (error) {
    console.error('[eventoController] Error en actualizarEstadoEvento:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al actualizar el evento.',
    });
  }
};

/**
 * Obtiene el detalle de un evento por su ID enriquecido con cliente, cotización,
 * actividades y pagos.
 */
export const obtenerEventoPorId = async (req, res) => {
  const { id } = req.params;
  const empresa_id = req.user.empresa_id;

  try {
    const result = await pool.query(
      `SELECT
         e.id,
         e.titulo,
         e.descripcion,
         e.estado_progreso,
         e.estado_progreso AS estado,
         e.fecha_creacion,
         r.id            AS reserva_id,
         r.salon_o_lugar,
         r.salon_o_lugar AS salon,
         r.fecha_evento,
         r.fecha_evento  AS fecha,
         r.hora_inicio,
         r.hora_fin,
         CONCAT(TO_CHAR(r.hora_inicio, 'HH24:MI'), ' - ', TO_CHAR(r.hora_fin, 'HH24:MI')) AS horario,
         r.estado        AS reserva_estado,
         cl.id           AS cliente_id,
         cl.nombres      AS cliente_nombres,
         cl.apellidos    AS cliente_apellidos,
         CONCAT(cl.nombres, ' ', cl.apellidos) AS cliente_nombre,
         cl.email        AS cliente_email,
         cl.telefono     AS cliente_telefono,
         p.id            AS paquete_id,
         p.nombre        AS paquete,
         p.nombre        AS paquete_nombre,
         c.id            AS cotizacion_id,
         c.total_calculado AS monto_total,
         COALESCE((SELECT SUM(monto) FROM pagos WHERE evento_id = e.id AND estado = 'Completado'), 0) AS anticipo_pagado,
         c.total_calculado - COALESCE((SELECT SUM(monto) FROM pagos WHERE evento_id = e.id AND estado = 'Completado'), 0) AS saldo_pendiente,
         COALESCE(ROUND((SELECT COUNT(*) FILTER (WHERE estado = 'Completada')::numeric / NULLIF(COUNT(*), 0) * 100 FROM actividades WHERE evento_id = e.id)), 0) AS progreso_porcentaje,
         COALESCE((SELECT u.nombre_completo FROM actividades a JOIN usuarios u ON a.responsable_id = u.id WHERE a.evento_id = e.id LIMIT 1), 'Jorge Sailema') AS responsable,
         CASE 
           WHEN e.titulo ILIKE '%boda%' OR e.titulo ILIKE '%matrimonio%' THEN 'Matrimonio'
           WHEN e.titulo ILIKE '%xv%' OR e.titulo ILIKE '%quince%' THEN 'Quinceañera'
           ELSE 'Corporativo'
         END AS tipo,
         CASE 
           WHEN e.titulo ILIKE '%boda%' THEN 120
           WHEN e.titulo ILIKE '%xv%' THEN 90
           ELSE 60
         END AS invitados
       FROM eventos e
       INNER JOIN reservas r ON e.reserva_id = r.id
       INNER JOIN cotizaciones c ON r.cotizacion_id = c.id
       INNER JOIN clientes cl ON c.cliente_id = cl.id
       LEFT  JOIN paquetes p ON c.paquete_id = p.id
       WHERE e.id = $1 AND e.empresa_id = $2`,
      [id, empresa_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Evento no encontrado.' });
    }

    const evento = result.rows[0];

    // Obtener actividades asociadas al evento
    const actResult = await pool.query(
      `SELECT a.id, a.titulo AS nombre, a.titulo, a.descripcion, a.fecha_vencimiento AS fecha, a.estado,
              COALESCE(u.nombre_completo, 'Sin asignar') AS responsable
       FROM actividades a
       LEFT JOIN usuarios u ON a.responsable_id = u.id
       WHERE a.evento_id = $1 AND a.empresa_id = $2
       ORDER BY a.fecha_vencimiento ASC NULLS LAST, a.fecha_creacion DESC`,
      [id, empresa_id]
    );

    // Obtener pagos asociados al evento
    const pagosResult = await pool.query(
      `SELECT p.id, p.concepto, p.monto, p.fecha_pago AS fecha, p.metodo_pago AS metodo, p.estado, p.comprobante_url
       FROM pagos p
       WHERE p.evento_id = $1 AND p.empresa_id = $2
       ORDER BY p.fecha_pago DESC, p.fecha_registro DESC`,
      [id, empresa_id]
    );

    evento.actividades = actResult.rows;
    evento.pagos = pagosResult.rows;

    return res.status(200).json({ success: true, data: evento });
  } catch (error) {
    console.error('[eventoController] Error en obtenerEventoPorId:', error.message);
    return res.status(500).json({ success: false, message: 'Error interno al obtener evento.' });
  }
};

/**
 * Actualiza los datos principales de un evento.
 */
export const actualizarEvento = async (req, res) => {
  const { id } = req.params;
  const empresa_id = req.user.empresa_id;
  const { titulo, descripcion } = req.body;

  try {
    const result = await pool.query(
      `UPDATE eventos 
       SET titulo = COALESCE($1, titulo),
           descripcion = COALESCE($2, descripcion)
       WHERE id = $3 AND empresa_id = $4
       RETURNING id, titulo, descripcion`,
      [titulo, descripcion, id, empresa_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Evento no encontrado.' });
    }

    return res.status(200).json({ success: true, message: 'Evento actualizado.', data: result.rows[0] });
  } catch (error) {
    console.error('[eventoController] Error en actualizarEvento:', error.message);
    return res.status(500).json({ success: false, message: 'Error interno al actualizar.' });
  }
};

/**
 * Elimina un evento.
 */
export const eliminarEvento = async (req, res) => {
  const { id } = req.params;
  const empresa_id = req.user.empresa_id;

  try {
    const result = await pool.query(
      `DELETE FROM eventos WHERE id = $1 AND empresa_id = $2 RETURNING id`,
      [id, empresa_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Evento no encontrado.' });
    }

    return res.status(200).json({ success: true, message: 'Evento eliminado.' });
  } catch (error) {
    console.error('[eventoController] Error en eliminarEvento:', error.message);
    return res.status(500).json({ success: false, message: 'Error interno al eliminar.' });
  }
};
