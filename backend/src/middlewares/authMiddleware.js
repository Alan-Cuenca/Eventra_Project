import jwt from 'jsonwebtoken';

/**
 * Middleware: verifyToken
 * -----------------------------------------------------------------------
 * Protege rutas privadas verificando que la petición incluya un JWT válido.
 *
 * Espera el header:  Authorization: Bearer <token>
 *
 * Si el token es válido, inyecta el payload decodificado en `req.user`
 * para que los siguientes middlewares o controladores puedan acceder a:
 *   - req.user.id         → UUID del usuario
 *   - req.user.rol_id     → ID del rol asignado
 *   - req.user.empresa_id → ID de la empresa a la que pertenece
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
    req.user = decoded; // Inyecta el payload en la request
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
 * Uso:
 *   router.get('/admin', verifyToken, authorizeRoles([1]), handler);
 *   router.get('/panel', verifyToken, authorizeRoles([1, 2]), handler);
 *
 * IDs de roles base del sistema EVENTRA:
 *   1 → Administrador
 *   2 → Gerente
 *   3 → Trabajador
 *   4 → Cliente
 *
 * @param {number[]} allowedRoles - Array de rol_id que tienen permiso de acceso
 * @returns {import('express').RequestHandler}
 */
export const authorizeRoles = (allowedRoles) => {
  return (req, res, next) => {
    // req.user es inyectado por verifyToken
    if (!req.user || !allowedRoles.includes(req.user.rol_id)) {
      return res.status(403).json({
        success: false,
        message: 'Acceso prohibido. No tienes los permisos necesarios.',
      });
    }
    next();
  };
};
