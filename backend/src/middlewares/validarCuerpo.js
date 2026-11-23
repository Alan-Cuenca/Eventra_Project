/**
 * validarCuerpo.js — Validación declarativa del cuerpo de las peticiones.
 *
 * Cada ruta de creación/edición declara un esquema { campo: regla }. Antes de llegar al
 * controlador se valida TODO el cuerpo y, si algo falla, se responde 400 con el primer
 * mensaje legible y la lista completa de errores por campo:
 *   { success: false, message, errores: { campo: 'mensaje' } }
 * Los textos se recortan (trim) y se guardan normalizados en req.body.
 *
 * Reglas disponibles (todas aceptan `requerido` y `etiqueta`):
 *   texto      { min, max, patron: 'nombre' }
 *   email      {}
 *   telefono   {}
 *   cedula     {}             cédula ecuatoriana (10 dígitos, dígito verificador)
 *   ruc        {}             13 dígitos
 *   monto      { permitirCero }
 *   entero     { min, max }
 *   fecha      { noPasada, noFutura, maxAnios, edadMinima }
 *   hora       {}
 *   id         {}             identificador (UUID o numérico)
 *   enum       { valores: [] }
 *   booleano   {}
 *   ids        { min, max }   arreglo de identificadores
 */
import { esEmailValido, validarMonto, validarFecha, validarHora } from '../utils/validaciones.js';

const PATRON_NOMBRE = /^[\p{L}][\p{L}\s'.-]*$/u;
const ZONA = 'America/Guayaquil';

/** Fecha de hoy (AAAA-MM-DD) en Ecuador, para comparar fechas de calendario. */
export const hoyEcuador = () => new Intl.DateTimeFormat('en-CA', { timeZone: ZONA }).format(new Date());

const sumarAnios = (fechaIso, anios) => {
  const [y, m, d] = fechaIso.split('-').map(Number);
  return `${String(y + anios).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
};

/** Cédula ecuatoriana: 10 dígitos, provincia 01-24 (o 30), tercer dígito < 6 y verificador módulo 10. */
export const esCedulaValida = (valor) => {
  const c = String(valor ?? '').trim();
  if (!/^\d{10}$/.test(c)) return false;
  const provincia = Number(c.slice(0, 2));
  if (!((provincia >= 1 && provincia <= 24) || provincia === 30)) return false;
  if (Number(c[2]) >= 6) return false;
  const suma = c.slice(0, 9).split('').reduce((acc, dig, i) => {
    let v = Number(dig) * (i % 2 === 0 ? 2 : 1);
    if (v > 9) v -= 9;
    return acc + v;
  }, 0);
  return (10 - (suma % 10)) % 10 === Number(c[9]);
};

const vacio = (v) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

/** Valida un valor con su regla. Devuelve { error } o { valor } (valor normalizado). */
export const validarValor = (valor, regla) => {
  const etq = regla.etiqueta || 'campo';
  if (vacio(valor)) {
    if (!regla.requerido) return { valor: undefined, omitido: true };
    return { error: regla.vacioEnEdicion ? `El campo ${etq} no puede quedar vacío.` : `El campo ${etq} es obligatorio.` };
  }

  switch (regla.tipo) {
    case 'texto': {
      if (typeof valor !== 'string' && typeof valor !== 'number') return { error: `El campo ${etq} debe ser texto.` };
      const t = String(valor).trim().replace(/\s+/g, ' ');
      const min = regla.min ?? 1;
      if (t.length < min) return { error: `El campo ${etq} debe tener al menos ${min} caracteres.` };
      if (regla.max && t.length > regla.max) return { error: `El campo ${etq} no puede superar los ${regla.max} caracteres.` };
      if (regla.patron === 'nombre' && !PATRON_NOMBRE.test(t)) return { error: `El campo ${etq} solo puede contener letras y espacios.` };
      return { valor: t };
    }
    case 'email': {
      const e = String(valor).trim().toLowerCase();
      return esEmailValido(e) ? { valor: e } : { error: `El ${etq} no tiene un formato válido (ej. nombre@dominio.com).` };
    }
    case 'telefono': {
      const t = String(valor).trim();
      const digitos = t.replace(/\D/g, '');
      if (!/^\+?[\d\s()-]+$/.test(t) || digitos.length < 7 || digitos.length > 15) {
        return { error: `El ${etq} debe tener entre 7 y 15 dígitos (ej. 0991234567).` };
      }
      return { valor: t };
    }
    case 'cedula':
      return esCedulaValida(valor) ? { valor: String(valor).trim() } : { error: `La ${etq} no es una cédula ecuatoriana válida.` };
    case 'ruc':
      return /^\d{13}$/.test(String(valor).trim()) ? { valor: String(valor).trim() } : { error: `El ${etq} debe tener 13 dígitos.` };
    case 'monto': {
      const err = validarMonto(valor, { permitirCero: regla.permitirCero, etiqueta: etq });
      return err ? { error: err } : { valor: Number(valor) };
    }
    case 'entero': {
      const n = Number(valor);
      if (!Number.isInteger(n)) return { error: `El campo ${etq} debe ser un número entero.` };
      if (regla.min !== undefined && n < regla.min) return { error: `El campo ${etq} debe ser al menos ${regla.min}.` };
      if (regla.max !== undefined && n > regla.max) return { error: `El campo ${etq} no puede ser mayor a ${regla.max}.` };
      return { valor: n };
    }
    case 'fecha': {
      const err = validarFecha(String(valor), etq);
      if (err) return { error: err };
      const f = String(valor).slice(0, 10);
      const hoy = hoyEcuador();
      if (regla.noPasada && f < hoy) return { error: `La ${etq} no puede estar en el pasado.` };
      if (regla.noFutura && f > hoy) return { error: `La ${etq} no puede estar en el futuro.` };
      if (regla.maxAnios && f > sumarAnios(hoy, regla.maxAnios)) return { error: `La ${etq} no puede ser posterior a ${regla.maxAnios} años desde hoy.` };
      if (regla.edadMinima && f > sumarAnios(hoy, -regla.edadMinima)) return { error: `Debes ser mayor de ${regla.edadMinima} años (revisa la ${etq}).` };
      if (f < '1900-01-01') return { error: `La ${etq} no es una fecha válida.` };
      return { valor: f };
    }
    case 'hora': {
      const err = validarHora(String(valor), etq);
      return err ? { error: err } : { valor: String(valor) };
    }
    case 'id': {
      const s = String(valor).trim();
      return /^[\w-]{1,64}$/.test(s) ? { valor: s } : { error: `El campo ${etq} no es un identificador válido.` };
    }
    case 'enum':
      return regla.valores.includes(valor) ? { valor } : { error: `El campo ${etq} debe ser uno de: ${regla.valores.join(', ')}.` };
    case 'booleano':
      if (valor === true || valor === 'true') return { valor: true };
      if (valor === false || valor === 'false') return { valor: false };
      return { error: `El campo ${etq} debe ser verdadero o falso.` };
    case 'ids': {
      if (!Array.isArray(valor)) return { error: `El campo ${etq} debe ser una lista.` };
      const unicos = [...new Set(valor.map((v) => String(v).trim()))];
      if (unicos.some((v) => !/^[\w-]{1,64}$/.test(v))) return { error: `El campo ${etq} contiene identificadores inválidos.` };
      if (regla.min !== undefined && unicos.length < regla.min) return { error: `Selecciona al menos ${regla.min} elemento(s) en ${etq}.` };
      if (regla.max !== undefined && unicos.length > regla.max) return { error: `El campo ${etq} admite como máximo ${regla.max} elementos.` };
      return { valor: unicos };
    }
    default:
      return { valor };
  }
};

/**
 * Valida un objeto completo. Con `parcial` (ediciones) los campos requeridos solo se
 * exigen si vienen en el cuerpo, pero lo que venga debe ser válido y no puede vaciarse.
 */
export const validarObjeto = (cuerpo = {}, esquema = {}, { parcial = false } = {}) => {
  const errores = {};
  const normalizado = {};
  for (const [campo, regla] of Object.entries(esquema)) {
    const presente = Object.prototype.hasOwnProperty.call(cuerpo, campo);
    if (parcial && !presente) continue;
    const r = validarValor(cuerpo[campo], { ...regla, requerido: regla.requerido && (!parcial || presente), vacioEnEdicion: parcial });
    if (r.error) errores[campo] = r.error;
    // Un opcional vacío se deja tal cual llegó: cada controlador ya interpreta '' o null.
    else if (!r.omitido) normalizado[campo] = r.valor;
  }
  return { errores, normalizado };
};

/** Middleware Express. */
export const validarCuerpo = (esquema, opciones = {}) => (req, res, next) => {
  const cuerpo = req.body && typeof req.body === 'object' ? req.body : {};
  const { errores, normalizado } = validarObjeto(cuerpo, esquema, opciones);
  const campos = Object.keys(errores);
  if (campos.length > 0) {
    return res.status(400).json({ success: false, message: errores[campos[0]], errores });
  }
  req.body = { ...cuerpo, ...normalizado };
  return next();
};
