/**
 * configuracionPlataforma.js
 * Aplica en el backend los interruptores globales definidos por el Super Admin:
 *   - plataforma.modo_mantenimiento      → responde 503 a todo salvo Super Admin, auth, salud y configuración.
 *   - plataforma.registro_publico_activo → permite o bloquea los registros públicos (clientes y planes).
 *
 * Lee configuracion_saas con una caché corta para no consultar la BD en cada petición.
 * Si la BD falla, nunca bloquea la plataforma (falla abierta).
 */
import pool from '../config/db.js';
import jwt from 'jsonwebtoken';

let cache = { valor: null, expira: 0 };
const TTL_MS = 15_000;

export const leerPlataforma = async () => {
  const ahora = Date.now();
  if (cache.valor && cache.expira > ahora) return cache.valor;
  let plataforma = { modo_mantenimiento: false, registro_publico_activo: true };
  try {
    const r = await pool.query("SELECT valor FROM configuracion_saas WHERE clave = 'global'");
    const guardada = r?.rows?.[0]?.valor?.plataforma;
    if (guardada) plataforma = { ...plataforma, ...guardada };
  } catch (error) {
    console.warn('[configuracionPlataforma] No se pudo leer la configuración:', error.message);
  }
  cache = { valor: plataforma, expira: ahora + TTL_MS };
  return plataforma;
};

/** Invalida la caché (se llama al guardar la configuración). */
export const invalidarCachePlataforma = () => { cache = { valor: null, expira: 0 }; };

const RUTAS_EXENTAS = [/^\/api\/health/, /^\/api\/auth\//, /^\/api\/configuracion/, /^\/api-docs/];

const esSuperAdmin = (req) => {
  try {
    const token = String(req.headers.authorization || '').replace(/^Bearer /, '');
    if (!token) return false;
    const d = jwt.verify(token, process.env.JWT_SECRET);
    return Number(d.rol_id) === 5;
  } catch {
    return false;
  }
};

export const modoMantenimiento = async (req, res, next) => {
  if (process.env.NODE_ENV === 'test') return next();
  if (RUTAS_EXENTAS.some((re) => re.test(req.originalUrl))) return next();
  const plataforma = await leerPlataforma();
  if (plataforma.modo_mantenimiento && !esSuperAdmin(req)) {
    return res.status(503).json({
      success: false,
      message: 'La plataforma está en mantenimiento. Intenta nuevamente en unos minutos.',
    });
  }
  return next();
};

export const requerirRegistroPublico = async (req, res, next) => {
  if (process.env.NODE_ENV === 'test') return next();
  const plataforma = await leerPlataforma();
  if (plataforma.registro_publico_activo === false) {
    return res.status(403).json({
      success: false,
      message: 'Los registros públicos están deshabilitados temporalmente.',
    });
  }
  return next();
};
