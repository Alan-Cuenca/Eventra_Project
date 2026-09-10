import pool from '../config/db.js';

/**
 * Crea un nuevo paquete y asocia sus servicios usando una transacción SQL.
 *
 * Flujo transaccional:
 *  1. BEGIN      → inicia la transacción atómica
 *  2. INSERT     → crea el paquete y captura su UUID generado
 *  3. INSERT × N → inserta cada relación en paquete_servicios
 *  4. COMMIT     → confirma todos los cambios si no hubo errores
 *  ROLLBACK      → revierte todo si ocurre cualquier fallo
 *
 * Aislamiento SaaS: empresa_id proviene del JWT, nunca del body.
 * RBAC: la restricción Admin/Gerente se aplica en la capa de rutas.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
export const crearPaquete = async (req, res) => {
  const empresa_id = req.user.empresa_id;
  const { nombre, descripcion, precio_total, servicios_ids } = req.body;

  // --- Validación de campos obligatorios ---
  if (!nombre || precio_total === undefined || precio_total === null) {
    return res.status(400).json({
      success: false,
      message: 'Los campos nombre y precio_total son obligatorios.',
    });
  }

  if (!Array.isArray(servicios_ids) || servicios_ids.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Debes incluir al menos un servicio en el arreglo servicios_ids.',
    });
  }

  if (isNaN(precio_total) || Number(precio_total) < 0) {
    return res.status(400).json({
      success: false,
      message: 'El precio_total debe ser un número positivo.',
    });
  }

  // Adquirimos un cliente del pool para ejecutar la transacción completa
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // --- Paso 1: Insertar el paquete ---
    const paqueteResult = await client.query(
      `INSERT INTO paquetes (empresa_id, nombre, descripcion, precio_total)
       VALUES ($1, $2, $3, $4)
       RETURNING id, empresa_id, nombre, descripcion, precio_total, estado_activo, fecha_creacion`,
      [empresa_id, nombre, descripcion || null, precio_total]
    );

    const nuevoPaquete = paqueteResult.rows[0];
    const paquete_id = nuevoPaquete.id;

    // --- Paso 2: Insertar las relaciones N:M en paquete_servicios ---
    for (const servicio_id of servicios_ids) {
      await client.query(
        `INSERT INTO paquete_servicios (paquete_id, servicio_id)
         VALUES ($1, $2)`,
        [paquete_id, servicio_id]
      );
    }

    await client.query('COMMIT');

    return res.status(201).json({
      success: true,
      message: 'Paquete creado exitosamente con sus servicios asociados.',
      data: {
        ...nuevoPaquete,
        servicios_ids,
      },
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[paqueteController] Error en crearPaquete — ROLLBACK ejecutado:', error.message);

    // Violación de FK: servicio_id no existe o no pertenece a esta empresa
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'Uno o más servicios_ids no existen o no son válidos.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al crear el paquete.',
    });

  } finally {
    // Siempre liberar el cliente de vuelta al pool
    client.release();
  }
};

/**
 * Obtiene todos los paquetes de la empresa del usuario autenticado.
 *
 * Aislamiento SaaS: filtra estrictamente por empresa_id del JWT.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
export const obtenerPaquetes = async (req, res) => {
  const empresa_id = req.user.empresa_id;

  try {
    const result = await pool.query(
      `SELECT id, empresa_id, nombre, descripcion, precio_total, estado_activo, fecha_creacion
       FROM paquetes
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
    console.error('[paqueteController] Error en obtenerPaquetes:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener los paquetes.',
    });
  }
};
