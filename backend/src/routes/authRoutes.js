import express from 'express';
import { registerUser, loginUser } from '../controllers/authController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

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

/**
 * @route  GET /api/auth/me
 * @desc   Ruta protegida de prueba — valida el token y devuelve el payload del usuario
 * @access Private (requiere JWT válido en Authorization: Bearer <token>)
 */
router.get('/me', verifyToken, (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Acceso autorizado.',
    data: req.user,
  });
});

export default router;
