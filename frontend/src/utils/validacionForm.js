/**
 * validacionForm.js — Reglas de validación de formularios en el navegador.
 *
 * Replica las reglas del servidor (backend/src/middlewares/validarCuerpo.js y esquemas.js)
 * para marcar los campos ANTES de enviar o de pasar al siguiente paso. El servidor vuelve
 * a validar todo: esto solo mejora la experiencia, no reemplaza la validación del backend.
 *
 * Uso:
 *   const errores = validarFormulario(form, ESQUEMAS.cliente);
 *   if (hayErrores(errores)) { setErrores(errores); return; }
 */
export const TIPOS_EVENTO = ['Matrimonio', 'Quinceañera', 'Cumpleaños', 'Corporativo', 'Bautizo', 'Grado', 'Otro'];
const PATRON_NOMBRE = /^[\p{L}][\p{L}\s'.-]*$/u;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MONTO_MAXIMO = 99_999_999.99;

/** Fecha de hoy (AAAA-MM-DD) en la zona del navegador. */
export const hoyIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const sumarAnios = (iso, anios) => {
  const [y, m, d] = iso.split('-');
  return `${String(Number(y) + anios).padStart(4, '0')}-${m}-${d}`;
};

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

/** Devuelve el mensaje de error de un valor o '' si es válido. */
export const validarCampo = (valor, regla) => {
  const etq = regla.etiqueta || 'campo';
  if (vacio(valor)) return regla.requerido ? `El campo ${etq} es obligatorio.` : '';
  switch (regla.tipo) {
    case 'texto': {
      const t = String(valor).trim().replace(/\s+/g, ' ');
      const min = regla.min ?? 1;
      if (t.length < min) return `El campo ${etq} debe tener al menos ${min} caracteres.`;
      if (regla.max && t.length > regla.max) return `El campo ${etq} no puede superar los ${regla.max} caracteres.`;
      if (regla.patron === 'nombre' && !PATRON_NOMBRE.test(t)) return `El campo ${etq} solo puede contener letras y espacios.`;
      return '';
    }
    case 'email':
      return EMAIL_RE.test(String(valor).trim()) && String(valor).length <= 150 ? '' : `El ${etq} no tiene un formato válido (ej. nombre@dominio.com).`;
    case 'telefono': {
      const t = String(valor).trim();
      const dig = t.replace(/\D/g, '');
      return /^\+?[\d\s()-]+$/.test(t) && dig.length >= 7 && dig.length <= 15 ? '' : `El ${etq} debe tener entre 7 y 15 dígitos (ej. 0991234567).`;
    }
    case 'cedula':
      return esCedulaValida(valor) ? '' : `La ${etq} no es una cédula ecuatoriana válida.`;
    case 'monto': {
      const n = Number(valor);
      if (Number.isNaN(n)) return `El ${etq} debe ser un número.`;
      if (regla.permitirCero ? n < 0 : n <= 0) return `El ${etq} debe ser ${regla.permitirCero ? 'cero o mayor' : 'mayor a cero'}.`;
      if (regla.max !== undefined && n > regla.max + 0.001) return regla.mensajeMax || `El ${etq} no puede superar ${regla.max}.`;
      if (n > MONTO_MAXIMO) return `El ${etq} supera el máximo permitido.`;
      return '';
    }
    case 'entero': {
      const n = Number(valor);
      if (!Number.isInteger(n)) return `El campo ${etq} debe ser un número entero.`;
      if (regla.min !== undefined && n < regla.min) return `El campo ${etq} debe ser al menos ${regla.min}.`;
      if (regla.max !== undefined && n > regla.max) return `El campo ${etq} no puede ser mayor a ${regla.max}.`;
      return '';
    }
    case 'fecha': {
      const f = String(valor).slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(f) || Number.isNaN(new Date(`${f}T00:00:00`).getTime())) return `La ${etq} no es una fecha válida.`;
      const hoy = hoyIso();
      if (regla.noPasada && f < hoy) return `La ${etq} no puede estar en el pasado.`;
      if (regla.noFutura && f > hoy) return `La ${etq} no puede estar en el futuro.`;
      if (regla.maxAnios && f > sumarAnios(hoy, regla.maxAnios)) return `La ${etq} no puede ser posterior a ${regla.maxAnios} años desde hoy.`;
      if (regla.edadMinima && f > sumarAnios(hoy, -regla.edadMinima)) return `Debes ser mayor de ${regla.edadMinima} años (revisa la ${etq}).`;
      if (regla.noDespuesDe && f > regla.noDespuesDe) return regla.mensajeNoDespuesDe || `La ${etq} no puede ser posterior a ${regla.noDespuesDe}.`;
      if (f < '1900-01-01') return `La ${etq} no es una fecha válida.`;
      return '';
    }
    case 'enum':
      return regla.valores.includes(valor) ? '' : `Selecciona un ${etq} válido.`;
    default:
      return '';
  }
};

/** Valida todo el formulario: { campo: mensaje } solo con los campos que fallan. */
export const validarFormulario = (valores, esquema) => {
  const errores = {};
  Object.entries(esquema).forEach(([campo, regla]) => {
    const msg = validarCampo(valores?.[campo], regla);
    if (msg) errores[campo] = msg;
  });
  return errores;
};

export const hayErrores = (errores) => Object.keys(errores || {}).length > 0;
/** Primer mensaje (para banners de error). */
export const primerError = (errores) => Object.values(errores || {})[0] || '';
/** Todos los mensajes en una sola línea. */
export const resumenErrores = (errores) => Object.values(errores || {}).join(' ');

const nombre = (etiqueta, requerido = true, max = 100) => ({ tipo: 'texto', patron: 'nombre', min: 2, max, requerido, etiqueta });
const texto = (etiqueta, { requerido = false, min = 1, max = 1000 } = {}) => ({ tipo: 'texto', min, max, requerido, etiqueta });

export const ESQUEMAS = {
  cliente: {
    nombres: nombre('nombres'),
    apellidos: nombre('apellidos'),
    email: { tipo: 'email', etiqueta: 'correo electrónico' },
    telefono: { tipo: 'telefono', etiqueta: 'teléfono' },
  },
  servicio: {
    nombre: texto('nombre', { requerido: true, min: 2, max: 100 }),
    descripcion: texto('descripción', { max: 1000 }),
    precio_base: { tipo: 'monto', requerido: true, etiqueta: 'precio' },
  },
  paquete: {
    nombre: texto('nombre', { requerido: true, min: 2, max: 100 }),
    descripcion: texto('descripción', { max: 1000 }),
    precio_total: { tipo: 'monto', requerido: true, etiqueta: 'precio total' },
  },
  proveedor: {
    nombre_empresa_o_contacto: texto('nombre o empresa', { requerido: true, min: 2, max: 150 }),
    especialidad: texto('especialidad', { max: 100 }),
    telefono: { tipo: 'telefono', etiqueta: 'teléfono' },
    email: { tipo: 'email', etiqueta: 'correo electrónico' },
  },
  cotizacionDatos: {
    cliente_id: { tipo: 'texto', requerido: true, etiqueta: 'cliente' },
    tipo_evento: { tipo: 'enum', requerido: true, valores: TIPOS_EVENTO, etiqueta: 'tipo de evento' },
    fecha_estimada: { tipo: 'fecha', requerido: true, noPasada: true, maxAnios: 5, etiqueta: 'fecha del evento' },
    num_invitados: { tipo: 'entero', requerido: true, min: 1, max: 10000, etiqueta: 'número de invitados' },
  },
  evento: {
    reserva_id: { tipo: 'texto', requerido: true, etiqueta: 'reserva asociada' },
    titulo: texto('nombre del evento', { requerido: true, min: 3, max: 150 }),
    descripcion: texto('descripción', { max: 2000 }),
  },
  actividad: {
    descripcion: texto('descripción de la tarea', { requerido: true, min: 3, max: 255 }),
    evento_id: { tipo: 'texto', requerido: true, etiqueta: 'evento' },
  },
  pago: {
    eventoId: { tipo: 'texto', requerido: true, etiqueta: 'evento' },
    monto: { tipo: 'monto', requerido: true, etiqueta: 'monto' },
  },
  solicitud: {
    descripcion: texto('detalle de la solicitud', { requerido: true, min: 10, max: 1000 }),
  },
  completarRegistro: {
    nombre_completo: nombre('nombre completo', true, 150),
    cedula: { tipo: 'cedula', requerido: true, etiqueta: 'cédula' },
    fecha_nacimiento: { tipo: 'fecha', requerido: true, noFutura: true, edadMinima: 18, etiqueta: 'fecha de nacimiento' },
  },
  registroCliente: {
    nombres: nombre('nombres'),
    apellidos: nombre('apellidos'),
    email: { tipo: 'email', requerido: true, etiqueta: 'correo electrónico' },
    telefono: { tipo: 'telefono', etiqueta: 'teléfono' },
  },
};

/**
 * Marca en el formulario los campos con error (borde rojo, aria-invalid y el mensaje como
 * tooltip) y enfoca el primero. Busca cada campo por su atributo name. La marca se quita
 * sola cuando el usuario vuelve a escribir en ese campo.
 */
export const marcarCampos = (formulario, errores) => {
  if (!formulario || typeof formulario.querySelectorAll !== 'function') return;
  formulario.querySelectorAll('[data-campo-invalido]').forEach((el) => {
    el.removeAttribute('data-campo-invalido');
    el.removeAttribute('aria-invalid');
    el.style.borderColor = '';
    el.style.boxShadow = '';
  });
  let primero = null;
  Object.entries(errores || {}).forEach(([campo, mensaje]) => {
    const el = formulario.querySelector(`[name="${campo}"]`);
    if (!el) return;
    el.setAttribute('data-campo-invalido', 'true');
    el.setAttribute('aria-invalid', 'true');
    el.title = mensaje;
    el.style.borderColor = '#C95C5C';
    el.style.boxShadow = '0 0 0 1px #C95C5C';
    const limpiar = () => {
      el.removeAttribute('data-campo-invalido');
      el.removeAttribute('aria-invalid');
      el.removeAttribute('title');
      el.style.borderColor = '';
      el.style.boxShadow = '';
    };
    el.addEventListener('input', limpiar, { once: true });
    el.addEventListener('change', limpiar, { once: true });
    if (!primero) primero = el;
  });
  if (primero && typeof primero.focus === 'function') primero.focus();
};
