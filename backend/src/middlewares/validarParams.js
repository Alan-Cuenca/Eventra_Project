/**
 * validarParams.js — Validación de parámetros de ruta (evita 500 por ids malformados).
 *
 * Uso en un router:  registrarValidacionIds(router);
 *   - :id y :evento_id deben ser UUID.
 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const esUuid = (valor) => UUID_RE.test(String(valor || ''));

const validarUuid = (req, res, next, valor, nombre) => {
  if (!esUuid(valor)) {
    return res.status(400).json({
      success: false,
      message: `El identificador "${nombre}" no es válido.`,
    });
  }
  return next();
};

/** Registra la validación UUID para :id y :evento_id en el router indicado. */
export const registrarValidacionIds = (router) => {
  router.param('id', validarUuid);
  router.param('evento_id', validarUuid);
};

/** Para rutas con id entero (empresas, SERIAL). */
export const validarIdEntero = (req, res, next, valor) => {
  if (!/^\d{1,9}$/.test(String(valor)) || Number(valor) < 1) {
    return res.status(400).json({ success: false, message: 'El identificador de empresa no es válido.' });
  }
  return next();
};
