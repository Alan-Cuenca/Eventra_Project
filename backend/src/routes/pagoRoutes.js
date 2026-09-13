import express from 'express';
import {
  registrarPago,
  obtenerPagos,
  obtenerPagosPorEvento,
} from '../controllers/pagoController.js';
import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @route  POST /api/pagos
 * @desc   Registra un nuevo pago o anticipo para un evento
 * @access Private + RBAC — solo Administrador (1) y Gerente (2)
 *
 * Body esperado:
 * {
 *   "evento_id":   "uuid-del-evento",
 *   "monto":       500.00,
 *   "concepto":    "Anticipo" | "Abono" | "Liquidación",
 *   "metodo_pago": "Transferencia" | "Efectivo" | "Tarjeta",
 *   "estado":      "Completado" | "Pendiente" | "Anulado"  (opcional)
 * }
 */
router.post('/', verifyToken, authorizeRoles([1, 2]), registrarPago);

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

export default router;
