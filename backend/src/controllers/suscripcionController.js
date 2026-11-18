import pool from '../config/db.js';
import { supabase } from '../config/supabase.js';
import { obtenerConsumoPlanEmpresa, normalizarPlan } from '../middlewares/planLimitsMiddleware.js';

const ESTADOS_VALIDOS = ['En Revisión', 'Aprobado', 'Rechazado'];

/**
 * Registra un pago de suscripción mensual/anual por parte de una empresa.
 * El empresa_id proviene estrictamente de la sesión autenticada (Anti-IDOR).
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
export const registrarPagoSuscripcion = async (req, res) => {
  const empresa_id = req.user.empresa_id;
  const { plan_nombre, monto } = req.body;

  try {
    if (!empresa_id) {
      return res.status(400).json({
        success: false,
        message: 'No se identificó la empresa del usuario autenticado.',
      });
    }

    if (!plan_nombre) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del plan (plan_nombre) es obligatorio.',
      });
    }

    // El plan se normaliza a Basico|Premium (el texto libre del cliente no se guarda tal cual)
    const planNormalizado = normalizarPlan(plan_nombre);

    // Monto predeterminado según plan si no viene explícito
    let montoFinal = Number(monto);
    if (isNaN(montoFinal) || montoFinal <= 0) {
      if (planNormalizado === 'Premium') {
        montoFinal = 99.00;
      } else {
        montoFinal = 49.00;
      }
    }

    // Validar que la empresa exista y esté activa
    const empresaCheck = await pool.query(
      'SELECT id, nombre_comercial, plan_suscripcion FROM empresas WHERE id = $1',
      [empresa_id]
    );

    if (empresaCheck.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'La empresa especificada no existe en la plataforma.',
      });
    }

    // Manejo de Comprobante mediante Supabase Storage
    let comprobante_url = null;

    if (req.file) {
      const file = req.file;

      if (supabase) {
        const fileExt = (String(file.originalname || '').split('.').pop() || 'bin').replace(/[^a-zA-Z0-9]/g, '').slice(0, 5) || 'bin';
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `suscripciones/${empresa_id}/${fileName}`;

        const { data, error: uploadError } = await supabase.storage
          .from('comprobantes')
          .upload(filePath, file.buffer, {
            contentType: file.mimetype,
            upsert: true,
          });

        if (uploadError) {
          console.error('[suscripcionController] Error subiendo comprobante a Supabase:', uploadError.message);
          return res.status(502).json({
            success: false,
            message: 'No se pudo almacenar el comprobante. Intenta nuevamente en unos minutos.',
          });
        } else {
          const { data: publicUrlData } = supabase.storage.from('comprobantes').getPublicUrl(filePath);
          comprobante_url = publicUrlData.publicUrl;
        }
      } else {
        return res.status(503).json({
          success: false,
          message: 'El almacenamiento de comprobantes no está disponible. Contacta al administrador.',
        });
      }
    }

    // Inserción en la tabla suscripciones_pagos
    const result = await pool.query(
      `INSERT INTO suscripciones_pagos (empresa_id, plan_nombre, monto, comprobante_url, estado, fecha_pago)
       VALUES ($1, $2, $3, $4, 'En Revisión', CURRENT_DATE)
       RETURNING id, empresa_id, plan_nombre, monto, comprobante_url, estado, fecha_pago, fecha_registro`,
      [empresa_id, planNormalizado, montoFinal, comprobante_url]
    );

    return res.status(201).json({
      success: true,
      message: 'Comprobante de suscripción enviado exitosamente. Tu plan está en revisión.',
      data: result.rows[0],
    });

  } catch (error) {
    console.error('[suscripcionController] Error en registrarPagoSuscripcion:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al registrar el pago de suscripción.',
    });
  }
};

/**
 * Obtiene los pagos de suscripciones.
 * - Super_Admin (5): Obtiene TODOS los pagos de todas las empresas con datos del tenant.
 * - Administrador (1): Obtiene SOLO los pagos de su empresa.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
export const obtenerSuscripciones = async (req, res) => {
  const { rol_id, empresa_id } = req.user;

  try {
    if (Number(rol_id) === 5) {
      // Super_Admin global: consulta general
      const result = await pool.query(
        `SELECT
           sp.id,
           sp.empresa_id,
           sp.plan_nombre,
           sp.monto,
           sp.comprobante_url,
           sp.estado,
           sp.fecha_pago,
           sp.fecha_registro,
           e.nombre_comercial AS empresa_nombre,
           e.ruc              AS empresa_ruc,
           e.plan_suscripcion AS empresa_plan_actual,
           e.estado_activo    AS empresa_activa
         FROM suscripciones_pagos sp
         INNER JOIN empresas e ON sp.empresa_id = e.id
         ORDER BY sp.fecha_registro DESC`
      );

      return res.status(200).json({
        success: true,
        total: result.rowCount,
        data: result.rows,
      });
    }

    // Administrador de empresa: solo sus pagos
    if (!empresa_id) {
      return res.status(400).json({
        success: false,
        message: 'No se encontró la empresa del usuario.',
      });
    }

    const result = await pool.query(
      `SELECT
         sp.id,
         sp.empresa_id,
         sp.plan_nombre,
         sp.monto,
         sp.comprobante_url,
         sp.estado,
         sp.fecha_pago,
         sp.fecha_registro,
         e.nombre_comercial AS empresa_nombre,
         e.plan_suscripcion AS empresa_plan_actual,
         e.estado_activo    AS empresa_activa
       FROM suscripciones_pagos sp
       INNER JOIN empresas e ON sp.empresa_id = e.id
       WHERE sp.empresa_id = $1
       ORDER BY sp.fecha_registro DESC`,
      [empresa_id]
    );

    return res.status(200).json({
      success: true,
      total: result.rowCount,
      data: result.rows,
    });

  } catch (error) {
    console.error('[suscripcionController] Error en obtenerSuscripciones:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener suscripciones.',
    });
  }
};

/**
 * Actualiza el estado de un pago de suscripción.
 * Exclusivo para Super_Admin (5).
 * Si el estado es 'Aprobado', renueva/activa automáticamente el plan de la empresa.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
export const actualizarEstadoSuscripcion = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  try {
    if (!estado || !ESTADOS_VALIDOS.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: `Estado inválido. Valores permitidos: ${ESTADOS_VALIDOS.join(', ')}.`,
      });
    }

    // Verificar si el pago de suscripción existe
    const pagoRes = await pool.query(
      'SELECT id, empresa_id, plan_nombre, monto, estado FROM suscripciones_pagos WHERE id = $1',
      [id]
    );

    if (pagoRes.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Registro de pago de suscripción no encontrado.',
      });
    }

    const pago = pagoRes.rows[0];

    // Actualizar el estado del pago de suscripción
    const updatedPagoRes = await pool.query(
      `UPDATE suscripciones_pagos
       SET estado = $1
       WHERE id = $2
       RETURNING id, empresa_id, plan_nombre, monto, comprobante_url, estado, fecha_pago, fecha_registro`,
      [estado, id]
    );

    // Si se aprueba, se renueva y activa el plan correspondiente de la empresa y se reinicia la cuota de chatbot
    if (estado === 'Aprobado') {
      await pool.query(
        `UPDATE empresas
         SET plan_suscripcion = $1, mensajes_chatbot_mes = 0, chatbot_mes_ref = date_trunc('month', CURRENT_DATE)::date
         WHERE id = $2`,
        [normalizarPlan(pago.plan_nombre), pago.empresa_id]
      );
    }

    return res.status(200).json({
      success: true,
      message: `Suscripción marcada como "${estado}" exitosamente.`,
      data: updatedPagoRes.rows[0],
    });

  } catch (error) {
    if (error.code === '22P02') {
      return res.status(400).json({ success: false, message: 'Identificador de suscripción inválido.' });
    }
    console.error('[suscripcionController] Error en actualizarEstadoSuscripcion:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno al actualizar estado de la suscripción.',
    });
  }
};

/**
 * Retorna el consumo y límites de la empresa en sesión.
 * Permite renderizar las barras de uso del plan en el portal administrativo.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
export const obtenerConsumoSuscripcion = async (req, res) => {
  try {
    const empresa_id = req.user?.empresa_id;
    if (!empresa_id) {
      return res.status(400).json({
        success: false,
        message: 'No se identificó la empresa del usuario autenticado.',
      });
    }

    const consumo = await obtenerConsumoPlanEmpresa(empresa_id);

    return res.status(200).json({
      success: true,
      data: consumo,
    });
  } catch (error) {
    console.error('[suscripcionController] Error en obtenerConsumoSuscripcion:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error al consultar el consumo del plan de suscripción.',
    });
  }
};



/**
 * POST /api/suscripciones/solicitud-publica  (público)
 * Registra la solicitud de contratación de un plan hecha desde la landing, con el
 * comprobante PDF de la transferencia. El Super_Admin la revisa y crea la empresa.
 */
export const crearSolicitudRegistroPlan = async (req, res) => {
  const { plan_nombre, ciclo, correo_contacto, nombre_empresa } = req.body;

  try {
    const correo = String(correo_contacto || '').trim().toLowerCase();
    const empresa = String(nombre_empresa || '').trim();

    if (!['Basico', 'Premium'].includes(plan_nombre)) {
      return res.status(400).json({ success: false, message: 'El plan debe ser Basico o Premium.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      return res.status(400).json({ success: false, message: 'Ingresa un correo electrónico válido.' });
    }
    if (!empresa) {
      return res.status(400).json({ success: false, message: 'El nombre de la empresa es obligatorio.' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'El comprobante de pago (PDF) es obligatorio.' });
    }
    if (!supabase) {
      return res.status(503).json({
        success: false,
        message: 'El almacenamiento de comprobantes no está disponible en este momento. Intenta más tarde.',
      });
    }

    const filePath = `solicitudes-planes/${Date.now()}_${Math.random().toString(36).substring(7)}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from('comprobantes')
      .upload(filePath, req.file.buffer, { contentType: 'application/pdf', upsert: false });

    if (uploadError) {
      console.error('[suscripcionController] Error subiendo comprobante público:', uploadError.message);
      return res.status(502).json({ success: false, message: 'No se pudo almacenar el comprobante. Intenta nuevamente.' });
    }
    const { data: publicUrlData } = supabase.storage.from('comprobantes').getPublicUrl(filePath);

    const result = await pool.query(
      `INSERT INTO solicitudes_registro_plan (plan_nombre, ciclo, correo_contacto, nombre_empresa, comprobante_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, plan_nombre, ciclo, correo_contacto, nombre_empresa, estado, fecha_solicitud`,
      [plan_nombre, ciclo === 'anual' ? 'anual' : 'mensual', correo, empresa, publicUrlData.publicUrl]
    );

    return res.status(201).json({
      success: true,
      message: 'Solicitud recibida. Revisaremos tu comprobante y te enviaremos las credenciales por correo.',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('[suscripcionController] Error en crearSolicitudRegistroPlan:', error.message);
    return res.status(500).json({ success: false, message: 'Error interno del servidor al registrar la solicitud.' });
  }
};

/**
 * GET /api/suscripciones/solicitudes-publicas  (Super_Admin)
 */
export const listarSolicitudesRegistroPlan = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, plan_nombre, ciclo, correo_contacto, nombre_empresa, comprobante_url, estado, fecha_solicitud
       FROM solicitudes_registro_plan ORDER BY fecha_solicitud DESC`
    );
    return res.status(200).json({ success: true, total: result.rowCount, data: result.rows });
  } catch (error) {
    console.error('[suscripcionController] Error en listarSolicitudesRegistroPlan:', error.message);
    return res.status(500).json({ success: false, message: 'Error interno del servidor al listar las solicitudes.' });
  }
};

/**
 * PATCH /api/suscripciones/solicitudes-publicas/:id/estado  (Super_Admin)
 * Marca la solicitud como Atendida (empresa creada) o Rechazada.
 */
export const actualizarEstadoSolicitudRegistroPlan = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  try {
    if (!['Pendiente', 'Atendida', 'Rechazada'].includes(estado)) {
      return res.status(400).json({ success: false, message: 'El estado debe ser Pendiente, Atendida o Rechazada.' });
    }
    const result = await pool.query(
      'UPDATE solicitudes_registro_plan SET estado = $1 WHERE id = $2 RETURNING id, estado',
      [estado, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Solicitud no encontrada.' });
    }
    return res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    if (error.code === '22P02') {
      return res.status(400).json({ success: false, message: 'Identificador de solicitud inválido.' });
    }
    console.error('[suscripcionController] Error en actualizarEstadoSolicitudRegistroPlan:', error.message);
    return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};
