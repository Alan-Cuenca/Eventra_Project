import express from 'express';
import {
  obtenerEmpresas,
  crearEmpresa,
  actualizarPlanEmpresa,
  suspenderEmpresa,
} from '../controllers/empresaController.js';
import { verifyToken, authorizeSuperAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * =============================================================================
 * RUTAS: /api/empresas (Gestión Global de Inquilinos SaaS)
 * =============================================================================
 * Acceso EXCLUSIVO para Super_Admin (rol_id = 5 / 0).
 * Ninguna ruta requiere ni acepta manipulación de empresa_id por cabecera ajena.
 * =============================================================================
 */

// Todas las rutas en este router requieren autenticación y rol Super_Admin
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

