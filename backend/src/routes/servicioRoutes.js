import express from 'express';
import { crearServicio, obtenerServicios, actualizarServicio, eliminarServicio } from '../controllers/servicioController.js';
import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware.js';
import { verificarLimitePlan } from '../middlewares/planLimitsMiddleware.js';

const router = express.Router();

/**
 * @route  GET /api/servicios
 * @desc   Retorna el catálogo de servicios de la empresa del usuario autenticado
 * @access Private — cualquier usuario autenticado con JWT válido
 */
router.get('/', verifyToken, obtenerServicios);

/**
 * @route  POST /api/servicios
 * @desc   Crea un nuevo servicio en el catálogo de la empresa
 * @access Private + RBAC + Límites de Plan SaaS (20 Básico, 50 Premium)
 */
router.post('/', verifyToken, authorizeRoles([1, 2]), verificarLimitePlan('servicios'), crearServicio);

/**
 * @route  PUT /api/servicios/:id
 * @desc   Actualiza un servicio existente
 * @access Private + RBAC — solo Administrador (1) y Gerente (2)
 */
router.put('/:id', verifyToken, authorizeRoles([1, 2]), actualizarServicio);

/**
 * @route  DELETE /api/servicios/:id
 * @desc   Elimina (borrado lógico) un servicio
 * @access Private + RBAC — solo Administrador (1) y Gerente (2)
 */
router.delete('/:id', verifyToken, authorizeRoles([1, 2]), eliminarServicio);

export default router;
