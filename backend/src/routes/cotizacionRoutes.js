import express from 'express';
import { crearCotizacion, obtenerCotizaciones } from '../controllers/cotizacionController.js';
import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @route  POST /api/cotizaciones
 * @desc   Crea una nueva cotización para un cliente de la empresa
 * @access Private + RBAC — Administrador (1), Gerente (2) y Trabajador (3)
 *
 * Body esperado:
 * {
 *   "cliente_id":             "uuid-del-cliente",
 *   "paquete_id":             "uuid-del-paquete" | null,
 *   "fecha_estimada_evento":  "2026-12-15",
 *   "total_calculado":        1500.00
 * }
 */
router.post('/', verifyToken, authorizeRoles([1, 2, 3]), crearCotizacion);

/**
 * @route  GET /api/cotizaciones
 * @desc   Retorna las cotizaciones de la empresa con datos de cliente y paquete
 * @access Private — cualquier usuario autenticado con JWT válido
 */
router.get('/', verifyToken, obtenerCotizaciones);

export default router;
