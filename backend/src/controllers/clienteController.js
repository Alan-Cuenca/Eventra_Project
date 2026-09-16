import pool from '../config/db.js';

/**
 * Crea un nuevo cliente asociado a la empresa del usuario autenticado.
 *
 * El empresa_id se extrae del JWT (req.user.empresa_id), garantizando
 * que un usuario solo pueda crear clientes dentro de su propia empresa.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
export const crearCliente = async (req, res) => {
  // Aislamiento SaaS: empresa_id viene del token, no del body
  const empresa_id = req.user.empresa_id;
  const { nombres, apellidos, email, telefono } = req.body;

  try {
    // --- Validación de campos obligatorios ---
    if (!nombres || !apellidos) {
      return res.status(400).json({
        success: false,
        message: 'Los campos nombres y apellidos son obligatorios.',
      });
    }

    // --- Insertar cliente (SQL parametrizado) ---
    const result = await pool.query(
      `INSERT INTO clientes (empresa_id, nombres, apellidos, email, telefono)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, empresa_id, nombres, apellidos, email, telefono, estado_activo, fecha_creacion`,
      [empresa_id, nombres, apellidos, email || null, telefono || null]
    );

    return res.status(201).json({
      success: true,
      message: 'Cliente creado exitosamente.',
      data: result.rows[0],
    });

  } catch (error) {
    // Manejo de email duplicado (violación de UNIQUE)
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un cliente registrado con ese email.',
      });
    }
    console.error('[clienteController] Error en crearCliente:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al crear el cliente.',
    });
  }
};

/**
 * Obtiene todos los clientes pertenecientes a la empresa del usuario autenticado.
 *
 * Aislamiento SaaS: el filtro WHERE empresa_id = $1 garantiza que cada
 * empresa únicamente pueda ver sus propios clientes.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
export const obtenerClientes = async (req, res) => {
  const empresa_id = req.user.empresa_id;

  try {
    const result = await pool.query(
      `SELECT id, empresa_id, nombres, apellidos, email, telefono, estado_activo, fecha_creacion
       FROM clientes
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
    console.error('[clienteController] Error en obtenerClientes:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener los clientes.',
    });
  }
};

/**
 * Actualiza un cliente existente perteneciente a la empresa del usuario.
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
export const actualizarCliente = async (req, res) => {
  const empresa_id = req.user.empresa_id;
  const { id } = req.params;
  const { nombres, apellidos, email, telefono, estado_activo } = req.body;

  try {
    const result = await pool.query(
      `UPDATE clientes
       SET nombres = COALESCE($1, nombres),
           apellidos = COALESCE($2, apellidos),
           email = COALESCE($3, email),
           telefono = COALESCE($4, telefono),
           estado_activo = COALESCE($5, estado_activo),
           fecha_actualizacion = CURRENT_TIMESTAMP
       WHERE id = $6 AND empresa_id = $7
       RETURNING id, empresa_id, nombres, apellidos, email, telefono, estado_activo, fecha_actualizacion`,
      [nombres, apellidos, email, telefono, estado_activo, id, empresa_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado o no pertenece a la empresa.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Cliente actualizado exitosamente.',
      data: result.rows[0],
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Ya existe otro cliente registrado con ese email.',
      });
    }
    console.error('[clienteController] Error en actualizarCliente:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al actualizar el cliente.',
    });
  }
};

/**
 * Elimina (borrado lógico) un cliente de la empresa del usuario.
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
export const eliminarCliente = async (req, res) => {
  const empresa_id = req.user.empresa_id;
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE clientes
       SET estado_activo = false,
           fecha_actualizacion = CURRENT_TIMESTAMP
       WHERE id = $1 AND empresa_id = $2
       RETURNING id`,
      [id, empresa_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado o no pertenece a la empresa.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Cliente eliminado exitosamente.',
    });
  } catch (error) {
    console.error('[clienteController] Error en eliminarCliente:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al eliminar el cliente.',
    });
  }
};
