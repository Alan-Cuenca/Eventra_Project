import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { ROL_SUPER_ADMIN } from '../middlewares/authMiddleware.js';

/**
 * Registra un nuevo usuario en el sistema EVENTRA.
 *
 * Flujo SaaS:
 *  1. Valida campos obligatorios (nombre_completo, email, password, rol_id, empresa_id).
 *  2. Previene autoregistro no autorizado con rol Super_Admin (5).
 *  3. Verifica que el email sea único en la plataforma.
 *  4. Encripta la contraseña con bcrypt.
 *  5. Inserta el usuario vinculado a su tenant (empresa_id).
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
export const registerUser = async (req, res) => {
  const { nombre_completo, email, password, rol_id, empresa_id } = req.body;

  try {
    // --- Validación de campos obligatorios ---
    if (!nombre_completo || !email || !password || rol_id === undefined || rol_id === null) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son obligatorios: nombre_completo, email, password, rol_id, empresa_id.',
      });
    }

    // Para usuarios que no sean Super Admin, empresa_id es estrictamente obligatorio
    if (Number(rol_id) !== ROL_SUPER_ADMIN && !empresa_id) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son obligatorios: nombre_completo, email, password, rol_id, empresa_id.',
      });
    }

    // Protección de escalabilidad de privilegios: no permitir autoregistro como Super_Admin
    if (Number(rol_id) === ROL_SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'No está permitido registrarse como Super_Admin directamente.',
      });
    }

    // --- Verificar si el email ya existe ---
    const existingUser = await pool.query(
      'SELECT id FROM usuarios WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'El email ya se encuentra registrado en el sistema.',
      });
    }

    // --- Encriptar la contraseña ---
    const SALT_ROUNDS = 10;
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    // --- Insertar el nuevo usuario (SQL parametrizado) ---
    const result = await pool.query(
      `INSERT INTO usuarios (empresa_id, rol_id, nombre_completo, email, password_hash)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, empresa_id, rol_id, nombre_completo, email, estado_activo, fecha_creacion`,
      [empresa_id || null, Number(rol_id), nombre_completo, email, password_hash]
    );

    const newUser = result.rows[0];

    return res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente.',
      data: newUser,
    });

  } catch (error) {
    console.error('[authController] Error en registerUser:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al registrar el usuario.',
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
              r.nombre AS rol_nombre,
              e.nombre_comercial AS empresa_nombre,
              e.plan_suscripcion,
              e.estado_activo AS empresa_activa
       FROM usuarios u
       LEFT JOIN roles r ON u.rol_id = r.id
       LEFT JOIN empresas e ON u.empresa_id = e.id
       WHERE u.email = $1`,
      [email]
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
    const payload = {
      id: user.id,
      rol_id: Number(user.rol_id),
      rol: user.rol_nombre,
      rol_nombre: user.rol_nombre,
      empresa_id: user.empresa_id !== undefined && user.empresa_id !== null ? Number(user.empresa_id) : null,
      plan_suscripcion: user.plan_suscripcion || null,
      email: user.email,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

    // --- Respuesta exitosa (sin exponer password_hash) ---
    const { password_hash, ...userData } = user;

    return res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso.',
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

