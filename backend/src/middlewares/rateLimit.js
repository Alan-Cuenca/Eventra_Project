/**
 * rateLimit.js — Limitador de ritmo en memoria por IP (sin dependencias).
 *
 * Suficiente para una sola instancia (Render). Si se escala a varias instancias,
 * sustituir por un almacén compartido (Redis) con la misma interfaz.
 */
export const crearRateLimit = ({ ventanaMs = 60_000, max = 30, mensaje = 'Demasiadas solicitudes. Espera un momento e intenta de nuevo.' } = {}) => {
  const golpes = new Map();

  // Limpieza periódica para que el mapa no crezca indefinidamente
  const limpieza = setInterval(() => {
    const ahora = Date.now();
    for (const [clave, registro] of golpes) {
      if (registro.expira <= ahora) golpes.delete(clave);
    }
  }, ventanaMs);
  if (typeof limpieza.unref === 'function') limpieza.unref();

  return (req, res, next) => {
    if (process.env.NODE_ENV === 'test') return next();

    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.socket?.remoteAddress || 'desconocida';
    const ahora = Date.now();
    let registro = golpes.get(ip);

    if (!registro || registro.expira <= ahora) {
      registro = { cuenta: 0, expira: ahora + ventanaMs };
      golpes.set(ip, registro);
    }

    registro.cuenta += 1;
    if (registro.cuenta > max) {
      res.setHeader('Retry-After', Math.ceil((registro.expira - ahora) / 1000));
      return res.status(429).json({ success: false, message: mensaje });
    }
    return next();
  };
};
