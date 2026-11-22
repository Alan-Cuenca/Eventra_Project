import { describe, it, expect } from 'vitest';
import { aFechaLocal, formatFecha } from '../utils/format';

describe('aFechaLocal (columnas DATE sin desfase de zona horaria)', () => {
  it('"AAAA-MM-DD" y la medianoche UTC que envía la API conservan el día del calendario', () => {
    for (const valor of ['2031-06-15', '2031-06-15T00:00:00.000Z', '2031-06-15T00:00:00Z']) {
      const d = aFechaLocal(valor);
      expect([d.getFullYear(), d.getMonth() + 1, d.getDate()]).toEqual([2031, 6, 15]);
    }
  });

  it('los timestamps con hora se respetan tal cual', () => {
    const iso = '2026-11-21T18:30:00.000Z';
    expect(aFechaLocal(iso).getTime()).toBe(new Date(iso).getTime());
  });

  it('acepta Date y devuelve inválida si el texto no es fecha', () => {
    const d = new Date(2030, 0, 1);
    expect(aFechaLocal(d)).toBe(d);
    expect(Number.isNaN(aFechaLocal('no-fecha').getTime())).toBe(true);
  });

  it('formatFecha muestra el día correcto para la medianoche UTC', () => {
    expect(formatFecha('2031-06-15T00:00:00.000Z')).toMatch(/^15 jun/);
    expect(formatFecha(null)).toBe('—');
  });
});
