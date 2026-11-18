/**
 * sesionService.js — Revalidación de sesiones JWT contra la base de datos.
 *
 * El JWT dura 24 h y es "sin estado": por sí solo no se entera de que el usuario fue desactivado,
 * cambió de rol o su empresa fue suspendida. Este servicio consulta el estado actual del usuario
 * (con una caché corta por instancia para no golpear la BD en cada petición) y permite invalidar
 * la caché de inmediato cuando se desactiva un usuario, se cambia su rol o se suspende una empresa.
 *
 * En tests unitarios (NODE_ENV=test) está desactivado salvo que se defina REVALIDAR_SESIONES=true,
 * porque esos tests simulan pool.query por orden de llamada.
 */
import pool from '../config/db.js';

const TTL_MS = 15_000;
const cache = new Map(); // userId -> { sesion, expira }

export const revalidarSesionesActivo = () =>
  process.env.NODE_ENV !== 'test' || process.env.REVALIDAR_SESIONES === 'true';

/**
 * @returns {Promise<null | { id, rol_id, empresa_id, estado_activo, empresa_activa }>}
 *          null si el usuario ya no existe.
 */
export const cargarSesion = async (userId) => {
  const ahora = Date.now();
  const enCache = cache.get(userId);
  if (enCache && enCache.expira > ahora) return enCache.sesion;

  const r = await pool.query(
    `SELECT u.id, u.rol_id, u.empresa_id, u.estado_activo, e.estado_activo AS empresa_activa
     FROM usuarios u
     LEFT JOIN empresas e ON e.id = u.empresa_id
     WHERE u.id = $1`,
    [userId]
  );
  const sesion = r.rows?.[0] || null;
  cache.set(userId, { sesion, expira: ahora + TTL_MS });
  return sesion;
};

/** Olvida la sesión de un usuario (al desactivarlo, eliminarlo o cambiarle el rol). */
export const invalidarSesionUsuario = (userId) => { cache.delete(String(userId)); };

/** Olvida todas las sesiones de una empresa (al suspenderla o reactivarla). */
export const invalidarSesionesEmpresa = (empresaId) => {
  for (const [id, { sesion }] of cache) {
    if (sesion && Number(sesion.empresa_id) === Number(empresaId)) cache.delete(id);
  }
};

export const limpiarCacheSesiones = () => cache.clear();

/**
 * Evalúa si una sesión sigue siendo válida.
 * @returns {{ ok: true, sesion } | { ok: false, status: number, message: string }}
 */
export const evaluarSesion = (sesion) => {
  if (!sesion || sesion.estado_activo === false) {
    return { ok: false, status: 401, message: 'Tu sesión ya no es válida. Inicia sesión nuevamente.' };
  }
  if (Number(sesion.rol_id) !== 5 && sesion.empresa_activa === false) {
    return { ok: false, status: 403, message: 'La empresa asociada a tu cuenta está suspendida. Contacta a soporte de EVENTRA.' };
  }
  return { ok: true, sesion };
};
