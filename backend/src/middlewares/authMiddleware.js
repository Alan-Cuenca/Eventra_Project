import jwt from 'jsonwebtoken';
import { revalidarSesionesActivo, cargarSesion, evaluarSesion } from '../services/sesionService.js';

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
export const CODIGO_CAMBIO_PASSWORD = 'PASSWORD_CHANGE_REQUIRED';

const autenticar = async (req, res, next, { permitirCambioPendiente = false } = {}) => {
  const authHeader = req.headers.authorization;

  // Verificar que el header existe y tiene el formato "Bearer <token>"
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Acceso denegado. No se proporcionó un token.',
    });
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido o expirado.',
    });
  }

  // Inyecta el payload normalizado asegurando empresa_id y rol_id
  req.user = {
    ...decoded,
    id: decoded.id,
    rol_id: decoded.rol_id !== undefined ? Number(decoded.rol_id) : undefined,
    empresa_id: decoded.empresa_id !== undefined && decoded.empresa_id !== null ? Number(decoded.empresa_id) : null,
    email: decoded.email,
  };

  // Revalidación contra la BD: usuario desactivado/eliminado, empresa suspendida o rol cambiado
  if (revalidarSesionesActivo()) {
    try {
      const evaluacion = evaluarSesion(await cargarSesion(String(decoded.id)));
      if (!evaluacion.ok) {
        return res.status(evaluacion.status).json({ success: false, error: evaluacion.error, message: evaluacion.message });
      }
      // El rol y la empresa vigentes en la BD mandan sobre los del token
      req.user.rol_id = Number(evaluacion.sesion.rol_id);
      req.user.empresa_id = evaluacion.sesion.empresa_id !== null && evaluacion.sesion.empresa_id !== undefined
        ? Number(evaluacion.sesion.empresa_id)
        : null;
    } catch (error) {
      console.error('[authMiddleware] No se pudo revalidar la sesión:', error.message);
      return res.status(503).json({ success: false, message: 'No se pudo validar tu sesión. Intenta nuevamente en unos segundos.' });
    }
  }

  // Cuentas con contraseña temporal: solo pueden acceder al flujo de cambio de contraseña
  if (decoded.debe_cambiar_password === true && !permitirCambioPendiente) {
    return res.status(403).json({
      success: false,
      error: CODIGO_CAMBIO_PASSWORD,
      message: 'Debes actualizar tu contraseña temporal antes de continuar.',
    });
  }

  next();
};

export const verifyToken = (req, res, next) => autenticar(req, res, next);

/**
 * Middleware: verifyTokenPermitirCambioPendiente
 * -----------------------------------------------------------------------
 * Igual que verifyToken, pero permite el paso a usuarios que aún deben
 * cambiar su contraseña temporal. Usar EXCLUSIVAMENTE en las rutas del
 * flujo de cambio obligatorio de contraseña y en /auth/me.
 */
export const verifyTokenPermitirCambioPendiente = (req, res, next) =>
  autenticar(req, res, next, { permitirCambioPendiente: true });

/**
 * Middleware: optionalVerifyToken
 * -----------------------------------------------------------------------
 * Intenta autenticar el token JWT si está presente en la cabecera.
 * Si no está presente, permite que la petición continúe (ej. para consultas
 * públicas de clientes en la landing page del inquilino).
 */
export const optionalVerifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Sesiones con contraseña temporal pendiente se tratan como visitante público
    if (decoded.debe_cambiar_password === true) return next();
    req.user = {
      ...decoded,
      id: decoded.id,
      rol_id: decoded.rol_id !== undefined ? Number(decoded.rol_id) : undefined,
      empresa_id: decoded.empresa_id !== undefined && decoded.empresa_id !== null ? Number(decoded.empresa_id) : null,
      email: decoded.email,
    };

    // Si la sesión ya no es válida en la BD, se trata como visitante público
    if (revalidarSesionesActivo()) {
      const evaluacion = evaluarSesion(await cargarSesion(String(decoded.id)));
      if (!evaluacion.ok) {
        req.user = undefined;
      } else {
        req.user.rol_id = Number(evaluacion.sesion.rol_id);
        req.user.empresa_id = evaluacion.sesion.empresa_id !== null && evaluacion.sesion.empresa_id !== undefined
          ? Number(evaluacion.sesion.empresa_id)
          : null;
      }
    }
  } catch (error) {
    // Si el token es inválido o expiró (o la BD no responde), se ignora y continúa como visitante público
    req.user = undefined;
  }

  next();
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
 * Valida estrictamente que el usuario autenticado posea el rol de Super_Admin (rol_id 5).
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

