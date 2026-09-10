import express from 'express';
import { registerUser } from '../controllers/authController.js';

const router = express.Router();

/**
 * @route  POST /api/auth/register
 * @desc   Registra un nuevo usuario en el sistema EVENTRA
 * @access Public
 */
router.post('/register', registerUser);

export default router;
