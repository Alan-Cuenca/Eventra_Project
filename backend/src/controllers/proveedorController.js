import pool from '../config/db.js';

/**
 * Registra un nuevo proveedor asociado a la empresa del usuario autenticado.
 *
 * Aislamiento SaaS: empresa_id proviene exclusivamente del JWT.
 * RBAC: Solo Admin (1) y Gerente (2) pueden crear (controlado en rutas).
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
export const crearProveedor = async (req, res) => {
  const empresa_id = req.user.empresa_id;
  const { nombre_empresa_o_contacto, especialidad, telefono, email } = req.body;

  try {
    // --- Validación de campos obligatorios ---
    if (!nombre_empresa_o_contacto || !especialidad) {
      return res.status(400).json({
        success: false,
        message: 'Los campos nombre_empresa_o_contacto y especialidad son obligatorios.',
      });
    }

    // --- Insertar proveedor (SQL parametrizado) ---
    const result = await pool.query(
      `INSERT INTO proveedores
         (empresa_id, nombre_empresa_o_contacto, especialidad, telefono, email)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, empresa_id, nombre_empresa_o_contacto, especialidad,
                 telefono, email, estado_activo, fecha_registro`,
      [
        empresa_id,
        nombre_empresa_o_contacto,
        especialidad,
        telefono || null,
        email    || null,
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Proveedor registrado exitosamente.',
      data: result.rows[0],
    });

  } catch (error) {
    console.error('[proveedorController] Error en crearProveedor:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al registrar el proveedor.',
    });
  }
};

/**
 * Obtiene todos los proveedores de la empresa del usuario autenticado.
 *
 * Aislamiento SaaS: el filtro WHERE empresa_id = $1 garantiza que cada
 * empresa únicamente pueda ver su propia cartera de proveedores.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
export const obtenerProveedores = async (req, res) => {
  const empresa_id = req.user.empresa_id;

  try {
    const result = await pool.query(
      `SELECT
         id,
         empresa_id,
         nombre_empresa_o_contacto,
         especialidad,
         telefono,
         email,
         estado_activo,
         fecha_registro
       FROM proveedores
       WHERE empresa_id = $1
       ORDER BY nombre_empresa_o_contacto ASC`,
      [empresa_id]
    );

    return res.status(200).json({
      success: true,
      total: result.rowCount,
      data: result.rows,
    });

  } catch (error) {
    console.error('[proveedorController] Error en obtenerProveedores:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener los proveedores.',
    });
  }
};

/**
 * Actualiza los datos de contacto o el estado_activo de un proveedor.
 *
 * Doble filtro (id + empresa_id) garantiza aislamiento SaaS en el UPDATE:
 * un usuario no puede modificar proveedores de otra empresa aunque conozca el UUID.
 *
 * Solo se actualizan los campos que vengan en el body (COALESCE).
 *
 * @param {import('express').Request}  req  — Parámetro :id en la URL
 * @param {import('express').Response} res
 */
export const actualizarProveedor = async (req, res) => {
  const empresa_id = req.user.empresa_id;
  const { id } = req.params;
  const { nombre_empresa_o_contacto, especialidad, telefono, email, estado_activo } = req.body;

  try {
    // Verificar que al menos un campo fue enviado
    if (
      nombre_empresa_o_contacto === undefined &&
      especialidad === undefined &&
      telefono === undefined &&
      email === undefined &&
      estado_activo === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: 'Debes enviar al menos un campo para actualizar.',
      });
    }

    // --- UPDATE con COALESCE: solo cambia los campos recibidos ---
    const result = await pool.query(
      `UPDATE proveedores
       SET
         nombre_empresa_o_contacto = COALESCE($1, nombre_empresa_o_contacto),
         especialidad               = COALESCE($2, especialidad),
         telefono                   = COALESCE($3, telefono),
         email                      = COALESCE($4, email),
         estado_activo              = COALESCE($5, estado_activo)
       WHERE id          = $6
         AND empresa_id  = $7
       RETURNING id, empresa_id, nombre_empresa_o_contacto, especialidad,
                 telefono, email, estado_activo, fecha_registro`,
      [
        nombre_empresa_o_contacto ?? null,
        especialidad               ?? null,
        telefono                   ?? null,
        email                      ?? null,
        estado_activo              ?? null,
        id,
        empresa_id,
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado o no pertenece a tu empresa.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Proveedor actualizado exitosamente.',
      data: result.rows[0],
    });

  } catch (error) {
    console.error('[proveedorController] Error en actualizarProveedor:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al actualizar el proveedor.',
    });
  }
};
