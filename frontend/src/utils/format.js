/**
 * Formatos de presentación compartidos (una sola convención en toda la app).
 */
const fmtMoneda = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Dinero en dólares: $2,150.00 */
export const formatMoney = (valor) => fmtMoneda.format(Number(valor) || 0);

const fmtFecha = new Intl.DateTimeFormat('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });

/**
 * Convierte un valor de fecha a Date respetando el día del calendario.
 * Las columnas DATE de PostgreSQL llegan como "2031-06-15" o "2031-06-15T00:00:00.000Z";
 * con new Date() se interpretan como medianoche UTC y en Ecuador (UTC-5) se muestran
 * el día anterior. Esos valores se tratan como medianoche local del mismo día.
 * Los timestamps reales (con hora) se respetan tal cual.
 */
export const aFechaLocal = (valor) => {
  if (valor instanceof Date) return valor;
  const texto = String(valor ?? '');
  const soloFecha = texto.match(/^(\d{4})-(\d{2})-(\d{2})(?:T00:00:00(?:\.000)?Z?)?$/);
  if (soloFecha) return new Date(Number(soloFecha[1]), Number(soloFecha[2]) - 1, Number(soloFecha[3]));
  return new Date(valor);
};

/** Fecha corta legible: 20 mar 2027 (acepta ISO, Date o AAAA-MM-DD). */
export const formatFecha = (valor) => {
  if (!valor) return '—';
  const d = aFechaLocal(valor);
  return Number.isNaN(d.getTime()) ? '—' : fmtFecha.format(d).replace('.', '');
};
