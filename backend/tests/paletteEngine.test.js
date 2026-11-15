import zlib from 'zlib';
import {
  extractSwatches,
  buildTheme,
  assignRoles,
  normalizeSwatches,
  contrastRatio,
} from '../src/utils/paletteEngine.js';
import { decodePng } from '../src/utils/pngDecoder.js';
import { analizarLogotipoConIA } from '../src/services/aiBrandingService.js';

// Sin claves de IA: se prueba el camino determinista
delete process.env.GEMINI_API_KEY;
delete process.env.OPENAI_API_KEY;

/** Genera una imagen RGBA a partir de una función (x, y) → [r, g, b, a?] */
const makeImage = (width, height, fn) => {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b, a = 255] = fn(x, y);
      const i = (y * width + x) * 4;
      data.set([r, g, b, a], i);
    }
  }
  return { data, width, height };
};

/** Logo de 4 colores sobre fondo blanco con texto gris oscuro */
const GOOGLE_COLORS = [
  [66, 133, 244],
  [234, 67, 53],
  [251, 188, 5],
  [52, 168, 83],
];
const multiColorLogo = makeImage(100, 100, (x, y) => {
  if (y < 20 || y > 80 || x < 10 || x > 90) return [255, 255, 255];
  if (y > 70) return [60, 64, 67];
  return GOOGLE_COLORS[Math.min(Math.floor((x - 10) / 20), 3)];
});

/** Codifica un PNG RGBA de 8 bits usando distintos filtros por fila */
const encodePng = ({ data, width, height }) => {
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buf) => {
    let c = 0xffffffff;
    for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, body) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(body.length);
    const tb = Buffer.concat([Buffer.from(type, 'ascii'), body]);
    const c = Buffer.alloc(4);
    c.writeUInt32BE(crc(tb));
    return Buffer.concat([len, tb, c]);
  };
  const stride = width * 4;
  const rows = [];
  const filters = [0, 1, 2, 3, 4];
  for (let y = 0; y < height; y++) {
    const f = filters[y % filters.length];
    const row = Buffer.alloc(stride + 1);
    row[0] = f;
    for (let i = 0; i < stride; i++) {
      const x = data[y * stride + i];
      const a = i >= 4 ? data[y * stride + i - 4] : 0;
      const b = y > 0 ? data[(y - 1) * stride + i] : 0;
      const c = y > 0 && i >= 4 ? data[(y - 1) * stride + i - 4] : 0;
      let pred = 0;
      if (f === 1) pred = a;
      else if (f === 2) pred = b;
      else if (f === 3) pred = (a + b) >> 1;
      else if (f === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        pred = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      row[i + 1] = (x - pred) & 255;
    }
    rows.push(row);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(Buffer.concat(rows))),
    chunk('IEND', Buffer.alloc(0)),
  ]);
};

describe('paletteEngine — paleta completa del logotipo', () => {
  test('Extrae todos los colores del logo y descarta el fondo blanco', () => {
    const { swatches, background } = extractSwatches(multiColorLogo);
    expect(background?.hex).toBe('#FFFFFF');
    const hexes = swatches.map((s) => s.hex);
    expect(hexes).toEqual(expect.arrayContaining(['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#3C4043']));
    expect(hexes).not.toContain('#FFFFFF');
  });

  test('Asigna primario, secundario y acento a colores distintos del logo', () => {
    const { swatches } = extractSwatches(multiColorLogo);
    const roles = assignRoles(swatches);
    const used = [roles.primary.hex, roles.secondary.hex, roles.accent.hex];
    expect(new Set(used).size).toBe(3);
    expect(roles.text.hex).toBe('#3C4043');
  });

  test('Respeta los roles sugeridos por IA solo si existen en el logo', () => {
    const { swatches } = extractSwatches(multiColorLogo);
    const roles = assignRoles(swatches, { primary: '#4285F4', secondary: '#FF00FF', accent: '#FBBC05' });
    expect(roles.primary.hex).toBe('#4285F4');
    expect(roles.accent.hex).toBe('#FBBC05');
    expect(roles.secondary.hex).not.toBe('#FF00FF');
  });

  test('El tema cumple contraste WCAG y las reglas de Sofisticación Sutil', () => {
    const { swatches, background } = extractSwatches(multiColorLogo);
    const theme = buildTheme(swatches, { background });
    expect(theme.surface).toBe('#FFFFFF');
    expect(theme.bg).not.toBe('#FFFFFF');
    expect(theme.text).not.toBe('#000000');
    expect(contrastRatio(theme.primary, '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(theme.secondary, '#FFFFFF')).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(theme.accent, '#FFFFFF')).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(theme.text, theme.bg)).toBeGreaterThanOrEqual(7);
    expect(theme.logoColors.length).toBe(swatches.length);
  });

  test('Un logo con fondo de color conserva ese color como marca', () => {
    const img = makeImage(80, 80, (x, y) => (x > 30 && x < 50 && y > 30 && y < 50 ? [255, 255, 255] : [211, 47, 47]));
    const { swatches, background } = extractSwatches(img);
    expect(background).toBeNull();
    expect(swatches[0].hex).toBe('#D32F2F');
  });

  test('Un logo negro transparente genera un tema sobrio sin #000000', () => {
    const img = makeImage(60, 60, (x, y) => (x > 15 && x < 45 && y > 15 && y < 45 ? [20, 20, 20, 255] : [0, 0, 0, 0]));
    const theme = buildTheme(extractSwatches(img).swatches);
    expect(theme.text).not.toBe('#000000');
    expect(contrastRatio(theme.primary, '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
  });

  test('normalizeSwatches ignora valores inválidos', () => {
    const list = normalizeSwatches([{ hex: '#123456', population: 0.6 }, { hex: 'rojo' }, '#ABCDEF', null]);
    expect(list.map((s) => s.hex)).toEqual(['#123456', '#ABCDEF']);
  });
});

describe('pngDecoder — filtros de fila PNG', () => {
  test('Decodifica correctamente un PNG con filtros Sub/Up/Average/Paeth', () => {
    const png = encodePng(multiColorLogo);
    const img = decodePng(png, { maxSide: 200 });
    expect(img.width).toBe(100);
    expect(Buffer.from(img.data).equals(Buffer.from(multiColorLogo.data))).toBe(true);
  });

  test('Devuelve null para datos que no son PNG', () => {
    expect(decodePng(Buffer.from('no-es-un-png-valido-no-es-un-png-valido'))).toBeNull();
  });
});

describe('aiBrandingService — análisis sin IA', () => {
  test('Extrae la paleta completa desde un PNG subido', async () => {
    const theme = await analizarLogotipoConIA({ buffer: encodePng(multiColorLogo), mimetype: 'image/png' });
    expect(theme.key).toBe('custom_ia');
    expect(theme.logoColors.length).toBeGreaterThanOrEqual(5);
    expect(theme.secondary).toBeDefined();
    expect(theme.accent).not.toBe(theme.primary);
  });

  test('Usa los colores calculados por el navegador cuando la imagen no es PNG', async () => {
    const theme = await analizarLogotipoConIA({
      buffer: Buffer.from('jpeg-falso'),
      mimetype: 'image/jpeg',
      clientPalette: { logoColors: [{ hex: '#1877F2', population: 0.7 }, { hex: '#F2A818', population: 0.3 }] },
    });
    expect(theme.logoColors.map((c) => c.hex)).toEqual(['#1877F2', '#F2A818']);
  });
});
