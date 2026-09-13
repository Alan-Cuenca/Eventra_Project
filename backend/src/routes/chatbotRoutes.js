import express from 'express';
import { consultarAsistente } from '../controllers/chatbotController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @route  POST /api/chatbot
 * @desc   Consulta al asistente conversacional EVARA con contexto del catálogo
 *         real de la empresa autenticada. La respuesta es generada por gpt-4o-mini.
 * @access Private — cualquier usuario autenticado con JWT válido
 *
 * Body esperado:
 * {
 *   "mensaje": "¿Qué paquetes tienen disponibles para una boda de 100 personas?"
 * }
 *
 * Respuesta exitosa (200):
 * {
 *   "success": true,
 *   "data": {
 *     "respuesta":     "¡Hola! Con mucho gusto te ayudo...",
 *     "modelo_usado":  "gpt-4o-mini",
 *     "tokens_usados": 312
 *   }
 * }
 */
router.post('/', verifyToken, consultarAsistente);

export default router;
