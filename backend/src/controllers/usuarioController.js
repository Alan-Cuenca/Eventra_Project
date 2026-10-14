import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import { ROL_SUPER_ADMIN } from '../middlewares/authMiddleware.js';

/**
 * Obtiene todos los usuarios pertenecientes a la empresa del usuario autenticado.
 * Aislamiento SaaS: WHERE empresa_id = $1 (estrictamente desde req.user.empresa_id).
 */
export const obtenerUsuarios = async (req, res) => {
  const empresa_id = req.user.empresa_id;

  if (!empresa_id) {
    return res.status(403).json({
      success: false,
      message: 'Operación denegada. Usuario sin inquilino asignado.',
    });
  }

  try {
    const result = await pool.query(
      `SELECT u.id, u.empresa_id, u.rol_id, 
              COALESCE(u.nombre_completo, u.nombre) AS nombre_completo,
              COALESCE(u.nombre_completo, u.nombre) AS nombre,
              u.email, u.estado_activo, u.fecha_creacion,
              r.nombre AS rol_nombre
       FROM usuarios u
       LEFT JOIN roles r ON u.rol_id = r.id
       WHERE u.empresa_id = $1
       ORDER BY u.fecha_creacion DESC`,
      [empresa_id]
    );

    return res.status(200).json({
      success: true,
      total: result.rowCount,
      data: result.rows,
    });
  } catch (error) {
    console.error('[usuarioController] Error en obtenerUsuarios:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener los usuarios.',
    });
  }
};

/**
 * Crea un nuevo usuario colaborador dentro de la empresa del usuario autenticado.
 * Aislamiento SaaS: asigna obligatoriamente req.user.empresa_id.
 */
export const crearUsuario = async (req, res) => {
  const empresa_id = req.user.empresa_id;
  const { rol_id, nombre_completo, nombre, email, password } = req.body;

  if (!empresa_id) {
    return res.status(403).json({
      success: false,
      message: 'Operación denegada. Usuario sin inquilino asignado.',
    });
  }

  const nombreFinal = nombre_completo || nombre;

  if (!nombreFinal || !email || !password || !rol_id) {
    return res.status(400).json({
      success: false,
      message: 'Todos los campos son obligatorios: nombre_completo, email, password, rol_id.',
    });
  }

  if (Number(rol_id) === ROL_SUPER_ADMIN) {
    return res.status(403).json({
      success: false,
      message: 'No está permitido crear usuarios Super_Admin dentro de una empresa.',
    });
  }

  try {
    const existing = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (existing.rowCount > 0) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un usuario registrado con ese email.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await pool.query(
      `INSERT INTO usuarios (empresa_id, rol_id, nombre_completo, email, password_hash)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, empresa_id, rol_id, nombre_completo, email, estado_activo, fecha_creacion`,
      [empresa_id, Number(rol_id), nombreFinal, email, passwordHash]
    );

    return res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente dentro de la empresa.',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('[usuarioController] Error en crearUsuario:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al crear el usuario.',
    });
  }
};

/**
 * Actualiza un usuario existente de la misma empresa.
 * Aislamiento SaaS: WHERE id = $6 AND empresa_id = $7.
 */
export const actualizarUsuario = async (req, res) => {
  const empresa_id = req.user.empresa_id;
  const { id } = req.params;
  const { rol_id, nombre_completo, nombre, email, password, estado_activo } = req.body;

  if (!empresa_id) {
    return res.status(403).json({
      success: false,
      message: 'Operación denegada. Usuario sin inquilino asignado.',
    });
  }

  if (rol_id && Number(rol_id) === ROL_SUPER_ADMIN) {
    return res.status(403).json({
      success: false,
      message: 'No está permitido asignar el rol de Super_Admin desde la gestión de empresas.',
    });
  }

  const nombreFinal = nombre_completo || nombre || null;

  try {
    let passwordHash = null;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(password, salt);
    }

    const result = await pool.query(
      `UPDATE usuarios
       SET rol_id = COALESCE($1, rol_id),
           nombre_completo = COALESCE($2, nombre_completo),
           email = COALESCE($3, email),
           password_hash = COALESCE($4, password_hash),
           estado_activo = COALESCE($5, estado_activo),
           fecha_actualizacion = CURRENT_TIMESTAMP
       WHERE id = $6 AND empresa_id = $7
       RETURNING id, empresa_id, rol_id, nombre_completo, email, estado_activo, fecha_actualizacion`,
      [rol_id, nombreFinal, email, passwordHash, estado_activo, id, empresa_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado o no pertenece a tu empresa.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Usuario actualizado exitosamente.',
      data: result.rows[0],
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Ya existe otro usuario con ese email.',
      });
    }
    console.error('[usuarioController] Error en actualizarUsuario:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al actualizar el usuario.',
    });
  }
};

/**
 * Elimina (borrado lógico) un usuario de la empresa autenticada.
 * Aislamiento SaaS: WHERE id = $1 AND empresa_id = $2.
 */
export const eliminarUsuario = async (req, res) => {
  const empresa_id = req.user.empresa_id;
  const { id } = req.params;

  if (!empresa_id) {
    return res.status(403).json({
      success: false,
      message: 'Operación denegada. Usuario sin inquilino asignado.',
    });
  }

  try {
    // Evitar que el usuario se desactive a sí mismo
    if (req.user.id === id) {
      return res.status(400).json({
        success: false,
        message: 'No puedes eliminar tu propio usuario.',
      });
    }

    const result = await pool.query(
      `UPDATE usuarios
       SET estado_activo = false,
           fecha_actualizacion = CURRENT_TIMESTAMP
       WHERE id = $1 AND empresa_id = $2
       RETURNING id`,
      [id, empresa_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado o no pertenece a tu empresa.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Usuario eliminado exitosamente.',
    });
  } catch (error) {
    console.error('[usuarioController] Error en eliminarUsuario:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al eliminar el usuario.',
    });
  }
};

