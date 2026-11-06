import express from 'express';
import {
  obtenerConfiguracionGlobal,
  guardarConfiguracionGlobal,
} from '../controllers/configuracionController.js';
import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @route   GET /api/configuracion
 * @desc    Obtiene la configuración global SaaS (Planes, Límites, Datos Bancarios).
 * @access  Public / Authenticated
 */
router.get('/', obtenerConfiguracionGlobal);

/**
 * @route   PUT /api/configuracion
 * @desc    Actualiza y sincroniza los parámetros globales SaaS en PostgreSQL.
 * @access  Private — Exclusivo Super_Admin (rol_id = 5)
 */
router.put('/', verifyToken, authorizeRoles([5]), guardarConfiguracionGlobal);

export default router;
