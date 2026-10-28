import express from 'express';
import { consultarEvara } from '../controllers/chatbotController.js';
import { optionalVerifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @route   POST /api/chatbot
 * @desc    Consulta conversacional al asistente EVARA AI.
 *          El aislamiento multi-tenant se garantiza mediante:
 *          - req.user.empresa_id si el usuario está autenticado con JWT (Anti-IDOR estricto).
 *          - slug o empresa_id de la empresa si es un cliente público en la landing del inquilino.
 * @access  Public / Authenticated (optionalVerifyToken)
 */
router.post('/', optionalVerifyToken, consultarEvara);

export default router;
