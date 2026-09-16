import pool from '../config/db.js';
import bcrypt from 'bcrypt';

/**
 * Obtiene todos los usuarios pertenecientes a la empresa del usuario autenticado.
 * Aislamiento SaaS: WHERE empresa_id = $1.
 */
export const obtenerUsuarios = async (req, res) => {
  const empresa_id = req.user.empresa_id;

  try {
    const result = await pool.query(
      `SELECT id, empresa_id, rol_id, nombre, email, estado_activo, fecha_creacion
       FROM usuarios
       WHERE empresa_id = $1
       ORDER BY fecha_creacion DESC`,
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
 * Actualiza un usuario existente (rol, nombre, estado_activo, etc.) de la misma empresa.
 * También permite blanquear/cambiar la contraseña si se proporciona.
 */
export const actualizarUsuario = async (req, res) => {
  const empresa_id = req.user.empresa_id;
  const { id } = req.params;
  const { rol_id, nombre, email, password, estado_activo } = req.body;

  try {
    let passwordHash = null;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(password, salt);
    }

    const result = await pool.query(
      `UPDATE usuarios
       SET rol_id = COALESCE($1, rol_id),
           nombre = COALESCE($2, nombre),
           email = COALESCE($3, email),
           password_hash = COALESCE($4, password_hash),
           estado_activo = COALESCE($5, estado_activo),
           fecha_actualizacion = CURRENT_TIMESTAMP
       WHERE id = $6 AND empresa_id = $7
       RETURNING id, empresa_id, rol_id, nombre, email, estado_activo, fecha_actualizacion`,
      [rol_id, nombre, email, passwordHash, estado_activo, id, empresa_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado o no pertenece a la empresa.',
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
 */
export const eliminarUsuario = async (req, res) => {
  const empresa_id = req.user.empresa_id;
  const { id } = req.params;

  try {
    // Evitar que el administrador se elimine a sí mismo
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
        message: 'Usuario no encontrado o no pertenece a la empresa.',
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
