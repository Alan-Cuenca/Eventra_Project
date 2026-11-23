import express from 'express';
import { registrarValidacionIds } from '../middlewares/validarParams.js';
import { crearPaquete, obtenerPaquetes, actualizarPaquete, eliminarPaquete } from '../controllers/paqueteController.js';
import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware.js';
import { validarCuerpo } from '../middlewares/validarCuerpo.js';
import { esquemas } from '../middlewares/esquemas.js';

const router = express.Router();
registrarValidacionIds(router);

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
router.post('/', verifyToken, authorizeRoles([1, 2]), validarCuerpo(esquemas.paquete), crearPaquete);

/**
 * @route  PUT /api/paquetes/:id
 * @desc   Actualiza un paquete existente
 * @access Private + RBAC — solo Administrador (1) y Gerente (2)
 */
router.put('/:id', verifyToken, authorizeRoles([1, 2]), validarCuerpo(esquemas.paquete, { parcial: true }), actualizarPaquete);

/**
 * @route  DELETE /api/paquetes/:id
 * @desc   Elimina (borrado lógico) un paquete
 * @access Private + RBAC — solo Administrador (1) y Gerente (2)
 */
router.delete('/:id', verifyToken, authorizeRoles([1, 2]), eliminarPaquete);

export default router;
