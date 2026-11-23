import express from 'express';
import { registrarValidacionIds } from '../middlewares/validarParams.js';
import { crearCliente, obtenerClientes, obtenerClientePorId, actualizarCliente, eliminarCliente } from '../controllers/clienteController.js';
import { registrarClientePortal } from '../controllers/authController.js';
import { requerirRegistroPublico } from '../middlewares/configuracionPlataforma.js';
import { crearRateLimit } from '../middlewares/rateLimit.js';

const limitarRegistro = crearRateLimit({ ventanaMs: 60 * 60_000, max: 20, mensaje: 'Demasiados registros desde esta red. Intenta más tarde.' });
import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware.js';
import { verificarLimitePlan } from '../middlewares/planLimitsMiddleware.js';
import { validarCuerpo } from '../middlewares/validarCuerpo.js';
import { esquemas } from '../middlewares/esquemas.js';

const router = express.Router();
registrarValidacionIds(router);

/**
 * @route  POST /api/clientes/registro-publico
 * @desc   Autoregistro seguro de clientes finales desde el portal de una empresa (marca blanca)
 * @access Public — validación de cuota de plan SaaS
 */
router.post('/registro-publico', requerirRegistroPublico, limitarRegistro, verificarLimitePlan('clientes'), validarCuerpo(esquemas.registroCliente), registrarClientePortal);

/**
 * @route  POST /api/clientes
 * @desc   Crea un nuevo cliente para la empresa del usuario autenticado
 * @access Private — requiere JWT válido + Límites de Plan SaaS (50 Básico, 200 Premium)
 */
router.post('/', verifyToken, authorizeRoles([1, 2, 3]), verificarLimitePlan('clientes'), validarCuerpo(esquemas.cliente), crearCliente);

/**
 * @route  GET /api/clientes
 * @desc   Retorna todos los clientes de la empresa del usuario autenticado
 * @access Private — requiere JWT válido
 */
router.get('/', verifyToken, authorizeRoles([1, 2, 3]), obtenerClientes);

/**
 * @route  GET /api/clientes/:id
 * @desc   Retorna un cliente por ID perteneciente a la empresa
 * @access Private — requiere JWT válido
 */
router.get('/:id', verifyToken, authorizeRoles([1, 2, 3]), obtenerClientePorId);

/**
 * @route  PUT /api/clientes/:id
 * @desc   Actualiza un cliente existente
 * @access Private — Admin y Gerente
 */
router.put('/:id', verifyToken, authorizeRoles([1, 2]), validarCuerpo(esquemas.cliente, { parcial: true }), actualizarCliente);

/**
 * @route  DELETE /api/clientes/:id
 * @desc   Elimina un cliente existente
 * @access Private — Admin y Gerente
 */
router.delete('/:id', verifyToken, authorizeRoles([1, 2]), eliminarCliente);

export default router;
