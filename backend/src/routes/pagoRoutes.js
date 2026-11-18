import express from 'express';
import { registrarValidacionIds } from '../middlewares/validarParams.js';
import {
  registrarPago,
  obtenerPagos,
  obtenerPagosPorEvento,
  actualizarEstadoPago,
} from '../controllers/pagoController.js';
import multer from 'multer';

const TIPOS_COMPROBANTE = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (TIPOS_COMPROBANTE.includes(file.mimetype)) return cb(null, true);
    const err = new Error('El comprobante debe ser una imagen (JPG, PNG, WEBP) o un PDF.');
    err.status = 400;
    return cb(err);
  },
});
import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();
registrarValidacionIds(router);

/**
 * @route  POST /api/pagos
 * @desc   Registra un nuevo pago o anticipo para un evento
 * @access Private + RBAC — Administrador (1), Gerente (2), Trabajador (3) y Cliente (4)
 *
 * Body esperado (multipart/form-data):
 * {
 *   "evento_id":   "uuid-del-evento",
 *   "monto":       500.00,
 *   "concepto":    "Anticipo" | "Abono" | "Liquidación",
 *   "metodo_pago": "Transferencia" | "Deuna" | "Efectivo",
 *   "comprobante": File (obligatorio si Deuna o Transferencia)
 * }
 */
router.post('/', verifyToken, authorizeRoles([1, 2, 3, 4]), upload.single('comprobante'), registrarPago);

/**
 * @route  GET /api/pagos
 * @desc   Lista todos los pagos de la empresa con datos del evento (JOIN)
 * @access Private + RBAC — Administrador (1), Gerente (2) y Trabajador (3)
 */
router.get('/', verifyToken, authorizeRoles([1, 2, 3]), obtenerPagos);

/**
 * @route  GET /api/pagos/evento/:evento_id
 * @desc   Lista los pagos de un evento específico + resumen de totales
 * @access Private — cualquier usuario autenticado con JWT válido
 */
router.get('/evento/:evento_id', verifyToken, obtenerPagosPorEvento);

/**
 * @route  PUT /api/pagos/:id/estado
 * @desc   Aprueba o rechaza un pago (cambia estado)
 * @access Private + RBAC — Administrador (1) y Gerente (2)
 */
router.put('/:id/estado', verifyToken, authorizeRoles([1, 2]), actualizarEstadoPago);

export default router;
