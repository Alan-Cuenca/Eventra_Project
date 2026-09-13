import express from 'express';
import { registerUser, loginUser } from '../controllers/authController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @openapi
 * tags:
 *   name: Autenticación
 *   description: Registro, login y validación de sesión JWT
 */

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Registra un nuevo usuario en EVENTRA
 *     description: >
 *       Crea un nuevo usuario asociado a una empresa (empresa_id) y rol (rol_id).
 *       No requiere autenticación previa. El password se almacena hasheado con bcrypt.
 *     tags: [Autenticación]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [empresa_id, rol_id, nombre_completo, email, password]
 *             properties:
 *               empresa_id:
 *                 type: integer
 *                 example: 1
 *                 description: ID de la empresa a la que pertenece el usuario
 *               rol_id:
 *                 type: integer
 *                 example: 3
 *                 description: "1=Administrador, 2=Gerente, 3=Trabajador, 4=Cliente"
 *               nombre_completo:
 *                 type: string
 *                 example: "Ana García López"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "ana.garcia@empresa.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: "MiContraseña123"
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Usuario registrado exitosamente."
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:             { type: string, format: uuid }
 *                     empresa_id:     { type: integer, example: 1 }
 *                     rol_id:         { type: integer, example: 3 }
 *                     nombre_completo:{ type: string }
 *                     email:          { type: string, format: email }
 *                     estado_activo:  { type: boolean, example: true }
 *                     fecha_creacion: { type: string, format: date-time }
 *       400:
 *         description: Campos obligatorios faltantes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: El email ya está registrado (conflicto UNIQUE)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/register', registerUser);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Inicia sesión y retorna un JWT de acceso
 *     description: >
 *       Autentica al usuario con email y password. Retorna un token JWT firmado
 *       válido por 8 horas que debe enviarse en el header `Authorization: Bearer <token>`
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Login exitoso."
 *                 token:
 *                   type: string
 *                   description: JWT firmado. Úsalo en Authorization Bearer.
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 data:
 *                   type: object
 *                   description: Payload del usuario autenticado
 *       400:
 *         description: Email o password faltantes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Credenciales inválidas (usuario no existe o password incorrecto)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/login', loginUser);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Valida el token y retorna el payload del usuario autenticado
 *     description: >
 *       Ruta protegida de introspección. Útil para que el frontend verifique
 *       que el token sigue siendo válido y recupere los datos de sesión
 *       (empresa_id, rol_id, email) sin hacer un nuevo login.
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token válido — retorna el payload decodificado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Acceso autorizado." }
 *                 data:
 *                   type: object
 *                   description: Payload JWT decodificado (id, empresa_id, rol_id, email)
 *       401:
 *         description: Token ausente, expirado o inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/me', verifyToken, (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Acceso autorizado.',
    data: req.user,
  });
});

export default router;

