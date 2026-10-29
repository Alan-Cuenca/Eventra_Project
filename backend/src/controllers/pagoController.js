import pool from '../config/db.js';
import { supabase } from '../config/supabase.js';
import { notificarPagoAprobado } from '../services/emailService.js';

// Estados y conceptos válidos para validación en el servidor
const ESTADOS_VALIDOS  = ['Pendiente', 'En Revisión', 'Aprobado', 'Rechazado', 'Anulado'];
const CONCEPTOS_VALIDOS = ['Anticipo', 'Abono', 'Liquidación'];

/**
 * Registra un nuevo pago o anticipo vinculado a un evento.
 *
 * Aislamiento SaaS: empresa_id proviene exclusivamente del JWT.
 * RBAC: Admin (1), Gerente (2), Trabajador (3) y Cliente (4).
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

    const metodoNormalizado = metodo_pago ? String(metodo_pago).trim() : 'Efectivo';

    // --- Blindaje SaaS Multi-tenant (Anti-IDOR) ---
    // Validar que el evento pertenezca estrictamente a la empresa en sesión
    const eventoCheck = await pool.query(
      'SELECT id FROM eventos WHERE id = $1 AND empresa_id = $2',
      [evento_id, empresa_id]
    );

    if (eventoCheck.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'El evento especificado no existe o no pertenece a su empresa.',
      });
    }

    // --- Lógica de Comprobante y Estados ---
    // Si es "Deuna" o "Transferencia", requiere comprobante y estado = "En Revisión".
    // Si es "Efectivo", ignora archivo y estado = "Pendiente".
    let comprobante_url = null;
    let estadoPago = 'Pendiente';

    if (metodoNormalizado === 'Efectivo') {
      estadoPago = 'Pendiente';
      comprobante_url = null;
    } else if (metodoNormalizado === 'Deuna' || metodoNormalizado === 'Transferencia') {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'El archivo de comprobante es obligatorio para pagos por Deuna o Transferencia.',
        });
      }

      estadoPago = 'En Revisión';
      const file = req.file;

      if (supabase) {
        const fileExt = file.originalname.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${empresa_id}/${fileName}`;

        const { data, error: uploadError } = await supabase.storage
          .from('comprobantes')
          .upload(filePath, file.buffer, {
            contentType: file.mimetype,
            upsert: true,
          });

        if (uploadError) {
          console.error('[pagoController] Error subiendo comprobante a Supabase Storage:', uploadError.message);
          // Si el bucket aún no existe o hay error en Supabase, registrar fallback de datos en dev
          comprobante_url = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
        } else {
          const { data: publicUrlData } = supabase.storage.from('comprobantes').getPublicUrl(filePath);
          comprobante_url = publicUrlData.publicUrl;
        }
      } else {
        // Fallback resiliente para entornos locales sin credenciales directas de Supabase Storage
        comprobante_url = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      }
    } else {
      // Otros métodos (ej. Tarjeta de crédito física, POS)
      estadoPago = estado || 'Completado';
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
        metodoNormalizado,
        estadoPago,
        comprobante_url,
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Pago registrado exitosamente.',
      data: result.rows[0],
    });

  } catch (error) {
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
 * enriquecidos con el título del evento y datos del cliente mediante JOIN.
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
         e.estado_progreso AS evento_estado,
         -- Cliente asociado
         COALESCE(TRIM(CONCAT(cl.nombres, ' ', cl.apellidos)), 'Cliente General') AS cliente_nombre,
         cl.email AS cliente_email,
         c.total_calculado AS evento_total
       FROM pagos p
       INNER JOIN eventos e ON p.evento_id = e.id
       LEFT JOIN reservas r ON e.reserva_id = r.id
       LEFT JOIN cotizaciones c ON r.cotizacion_id = c.id
       LEFT JOIN clientes cl ON c.cliente_id = cl.id
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
 * RBAC: Administrador (1) y Gerente (2).
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const actualizarEstadoPago = async (req, res) => {
  const empresa_id = req.user.empresa_id;
  const { id } = req.params;
  const { estado } = req.body;

  try {
    if (!estado || !['Aprobado', 'Rechazado', 'Pendiente', 'En Revisión'].includes(estado)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido. Los valores permitidos son: Aprobado, Rechazado, Pendiente, En Revisión.'
      });
    }

    const result = await pool.query(
      `UPDATE pagos
       SET estado = $1
       WHERE id = $2 AND empresa_id = $3
       RETURNING id, empresa_id, evento_id, monto, concepto, metodo_pago, estado, comprobante_url`,
      [estado, id, empresa_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Pago no encontrado o no pertenece a la empresa.' });
    }

    const pagoActualizado = result.rows[0];

    // Disparar notificación por correo al cliente si el pago fue Aprobado
    if (estado === 'Aprobado') {
      try {
        const queryInfo = await pool.query(
          `SELECT
             p.monto,
             e.titulo AS evento_titulo,
             cl.email AS cliente_email
           FROM pagos p
           JOIN eventos e ON p.evento_id = e.id
           LEFT JOIN reservas r ON e.reserva_id = r.id
           LEFT JOIN cotizaciones c ON r.cotizacion_id = c.id
           LEFT JOIN clientes cl ON c.cliente_id = cl.id
           WHERE p.id = $1 AND p.empresa_id = $2`,
          [id, empresa_id]
        );

        if (queryInfo?.rows?.length > 0 && queryInfo.rows[0].cliente_email) {
          const { monto, evento_titulo, cliente_email } = queryInfo.rows[0];
          notificarPagoAprobado(cliente_email, monto, evento_titulo).catch((emailErr) => {
            console.error('[pagoController] Error enviando correo de pago aprobado:', emailErr.message);
          });
        }
      } catch (notifErr) {
        console.error('[pagoController] Error preparando correo de pago aprobado:', notifErr.message);
      }
    }

    return res.status(200).json({ success: true, message: `Estado del pago actualizado a ${estado}.`, data: pagoActualizado });
  } catch (error) {
    console.error('[pagoController] Error en actualizarEstadoPago:', error.message);
    return res.status(500).json({ success: false, message: 'Error interno al actualizar estado del pago.' });
  }
};
