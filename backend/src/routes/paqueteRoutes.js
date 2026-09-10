import express from 'express';
import { crearPaquete, obtenerPaquetes } from '../controllers/paqueteController.js';
import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @route  GET /api/paquetes
 * @desc   Retorna todos los paquetes de la empresa del usuario autenticado
 * @access Private — cualquier usuario autenticado con JWT válido
 */
router.get('/', verifyToken, obtenerPaquetes);

/**
 * @route  POST /api/paquetes
 * @desc   Crea un paquete y asocia sus servicios (transacción atómica)
 * @access Private + RBAC — solo Administrador (1) y Gerente (2)
 *
 * Body esperado:
 * {
 *   "nombre": "Paquete Gold",
 *   "descripcion": "Incluye fotografía y catering",
 *   "precio_total": 1500.00,
 *   "servicios_ids": ["uuid-servicio-1", "uuid-servicio-2"]
 * }
 */
router.post('/', verifyToken, authorizeRoles([1, 2]), crearPaquete);

export default router;
