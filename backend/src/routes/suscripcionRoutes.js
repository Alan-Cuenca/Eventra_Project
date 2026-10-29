import express from 'express';
import multer from 'multer';
import {
  registrarPagoSuscripcion,
  obtenerSuscripciones,
  actualizarEstadoSuscripcion,
  obtenerConsumoSuscripcion,
} from '../controllers/suscripcionController.js';
import {
  verifyToken,
  authorizeRoles,
  authorizeSuperAdmin,
  ROL_SUPER_ADMIN,
  ROL_ADMINISTRADOR,
  ROL_GERENTE,
} from '../middlewares/authMiddleware.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

const router = express.Router();

/**
 * @route   POST /api/suscripciones/pagar
 * @desc    Registra y sube el comprobante de pago de suscripción SaaS de la empresa
 * @access  Private — Administrador (1) y Gerente (2)
 */
router.post(
  '/pagar',
  verifyToken,
  authorizeRoles([ROL_ADMINISTRADOR, ROL_GERENTE]),
  upload.single('comprobante'),
  registrarPagoSuscripcion
);

/**
 * @route   GET /api/suscripciones/consumo
 * @desc    Obtiene el uso y los límites del plan de la empresa
 * @access  Private — Administrador (1) y Gerente (2)
 */
router.get(
  '/consumo',
  verifyToken,
  authorizeRoles([ROL_ADMINISTRADOR, ROL_GERENTE]),
  obtenerConsumoSuscripcion
);

/**
 * @route   GET /api/suscripciones
 * @desc    Obtiene el listado de suscripciones
 *          - Super_Admin (5): Todas las empresas
 *          - Administrador (1): Exclusivamente su empresa
 * @access  Private — Super_Admin (5) y Administrador (1)
 */
router.get(
  '/',
  verifyToken,
  authorizeRoles([ROL_ADMINISTRADOR, ROL_SUPER_ADMIN]),
  obtenerSuscripciones
);

/**
 * @route   PUT /api/suscripciones/:id/estado
 * @desc    Aprueba o rechaza una suscripción SaaS de una empresa
 * @access  Private — Exclusivo Super_Admin (5)
 */
router.put(
  '/:id/estado',
  verifyToken,
  authorizeSuperAdmin,
  actualizarEstadoSuscripcion
);

export default router;

