/**
 * validaciones.js — Validaciones de entrada compartidas por los controladores.
 * Cada función devuelve null si el valor es válido o un mensaje de error en español.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const MONTO_MAXIMO = 99_999_999.99; // DECIMAL(10,2)

export const esEmailValido = (valor) => typeof valor === 'string' && valor.length <= 150 && EMAIL_RE.test(valor.trim());

/** Email opcional: vacío es válido; si viene, debe tener formato correcto. */
export const validarEmailOpcional = (valor, etiqueta = 'correo electrónico') => {
  if (valor === undefined || valor === null || valor === '') return null;
  return esEmailValido(valor) ? null : `El ${etiqueta} no tiene un formato válido.`;
};

/** Política única de contraseñas: 8-72 caracteres, una mayúscula y un número. */
export const validarPassword = (password) => {
  if (!password || typeof password !== 'string') return 'La contraseña es obligatoria.';
  if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
  if (password.length > 72) return 'La contraseña no puede superar los 72 caracteres.';
  if (!/[A-Z]/.test(password)) return 'La contraseña debe incluir al menos una letra mayúscula.';
  if (!/[0-9]/.test(password)) return 'La contraseña debe incluir al menos un número.';
  return null;
};

/** Monto positivo y dentro del rango de DECIMAL(10,2). */
export const validarMonto = (valor, { permitirCero = false, etiqueta = 'monto' } = {}) => {
  const n = Number(valor);
  if (valor === '' || valor === null || valor === undefined || Number.isNaN(n)) return `El ${etiqueta} debe ser un número.`;
  if (permitirCero ? n < 0 : n <= 0) return `El ${etiqueta} debe ser un número ${permitirCero ? 'no negativo' : 'mayor a cero'}.`;
  if (n > MONTO_MAXIMO) return `El ${etiqueta} supera el máximo permitido.`;
  return null;
};

/** Fecha YYYY-MM-DD real (rechaza 2027-02-31). */
export const validarFecha = (valor, etiqueta = 'fecha') => {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(valor)) return `La ${etiqueta} debe tener el formato AAAA-MM-DD.`;
  const [y, m, d] = valor.slice(0, 10).split('-').map(Number);
  const f = new Date(Date.UTC(y, m - 1, d));
  if (f.getUTCFullYear() !== y || f.getUTCMonth() !== m - 1 || f.getUTCDate() !== d) return `La ${etiqueta} no es una fecha válida.`;
  return null;
};

/** Hora HH:MM o HH:MM:SS. */
export const validarHora = (valor, etiqueta = 'hora') => {
  if (typeof valor !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(valor)) return `La ${etiqueta} debe tener el formato HH:MM.`;
  return null;
};
