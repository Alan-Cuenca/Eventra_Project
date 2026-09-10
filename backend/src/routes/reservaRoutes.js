import express from 'express';
import { crearReserva, obtenerReservas } from '../controllers/reservaController.js';
import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @route  POST /api/reservas
 * @desc   Crea una reserva de salón/lugar con control de concurrencia
 * @access Private + RBAC — Administrador (1), Gerente (2) y Trabajador (3)
 *
 * Body esperado:
 * {
 *   "cotizacion_id": "uuid-de-la-cotizacion",
 *   "salon_o_lugar": "Salón Principal",
 *   "fecha_evento":  "2026-12-15",
 *   "hora_inicio":   "18:00",
 *   "hora_fin":      "23:00"
 * }
 */
router.post('/', verifyToken, authorizeRoles([1, 2, 3]), crearReserva);

/**
 * @route  GET /api/reservas
 * @desc   Retorna las reservas de la empresa con datos de cotización y cliente
 * @access Private — cualquier usuario autenticado con JWT válido
 */
router.get('/', verifyToken, obtenerReservas);

export default router;
