import jwt from 'jsonwebtoken';

// Constantes de Roles estándar de EVENTRA
export const ROL_SUPER_ADMIN   = 5;
export const ROL_ADMINISTRADOR = 1;
export const ROL_GERENTE       = 2;
export const ROL_TRABAJADOR    = 3;
export const ROL_CLIENTE       = 4;

/**
 * Middleware: verifyToken
 * -----------------------------------------------------------------------
 * Protege rutas privadas verificando que la petición incluya un JWT válido.
 *
 * Espera el header:  Authorization: Bearer <token>
 *
 * Si el token es válido, inyecta el payload normalizado en `req.user`:
 *   - req.user.id         → UUID del usuario
 *   - req.user.rol_id     → ID numérico del rol asignado (1..5)
 *   - req.user.empresa_id → ID de la empresa (o null si es Super_Admin)
 *   - req.user.email      → Correo electrónico
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Verificar que el header existe y tiene el formato "Bearer <token>"
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Acceso denegado. No se proporcionó un token.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Inyecta el payload normalizado asegurando empresa_id y rol_id
    req.user = {
      ...decoded,
      id: decoded.id,
      rol_id: decoded.rol_id !== undefined ? Number(decoded.rol_id) : undefined,
      empresa_id: decoded.empresa_id !== undefined && decoded.empresa_id !== null ? Number(decoded.empresa_id) : null,
      email: decoded.email,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido o expirado.',
    });
  }
};

/**
 * Middleware: authorizeRoles
 * -----------------------------------------------------------------------
 * Control de Acceso Basado en Roles (RBAC).
 * Debe usarse DESPUÉS de `verifyToken`, ya que depende de `req.user`.
 *
 * @param {number[]} allowedRoles - Array de rol_id permitidos
 * @returns {import('express').RequestHandler}
 */
export const authorizeRoles = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(Number(req.user.rol_id))) {
      return res.status(403).json({
        success: false,
        message: 'Acceso prohibido. No tienes los permisos necesarios.',
      });
    }
    next();
  };
};

/**
 * Middleware: authorizeSuperAdmin
 * -----------------------------------------------------------------------
 * Control de acceso exclusivo para el Super Administrador global de EVENTRA.
 * Valida estrictamente que el usuario autenticado posea el rol de Super_Admin (rol_id 5 o 0).
 * Es el único rol autorizado para gestionar empresas / inquilinos globales sin empresa_id.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const authorizeSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Acceso denegado. Sesión no autenticada.',
    });
  }

  const isSuperAdmin =
    Number(req.user.rol_id) === ROL_SUPER_ADMIN ||
    Number(req.user.rol_id) === 0 ||
    req.user.rol === 'Super_Admin' ||
    req.user.rol_nombre === 'Super_Admin';

  if (!isSuperAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Acceso prohibido. Requiere privilegios de Super Admin global de EVENTRA.',
    });
  }

  next();
};

/**
 * Middleware: requireTenantScope
 * -----------------------------------------------------------------------
 * Garantiza que la petición esté asociada a una empresa válida (inquilino SaaS).
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const requireTenantScope = (req, res, next) => {
  if (!req.user || req.user.empresa_id === null || req.user.empresa_id === undefined) {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requiere un inquilino (empresa_id) válido asignado.',
    });
  }
  next();
};

