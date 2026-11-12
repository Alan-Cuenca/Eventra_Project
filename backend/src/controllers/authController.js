import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { ROL_SUPER_ADMIN, ROL_ADMINISTRADOR } from '../middlewares/authMiddleware.js';
import { getMailTransporter, sendPasswordResetEmail } from '../services/emailService.js';

/**
 * =============================================================================
 * TRANSPORTADOR DE CORREOS (Nodemailer)
 * =============================================================================
 * Delegado al servicio centralizado de correos (emailService.js).
 * =============================================================================
 */
export const createMailTransporter = () => getMailTransporter();


/**
 * Envía una invitación por correo a un nuevo colaborador.
 * Acceso exclusivo: Administrador de la empresa (rol_id = 1).
 *
 * Flujo:
 *  1. Extrae email y rol_id de req.body.
 *  2. Extrae empresa_id de req.user.empresa_id (Aislamiento SaaS).
 *  3. Verifica que el email no esté ya registrado en la BD.
 *  4. Genera un token JWT temporal válido por 48 horas con email, rol_id y empresa_id.
 *  5. Envía el correo mediante nodemailer con enlace a /completar-registro?token=...
 *  6. Retorna 200 con confirmación.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
export const invitarUsuario = async (req, res) => {
  const { email, rol_id } = req.body;
  const empresa_id = req.user?.empresa_id;

  try {
    // 1. Validaciones de entrada
    if (!email || rol_id === undefined || rol_id === null) {
      return res.status(400).json({
        success: false,
        message: 'Los campos email y rol_id son obligatorios para enviar una invitación.',
      });
    }

    // 2. Validación de aislamiento SaaS
    if (!empresa_id) {
      return res.status(403).json({
        success: false,
        message: 'Operación denegada. El administrador debe pertenecer a una empresa activa.',
      });
    }

    // Un admin de tenant no puede invitar a un Super Admin (5)
    if (Number(rol_id) === ROL_SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'No está permitido invitar usuarios con el rol supremo Super_Admin.',
      });
    }

    // 3. Verificar que el email no exista ya en la base de datos
    const existingUser = await pool.query(
      'SELECT id FROM usuarios WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (existingUser.rowCount > 0) {
      return res.status(409).json({
        success: false,
        message: 'El correo electrónico ya se encuentra registrado en el sistema.',
      });
    }

    // 4. Generar token temporal de invitación (48 horas)
    const tokenInvitacion = jwt.sign(
      {
        email: email.toLowerCase().trim(),
        rol_id: Number(rol_id),
        empresa_id: Number(empresa_id),
        tipo: 'invitacion',
      },
      process.env.JWT_SECRET,
      { expiresIn: '48h' }
    );

    // 5. Construir enlace hacia el frontend
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const enlaceRegistro = `${frontendUrl}/completar-registro?token=${tokenInvitacion}`;

    // Obtener nombre comercial de la empresa para personalizar el correo
    const empresaRes = await pool.query(
      'SELECT nombre_comercial FROM empresas WHERE id = $1',
      [empresa_id]
    );
    const nombreEmpresa = empresaRes.rows[0]?.nombre_comercial || 'EVENTRA';

    // 6. Envío de correo mediante Nodemailer
    const transporter = createMailTransporter();
    const mailOptions = {
      from: process.env.SMTP_FROM || `"EVENTRA SaaS" <no-reply@eventra.com>`,
      to: email.toLowerCase().trim(),
      subject: `Invitación para unirte al equipo de ${nombreEmpresa} en EVENTRA`,
      text: `Hola,\n\nHas sido invitado a formar parte del equipo de ${nombreEmpresa} en EVENTRA.\n\nPara activar tu cuenta y configurar tu contraseña, ingresa al siguiente enlace (válido por 48 horas):\n${enlaceRegistro}\n\nSi no esperabas este correo, puedes ignorarlo con total seguridad.`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F3F0E4; padding: 40px 20px; color: #233D49;">
          <div style="max-width: 560px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; padding: 32px; box-shadow: 0 4px 14px rgba(35, 61, 73, 0.08);">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #233D49; margin: 0; font-size: 24px; letter-spacing: 1px;">EVENTRA</h1>
              <p style="color: #4D7182; font-size: 13px; margin-top: 4px;">Plataforma de Gestión Integral de Eventos</p>
            </div>
            <hr style="border: none; border-top: 1px solid #ECE7D5; margin: 20px 0;" />
            <h2 style="color: #233D49; font-size: 18px; margin-top: 0;">¡Hola! Has sido invitado a unirte</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #4D7182;">
              El administrador de <strong>${nombreEmpresa}</strong> te ha invitado a formar parte de su equipo operativo en EVENTRA.
            </p>
            <p style="font-size: 14px; line-height: 1.6; color: #233D49;">
              Para completar tu registro, configurar tu contraseña y acceder al sistema, haz clic en el siguiente botón:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${enlaceRegistro}"
                 style="background-color: #4D7182; color: #FFFFFF; text-decoration: none; padding: 13px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">
                Completar mi Registro
              </a>
            </div>
            <p style="font-size: 12px; color: #8A98A0; line-height: 1.5; margin-top: 25px;">
              * Este enlace es seguro y expirará en <strong>48 horas</strong>.<br/>
              Si el botón no funciona, copia y pega este enlace en tu navegador:<br/>
              <a href="${enlaceRegistro}" style="color: #4D7182; word-break: break-all;">${enlaceRegistro}</a>
            </p>
          </div>
        </div>
      `,
    };

    let previewUrl = null;
    try {
      const info = await transporter.sendMail(mailOptions);
      previewUrl = nodemailer.getTestMessageUrl ? nodemailer.getTestMessageUrl(info) : null;
    } catch (mailError) {
      console.warn('[authController] Envío de correo no disponible o simulado:', mailError.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Invitación enviada exitosamente por correo electrónico.',
      data: {
        email: email.toLowerCase().trim(),
        rol_id: Number(rol_id),
        empresa_id: Number(empresa_id),
        enlace_registro: enlaceRegistro,
        token_invitacion: tokenInvitacion,
        preview_url: previewUrl,
      },
    });

  } catch (error) {
    console.error('[authController] Error en invitarUsuario:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al procesar la invitación.',
    });
  }
};

/**
 * Completa el registro de un nuevo empleado a partir de su token de invitación.
 * Acceso: Público (requiere token JWT de invitación válido).
 *
 * Flujo:
 *  1. Extrae token y datos personales del req.body: nombre_completo, cedula, fecha_nacimiento, password.
 *  2. Verifica el token con jwt.verify y extrae email, rol_id y empresa_id validados.
 *  3. Encripta password con bcrypt.
 *  4. Inserta el nuevo usuario en la tabla usuarios.
 *  5. Retorna 201 de creación exitosa.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
export const completarRegistro = async (req, res) => {
  const { token, nombre_completo, cedula, fecha_nacimiento, password } = req.body;

  try {
    // 1. Validar campos obligatorios
    if (!token || !nombre_completo || !password) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos obligatorios deben ser proporcionados: token, nombre_completo, password.',
      });
    }

    // 2. Verificar y decodificar el token de invitación
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      return res.status(400).json({
        success: false,
        message: 'El token de invitación es inválido o ha expirado. Solicite una nueva invitación a su Administrador.',
      });
    }

    const { email, rol_id, empresa_id } = decoded;

    if (!email || !rol_id || !empresa_id) {
      return res.status(400).json({
        success: false,
        message: 'El token de invitación no contiene la información requerida del tenant.',
      });
    }

    // 3. Verificar que el email no esté ya registrado (previene reuso del token)
    const existing = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (existing.rowCount > 0) {
      return res.status(409).json({
        success: false,
        message: 'Esta invitación ya fue utilizada. El usuario ya se encuentra registrado.',
      });
    }

    // 4. Encriptar la contraseña con bcrypt
    const SALT_ROUNDS = 10;
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    // 5. Insertar usuario en la BD con los datos del token y datos personales
    const result = await pool.query(
      `INSERT INTO usuarios (empresa_id, rol_id, nombre_completo, email, password_hash, cedula, fecha_nacimiento, estado_activo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)
       RETURNING id, empresa_id, rol_id, nombre_completo, email, cedula, fecha_nacimiento, estado_activo, fecha_creacion`,
      [
        Number(empresa_id),
        Number(rol_id),
        nombre_completo.trim(),
        email.toLowerCase().trim(),
        password_hash,
        cedula ? String(cedula).trim() : null,
        fecha_nacimiento || null,
      ]
    );

    const nuevoUsuario = result.rows[0];

    return res.status(201).json({
      success: true,
      message: 'Registro completado exitosamente. Ahora puedes iniciar sesión en EVENTRA.',
      data: nuevoUsuario,
    });

  } catch (error) {
    console.error('[authController] Error en completarRegistro:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al completar el registro.',
    });
  }
};

/**
 * Bloqueo de autoregistro público general (para evitar registro directo de roles internos).
 * Informa a cualquier intento de consumo de la ruta antigua que se requiere invitación.
 */
export const registerUser = async (req, res) => {
  return res.status(403).json({
    success: false,
    message: 'El autoregistro general está deshabilitado en EVENTRA. Los colaboradores deben ser invitados por su Administrador, y los clientes deben registrarse desde el portal específico de la empresa.',
  });
};

/**
 * =============================================================================
 * FLUJO SAAS NIVEL 3: Autoregistro de Clientes Finales
 * =============================================================================
 * Permite a los clientes finales auto-registrarse de forma segura ÚNICAMENTE desde
 * el portal web específico de una empresa (identificada por su slug).
 *
 * Reglas de Seguridad SaaS:
 *  1. Valida que la empresa exista y esté activa según el empresa_slug.
 *  2. Asigna obligatoriamente rol_id = 4 (Cliente), ignorando cualquier rol manipulado en el body.
 *  3. Inyecta de forma segura el empresa_id obtenido del slug verificado.
 *  4. Ejecuta transacción atómica: crea el usuario en 'usuarios' y el perfil en 'clientes'.
 *  5. Retorna 201 con token JWT firmado para autenticación inmediata.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
export const registrarClientePortal = async (req, res) => {
  const {
    empresa_slug,
    empresa_id,
    nombre_completo,
    nombres,
    apellidos,
    email,
    password,
    telefono,
    cedula,
  } = req.body;

  // 1. Validaciones básicas de entrada
  if ((!empresa_slug || !empresa_slug.trim()) && !empresa_id) {
    return res.status(400).json({
      success: false,
      message: 'El identificador de la empresa (empresa_id o empresa_slug) es obligatorio para identificar el portal de la empresa.',
    });
  }

  const nombreFinal = (nombre_completo || '').trim() || `${(nombres || '').trim()} ${(apellidos || '').trim()}`.trim();

  if (!nombreFinal) {
    return res.status(400).json({
      success: false,
      message: 'El nombre completo es obligatorio.',
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email.trim())) {
    return res.status(400).json({
      success: false,
      message: 'Debe proporcionar un correo electrónico válido.',
    });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'La contraseña es obligatoria y debe tener al menos 6 caracteres.',
    });
  }

  const client = await pool.connect();

  try {
    // 2. Buscar empresa por id o slug y verificar estado activo
    let empresaRes;
    if (empresa_id) {
      empresaRes = await client.query(
        `SELECT id, nombre_comercial, slug, plan_suscripcion, estado_activo
         FROM empresas
         WHERE id = $1`,
        [Number(empresa_id)]
      );
    } else {
      empresaRes = await client.query(
        `SELECT id, nombre_comercial, slug, plan_suscripcion, estado_activo
         FROM empresas
         WHERE LOWER(slug) = LOWER($1)
            OR (LOWER($1) = 'la-catedral' AND LOWER(slug) = 'helados-la-catedral')
            OR (LOWER($1) IN ('recepciones-eventos-imperial-1', 'eventos-imperial') AND LOWER(slug) IN ('recepciones-eventos-imperial-1', 'eventos-imperial'))
         LIMIT 1`,
        [empresa_slug.trim()]
      );
    }

    if (empresaRes.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'No existe ninguna empresa asociada al portal especificado.',
      });
    }

    const empresa = empresaRes.rows[0];

    if (!empresa.estado_activo) {
      return res.status(403).json({
        success: false,
        message: 'El portal de esta empresa se encuentra temporalmente inactivo. Contacte al organizador.',
      });
    }

    const emailNormalizado = email.toLowerCase().trim();

    // 3. Verificar que el email no esté registrado en usuarios
    const userExists = await client.query(
      'SELECT id FROM usuarios WHERE email = $1',
      [emailNormalizado]
    );

    if (userExists.rowCount > 0) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe una cuenta registrada con este correo electrónico. Inicia sesión en su lugar.',
      });
    }

    // 4. Iniciar transacción atómica (usuarios + clientes)
    await client.query('BEGIN');

    // Hashear contraseña con bcrypt
    const SALT_ROUNDS = 10;
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    // Inserción en usuarios con rol_id = 4 estricto (Cliente)
    const ROL_CLIENTE_ID = 4;
    const usuarioRes = await client.query(
      `INSERT INTO usuarios (empresa_id, rol_id, nombre_completo, email, password_hash, cedula, estado_activo)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING id, empresa_id, rol_id, nombre_completo, email, cedula, estado_activo, fecha_creacion`,
      [
        empresa.id,
        ROL_CLIENTE_ID,
        nombreFinal,
        emailNormalizado,
        password_hash,
        cedula ? String(cedula).trim() : null,
      ]
    );

    const nuevoUsuario = usuarioRes.rows[0];

    // Desglosar nombres y apellidos para la tabla de CRM clientes
    const partes = nombreFinal.split(/\s+/);
    const nombresCliente = (nombres && nombres.trim()) || (partes.length > 1 ? partes.slice(0, -1).join(' ') : partes[0]);
    const apellidosCliente = (apellidos && apellidos.trim()) || (partes.length > 1 ? partes.slice(-1).join(' ') : ' ');

    const clienteRes = await client.query(
      `INSERT INTO clientes (empresa_id, nombres, apellidos, email, telefono, estado_activo)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id, empresa_id, nombres, apellidos, email, telefono, estado_activo, fecha_creacion`,
      [
        empresa.id,
        nombresCliente,
        apellidosCliente,
        emailNormalizado,
        telefono ? String(telefono).trim() : null,
      ]
    );

    const nuevoCliente = clienteRes.rows[0];

    await client.query('COMMIT');

    // 5. Generar token JWT para inicio de sesión inmediato
    const payload = {
      id: nuevoUsuario.id,
      rol_id: ROL_CLIENTE_ID,
      rol: 'Cliente',
      rol_nombre: 'Cliente',
      empresa_id: empresa.id,
      empresa_nombre: empresa.nombre_comercial,
      empresa_slug: empresa.slug,
      plan_suscripcion: empresa.plan_suscripcion,
      email: nuevoUsuario.email,
      cliente_id: nuevoCliente.id,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

    return res.status(201).json({
      success: true,
      message: `¡Bienvenido! Te has registrado exitosamente en ${empresa.nombre_comercial}.`,
      token,
      data: {
        usuario: nuevoUsuario,
        cliente: nuevoCliente,
        empresa_slug: empresa.slug,
        empresa: {
          id: empresa.id,
          nombre_comercial: empresa.nombre_comercial,
          slug: empresa.slug,
        },
      },
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[authController] Error en registrarClientePortal:', error.message);

    // Detección de colisión de unicidad
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'El correo electrónico o la cédula ya se encuentran registrados en el sistema.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al procesar el registro del cliente.',
    });
  } finally {
    client.release();
  }
};

/**
 * Consulta la información pública del portal de una empresa por su slug.
 * Permite a la página de registro/login de clientes validar la empresa y personalizar la interfaz.
 */
export const obtenerInfoPortalEmpresa = async (req, res) => {
  const { slug } = req.params;

  if (!slug) {
    return res.status(400).json({
      success: false,
      message: 'El parámetro slug es requerido.',
    });
  }

  try {
    const result = await pool.query(
      `SELECT id, nombre_comercial, slug, plan_suscripcion, estado_activo,
              logo_url,
              COALESCE(paleta_colores, 'sofisticacion_sutil') AS paleta_colores,
              paleta_personalizada,
              COALESCE(marca_agua_activa, true) AS marca_agua_activa,
              portal_titulo,
              portal_descripcion
       FROM empresas
       WHERE LOWER(slug) = LOWER($1)
          OR (LOWER($1) = 'la-catedral' AND LOWER(slug) = 'helados-la-catedral')
          OR (LOWER($1) IN ('recepciones-eventos-imperial-1', 'eventos-imperial') AND LOWER(slug) IN ('recepciones-eventos-imperial-1', 'eventos-imperial'))
       LIMIT 1`,
      [slug.trim()]
    );

    if (result.rowCount === 0 || !result.rows[0].estado_activo) {
      return res.status(404).json({
        success: false,
        message: 'El portal de la empresa no existe o no se encuentra activo.',
      });
    }

    return res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('[authController] Error en obtenerInfoPortalEmpresa:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error al consultar la información del portal.',
    });
  }
};

/**
 * Inicia sesión de un usuario en el sistema EVENTRA SaaS.
 *
 * Flujo:
 *  1. Extrae email y password del body.
 *  2. Busca el usuario por email e incluye rol y estado de empresa (tenant).
 *  3. Compara el password con el hash almacenado (bcrypt).
 *  4. Verifica que la cuenta de usuario esté activa.
 *  5. Verifica que la empresa (tenant) no esté suspendida (si no es Super_Admin).
 *  6. Genera un JWT firmado con payload: id, rol_id, empresa_id, email.
 *  7. Retorna 200 con el token y datos del usuario (sin hash).
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // --- Validación de campos obligatorios ---
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Los campos email y password son obligatorios.',
      });
    }

    // --- Buscar usuario por email con datos de rol y empresa ---
    const result = await pool.query(
      `SELECT u.id, u.empresa_id, u.rol_id, u.nombre_completo, u.email, u.password_hash, u.estado_activo,
              u.debe_cambiar_password,
              r.nombre AS rol_nombre,
              e.nombre_comercial AS empresa_nombre,
              e.slug AS empresa_slug,
              e.plan_suscripcion,
              e.estado_activo AS empresa_activa
       FROM usuarios u
       LEFT JOIN roles r ON u.rol_id = r.id
       LEFT JOIN empresas e ON u.empresa_id = e.id
       WHERE u.email = $1`,
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado.',
      });
    }

    const user = result.rows[0];

    // --- Verificar contraseña con bcrypt ---
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas.',
      });
    }

    // --- Verificar que la cuenta esté activa ---
    if (!user.estado_activo) {
      return res.status(403).json({
        success: false,
        message: 'La cuenta de usuario está desactivada. Contacte al administrador.',
      });
    }

    // --- Verificar estado del tenant (empresa): si está suspendida, bloquear acceso (excepto Super_Admin) ---
    if (Number(user.rol_id) !== ROL_SUPER_ADMIN && user.empresa_activa === false) {
      return res.status(403).json({
        success: false,
        message: 'La empresa asociada a su cuenta se encuentra suspendida o inactiva. Contacte a soporte de EVENTRA.',
      });
    }

    // --- Generar token JWT con empresa_id y rol_id explícitos ---
    const { token, data: userData } = construirSesion(user);

    return res.status(200).json({
      success: true,
      message: userData.debe_cambiar_password
        ? 'Inicio de sesión exitoso. Debes actualizar tu contraseña temporal para continuar.'
        : 'Inicio de sesión exitoso.',
      token,
      data: userData,
    });

  } catch (error) {
    console.error('[authController] Error en loginUser:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al iniciar sesión.',
    });
  }
};

/**
 * =============================================================================
 * GESTIÓN DE CONTRASEÑAS: cambio obligatorio y recuperación
 * =============================================================================
 */

const SALT_ROUNDS_PASSWORD = 10;
const RESET_MINUTOS_VALIDEZ = 30;
const PROPOSITO_RESET = 'reset_password';

const SQL_USUARIO_SESION = `
  SELECT u.id, u.empresa_id, u.rol_id, u.nombre_completo, u.email, u.password_hash, u.estado_activo,
         u.debe_cambiar_password,
         r.nombre AS rol_nombre,
         e.nombre_comercial AS empresa_nombre,
         e.slug AS empresa_slug,
         e.plan_suscripcion,
         e.estado_activo AS empresa_activa
  FROM usuarios u
  LEFT JOIN roles r ON u.rol_id = r.id
  LEFT JOIN empresas e ON u.empresa_id = e.id`;

/**
 * Genera el JWT de sesión y los datos públicos del usuario (sin password_hash).
 * Si la cuenta tiene una contraseña temporal, el token lleva debe_cambiar_password = true
 * y el middleware verifyToken bloqueará el resto de la API hasta que se cambie.
 */
function construirSesion(user) {
  const debeCambiar = user.debe_cambiar_password === true;
  const payload = {
    id: user.id,
    rol_id: Number(user.rol_id),
    rol: user.rol_nombre,
    rol_nombre: user.rol_nombre,
    empresa_id: user.empresa_id !== undefined && user.empresa_id !== null ? Number(user.empresa_id) : null,
    empresa_slug: user.empresa_slug || null,
    plan_suscripcion: user.plan_suscripcion || null,
    email: user.email,
    debe_cambiar_password: debeCambiar,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
  const { password_hash, ...data } = user;
  return { token, data: { ...data, debe_cambiar_password: debeCambiar } };
}

/**
 * Valida la política de contraseñas de EVENTRA.
 * @returns {string|null} Mensaje de error o null si es válida.
 */
export const validarPoliticaPassword = (password, confirmacion) => {
  if (!password || typeof password !== 'string') {
    return 'Debes ingresar la nueva contraseña.';
  }
  if (password.length < 8) {
    return 'La nueva contraseña debe tener al menos 8 caracteres.';
  }
  if (password.length > 72) {
    return 'La nueva contraseña no puede superar los 72 caracteres.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'La nueva contraseña debe incluir al menos una letra mayúscula.';
  }
  if (!/\d/.test(password)) {
    return 'La nueva contraseña debe incluir al menos un número.';
  }
  if (confirmacion !== undefined && password !== confirmacion) {
    return 'Las contraseñas no coinciden.';
  }
  return null;
};

/**
 * Ruta de login a la que debe volver el usuario según su empresa.
 */
const rutaLoginUsuario = (user) => {
  if (Number(user.rol_id) !== ROL_SUPER_ADMIN && user.empresa_slug) {
    return `/portal/${user.empresa_slug}/login`;
  }
  return '/login';
};

/**
 * POST /api/auth/cambiar-password-obligatorio
 * Cambia la contraseña del usuario autenticado (obligatorio tras recibir una
 * contraseña temporal). Requiere la contraseña actual. Devuelve un JWT nuevo
 * sin la marca debe_cambiar_password.
 *
 * Nota: los errores de validación usan 400 (nunca 401) para no cerrar la sesión
 * desde el interceptor del frontend.
 */
export const cambiarPasswordObligatorio = async (req, res) => {
  const { password_temporal, password_actual, password_nuevo, password_confirmar } = req.body || {};
  const passwordActual = password_temporal ?? password_actual;
  const userId = req.user?.id;

  try {
    if (!passwordActual) {
      return res.status(400).json({
        success: false,
        message: 'Debes ingresar tu contraseña actual (la contraseña temporal recibida por correo).',
      });
    }

    const errorPolitica = validarPoliticaPassword(password_nuevo, password_confirmar);
    if (errorPolitica) {
      return res.status(400).json({ success: false, message: errorPolitica });
    }

    const result = await pool.query(`${SQL_USUARIO_SESION} WHERE u.id = $1`, [userId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
    }

    const user = result.rows[0];

    if (!user.estado_activo) {
      return res.status(403).json({
        success: false,
        message: 'La cuenta de usuario está desactivada. Contacte al administrador.',
      });
    }

    const actualValida = await bcrypt.compare(passwordActual, user.password_hash);
    if (!actualValida) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña actual (temporal) es incorrecta.',
      });
    }

    const esIgual = await bcrypt.compare(password_nuevo, user.password_hash);
    if (esIgual) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe ser diferente a la contraseña temporal.',
      });
    }

    const nuevoHash = await bcrypt.hash(password_nuevo, SALT_ROUNDS_PASSWORD);
    await pool.query(
      `UPDATE usuarios
          SET password_hash = $1, debe_cambiar_password = false, fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id = $2`,
      [nuevoHash, user.id]
    );

    const { token, data } = construirSesion({
      ...user,
      password_hash: nuevoHash,
      debe_cambiar_password: false,
    });

    return res.status(200).json({
      success: true,
      message: 'Contraseña actualizada exitosamente.',
      token,
      data,
    });
  } catch (error) {
    console.error('[authController] Error en cambiarPasswordObligatorio:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al actualizar la contraseña.',
    });
  }
};

/**
 * POST /api/auth/recuperar-password
 * Envía un enlace de restablecimiento (válido 30 min, de un solo uso) al correo.
 *
 * Seguridad:
 *  - Responde siempre el mismo mensaje exista o no la cuenta (evita enumeración).
 *  - El token se firma con JWT_SECRET + hash actual de la contraseña: en cuanto
 *    la contraseña cambia, el enlace deja de funcionar (uso único).
 */
export const solicitarRecuperacionPassword = async (req, res) => {
  const { email } = req.body || {};
  const respuestaGenerica = {
    success: true,
    message: 'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña en los próximos minutos.',
  };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
    return res.status(400).json({
      success: false,
      message: 'Ingresa un correo electrónico válido.',
    });
  }

  try {
    const result = await pool.query(`${SQL_USUARIO_SESION} WHERE u.email = $1`, [
      email.toLowerCase().trim(),
    ]);

    const user = result.rows[0];
    const empresaBloqueada =
      user && Number(user.rol_id) !== ROL_SUPER_ADMIN && user.empresa_activa === false;

    if (user && user.estado_activo && !empresaBloqueada) {
      const resetToken = jwt.sign(
        { id: user.id, proposito: PROPOSITO_RESET },
        process.env.JWT_SECRET + user.password_hash,
        { expiresIn: `${RESET_MINUTOS_VALIDEZ}m` }
      );

      const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
      const base =
        Number(user.rol_id) !== ROL_SUPER_ADMIN && user.empresa_slug
          ? `${frontendUrl}/portal/${encodeURIComponent(user.empresa_slug)}/restablecer-password`
          : `${frontendUrl}/restablecer-password`;
      const enlaceReset = `${base}?token=${encodeURIComponent(resetToken)}`;

      // Envío desacoplado: no se espera la respuesta del proveedor de correo para
      // no revelar (por tiempo de respuesta) si la cuenta existe.
      sendPasswordResetEmail({
        to: user.email,
        nombre: user.nombre_completo,
        empresaNombre: user.empresa_nombre,
        enlaceReset,
        minutosValidez: RESET_MINUTOS_VALIDEZ,
      })
        .then((r) => {
          if (!r?.success) {
            console.error('[authController] No se pudo enviar el correo de recuperación:', r?.error);
          }
        })
        .catch((err) => console.error('[authController] Error enviando correo de recuperación:', err.message));
    }

    return res.status(200).json(respuestaGenerica);
  } catch (error) {
    console.error('[authController] Error en solicitarRecuperacionPassword:', error.message);
    return res.status(500).json({
      success: false,
      message: 'No fue posible procesar la solicitud. Intenta nuevamente en unos minutos.',
    });
  }
};

/**
 * POST /api/auth/restablecer-password
 * Establece una nueva contraseña usando el token recibido por correo.
 * También limpia la marca debe_cambiar_password (la contraseña ya es personal).
 */
export const restablecerPassword = async (req, res) => {
  const { token, password_nuevo, password_confirmar } = req.body || {};
  const mensajeTokenInvalido =
    'El enlace de recuperación es inválido, ya fue utilizado o ha expirado. Solicita uno nuevo.';

  try {
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ success: false, message: mensajeTokenInvalido });
    }

    const errorPolitica = validarPoliticaPassword(password_nuevo, password_confirmar);
    if (errorPolitica) {
      return res.status(400).json({ success: false, message: errorPolitica });
    }

    const sinVerificar = jwt.decode(token);
    if (!sinVerificar?.id || sinVerificar.proposito !== PROPOSITO_RESET) {
      return res.status(400).json({ success: false, message: mensajeTokenInvalido });
    }

    const result = await pool.query(`${SQL_USUARIO_SESION} WHERE u.id = $1`, [sinVerificar.id]);
    const user = result.rows[0];
    if (!user) {
      return res.status(400).json({ success: false, message: mensajeTokenInvalido });
    }

    try {
      const verificado = jwt.verify(token, process.env.JWT_SECRET + user.password_hash);
      if (verificado.proposito !== PROPOSITO_RESET || verificado.id !== user.id) {
        throw new Error('Propósito inválido');
      }
    } catch {
      return res.status(400).json({ success: false, message: mensajeTokenInvalido });
    }

    if (!user.estado_activo) {
      return res.status(403).json({
        success: false,
        message: 'La cuenta de usuario está desactivada. Contacte al administrador.',
      });
    }

    const nuevoHash = await bcrypt.hash(password_nuevo, SALT_ROUNDS_PASSWORD);
    await pool.query(
      `UPDATE usuarios
          SET password_hash = $1, debe_cambiar_password = false, fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id = $2`,
      [nuevoHash, user.id]
    );

    return res.status(200).json({
      success: true,
      message: 'Tu contraseña fue restablecida exitosamente. Ya puedes iniciar sesión.',
      data: { redirect: rutaLoginUsuario(user) },
    });
  } catch (error) {
    console.error('[authController] Error en restablecerPassword:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al restablecer la contraseña.',
    });
  }
};
