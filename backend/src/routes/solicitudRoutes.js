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
 * @access Private — cualquier usuario autenticado (todos los roles)
 *
 * Body esperado:
 * {
 *   "evento_id":          "uuid-del-evento",
 *   "cliente_id":         "uuid-del-cliente" | null,
 *   "descripcion_cambio": "Cambiar el horario de inicio a las 19:00 hrs."
 * }
 */
router.post('/', verifyToken, crearSolicitud);

/**
 * @route  GET /api/solicitudes
 * @desc   Lista todas las solicitudes de modificación de la empresa
 * @access Private — cualquier usuario autenticado con JWT válido
 */
router.get('/', verifyToken, obtenerSolicitudes);

/**
 * @route  PATCH /api/solicitudes/:id/estado
 * @desc   Aprueba o rechaza una solicitud de modificación
 * @access Private + RBAC — solo Administrador (1) y Gerente (2)
 *
 * Body esperado:
 * {
 *   "estado": "Aprobada" | "Rechazada"
 * }
 */
router.patch('/:id/estado', verifyToken, authorizeRoles([1, 2]), actualizarEstadoSolicitud);

export default router;
