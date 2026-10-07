import express from 'express';
import { crearActividad, obtenerActividades, actualizarEstadoActividad, actualizarActividad, eliminarActividad } from '../controllers/actividadController.js';
import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @route  POST /api/actividades
 * @desc   Crea y asigna una nueva actividad a un evento
 * @access Private + RBAC — solo Administrador (1) y Gerente (2)
 *
 * Body esperado:
 * {
 *   "evento_id":         "uuid-del-evento",
 *   "responsable_id":    "uuid-del-usuario" | null,
 *   "titulo":            "Montar decoración floral",
 *   "descripcion":       "Descripción detallada de la tarea",
 *   "fecha_vencimiento": "2026-12-14"
 * }
 */
router.post('/', verifyToken, authorizeRoles([1, 2]), crearActividad);

/**
 * @route  GET /api/actividades
 * @desc   Lista actividades de la empresa (Trabajador ve solo las suyas)
 * @access Private — cualquier usuario autenticado con JWT válido
 */
router.get('/', verifyToken, obtenerActividades);

/**
 * @route  PATCH /api/actividades/:id/estado
 * @desc   Actualiza el estado de una actividad (ej. marcar como Completada)
 * @access Private — cualquier usuario autenticado (el responsable actualiza la suya)
 *
 * Body esperado:
 * {
 *   "estado": "Pendiente" | "En Progreso" | "Completada" | "Cancelada"
 * }
 */
router.patch('/:id/estado', verifyToken, actualizarEstadoActividad);

/**
 * @route  PUT /api/actividades/:id
 * @desc   Actualiza los datos de una actividad existente
 * @access Private + RBAC — solo Administrador (1) y Gerente (2)
 */
router.put('/:id', verifyToken, authorizeRoles([1, 2]), actualizarActividad);

/**
 * @route  DELETE /api/actividades/:id
 * @desc   Elimina una actividad
 * @access Private + RBAC — solo Administrador (1) y Gerente (2)
 */
router.delete('/:id', verifyToken, authorizeRoles([1, 2]), eliminarActividad);

export default router;
