import express from 'express';
import multer from 'multer';
import {
  registrarPagoSuscripcion,
  obtenerSuscripciones,
  actualizarEstadoSuscripcion,
  obtenerConsumoSuscripcion,
  crearSolicitudRegistroPlan,
  listarSolicitudesRegistroPlan,
  actualizarEstadoSolicitudRegistroPlan,
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

const uploadPdfPublico = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 }, // 12 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') return cb(null, true);
    const err = new Error('El comprobante debe ser un archivo PDF.');
    err.status = 400;
    return cb(err);
  },
});

const router = express.Router();

/** POST /api/suscripciones/solicitud-publica — solicitud de plan desde la landing (público). */
router.post('/solicitud-publica', uploadPdfPublico.single('comprobante'), crearSolicitudRegistroPlan);

/** GET /api/suscripciones/solicitudes-publicas — solicitudes pendientes de revisión (Super_Admin). */
router.get('/solicitudes-publicas', verifyToken, authorizeSuperAdmin, listarSolicitudesRegistroPlan);

/** PATCH /api/suscripciones/solicitudes-publicas/:id/estado — marcar Atendida/Rechazada (Super_Admin). */
router.patch('/solicitudes-publicas/:id/estado', verifyToken, authorizeSuperAdmin, actualizarEstadoSolicitudRegistroPlan);

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

