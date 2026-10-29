import express from 'express';
import multer from 'multer';
import {
  obtenerEmpresas,
  crearEmpresa,
  actualizarPlanEmpresa,
  suspenderEmpresa,
  obtenerMiBranding,
  actualizarMiBranding,
} from '../controllers/empresaController.js';
import {
  verifyToken,
  authorizeRoles,
  authorizeSuperAdmin,
  ROL_SUPER_ADMIN,
  ROL_ADMINISTRADOR,
  ROL_GERENTE,
  ROL_TRABAJADOR,
  ROL_CLIENTE,
} from '../middlewares/authMiddleware.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

const router = express.Router();

/**
 * =============================================================================
 * RUTAS DE MARCA BLANCA / BRANDING DEL TENANT
 * =============================================================================
 * Accesible para usuarios autenticados de la empresa inquilina.
 * =============================================================================
 */

/**
 * @openapi
 * /api/empresas/mi-branding:
 *   get:
 *     summary: Retorna la identidad y configuración de marca blanca de la empresa del usuario
 *     tags: [Branding Empresa]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configuración de marca obtenida exitosamente
 *       401:
 *         description: No autenticado
 */
router.get(
  '/mi-branding',
  verifyToken,
  authorizeRoles([ROL_ADMINISTRADOR, ROL_GERENTE, ROL_TRABAJADOR, ROL_CLIENTE, ROL_SUPER_ADMIN]),
  obtenerMiBranding
);

/**
 * @openapi
 * /api/empresas/mi-branding:
 *   put:
 *     summary: Actualiza logotipo, paleta, marca de agua y textos del portal de la empresa
 *     tags: [Branding Empresa]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Marca actualizada exitosamente
 *       403:
 *         description: Exclusivo para Administrador de la empresa
 */
router.put(
  '/mi-branding',
  verifyToken,
  authorizeRoles([ROL_ADMINISTRADOR, ROL_SUPER_ADMIN]),
  upload.single('logo'),
  actualizarMiBranding
);

/**
 * =============================================================================
 * RUTAS: /api/empresas (Gestión Global de Inquilinos SaaS)
 * =============================================================================
 * Acceso EXCLUSIVO para Super_Admin (rol_id = 5 / 0).
 * Ninguna ruta requiere ni acepta manipulación de empresa_id por cabecera ajena.
 * =============================================================================
 */

// Las siguientes rutas administrativas requieren autenticación y rol Super_Admin
router.use(verifyToken, authorizeSuperAdmin);

/**
 * @openapi
 * tags:
 *   name: Inquilinos (Super Admin)
 *   description: Gestión global de empresas y suscripciones SaaS de EVENTRA
 */

/**
 * @openapi
 * /api/empresas:
 *   get:
 *     summary: Lista todas las empresas registradas (Tenants)
 *     tags: [Inquilinos (Super Admin)]
 *     responses:
 *       200:
 *         description: Lista de empresas con métricas de usuarios y eventos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Requiere rol Super_Admin
 */
router.get('/', obtenerEmpresas);

/**
 * @openapi
 * /api/empresas:
 *   post:
 *     summary: Da de alta un nuevo inquilino SaaS y opcionalmente su administrador
 *     tags: [Inquilinos (Super Admin)]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre_comercial]
 *             properties:
 *               nombre_comercial: { type: string }
 *               ruc: { type: string }
 *               plan_suscripcion: { type: string, example: "Basico" }
 *               admin_nombre: { type: string }
 *               admin_email: { type: string }
 *               admin_password: { type: string }
 *     responses:
 *       201:
 *         description: Empresa creada exitosamente
 *       403:
 *         description: Requiere rol Super_Admin
 */
router.post('/', crearEmpresa);

/**
 * @openapi
 * /api/empresas/{id}/plan:
 *   put:
 *     summary: Actualiza el plan de suscripción de una empresa
 *     tags: [Inquilinos (Super Admin)]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [plan_suscripcion]
 *             properties:
 *               plan_suscripcion: { type: string, example: "Premium" }
 *     responses:
 *       200:
 *         description: Plan actualizado
 *       404:
 *         description: Empresa no encontrada
 */
router.put('/:id/plan', actualizarPlanEmpresa);
router.patch('/:id/plan', actualizarPlanEmpresa);

/**
 * @openapi
 * /api/empresas/{id}/suspender:
 *   put:
 *     summary: Suspende o reactiva el acceso de una empresa SaaS
 *     tags: [Inquilinos (Super Admin)]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               estado_activo: { type: boolean, example: false }
 *     responses:
 *       200:
 *         description: Estado modificado
 *       404:
 *         description: Empresa no encontrada
 */
router.put('/:id/suspender', suspenderEmpresa);
router.patch('/:id/suspender', suspenderEmpresa);

export default router;

