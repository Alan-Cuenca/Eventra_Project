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

/** Fecha corta legible: 20 mar 2027 (acepta ISO, Date o AAAA-MM-DD). */
export const formatFecha = (valor) => {
  if (!valor) return '—';
  const texto = String(valor);
  const d = /^\d{4}-\d{2}-\d{2}$/.test(texto.slice(0, 10)) && texto.length <= 10
    ? new Date(`${texto}T00:00:00`)
    : new Date(valor);
  return Number.isNaN(d.getTime()) ? '—' : fmtFecha.format(d).replace('.', '');
};
