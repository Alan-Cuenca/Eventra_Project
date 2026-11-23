import express from 'express';
import { registrarValidacionIds } from '../middlewares/validarParams.js';
import {
  crearProveedor,
  obtenerProveedores,
  actualizarProveedor,
  obtenerProveedorPorId,
  eliminarProveedor,
} from '../controllers/proveedorController.js';
import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware.js';
import { validarCuerpo } from '../middlewares/validarCuerpo.js';
import { esquemas } from '../middlewares/esquemas.js';

const router = express.Router();
registrarValidacionIds(router);

/**
 * @route  POST /api/proveedores
 * @desc   Registra un nuevo proveedor para la empresa del usuario autenticado
 * @access Private + RBAC — solo Administrador (1) y Gerente (2)
 *
 * Body esperado:
 * {
 *   "nombre_empresa_o_contacto": "Sonido Pro S.A.",
 *   "especialidad":              "Música",
 *   "telefono":                  "+593999000111",
 *   "email":                     "contacto@sonidopro.com"
 * }
 */
router.post('/', verifyToken, authorizeRoles([1, 2]), validarCuerpo(esquemas.proveedor), crearProveedor);

/**
 * @route  GET /api/proveedores
 * @desc   Lista todos los proveedores de la empresa del usuario autenticado
 * @access Private + RBAC — Administrador (1), Gerente (2) y Trabajador (3)
 */
router.get('/', verifyToken, authorizeRoles([1, 2, 3]), obtenerProveedores);

/**
 * @route  PUT /api/proveedores/:id
 * @desc   Actualiza datos de contacto o estado_activo de un proveedor
 * @access Private + RBAC — solo Administrador (1) y Gerente (2)
 *
 * Body esperado (todos los campos son opcionales, mínimo uno):
 * {
 *   "nombre_empresa_o_contacto": "Nuevo nombre",
 *   "especialidad":              "Catering",
 *   "telefono":                  "+593999000222",
 *   "email":                     "nuevo@email.com",
 *   "estado_activo":             false
 * }
 */
router.put('/:id', verifyToken, authorizeRoles([1, 2]), validarCuerpo(esquemas.proveedor, { parcial: true }), actualizarProveedor);

/**
 * @route  GET /api/proveedores/:id
 * @desc   Obtiene un proveedor por su ID
 * @access Private + RBAC — Administrador (1), Gerente (2) y Trabajador (3)
 */
router.get('/:id', verifyToken, authorizeRoles([1, 2, 3]), obtenerProveedorPorId);

/**
 * @route  DELETE /api/proveedores/:id
 * @desc   Elimina (borrado lógico) un proveedor
 * @access Private + RBAC — solo Administrador (1) y Gerente (2)
 */
router.delete('/:id', verifyToken, authorizeRoles([1, 2]), eliminarProveedor);

export default router;
