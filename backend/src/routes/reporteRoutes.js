import express from 'express';
import { obtenerResumenReportes } from '../controllers/reporteController.js';
import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @route   GET /api/reportes/resumen
 * @desc    Obtiene datos consolidados de reportes corporativos (Ingresos, Eventos y Cuentas por Cobrar con Membrete)
 * @access  Private — Exclusivo Administrador (1) y Gerente (2). Super_Admin (5) excluido por multi-tenant privacy.
 */
router.get('/resumen', verifyToken, authorizeRoles([1, 2]), obtenerResumenReportes);

export default router;

