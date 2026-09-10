import express from 'express';
import { crearEvento, obtenerEventos, actualizarEstadoEvento } from '../controllers/eventoController.js';
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

export default router;
