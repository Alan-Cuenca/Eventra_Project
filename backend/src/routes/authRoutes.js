import express from 'express';
import { registerUser, loginUser } from '../controllers/authController.js';

const router = express.Router();

/**
 * @route  POST /api/auth/register
 * @desc   Registra un nuevo usuario en el sistema EVENTRA
 * @access Public
 */
router.post('/register', registerUser);

/**
 * @route  POST /api/auth/login
 * @desc   Inicia sesión y retorna un JWT de acceso
 * @access Public
 */
router.post('/login', loginUser);

export default router;
