import express from 'express';
import { obtenerResumenAdmin } from '../controllers/dashboardController.js';
import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @route  GET /api/dashboard/admin
 * @desc   Retorna los 4 KPIs del panel de control ejecutivo:
 *           - total_eventos_activos  (En Planificación + En Progreso)
 *           - total_clientes         (clientes activos de la empresa)
 *           - ingresos_totales       (suma de pagos Completados)
 *           - tareas_pendientes      (actividades en estado Pendiente)
 * @access Private + RBAC — solo Administrador (1) y Gerente (2)
 *
 * Los KPIs se calculan en paralelo (Promise.all) y siempre filtran
 * por el empresa_id del JWT para garantizar aislamiento SaaS.
 */
router.get('/admin', verifyToken, authorizeRoles([1, 2]), obtenerResumenAdmin);

export default router;
