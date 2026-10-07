import pool from '../config/db.js';
import { supabase } from '../config/supabase.js';

// Estados y conceptos válidos para validación en el servidor
const ESTADOS_VALIDOS  = ['Pendiente', 'En Revisión', 'Aprobado', 'Rechazado', 'Anulado'];
const CONCEPTOS_VALIDOS = ['Anticipo', 'Abono', 'Liquidación'];

/**
 * Registra un nuevo pago o anticipo vinculado a un evento.
 *
 * Aislamiento SaaS: empresa_id proviene exclusivamente del JWT.
 * RBAC: Solo Admin (1) y Gerente (2) pueden registrar (controlado en rutas).
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
export const registrarPago = async (req, res) => {
  const empresa_id = req.user.empresa_id;
  const { evento_id, monto, concepto, metodo_pago, estado } = req.body;

  try {
    // --- Validación de campos obligatorios ---
    if (!evento_id || !monto || !concepto) {
      return res.status(400).json({
        success: false,
        message: 'Los campos evento_id, monto y concepto son obligatorios.',
      });
    }

    if (isNaN(monto) || Number(monto) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El monto debe ser un número positivo mayor a cero.',
      });
    }

    // Validar estado si se provee; de lo contrario la BD asigna 'Completado'
    if (estado && !ESTADOS_VALIDOS.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: `Estado inválido. Los valores permitidos son: ${ESTADOS_VALIDOS.join(', ')}.`,
      });
    }

    // --- Subida de Comprobante (Supabase Storage) ---
    let comprobante_url = null;
    let estadoPago = estado || (metodo_pago === 'Efectivo' ? 'Pendiente' : 'En Revisión');

    if (req.file) {
      if (!supabase) {
        return res.status(500).json({ success: false, message: 'Supabase no está configurado.' });
      }

      const file = req.file;
      const fileExt = file.originalname.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${empresa_id}/${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from('comprobantes')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
        });

      if (uploadError) {
        console.error('Error subiendo comprobante:', uploadError);
        return res.status(500).json({ success: false, message: 'Error subiendo comprobante.' });
      }

      const { data: publicUrlData } = supabase.storage.from('comprobantes').getPublicUrl(filePath);
      comprobante_url = publicUrlData.publicUrl;
      estadoPago = 'En Revisión';
    }

    // --- Insertar pago (SQL parametrizado) ---
    const result = await pool.query(
      `INSERT INTO pagos (empresa_id, evento_id, monto, concepto, metodo_pago, estado, comprobante_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, empresa_id, evento_id, monto, concepto,
                 metodo_pago, fecha_pago, estado, comprobante_url, fecha_registro`,
      [
        empresa_id,
        evento_id,
        Number(monto),
        concepto,
        metodo_pago || null,
        estadoPago,
        comprobante_url
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Pago registrado exitosamente.',
      data: result.rows[0],
    });

  } catch (error) {
    // Violación de FK: evento_id no existe o no pertenece a la empresa
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'El evento_id proporcionado no existe o no es válido.',
      });
    }
    console.error('[pagoController] Error en registrarPago:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al registrar el pago.',
    });
  }
};

/**
 * Obtiene todos los pagos de la empresa del usuario autenticado,
 * enriquecidos con el título del evento mediante JOIN.
 *
 * Aislamiento SaaS: filtra estrictamente por pagos.empresa_id.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
export const obtenerPagos = async (req, res) => {
  const empresa_id = req.user.empresa_id;

  try {
    const result = await pool.query(
      `SELECT
         p.id,
         p.empresa_id,
         p.monto,
         p.concepto,
         p.metodo_pago,
         p.fecha_pago,
         p.estado,
         p.comprobante_url,
         p.fecha_registro,
         -- Contexto del evento asociado
         e.id     AS evento_id,
         e.titulo AS evento_titulo,
         e.estado_progreso AS evento_estado
       FROM pagos p
       INNER JOIN eventos e ON p.evento_id = e.id
       WHERE p.empresa_id = $1
       ORDER BY p.fecha_pago DESC, p.fecha_registro DESC`,
      [empresa_id]
    );

    return res.status(200).json({
      success: true,
      total: result.rowCount,
      data: result.rows,
    });

  } catch (error) {
    console.error('[pagoController] Error en obtenerPagos:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener los pagos.',
    });
  }
};

/**
 * Obtiene todos los pagos de un evento específico junto con la
 * suma acumulada de montos para ese evento.
 *
 * Doble filtro (evento_id + empresa_id) garantiza aislamiento SaaS.
 *
 * @param {import('express').Request}  req  — Parámetro :evento_id en la URL
 * @param {import('express').Response} res
 */
export const obtenerPagosPorEvento = async (req, res) => {
  const empresa_id = req.user.empresa_id;
  const { evento_id } = req.params;

  try {
    // Listado de pagos individuales del evento
    const pagosResult = await pool.query(
      `SELECT
         p.id,
         p.monto,
         p.concepto,
         p.metodo_pago,
         p.fecha_pago,
         p.estado,
         p.comprobante_url,
         p.fecha_registro
       FROM pagos p
       WHERE p.evento_id = $1
         AND p.empresa_id = $2
       ORDER BY p.fecha_pago DESC, p.fecha_registro DESC`,
      [evento_id, empresa_id]
    );

    // Sumatoria de montos (solo pagos en estado 'Aprobado')
    const sumaResult = await pool.query(
      `SELECT
         COALESCE(SUM(monto), 0) AS total_pagado,
         COUNT(*)                AS cantidad_pagos
       FROM pagos
       WHERE evento_id  = $1
         AND empresa_id = $2
         AND estado     = 'Aprobado'`,
      [evento_id, empresa_id]
    );

    return res.status(200).json({
      success: true,
      evento_id,
      resumen: {
        total_pagado:   Number(sumaResult.rows[0].total_pagado),
        cantidad_pagos: Number(sumaResult.rows[0].cantidad_pagos),
      },
      total: pagosResult.rowCount,
      data:  pagosResult.rows,
    });

  } catch (error) {
    console.error('[pagoController] Error en obtenerPagosPorEvento:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener los pagos del evento.',
    });
  }
};

/**
 * Actualiza el estado de un pago.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const actualizarEstadoPago = async (req, res) => {
  const empresa_id = req.user.empresa_id;
  const { id } = req.params;
  const { estado } = req.body;

  try {
    if (!estado || !ESTADOS_VALIDOS.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: `Estado inválido. Los valores permitidos son: ${ESTADOS_VALIDOS.join(', ')}.`
      });
    }

    const result = await pool.query(
      `UPDATE pagos
       SET estado = $1
       WHERE id = $2 AND empresa_id = $3
       RETURNING id, estado`,
      [estado, id, empresa_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Pago no encontrado o no pertenece a la empresa.' });
    }

    return res.status(200).json({ success: true, message: 'Estado del pago actualizado.', data: result.rows[0] });
  } catch (error) {
    console.error('[pagoController] Error en actualizarEstadoPago:', error.message);
    return res.status(500).json({ success: false, message: 'Error interno al actualizar estado del pago.' });
  }
};
