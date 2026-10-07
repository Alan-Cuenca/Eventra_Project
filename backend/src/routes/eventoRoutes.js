import express from 'express';
import { crearEvento, obtenerEventos, actualizarEstadoEvento, obtenerEventoPorId, actualizarEvento, eliminarEvento } from '../controllers/eventoController.js';
import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @route  POST /api/eventos
 * @desc   Crea un nuevo evento vinculado a una reserva
 * @access Private + RBAC — solo Administrador (1) y Gerente (2)
 *
 * Body esperado:
 * {
 *   "reserva_id":  "uuid-de-la-reserva",
 *   "titulo":      "Boda García-López",
 *   "descripcion": "Evento de 200 personas en salón principal"
 * }
 */
router.post('/', verifyToken, authorizeRoles([1, 2]), crearEvento);

/**
 * @route  GET /api/eventos
 * @desc   Retorna todos los eventos de la empresa con datos de la reserva
 * @access Private — cualquier usuario autenticado con JWT válido
 */
router.get('/', verifyToken, obtenerEventos);

/**
 * @route  PATCH /api/eventos/:id/estado
 * @desc   Actualiza el estado de progreso de un evento
 * @access Private + RBAC — Admin (1), Gerente (2) y Trabajador (3)
 *
 * Body esperado:
 * {
 *   "estado_progreso": "En Progreso" | "Finalizado" | "Cancelado" | "En Planificación"
 * }
 */
router.patch('/:id/estado', verifyToken, authorizeRoles([1, 2, 3]), actualizarEstadoEvento);

/**
 * @route  GET /api/eventos/:id
 * @desc   Obtiene el detalle de un evento por su ID
 * @access Private — cualquier usuario autenticado con JWT válido
 */
router.get('/:id', verifyToken, obtenerEventoPorId);

/**
 * @route  PUT /api/eventos/:id
 * @desc   Actualiza los datos de un evento
 * @access Private + RBAC — solo Administrador (1) y Gerente (2)
 */
router.put('/:id', verifyToken, authorizeRoles([1, 2]), actualizarEvento);

/**
 * @route  DELETE /api/eventos/:id
 * @desc   Elimina un evento
 * @access Private + RBAC — solo Administrador (1) y Gerente (2)
 */
router.delete('/:id', verifyToken, authorizeRoles([1, 2]), eliminarEvento);

export default router;
