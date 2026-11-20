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

const PLATAFORMA_DEFECTO = { modo_mantenimiento: false, registro_publico_activo: true };
export const JWT_HORAS_DEFECTO = 8;
export const JWT_HORAS_MIN = 1;
export const JWT_HORAS_MAX = 72;

const construirValor = (guardada = {}) => ({
  plataforma: { ...PLATAFORMA_DEFECTO, ...(guardada.plataforma || {}) },
  seguridad: { expiracion_jwt_horas: JWT_HORAS_DEFECTO, ...(guardada.seguridad || {}) },
});

/** Lee plataforma y seguridad de configuracion_saas (con caché corta). */
const leerConfigGlobal = async () => {
  const ahora = Date.now();
  if (cache.valor && cache.expira > ahora) return cache.valor;
  let guardada = {};
  try {
    const r = await pool.query("SELECT valor FROM configuracion_saas WHERE clave = 'global'");
    guardada = r?.rows?.[0]?.valor || {};
  } catch (error) {
    console.warn('[configuracionPlataforma] No se pudo leer la configuración:', error.message);
  }
  cache = { valor: construirValor(guardada), expira: ahora + TTL_MS };
  return cache.valor;
};

export const leerPlataforma = async () => (await leerConfigGlobal()).plataforma;

/** Invalida la caché (se llama al guardar la configuración). */
export const invalidarCachePlataforma = () => { cache = { valor: null, expira: 0 }; };

/** Fija la caché con una configuración dada (tras guardar, o en pruebas). */
export const establecerCachePlataforma = (guardada) => {
  cache = { valor: construirValor(guardada), expira: Date.now() + TTL_MS };
};

/** Normaliza las horas de vigencia del JWT al rango permitido (1–72). */
export const normalizarHorasJwt = (valor) => {
  const n = Math.round(Number(valor));
  if (!Number.isFinite(n) || n <= 0) return JWT_HORAS_DEFECTO;
  return Math.min(JWT_HORAS_MAX, Math.max(JWT_HORAS_MIN, n));
};

/**
 * Duración del JWT de sesión según seguridad.expiracion_jwt_horas (ej. "8h").
 * En Jest no consulta la BD (no consume los mocks de pool.query): usa la caché o el valor por defecto.
 */
export const obtenerExpiracionJwt = async () => {
  const config = process.env.NODE_ENV === 'test' ? (cache.valor || construirValor()) : await leerConfigGlobal();
  return `${normalizarHorasJwt(config.seguridad.expiracion_jwt_horas)}h`;
};

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
