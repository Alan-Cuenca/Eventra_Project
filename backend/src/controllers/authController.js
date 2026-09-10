import pool from '../config/db.js';
import bcrypt from 'bcrypt';

/**
 * Registra un nuevo usuario en el sistema EVENTRA.
 *
 * Flujo:
 *  1. Extrae los datos del cuerpo de la petición.
 *  2. Verifica que el email no esté ya registrado (unicidad).
 *  3. Encripta la contraseña con bcrypt (salt rounds = 10).
 *  4. Inserta el usuario usando consultas parametrizadas (previene SQL Injection).
 *  5. Retorna 201 con los datos del usuario creado (sin exponer el hash).
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
export const registerUser = async (req, res) => {
  const { nombre_completo, email, password, rol_id, empresa_id } = req.body;

  try {
    // --- Validación de campos obligatorios ---
    if (!nombre_completo || !email || !password || !rol_id || !empresa_id) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son obligatorios: nombre_completo, email, password, rol_id, empresa_id.',
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
      [empresa_id, rol_id, nombre_completo, email, password_hash]
    );

    const newUser = result.rows[0];

    // --- Respuesta exitosa (sin exponer password_hash) ---
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
