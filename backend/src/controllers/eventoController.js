import pool from '../config/db.js';

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

  try {
    // --- Validación de campos obligatorios ---
    if (!reserva_id || !titulo) {
      return res.status(400).json({
        success: false,
        message: 'Los campos reserva_id y titulo son obligatorios.',
      });
    }

    // --- Insertar evento (SQL parametrizado) ---
    const result = await pool.query(
      `INSERT INTO eventos (empresa_id, reserva_id, titulo, descripcion)
       VALUES ($1, $2, $3, $4)
       RETURNING id, empresa_id, reserva_id, titulo, descripcion, estado_progreso, fecha_creacion`,
      [empresa_id, reserva_id, titulo, descripcion || null]
    );

    return res.status(201).json({
      success: true,
      message: 'Evento creado exitosamente.',
      data: result.rows[0],
    });

  } catch (error) {
    // FK inválida: reserva_id no existe o no pertenece a esta empresa
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
         e.fecha_creacion,
         -- Datos de la reserva vinculada
         r.id            AS reserva_id,
         r.salon_o_lugar,
         r.fecha_evento,
         r.hora_inicio,
         r.hora_fin,
         r.estado        AS reserva_estado
       FROM eventos e
       INNER JOIN reservas r ON e.reserva_id = r.id
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
