import pool from '../config/db.js';

// Estados válidos del ciclo de vida de una actividad
const ESTADOS_VALIDOS = ['Pendiente', 'En Progreso', 'Completada', 'Cancelada'];

// ID del rol Trabajador (según datos semilla en init.sql)
const ROL_TRABAJADOR = 3;

/**
 * Crea una nueva actividad/tarea asignada a un evento.
 *
 * Aislamiento SaaS: empresa_id proviene del JWT.
 * RBAC: Solo Admin (1) y Gerente (2) pueden crear (controlado en rutas).
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
export const crearActividad = async (req, res) => {
  const empresa_id = req.user.empresa_id;
  const { evento_id, responsable_id, titulo, descripcion, fecha_vencimiento } = req.body;

  try {
    // --- Validación de campos obligatorios ---
    if (!evento_id || !titulo) {
      return res.status(400).json({
        success: false,
        message: 'Los campos evento_id y titulo son obligatorios.',
      });
    }

    // --- Insertar actividad (SQL parametrizado) ---
    const result = await pool.query(
      `INSERT INTO actividades (empresa_id, evento_id, responsable_id, titulo, descripcion, fecha_vencimiento)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, empresa_id, evento_id, responsable_id, titulo,
                 descripcion, fecha_vencimiento, estado, fecha_creacion`,
      [empresa_id, evento_id, responsable_id || null, titulo, descripcion || null, fecha_vencimiento || null]
    );

    return res.status(201).json({
      success: true,
      message: 'Actividad creada y asignada exitosamente.',
      data: result.rows[0],
    });

  } catch (error) {
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'El evento_id o responsable_id proporcionado no existe o no es válido.',
      });
    }
    console.error('[actividadController] Error en crearActividad:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al crear la actividad.',
    });
  }
};

/**
 * Obtiene las actividades de la empresa del usuario autenticado.
 *
 * Lógica diferenciada por rol:
 *  - Trabajador (rol_id === 3): ve únicamente sus actividades asignadas
 *    (WHERE responsable_id = req.user.id).
 *  - Admin / Gerente:           ve todas las actividades de la empresa.
 *
 * Aislamiento SaaS: siempre filtra por empresa_id del JWT.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
export const obtenerActividades = async (req, res) => {
  const empresa_id = req.user.empresa_id;
  const { id: usuario_id, rol_id } = req.user;

  try {
    // Base de la consulta con JOIN a eventos para contexto
    let query = `
      SELECT
        a.id,
        a.titulo,
        a.descripcion,
        a.fecha_vencimiento,
        a.estado,
        a.fecha_creacion,
        a.responsable_id,
        -- Contexto del evento al que pertenece la actividad
        e.id     AS evento_id,
        e.titulo AS evento_titulo,
        e.estado_progreso AS evento_estado
      FROM actividades a
      INNER JOIN eventos e ON a.evento_id = e.id
      WHERE a.empresa_id = $1`;

    const params = [empresa_id];

    // Si es Trabajador, restringe a sus propias actividades asignadas
    if (rol_id === ROL_TRABAJADOR) {
      query += ` AND a.responsable_id = $2`;
      params.push(usuario_id);
    }

    query += ` ORDER BY a.fecha_vencimiento ASC NULLS LAST, a.fecha_creacion DESC`;

    const result = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      total: result.rowCount,
      data: result.rows,
    });

  } catch (error) {
    console.error('[actividadController] Error en obtenerActividades:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener las actividades.',
    });
  }
};

/**
 * Actualiza el estado de una actividad específica.
 *
 * Valida el nuevo estado contra ESTADOS_VALIDOS.
 * Doble filtro (id + empresa_id) garantiza aislamiento SaaS en el UPDATE.
 *
 * @param {import('express').Request}  req  - Parámetro :id en la URL
 * @param {import('express').Response} res
 */
export const actualizarEstadoActividad = async (req, res) => {
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

    // --- Actualizar con doble filtro (id + empresa_id) ---
    const result = await pool.query(
      `UPDATE actividades
       SET estado = $1
       WHERE id = $2
         AND empresa_id = $3
       RETURNING id, titulo, estado, responsable_id, empresa_id`,
      [estado, id, empresa_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Actividad no encontrada o no pertenece a tu empresa.',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Estado de la actividad actualizado a "${estado}".`,
      data: result.rows[0],
    });

  } catch (error) {
    console.error('[actividadController] Error en actualizarEstadoActividad:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al actualizar la actividad.',
    });
  }
};
