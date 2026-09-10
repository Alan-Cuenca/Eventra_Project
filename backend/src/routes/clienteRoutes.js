import express from 'express';
import { crearCliente, obtenerClientes } from '../controllers/clienteController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @route  POST /api/clientes
 * @desc   Crea un nuevo cliente para la empresa del usuario autenticado
 * @access Private — requiere JWT válido
 */
router.post('/', verifyToken, crearCliente);

/**
 * @route  GET /api/clientes
 * @desc   Retorna todos los clientes de la empresa del usuario autenticado
 * @access Private — requiere JWT válido
 */
router.get('/', verifyToken, obtenerClientes);

export default router;
