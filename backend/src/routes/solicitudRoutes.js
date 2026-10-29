import express from 'express';
import {
  crearSolicitud,
  obtenerSolicitudes,
  actualizarEstadoSolicitud,
} from '../controllers/solicitudController.js';
import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @route  POST /api/solicitudes
 * @desc   Registra una nueva solicitud de modificación sobre un evento
 * @access Private — cualquier usuario autenticado (Clientes y equipo de la empresa)
 */
router.post('/', verifyToken, crearSolicitud);

/**
 * @route  GET /api/solicitudes
 * @desc   Lista historial de solicitudes (Clientes ven solo las suyas, Admin/Gerente ven todas)
 * @access Private — cualquier usuario autenticado con JWT válido
 */
router.get('/', verifyToken, obtenerSolicitudes);

/**
 * @route  PUT /api/solicitudes/:id/estado
 * @route  PATCH /api/solicitudes/:id/estado
 * @desc   Aprueba o rechaza una solicitud de modificación (dispara notificación por correo)
 * @access Private + RBAC — solo Administrador (1) y Gerente (2)
 */
router.put('/:id/estado', verifyToken, authorizeRoles([1, 2]), actualizarEstadoSolicitud);
router.patch('/:id/estado', verifyToken, authorizeRoles([1, 2]), actualizarEstadoSolicitud);

export default router;
