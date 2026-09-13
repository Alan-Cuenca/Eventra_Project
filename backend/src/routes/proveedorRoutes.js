import express from 'express';
import {
  crearProveedor,
  obtenerProveedores,
  actualizarProveedor,
} from '../controllers/proveedorController.js';
import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

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
router.post('/', verifyToken, authorizeRoles([1, 2]), crearProveedor);

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
router.put('/:id', verifyToken, authorizeRoles([1, 2]), actualizarProveedor);

export default router;
