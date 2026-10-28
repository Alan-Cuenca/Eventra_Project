import express from 'express';
import { crearCliente, obtenerClientes, obtenerClientePorId, actualizarCliente, eliminarCliente } from '../controllers/clienteController.js';
import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware.js';
import { verificarLimitePlan } from '../middlewares/planLimitsMiddleware.js';

const router = express.Router();

/**
 * @route  POST /api/clientes
 * @desc   Crea un nuevo cliente para la empresa del usuario autenticado
 * @access Private — requiere JWT válido + Límites de Plan SaaS (50 Básico, 200 Premium)
 */
router.post('/', verifyToken, verificarLimitePlan('clientes'), crearCliente);

/**
 * @route  GET /api/clientes
 * @desc   Retorna todos los clientes de la empresa del usuario autenticado
 * @access Private — requiere JWT válido
 */
router.get('/', verifyToken, obtenerClientes);

/**
 * @route  GET /api/clientes/:id
 * @desc   Retorna un cliente por ID perteneciente a la empresa
 * @access Private — requiere JWT válido
 */
router.get('/:id', verifyToken, obtenerClientePorId);

/**
 * @route  PUT /api/clientes/:id
 * @desc   Actualiza un cliente existente
 * @access Private — Admin y Gerente
 */
router.put('/:id', verifyToken, authorizeRoles([1, 2]), actualizarCliente);

/**
 * @route  DELETE /api/clientes/:id
 * @desc   Elimina un cliente existente
 * @access Private — Admin y Gerente
 */
router.delete('/:id', verifyToken, authorizeRoles([1, 2]), eliminarCliente);

export default router;
