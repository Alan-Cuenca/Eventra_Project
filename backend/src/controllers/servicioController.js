import pool from '../config/db.js';

/**
 * Crea un nuevo servicio en el catálogo de la empresa del usuario autenticado.
 *
 * Aislamiento SaaS: empresa_id se extrae del JWT (req.user.empresa_id),
 * impidiendo que un usuario manipule el body para asignar el servicio a
 * otra empresa.
 *
 * Acceso restringido por RBAC: solo Administradores (1) y Gerentes (2)
 * pueden llamar a esta función (controlado desde la capa de rutas).
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
export const crearServicio = async (req, res) => {
  const empresa_id = req.user.empresa_id; // Aislamiento SaaS desde el token
  const { nombre, descripcion, precio_base } = req.body;

  try {
    // --- Validación de campos obligatorios ---
    if (!nombre || precio_base === undefined || precio_base === null) {
      return res.status(400).json({
        success: false,
        message: 'Los campos nombre y precio_base son obligatorios.',
      });
    }

    if (isNaN(precio_base) || Number(precio_base) < 0) {
      return res.status(400).json({
        success: false,
        message: 'El precio_base debe ser un número positivo.',
      });
    }

    // --- Insertar servicio (SQL parametrizado) ---
    const result = await pool.query(
      `INSERT INTO servicios (empresa_id, nombre, descripcion, precio_base)
       VALUES ($1, $2, $3, $4)
       RETURNING id, empresa_id, nombre, descripcion, precio_base, estado_activo, fecha_creacion`,
      [empresa_id, nombre, descripcion || null, precio_base]
    );

    return res.status(201).json({
      success: true,
      message: 'Servicio creado exitosamente.',
      data: result.rows[0],
    });

  } catch (error) {
    console.error('[servicioController] Error en crearServicio:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al crear el servicio.',
    });
  }
};

/**
 * Obtiene el catálogo de servicios de la empresa del usuario autenticado.
 *
 * Aislamiento SaaS: el filtro WHERE empresa_id = $1 garantiza que cada
 * empresa acceda exclusivamente a su propio catálogo de servicios.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
export const obtenerServicios = async (req, res) => {
  const empresa_id = req.user.empresa_id;

  try {
    const result = await pool.query(
      `SELECT id, empresa_id, nombre, descripcion, precio_base, estado_activo, fecha_creacion
       FROM servicios
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
    console.error('[servicioController] Error en obtenerServicios:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener los servicios.',
    });
  }
};

/**
 * Actualiza un servicio existente.
 */
export const actualizarServicio = async (req, res) => {
  const { id } = req.params;
  const empresa_id = req.user.empresa_id;
  const { nombre, descripcion, precio_base, estado_activo } = req.body;

  try {
    const result = await pool.query(
      `UPDATE servicios 
       SET nombre = COALESCE($1, nombre),
           descripcion = COALESCE($2, descripcion),
           precio_base = COALESCE($3, precio_base),
           estado_activo = COALESCE($4, estado_activo)
       WHERE id = $5 AND empresa_id = $6
       RETURNING id, nombre, descripcion, precio_base, estado_activo`,
      [nombre, descripcion, precio_base, estado_activo, id, empresa_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Servicio no encontrado o no pertenece a tu empresa.' });
    }

    return res.status(200).json({ success: true, message: 'Servicio actualizado.', data: result.rows[0] });
  } catch (error) {
    console.error('[servicioController] Error en actualizarServicio:', error.message);
    return res.status(500).json({ success: false, message: 'Error interno al actualizar.' });
  }
};

/**
 * Elimina (borrado lógico) un servicio.
 */
export const eliminarServicio = async (req, res) => {
  const { id } = req.params;
  const empresa_id = req.user.empresa_id;

  try {
    const result = await pool.query(
      `UPDATE servicios SET estado_activo = false WHERE id = $1 AND empresa_id = $2 RETURNING id`,
      [id, empresa_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Servicio no encontrado.' });
    }

    return res.status(200).json({ success: true, message: 'Servicio eliminado (borrado lógico).' });
  } catch (error) {
    console.error('[servicioController] Error en eliminarServicio:', error.message);
    return res.status(500).json({ success: false, message: 'Error interno al eliminar.' });
  }
};
