import express from 'express';
import { obtenerUsuarios, actualizarUsuario, eliminarUsuario } from '../controllers/usuarioController.js';
import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @route  GET /api/usuarios
 * @desc   Retorna todos los usuarios de la empresa del admin
 * @access Private — Solo Administrador (1)
 */
router.get('/', verifyToken, authorizeRoles([1]), obtenerUsuarios);

/**
 * @route  PUT /api/usuarios/:id
 * @desc   Actualiza un usuario existente (roles, datos, estado)
 * @access Private — Solo Administrador (1)
 */
router.put('/:id', verifyToken, authorizeRoles([1]), actualizarUsuario);

/**
 * @route  DELETE /api/usuarios/:id
 * @desc   Elimina (desactiva) un usuario
 * @access Private — Solo Administrador (1)
 */
router.delete('/:id', verifyToken, authorizeRoles([1]), eliminarUsuario);

export default router;
