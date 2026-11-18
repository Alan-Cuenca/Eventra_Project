import { invalidarSesionesEmpresa } from '../services/sesionService.js';
import pool from '../config/db.js';
import { normalizarPlan } from '../middlewares/planLimitsMiddleware.js';
import bcrypt from 'bcrypt';
import { supabase } from '../config/supabase.js';
import { generarPasswordTemporal } from '../utils/passwordGenerator.js';
import { sendWelcomeAdminEmail } from '../services/emailService.js';
import { analizarLogotipoConIA } from '../services/aiBrandingService.js';

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

let columnaSlugDisponible = null;
export const checkColumnaSlug = async () => {
  if (columnaSlugDisponible !== null) return columnaSlugDisponible;
  if (process.env.NODE_ENV === 'test') {
    columnaSlugDisponible = false;
    return false;
  }
  try {
    const res = await pool.query(
      "SELECT 1 FROM information_schema.columns WHERE table_name = 'empresas' AND column_name = 'slug' LIMIT 1"
    );
    columnaSlugDisponible = res.rowCount > 0;
  } catch {
    columnaSlugDisponible = false;
  }
  return columnaSlugDisponible;
};

export const obtenerEmpresas = async (req, res) => {
  try {
    const tieneSlug = await checkColumnaSlug();
    const querySql = tieneSlug
      ? `SELECT 
           e.id, 
           e.nombre_comercial,
           e.slug,
           e.ruc, 
           e.plan_suscripcion, 
           e.estado_activo, 
           e.fecha_registro,
           (SELECT COUNT(*) FROM usuarios u WHERE u.empresa_id = e.id) AS total_usuarios,
           (SELECT COUNT(*) FROM eventos ev WHERE ev.empresa_id = e.id) AS total_eventos,
           COALESCE((SELECT SUM(p.monto) FROM pagos p
                     WHERE p.empresa_id = e.id AND p.estado IN ('Aprobado', 'Completado')), 0) AS total_ingresos
         FROM empresas e
         ORDER BY e.fecha_registro DESC`
      : `SELECT 
           e.id, 
           e.nombre_comercial,
           NULL AS slug,
           e.ruc, 
           e.plan_suscripcion, 
           e.estado_activo, 
           e.fecha_registro,
           (SELECT COUNT(*) FROM usuarios u WHERE u.empresa_id = e.id) AS total_usuarios,
           (SELECT COUNT(*) FROM eventos ev WHERE ev.empresa_id = e.id) AS total_eventos,
           COALESCE((SELECT SUM(p.monto) FROM pagos p
                     WHERE p.empresa_id = e.id AND p.estado IN ('Aprobado', 'Completado')), 0) AS total_ingresos
         FROM empresas e
         ORDER BY e.fecha_registro DESC`;

    const result = await pool.query(querySql);

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

  const tieneSlug = await checkColumnaSlug();
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

    // 4. Crear el tenant según la disponibilidad de la columna slug
    let empresaRes;
    if (tieneSlug) {
      empresaRes = await client.query(
        `INSERT INTO empresas (nombre_comercial, slug, ruc, plan_suscripcion, estado_activo)
         VALUES ($1, $2, $3, $4, true)
         RETURNING id, nombre_comercial, slug, ruc, plan_suscripcion, estado_activo, fecha_registro`,
        [nombre_comercial.trim(), slugFinal, ruc ? String(ruc).trim() : null, planNormalizado]
      );
    } else {
      empresaRes = await client.query(
        `INSERT INTO empresas (nombre_comercial, ruc, plan_suscripcion, estado_activo)
         VALUES ($1, $2, $3, true)
         RETURNING id, nombre_comercial, NULL AS slug, ruc, plan_suscripcion, estado_activo, fecha_registro`,
        [nombre_comercial.trim(), ruc ? String(ruc).trim() : null, planNormalizado]
      );
    }

    nuevaEmpresa = empresaRes.rows[0];

    // 5. Crear administrador inicial en el tenant con hash de contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(tempPassword, salt);

    const adminRes = await client.query(
      `INSERT INTO usuarios (empresa_id, rol_id, nombre_completo, email, password_hash, debe_cambiar_password)
       VALUES ($1, 1, $2, $3, $4, true)
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
      [normalizarPlan(plan_suscripcion), id]
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

    invalidarSesionesEmpresa(id); // la suspensión/reactivación rige de inmediato
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

export const PALETAS_VALIDAS = [
  'sofisticacion_sutil',
  'bosque_olivo',
  'terracota_real',
  'champagne_gala',
  'lavanda_imperial',
  'custom_ia',
];

/**
 * Obtiene la configuración de marca blanca (Branding) de la empresa del usuario autenticado.
 * Disponible para roles 1 (Admin), 2 (Gerente), 3 (Trabajador) y 4 (Cliente).
 */
export const obtenerMiBranding = async (req, res) => {
  try {
    let empresa_id = req.user?.empresa_id;

    // Si es Super_Admin y proporciona explícitamente empresa_id por query, se consulta dicha empresa
    if (!empresa_id && (Number(req.user?.rol_id) === 5 || req.user?.rol === 'Super_Admin' || req.user?.rol_nombre === 'Super_Admin')) {
      if (req.query?.empresa_id) {
        empresa_id = Number(req.query.empresa_id);
      }
    }

    if (!empresa_id) {
      // Si es un Super Admin sin empresa asignada, retorna branding institucional EVENTRA
      return res.status(200).json({
        success: true,
        data: {
          id: null,
          nombre_comercial: 'EVENTRA',
          ruc: null,
          slug: 'eventra',
          logo_url: null,
          paleta_colores: 'sofisticacion_sutil',
          marca_agua_activa: false,
          portal_titulo: 'Portal de Eventos EVENTRA',
          portal_descripcion: 'Gestión inteligente y sofisticada de eventos sociales y corporativos.',
        },
      });
    }

    const result = await pool.query(
      `SELECT 
         id, 
         nombre_comercial, 
         ruc, 
         slug, 
         logo_url, 
         COALESCE(paleta_colores, 'sofisticacion_sutil') AS paleta_colores, 
         paleta_personalizada,
         COALESCE(marca_agua_activa, true) AS marca_agua_activa, 
         portal_titulo, 
         portal_descripcion,
         datos_pago
       FROM empresas
       WHERE id = $1`,
      [empresa_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Empresa no encontrada.',
      });
    }

    return res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('[empresaController] Error en obtenerMiBranding:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno al consultar el branding de la empresa.',
    });
  }
};

/**
 * Actualiza la configuración de marca blanca (Branding) de la empresa.
 * Exclusivo para el Administrador de la empresa (Rol 1).
 * Filtra estrictamente por req.user.empresa_id (Anti-IDOR).
 */
export const actualizarMiBranding = async (req, res) => {
  try {
    let empresa_id = req.user?.empresa_id;

    // Si es Super_Admin sin empresa_id fija, actualizar la empresa objetivo o la empresa 1 por defecto
    if (!empresa_id && (Number(req.user?.rol_id) === 5 || req.user?.rol === 'Super_Admin' || req.user?.rol_nombre === 'Super_Admin')) {
      empresa_id = req.body?.empresa_id ? Number(req.body.empresa_id) : 1;
    }

    if (!empresa_id) {
      return res.status(400).json({
        success: false,
        message: 'No se identificó la empresa del usuario autenticado.',
      });
    }

    const {
      paleta_colores,
      paleta_personalizada,
      marca_agua_activa,
      portal_titulo,
      portal_descripcion,
      restablecer_logo,
    } = req.body;

    // Validar paleta si se envía
    if (paleta_colores && !PALETAS_VALIDAS.includes(paleta_colores)) {
      return res.status(400).json({
        success: false,
        message: `Paleta no válida. Opciones permitidas: ${PALETAS_VALIDAS.join(', ')}`,
      });
    }

    // Manejo de carga de logotipo con multer y Supabase Storage
    let nuevoLogoUrl = undefined;

    if (req.file) {
      const file = req.file;
      if (supabase) {
        const fileExt = (String(file.originalname || '').split('.').pop() || 'bin').replace(/[^a-zA-Z0-9]/g, '').slice(0, 5) || 'bin';
        const fileName = `logo_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `logos/${empresa_id}/${fileName}`;

        try {
          const { error: uploadError } = await supabase.storage
            .from('comprobantes')
            .upload(filePath, file.buffer, {
              contentType: file.mimetype,
              upsert: true,
            });

          if (uploadError) {
            console.warn('[empresaController] Falló subida a bucket comprobantes, usando Data URL:', uploadError.message);
            nuevoLogoUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
          } else {
            const { data: publicUrlData } = supabase.storage
              .from('comprobantes')
              .getPublicUrl(filePath);
            nuevoLogoUrl = publicUrlData.publicUrl;
          }
        } catch (storageErr) {
          console.warn('[empresaController] Excepción en Supabase Storage:', storageErr.message);
          nuevoLogoUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
        }
      } else {
        nuevoLogoUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      }
    } else if (req.body?.logo_base64) {
      nuevoLogoUrl = req.body.logo_base64;
    } else if (req.body?.logo_url !== undefined && req.body?.logo_url !== null) {
      nuevoLogoUrl = req.body.logo_url;
    } else if (restablecer_logo === 'true' || restablecer_logo === true) {
      nuevoLogoUrl = null;
    }

    // Construcción dinámica de campos a actualizar
    const campos = [];
    const valores = [];
    let idx = 1;

    if (paleta_colores !== undefined) {
      campos.push(`paleta_colores = $${idx++}`);
      valores.push(paleta_colores);
    }

    if (paleta_personalizada !== undefined) {
      campos.push(`paleta_personalizada = $${idx++}`);
      const jsonStr = typeof paleta_personalizada === 'object'
        ? JSON.stringify(paleta_personalizada)
        : paleta_personalizada;
      valores.push(jsonStr);
    }

    if (marca_agua_activa !== undefined) {
      const boolMarca = String(marca_agua_activa) === 'true';
      campos.push(`marca_agua_activa = $${idx++}`);
      valores.push(boolMarca);
    }

    if (portal_titulo !== undefined) {
      campos.push(`portal_titulo = $${idx++}`);
      valores.push(portal_titulo ? String(portal_titulo).trim() : null);
    }

    if (portal_descripcion !== undefined) {
      campos.push(`portal_descripcion = $${idx++}`);
      valores.push(portal_descripcion ? String(portal_descripcion).trim() : null);
    }

    if (nuevoLogoUrl !== undefined) {
      campos.push(`logo_url = $${idx++}`);
      valores.push(nuevoLogoUrl);
    }

    if (campos.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se enviaron datos para actualizar.',
      });
    }

    valores.push(empresa_id);
    const updateSql = `
      UPDATE empresas
      SET ${campos.join(', ')}
      WHERE id = $${idx}
      RETURNING 
        id, 
        nombre_comercial, 
        ruc, 
        slug, 
        logo_url, 
        COALESCE(paleta_colores, 'sofisticacion_sutil') AS paleta_colores, 
        paleta_personalizada,
        COALESCE(marca_agua_activa, true) AS marca_agua_activa, 
        portal_titulo, 
        portal_descripcion
    `;

    const result = await pool.query(updateSql, valores);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Empresa no encontrada.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Configuración de marca actualizada exitosamente.',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('[empresaController] Error en actualizarMiBranding:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno al actualizar el branding de la empresa.',
    });
  }
};

/**
 * =============================================================================
 * CONTROLADOR: analizarLogoIA
 * =============================================================================
 * Analiza el logotipo de la empresa mediante visión por IA (GPT-4o / Gemini)
 * y genera una paleta minimalista de 5 colores armónicos (Sofisticación Sutil).
 * Guarda la paleta generada en 'empresas' bajo paleta_colores = 'custom_ia'.
 * =============================================================================
 */
export const analizarLogoIA = async (req, res) => {
  try {
    let empresa_id = req.user?.empresa_id;
    if (!empresa_id && (Number(req.user?.rol_id) === 5 || req.user?.rol === 'Super_Admin' || req.user?.rol_nombre === 'Super_Admin')) {
      empresa_id = req.body?.empresa_id ? Number(req.body.empresa_id) : 1;
    }

    let buffer = req.file?.buffer;
    let mimetype = req.file?.mimetype || 'image/png';
    let dataUrl = req.body?.logo_base64 || req.body?.logo_url;

    // Si no se adjuntó archivo o se solicitó use_current, consultar el logo_url actual de la empresa
    if (!buffer && (!dataUrl || req.body?.use_current) && empresa_id) {
      const empRes = await pool.query('SELECT logo_url FROM empresas WHERE id = $1', [empresa_id]);
      if (empRes.rows.length > 0 && empRes.rows[0].logo_url) {
        dataUrl = empRes.rows[0].logo_url;
      }
    }

    if (!buffer && !dataUrl) {
      return res.status(400).json({
        success: false,
        message: 'Por favor proporciona o sube un logotipo para analizar con la IA.',
      });
    }

    let clientPalette = req.body?.paleta;
    if (typeof clientPalette === 'string') {
      try {
        clientPalette = JSON.parse(clientPalette);
      } catch {}
    }

    const paletaGenerada = await analizarLogotipoConIA({ buffer, mimetype, dataUrl, clientPalette });

    // Si se subió un archivo o dataUrl nuevo en la petición de análisis IA,
    // persistir también el logotipo en empresas.logo_url
    let nuevoLogoGuardado = undefined;
    if (req.file) {
      if (supabase) {
        const fileExt = (String(req.file.originalname || '').split('.').pop() || 'bin').replace(/[^a-zA-Z0-9]/g, '').slice(0, 5) || 'bin';
        const fileName = `logo_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `logos/${empresa_id}/${fileName}`;
        try {
          const { error: uploadError } = await supabase.storage
            .from('comprobantes')
            .upload(filePath, req.file.buffer, {
              contentType: req.file.mimetype,
              upsert: true,
            });
          if (!uploadError) {
            const { data: publicUrlData } = supabase.storage
              .from('comprobantes')
              .getPublicUrl(filePath);
            nuevoLogoGuardado = publicUrlData.publicUrl;
          } else {
            nuevoLogoGuardado = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
          }
        } catch {
          nuevoLogoGuardado = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        }
      } else {
        nuevoLogoGuardado = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      }
    } else if (req.body?.logo_base64) {
      nuevoLogoGuardado = req.body.logo_base64;
    }

    // Guardar en la base de datos bajo el identificador custom_ia
    if (empresa_id) {
      if (nuevoLogoGuardado) {
        await pool.query(
          `UPDATE empresas
           SET paleta_colores = 'custom_ia',
               paleta_personalizada = $1,
               logo_url = $2
           WHERE id = $3`,
          [JSON.stringify(paletaGenerada), nuevoLogoGuardado, empresa_id]
        );
      } else {
        await pool.query(
          `UPDATE empresas
           SET paleta_colores = 'custom_ia',
               paleta_personalizada = $1
           WHERE id = $2`,
          [JSON.stringify(paletaGenerada), empresa_id]
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Paleta generada exitosamente con IA a partir del logotipo.',
      paleta_colores: 'custom_ia',
      paleta: paletaGenerada,
      logo_url: nuevoLogoGuardado,
    });
  } catch (error) {
    console.error('[empresaController] Error en analizarLogoIA:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error al procesar el logotipo con la IA.',
    });
  }
};

/**
 * GET /api/empresas/administradores  (Super_Admin)
 * Lista los usuarios Administrador (rol 1) de todos los tenants.
 */
export const obtenerAdministradoresTenant = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.nombre_completo, u.email, u.estado_activo, u.rol_id,
              r.nombre AS rol_nombre,
              e.id AS empresa_id, e.nombre_comercial AS empresa_nombre, e.ruc AS empresa_ruc,
              e.slug AS empresa_slug,
              e.plan_suscripcion AS empresa_plan,
              e.estado_activo AS empresa_activa,
              e.fecha_registro
       FROM usuarios u
       INNER JOIN empresas e ON u.empresa_id = e.id
       LEFT JOIN roles r ON u.rol_id = r.id
       WHERE u.rol_id = 1
       ORDER BY e.nombre_comercial ASC, u.nombre_completo ASC`
    );
    return res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('[empresaController] Error en obtenerAdministradoresTenant:', error.message);
    return res.status(500).json({ success: false, message: 'Error interno al obtener administradores.' });
  }
};


/**
 * PUT /api/empresas/mi-datos-pago  (Administrador y Gerente)
 * Guarda los datos de cobro de la empresa que ven sus clientes al pagar.
 */
export const actualizarMisDatosPago = async (req, res) => {
  const empresa_id = req.user?.empresa_id;
  if (!empresa_id) {
    return res.status(403).json({ success: false, message: 'Usuario sin empresa asignada.' });
  }

  const CAMPOS = ['banco', 'tipo_cuenta', 'numero_cuenta', 'titular', 'identificacion', 'correo', 'deuna'];
  const datos = {};
  for (const campo of CAMPOS) {
    const valor = req.body?.[campo];
    if (typeof valor === 'string' && valor.trim()) datos[campo] = valor.trim().slice(0, 120);
  }

  try {
    const result = await pool.query(
      'UPDATE empresas SET datos_pago = $1 WHERE id = $2 RETURNING datos_pago',
      [JSON.stringify(datos), empresa_id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Empresa no encontrada.' });
    }
    return res.status(200).json({ success: true, data: result.rows[0].datos_pago });
  } catch (error) {
    console.error('[empresaController] Error en actualizarMisDatosPago:', error.message);
    return res.status(500).json({ success: false, message: 'Error interno al guardar los datos de pago.' });
  }
};
