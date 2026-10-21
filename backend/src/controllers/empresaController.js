import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import { generarPasswordTemporal } from '../utils/passwordGenerator.js';
import { sendWelcomeAdminEmail } from '../services/emailService.js';

const PLANES_VALIDOS = ['Basico', 'Premium', 'Enterprise'];

/**
 * =============================================================================
 * CONTROLADOR: empresaController.js
 * =============================================================================
 * Módulo de Administración Global de Inquilinos (Tenants) de EVENTRA SaaS.
 * Acceso EXCLUSIVO para usuarios con rol Super_Admin (rol_id 5 / 0).
 * =============================================================================
 */

/**
 * Obtiene el listado completo de empresas registradas en la plataforma SaaS,
 * con métricas agregadas de usuarios, eventos y facturación.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
export const generarSlug = (texto) => {
  return texto
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
};

export const obtenerEmpresas = async (req, res) => {
  try {
    let result;
    try {
      result = await pool.query(
        `SELECT 
           e.id, 
           e.nombre_comercial,
           e.slug,
           e.ruc, 
           e.plan_suscripcion, 
           e.estado_activo, 
           e.fecha_registro,
           COUNT(DISTINCT u.id)  AS total_usuarios,
           COUNT(DISTINCT ev.id) AS total_eventos,
           COALESCE(SUM(p.monto) FILTER (WHERE p.estado = 'Completado'), 0) AS total_ingresos
         FROM empresas e
         LEFT JOIN usuarios u  ON u.empresa_id = e.id
         LEFT JOIN eventos ev  ON ev.empresa_id = e.id
         LEFT JOIN pagos p     ON p.empresa_id = e.id
         GROUP BY e.id, e.nombre_comercial, e.slug, e.ruc, e.plan_suscripcion, e.estado_activo, e.fecha_registro
         ORDER BY e.fecha_registro DESC`
      );
    } catch (queryErr) {
      // Si la columna slug aún no está migrada en la base de datos remota
      if (queryErr.code === '42703' || queryErr.message?.includes('slug')) {
        result = await pool.query(
          `SELECT 
             e.id, 
             e.nombre_comercial,
             NULL AS slug,
             e.ruc, 
             e.plan_suscripcion, 
             e.estado_activo, 
             e.fecha_registro,
             COUNT(DISTINCT u.id)  AS total_usuarios,
             COUNT(DISTINCT ev.id) AS total_eventos,
             COALESCE(SUM(p.monto) FILTER (WHERE p.estado = 'Completado'), 0) AS total_ingresos
           FROM empresas e
           LEFT JOIN usuarios u  ON u.empresa_id = e.id
           LEFT JOIN eventos ev  ON ev.empresa_id = e.id
           LEFT JOIN pagos p     ON p.empresa_id = e.id
           GROUP BY e.id, e.nombre_comercial, e.ruc, e.plan_suscripcion, e.estado_activo, e.fecha_registro
           ORDER BY e.fecha_registro DESC`
        );
      } else {
        throw queryErr;
      }
    }

    return res.status(200).json({
      success: true,
      total: result.rowCount,
      data: result.rows,
    });
  } catch (error) {
    console.error('[empresaController] Error en obtenerEmpresas:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener las empresas.',
    });
  }
};

/**
 * Da de alta una nueva empresa SaaS (Tenant) y su administrador inicial.
 * Flujo:
 *  1. Valida los campos obligatorios.
 *  2. Genera automáticamente un slug único si no es proporcionado.
 *  3. Genera automáticamente una contraseña segura mediante crypto.
 *  4. Ejecuta transacción atómica: INSERT en empresas + INSERT en usuarios (rol_id = 1).
 *  5. Almacena el hash bcrypt de la contraseña.
 *  6. Envía el correo con credenciales e instrucción de actualización mediante emailService.
 *  7. Retorna resultado diferenciando estado de registro de empresa del envío de correo.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
export const crearEmpresa = async (req, res) => {
  const {
    nombre_comercial,
    slug,
    ruc,
    plan_suscripcion = 'Basico',
    admin_nombre,
    admin_email,
    admin_password,
  } = req.body;

  // 1. Validaciones de entrada
  if (!nombre_comercial || !nombre_comercial.trim()) {
    return res.status(400).json({
      success: false,
      message: 'El campo nombre_comercial es obligatorio.',
    });
  }

  if (!admin_nombre || !admin_nombre.trim()) {
    return res.status(400).json({
      success: false,
      message: 'El campo admin_nombre (nombre del administrador inicial) es obligatorio.',
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!admin_email || !emailRegex.test(admin_email.trim())) {
    return res.status(400).json({
      success: false,
      message: 'El campo admin_email es obligatorio y debe ser un correo electrónico válido.',
    });
  }

  const planNormalizado = PLANES_VALIDOS.includes(plan_suscripcion) ? plan_suscripcion : 'Basico';

  // 2. Generación automática de contraseña temporal segura (o provista en tests)
  const tempPassword = admin_password || generarPasswordTemporal(12);

  const client = await pool.connect();
  let nuevaEmpresa = null;
  let adminUsuario = null;

  try {
    await client.query('BEGIN');

    // 3. Generar slug único
    let slugFinal = slug ? generarSlug(slug) : generarSlug(nombre_comercial);
    if (!slugFinal) {
      slugFinal = `empresa-${Date.now()}`;
    }

    // 4. Crear el tenant con soporte fallback si la columna slug aún no está migrada en la BD
    let empresaRes;
    try {
      empresaRes = await client.query(
        `INSERT INTO empresas (nombre_comercial, slug, ruc, plan_suscripcion, estado_activo)
         VALUES ($1, $2, $3, $4, true)
         RETURNING id, nombre_comercial, slug, ruc, plan_suscripcion, estado_activo, fecha_registro`,
        [nombre_comercial.trim(), slugFinal, ruc ? String(ruc).trim() : null, planNormalizado]
      );
    } catch (insertErr) {
      if (insertErr.code === '42703' || insertErr.message?.includes('slug')) {
        empresaRes = await client.query(
          `INSERT INTO empresas (nombre_comercial, ruc, plan_suscripcion, estado_activo)
           VALUES ($1, $2, $3, true)
           RETURNING id, nombre_comercial, NULL AS slug, ruc, plan_suscripcion, estado_activo, fecha_registro`,
          [nombre_comercial.trim(), ruc ? String(ruc).trim() : null, planNormalizado]
        );
      } else {
        throw insertErr;
      }
    }

    nuevaEmpresa = empresaRes.rows[0];

    // 4. Crear administrador inicial en el tenant con hash de contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(tempPassword, salt);

    const adminRes = await client.query(
      `INSERT INTO usuarios (empresa_id, rol_id, nombre_completo, email, password_hash)
       VALUES ($1, 1, $2, $3, $4)
       RETURNING id, empresa_id, rol_id, nombre_completo, email, estado_activo, fecha_creacion`,
      [
        nuevaEmpresa.id,
        admin_nombre.trim(),
        admin_email.trim().toLowerCase(),
        passwordHash,
      ]
    );

    adminUsuario = adminRes.rows[0];

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');

    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'El correo electrónico del administrador ya se encuentra registrado en el sistema.',
      });
    }

    console.error('[empresaController] Error en crearEmpresa:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al crear la empresa y su administrador inicial.',
    });
  } finally {
    client.release();
  }

  // 5. Envío de correo electrónico con credenciales e instrucción de actualización
  let correoEnviado = false;
  let errorDetalleCorreo = null;
  try {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const loginUrl = `${frontendUrl}/login`;

    const emailResult = await sendWelcomeAdminEmail({
      to: admin_email.trim().toLowerCase(),
      adminNombre: admin_nombre.trim(),
      empresaNombre: nombre_comercial.trim(),
      tempPassword,
      loginUrl,
    });

    correoEnviado = Boolean(emailResult?.success);
    if (!correoEnviado) {
      errorDetalleCorreo = emailResult?.error || 'No se pudo contactar el servidor SMTP de correo.';
    }
  } catch (mailError) {
    console.error('[empresaController] Fallo en despacho de correo de bienvenida:', mailError.message);
    correoEnviado = false;
    errorDetalleCorreo = mailError.message;
  }

  // 6. Respuesta al cliente diferenciando creación de empresa y estado de correo
  return res.status(201).json({
    success: true,
    empresa_creada: true,
    correo_enviado: correoEnviado,
    email_error: errorDetalleCorreo,
    message: correoEnviado
      ? 'Empresa y administrador inicial registrados exitosamente. Credenciales de acceso enviadas por correo.'
      : `Empresa registrada exitosamente, pero no fue posible enviar el correo (${errorDetalleCorreo || 'error de conexión SMTP'}).`,
    data: {
      empresa: nuevaEmpresa,
      administrador_inicial: adminUsuario,
    },
  });
};



/**
 * Actualiza el plan de suscripción de una empresa SaaS.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
export const actualizarPlanEmpresa = async (req, res) => {
  const { id } = req.params;
  const { plan_suscripcion } = req.body;

  const planesValidos = ['Basico', 'Premium', 'Enterprise', 'Profesional'];
  if (!plan_suscripcion || !planesValidos.some(p => p.toLowerCase() === String(plan_suscripcion).toLowerCase())) {
    return res.status(400).json({
      success: false,
      message: `Plan inválido. Opciones válidas: ${planesValidos.join(', ')}.`,
    });
  }

  try {
    const result = await pool.query(
      `UPDATE empresas
       SET plan_suscripcion = $1
       WHERE id = $2
       RETURNING id, nombre_comercial, ruc, plan_suscripcion, estado_activo`,
      [plan_suscripcion, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Empresa no encontrada.',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Plan de suscripción actualizado a "${plan_suscripcion}".`,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('[empresaController] Error en actualizarPlanEmpresa:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno al actualizar el plan de la empresa.',
    });
  }
};

/**
 * Suspende o reactiva el acceso de una empresa SaaS y todos sus usuarios.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
export const suspenderEmpresa = async (req, res) => {
  const { id } = req.params;
  // Si en el body no se pasa estado_activo, se suspende (false)
  const nuevoEstado = req.body.estado_activo !== undefined ? Boolean(req.body.estado_activo) : false;

  try {
    const result = await pool.query(
      `UPDATE empresas
       SET estado_activo = $1
       WHERE id = $2
       RETURNING id, nombre_comercial, ruc, plan_suscripcion, estado_activo`,
      [nuevoEstado, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Empresa no encontrada.',
      });
    }

    const accion = nuevoEstado ? 'reactivada' : 'suspendida';

    return res.status(200).json({
      success: true,
      message: `Empresa ${accion} exitosamente.`,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('[empresaController] Error en suspenderEmpresa:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno al actualizar el estado de la empresa.',
    });
  }
};

/**
 * Consulta pública de datos básicos de una empresa por slug para su portal.
 * Permite al frontend validar que la empresa exista y esté activa antes de registrar clientes.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
export const obtenerEmpresaPublicaPorSlug = async (req, res) => {
  const { slug } = req.params;

  try {
    if (!slug) {
      return res.status(400).json({
        success: false,
        message: 'El parámetro slug es obligatorio.',
      });
    }

    const result = await pool.query(
      `SELECT id, nombre_comercial, slug, plan_suscripcion, estado_activo
       FROM empresas
       WHERE LOWER(slug) = LOWER($1)`,
      [slug.trim()]
    );

    if (result.rowCount === 0 || !result.rows[0].estado_activo) {
      return res.status(404).json({
        success: false,
        message: 'Portal de empresa no encontrado o temporalmente inactivo.',
      });
    }

    return res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('[empresaController] Error en obtenerEmpresaPublicaPorSlug:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error al consultar los datos del portal.',
    });
  }
};
