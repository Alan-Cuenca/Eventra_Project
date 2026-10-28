import express from 'express';
import {
  invitarUsuario,
  completarRegistro,
  registerUser,
  registrarClientePortal,
  obtenerInfoPortalEmpresa,
  loginUser,
} from '../controllers/authController.js';
import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware.js';
import { verificarLimitePlan } from '../middlewares/planLimitsMiddleware.js';

const router = express.Router();

/**
 * @openapi
 * tags:
 *   name: Autenticación
 *   description: Invitaciones por correo, completar registro, login y validación de sesión JWT
 */

/**
 * @openapi
 * /api/auth/invitar:
 *   post:
 *     summary: Envía una invitación por correo a un nuevo colaborador
 *     description: >
 *       Genera un token temporal (48h) con el tenant (empresa_id) y rol_id,
 *       enviando un correo con enlace a /completar-registro.
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, rol_id]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "nuevo.colaborador@empresa.com"
 *               rol_id:
 *                 type: integer
 *                 example: 3
 *                 description: "ID de rol permitido (2=Gerente, 3=Trabajador, 4=Cliente)"
 *     responses:
 *       200:
 *         description: Invitación enviada exitosamente
 *       400:
 *         description: Parámetros inválidos
 *       403:
 *         description: No autorizado (Requiere Administrador)
 *       409:
 *         description: El email ya está registrado
 */
router.post('/invitar', verifyToken, authorizeRoles([1]), verificarLimitePlan('usuarios'), invitarUsuario);

/**
 * @openapi
 * /api/auth/completar-registro:
 *   post:
 *     summary: Completa el registro del empleado desde el enlace del correo
 *     description: >
 *       Verifica el token temporal de invitación e inserta los datos personales del usuario
 *       (nombre_completo, cedula, fecha_nacimiento, password).
 *     tags: [Autenticación]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, nombre_completo, password]
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token JWT temporal recibido en la URL del correo
 *               nombre_completo:
 *                 type: string
 *                 example: "Juan Carlos Pérez"
 *               cedula:
 *                 type: string
 *                 example: "1723456789"
 *               fecha_nacimiento:
 *                 type: string
 *                 format: date
 *                 example: "1994-08-15"
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: "MiContraseniaSegura123"
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *       400:
 *         description: Token inválido, expirado o datos incompletos
 *       409:
 *         description: La invitación ya fue utilizada previamente
 */
router.post('/completar-registro', completarRegistro);

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Endpoint deprecado / bloqueado
 *     description: El autoregistro público está deshabilitado en favor del sistema de invitaciones.
 *     tags: [Autenticación]
 *     responses:
 *       403:
 *         description: Autoregistro deshabilitado
 */
router.post('/register', registerUser);

/**
 * @openapi
 * /api/auth/registro-cliente:
 *   post:
 *     summary: Autoregistro seguro de clientes finales desde el portal de una empresa
 *     description: >
 *       Permite a un cliente registrarse exclusivamente en el portal específico de una empresa
 *       identificada por su slug. Asigna forzosamente rol_id = 4 (Cliente) y crea tanto el usuario
 *       como el registro en clientes atómicamente.
 *     tags: [Autenticación]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [empresa_slug, nombre_completo, email, password]
 *             properties:
 *               empresa_slug:
 *                 type: string
 *                 example: "luxury-events"
 *               nombre_completo:
 *                 type: string
 *                 example: "Valeria Morales"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "valeria.morales@gmail.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *               telefono:
 *                 type: string
 *                 example: "0998765432"
 *               cedula:
 *                 type: string
 *                 example: "1723456780"
 *     responses:
 *       201:
 *         description: Cliente registrado exitosamente con JWT de sesión
 *       400:
 *         description: Parámetros inválidos
 *       404:
 *         description: Empresa no encontrada
 *       409:
 *         description: El email ya se encuentra registrado
 */
router.post('/registro-cliente', verificarLimitePlan('clientes'), registrarClientePortal);

/**
 * @openapi
 * /api/auth/portal/{slug}:
 *   get:
 *     summary: Retorna los datos comerciales básicos de una empresa para su portal público
 *     tags: [Autenticación]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Datos básicos de la empresa inquilina
 *       404:
 *         description: Empresa no encontrada o portal inactivo
 */
router.get('/portal/:slug', obtenerInfoPortalEmpresa);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Inicia sesión y retorna un JWT de acceso
 *     description: >
 *       Autentica al usuario con email y password. Retorna un token JWT firmado
 *       válido por 1 día que debe enviarse en el header `Authorization: Bearer <token>`
 *       en todas las rutas protegidas.
 *     tags: [Autenticación]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "ana.garcia@empresa.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "MiContraseña123"
 *     responses:
 *       200:
 *         description: Login exitoso — retorna el Bearer Token JWT
 *       400:
 *         description: Email o password faltantes
 *       401:
 *         description: Credenciales inválidas
 *       403:
 *         description: Cuenta desactivada o empresa suspendida
 *       404:
 *         description: Usuario no encontrado
 */
router.post('/login', loginUser);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Valida el token y retorna el payload del usuario autenticado
 *     description: >
 *       Ruta protegida de introspección. Retorna los datos de sesión decodificados
 *       (id, empresa_id, rol_id, email) del token Bearer activo.
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token válido — retorna el payload decodificado
 *       401:
 *         description: Token ausente, expirado o inválido
 */
router.get('/me', verifyToken, (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Acceso autorizado.',
    data: req.user,
  });
});

export default router;
