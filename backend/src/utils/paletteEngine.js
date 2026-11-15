/**
 * =============================================================================
 * paletteEngine.js — Motor de Paleta Completa de Logotipos (isomórfico)
 * =============================================================================
 * IMPORTANTE: Este archivo existe en DOS copias idénticas que deben mantenerse
 * sincronizadas:
 *   - backend/src/utils/paletteEngine.js
 *   - frontend/src/utils/paletteEngine.js
 * No depende de DOM ni de Node: solo recibe píxeles RGBA y devuelve objetos.
 *
 * Flujo:
 *   1. extractSwatches()  → Paleta COMPLETA real del logo (k-means en OKLab,
 *                           espacio perceptualmente uniforme) con detección
 *                           de fondo y proporción de cada color.
 *   2. assignRoles()      → Decide qué color del logo cumple cada rol
 *                           (primario, secundario, acento, texto).
 *                           Puede recibir roles sugeridos por IA.
 *   3. buildTheme()       → Calibra cada rol para la UI (contraste WCAG,
 *                           sin neón) y genera los tokens "Sofisticación Sutil"
 *                           compatibles con ThemeBrandingContext.
 * =============================================================================
 */

// ─── Conversión de color ─────────────────────────────────────────────────────

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

const srgbToLinear = (c) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};

const linearToSrgb = (v) => {
  const c = v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
  return c * 255;
};

export const rgbToHex = (r, g, b) => {
  const toHex = (n) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
};

export const isValidHex = (hex) =>
  typeof hex === 'string' && /^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex.trim());

export const hexToRgb = (hex, fallback = [77, 113, 130]) => {
  if (!isValidHex(hex)) return fallback;
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) clean = clean.split('').map((c) => c + c).join('');
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
};

export const rgbToOklab = (r, g, b) => {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720969 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
};

/** OKLab → sRGB lineal (sin recortar, para detectar fuera de gama) */
const oklabToLinear = (L, a, b) => {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
};

export const oklabToRgb = (L, a, b) => oklabToLinear(L, a, b).map((v) => clamp(linearToSrgb(clamp(v, 0, 1)), 0, 255));

export const labToLch = ([L, a, b]) => {
  const c = Math.sqrt(a * a + b * b);
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { l: L, c, h };
};

const inGamut = (lin) => lin.every((v) => v >= -0.0005 && v <= 1.0005);

/** OKLCH → HEX con mapeo de gama (reduce croma conservando tono y luminosidad) */
export const oklchToHex = (l, c, h) => {
  const L = clamp(l, 0, 1);
  const rad = (h * Math.PI) / 180;
  let lo = 0;
  let hi = Math.max(0, c);
  if (!inGamut(oklabToLinear(L, hi * Math.cos(rad), hi * Math.sin(rad)))) {
    for (let i = 0; i < 18; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(oklabToLinear(L, mid * Math.cos(rad), mid * Math.sin(rad)))) lo = mid;
      else hi = mid;
    }
    hi = lo;
  }
  const [r, g, b] = oklabToRgb(L, hi * Math.cos(rad), hi * Math.sin(rad));
  return rgbToHex(r, g, b);
};

export const hexToOklch = (hex) => {
  const [r, g, b] = hexToRgb(hex);
  return labToLch(rgbToOklab(r, g, b));
};

/** Distancia perceptual ΔE en OKLab (0 = idéntico, ~0.02 = apenas perceptible) */
export const deltaE = (lab1, lab2) =>
  Math.sqrt((lab1[0] - lab2[0]) ** 2 + (lab1[1] - lab2[1]) ** 2 + (lab1[2] - lab2[2]) ** 2);

export const hueDistance = (h1, h2) => {
  const d = Math.abs(h1 - h2) % 360;
  return d > 180 ? 360 - d : d;
};

const relativeLuminance = (hex) => {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
};

export const contrastRatio = (hex1, hex2) => {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};

/** Oscurece o aclara un HEX porcentualmente (-1 a 1). Se mantiene por compatibilidad. */
export const adjustBrightness = (hex, percent) => {
  const [r, g, b] = hexToRgb(hex);
  const adjust = (c) => (percent > 0 ? c + (255 - c) * percent : c * (1 + percent));
  return rgbToHex(adjust(r), adjust(g), adjust(b));
};

// ─── 1. Extracción de la paleta completa ─────────────────────────────────────

const NEUTRAL_CHROMA = 0.035; // Por debajo: blanco/gris/negro
const BG_MATCH_DE = 0.06;

const makeSwatch = (lab, population, extra = {}) => {
  const [r, g, b] = oklabToRgb(lab[0], lab[1], lab[2]);
  const lch = labToLch(lab);
  return {
    hex: rgbToHex(r, g, b),
    rgb: [Math.round(r), Math.round(g), Math.round(b)],
    lab,
    l: lch.l,
    c: lch.c,
    h: lch.h,
    population,
    isNeutral: lch.c < NEUTRAL_CHROMA,
    ...extra,
  };
};

/**
 * Detecta un fondo sólido observando el anillo exterior de la imagen.
 * Devuelve el color OKLab del fondo o null (fondo transparente / sin fondo sólido).
 */
const detectBackground = (data, width, height) => {
  if (!width || !height || width < 4 || height < 4) return null;
  const samples = [];
  const push = (x, y) => {
    const i = (y * width + x) * 4;
    if (data[i + 3] >= 200) samples.push(rgbToOklab(data[i], data[i + 1], data[i + 2]));
  };
  const step = Math.max(1, Math.floor(Math.min(width, height) / 40));
  for (let x = 0; x < width; x += step) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y += step) {
    push(0, y);
    push(width - 1, y);
  }
  const ringSize = 2 * Math.ceil(width / step) + 2 * Math.ceil(height / step);
  // Si la mayor parte del borde es transparente, no hay fondo sólido
  if (samples.length < ringSize * 0.5) return null;

  // Moda del anillo (no la media, que se contamina con franjas del logo que tocan el borde)
  let bestIdx = 0;
  let bestCount = -1;
  const probe = Math.max(1, Math.floor(samples.length / 60));
  for (let i = 0; i < samples.length; i += probe) {
    let count = 0;
    for (const s of samples) if (deltaE(s, samples[i]) < BG_MATCH_DE) count++;
    if (count > bestCount) {
      bestCount = count;
      bestIdx = i;
    }
  }
  if (bestCount / samples.length < 0.55) return null;
  const mean = [0, 0, 0];
  let n = 0;
  for (const s of samples) {
    if (deltaE(s, samples[bestIdx]) >= BG_MATCH_DE) continue;
    mean[0] += s[0];
    mean[1] += s[1];
    mean[2] += s[2];
    n++;
  }
  return [mean[0] / n, mean[1] / n, mean[2] / n];
};

/**
 * Extrae TODA la paleta del logotipo.
 *
 * @param {Object} img
 * @param {Uint8ClampedArray|number[]} img.data - Píxeles RGBA planos
 * @param {number} [img.width]
 * @param {number} [img.height]
 * @param {Object} [opts]
 * @param {number} [opts.maxColors=8]
 * @returns {{ swatches: Array, background: Object|null }}
 */
export const extractSwatches = ({ data, width, height }, { maxColors = 8 } = {}) => {
  if (!data || data.length < 4) return { swatches: [], background: null };

  const bgLab = detectBackground(data, width, height);
  // Solo se descarta un fondo NEUTRO (blanco, negro, gris). Un fondo cromático
  // (ej. logo cuadrado rojo con letras blancas) ES el color de la marca.
  const bgIsNeutral = bgLab ? labToLch(bgLab).c < NEUTRAL_CHROMA : false;

  // 1. Histograma cuantizado a 5 bits por canal (32 niveles) para acelerar k-means
  const buckets = new Map();
  let totalOpaque = 0;
  let bgPixels = 0;
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 128) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    totalOpaque++;
    const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { count: 0, r: 0, g: 0, b: 0 };
      buckets.set(key, bucket);
    }
    bucket.count++;
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
  }
  if (totalOpaque === 0) return { swatches: [], background: null };

  let points = [];
  for (const bk of buckets.values()) {
    const lab = rgbToOklab(bk.r / bk.count, bk.g / bk.count, bk.b / bk.count);
    if (bgLab && bgIsNeutral && deltaE(lab, bgLab) < BG_MATCH_DE) {
      bgPixels += bk.count;
      continue;
    }
    points.push({ lab, w: bk.count });
  }

  // Si quitar el fondo deja la imagen casi vacía, el "fondo" era el logo
  let background = null;
  if (bgLab && bgIsNeutral) {
    if (points.reduce((s, p) => s + p.w, 0) < totalOpaque * 0.02) {
      points = [];
      for (const bk of buckets.values()) {
        points.push({ lab: rgbToOklab(bk.r / bk.count, bk.g / bk.count, bk.b / bk.count), w: bk.count });
      }
    } else {
      background = makeSwatch(bgLab, bgPixels / totalOpaque, { isBackground: true });
    }
  }
  if (points.length === 0) return { swatches: [], background };

  const totalW = points.reduce((s, p) => s + p.w, 0);

  // 2. k-means ponderado con siembra determinista por punto más lejano
  const k = Math.min(Math.max(maxColors + 4, 6), points.length);
  points.sort((p1, p2) => p2.w - p1.w);
  const centers = [points[0].lab.slice()];
  const minDist = points.map((p) => deltaE(p.lab, centers[0]));
  while (centers.length < k) {
    let best = -1;
    let bestScore = -1;
    for (let i = 0; i < points.length; i++) {
      const score = minDist[i] * minDist[i] * Math.log1p(points[i].w);
      if (score > bestScore) {
        bestScore = score;
        best = i;
      }
    }
    if (best < 0 || bestScore <= 0) break;
    const c = points[best].lab.slice();
    centers.push(c);
    for (let i = 0; i < points.length; i++) minDist[i] = Math.min(minDist[i], deltaE(points[i].lab, c));
  }

  const assign = new Array(points.length).fill(0);
  for (let iter = 0; iter < 16; iter++) {
    let changed = false;
    for (let i = 0; i < points.length; i++) {
      let bestJ = 0;
      let bestD = Infinity;
      for (let j = 0; j < centers.length; j++) {
        const d = deltaE(points[i].lab, centers[j]);
        if (d < bestD) {
          bestD = d;
          bestJ = j;
        }
      }
      if (assign[i] !== bestJ) {
        assign[i] = bestJ;
        changed = true;
      }
    }
    const sums = centers.map(() => [0, 0, 0, 0]);
    for (let i = 0; i < points.length; i++) {
      const s = sums[assign[i]];
      const { lab, w } = points[i];
      s[0] += lab[0] * w;
      s[1] += lab[1] * w;
      s[2] += lab[2] * w;
      s[3] += w;
    }
    for (let j = 0; j < centers.length; j++) {
      if (sums[j][3] > 0) centers[j] = [sums[j][0] / sums[j][3], sums[j][1] / sums[j][3], sums[j][2] / sums[j][3]];
    }
    if (!changed && iter > 0) break;
  }

  let clusters = centers.map((lab, j) => ({ lab, w: 0 }));
  for (let i = 0; i < points.length; i++) clusters[assign[i]].w += points[i].w;
  clusters = clusters.filter((c) => c.w > 0);

  // 3. Fusionar clusters perceptualmente indistinguibles
  const MERGE_DE = 0.05;
  let merged = true;
  while (merged) {
    merged = false;
    outer: for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        if (deltaE(clusters[i].lab, clusters[j].lab) < MERGE_DE) {
          const a = clusters[i];
          const b = clusters[j];
          const w = a.w + b.w;
          a.lab = [0, 1, 2].map((n) => (a.lab[n] * a.w + b.lab[n] * b.w) / w);
          a.w = w;
          clusters.splice(j, 1);
          merged = true;
          break outer;
        }
      }
    }
  }

  // 4. Descartar artefactos de antialiasing (<0.5%) y ordenar por presencia
  const swatches = clusters
    .filter((c) => c.w / totalW >= 0.005)
    .sort((a, b) => b.w - a.w)
    .slice(0, maxColors)
    .map((c) => makeSwatch(c.lab, c.w / totalW));

  return { swatches, background };
};

/**
 * Reconstruye swatches desde una lista externa (cliente o IA): [{hex, population}] o ['#hex']
 */
export const normalizeSwatches = (list, maxColors = 10) => {
  if (!Array.isArray(list)) return [];
  const out = [];
  for (const item of list.slice(0, maxColors * 2)) {
    const hex = typeof item === 'string' ? item : item?.hex;
    if (!isValidHex(hex)) continue;
    const [r, g, b] = hexToRgb(hex.startsWith('#') ? hex : `#${hex}`);
    const pop = Number(typeof item === 'object' ? item.population : NaN);
    const sw = makeSwatch(rgbToOklab(r, g, b), Number.isFinite(pop) ? clamp(pop, 0, 1) : 0);
    sw.hex = rgbToHex(r, g, b); // conservar el hex exacto recibido
    sw.rgb = [r, g, b];
    if (!out.some((o) => deltaE(o.lab, sw.lab) < 0.01)) out.push(sw);
  }
  // Sin poblaciones: repartir de forma decreciente según el orden recibido
  if (out.length && out.every((s) => s.population === 0)) {
    out.forEach((s, i) => {
      s.population = (out.length - i) / ((out.length * (out.length + 1)) / 2);
    });
  }
  return out.slice(0, maxColors);
};

/** Busca el swatch más cercano a un HEX (para validar roles sugeridos por IA) */
export const nearestSwatch = (hex, swatches, maxDE = 0.08) => {
  if (!isValidHex(hex) || !swatches?.length) return null;
  const [r, g, b] = hexToRgb(hex.startsWith('#') ? hex : `#${hex}`);
  const lab = rgbToOklab(r, g, b);
  let best = null;
  let bestD = Infinity;
  for (const s of swatches) {
    const d = deltaE(lab, s.lab);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return bestD <= maxDE ? best : null;
};

// ─── 2. Asignación de roles ──────────────────────────────────────────────────

/** Qué tan apto es un color del logo para ser color de marca protagonista */
const brandScore = (s) => {
  const chromaFactor = 0.25 + Math.min(s.c, 0.22) / 0.22;
  const lightFactor = s.l < 0.2 || s.l > 0.92 ? 0.35 : 1;
  return s.population ** 0.6 * chromaFactor * lightFactor;
};

/**
 * Asigna roles a los colores reales del logo.
 * @param {Array} swatches
 * @param {Object} [suggested] - Roles sugeridos { primary, secondary, accent, text } (HEX), p.ej. por IA
 * @returns {{ primary, secondary, accent, text }} swatches (o null si el logo no aporta ese rol)
 */
export const assignRoles = (swatches, suggested = null) => {
  const roles = { primary: null, secondary: null, accent: null, text: null };
  if (!swatches?.length) return roles;

  const used = new Set();
  const take = (s) => {
    if (s) used.add(s.hex);
    return s;
  };

  if (suggested) {
    for (const role of ['primary', 'secondary', 'accent', 'text']) {
      const match = nearestSwatch(suggested[role], swatches);
      if (match && (!used.has(match.hex) || role === 'text')) roles[role] = take(match);
    }
  }

  const chromatic = swatches.filter((s) => !s.isNeutral);
  const free = (list) => list.filter((s) => !used.has(s.hex));

  // Primario: el color cromático más representativo
  if (!roles.primary) {
    const pool = free(chromatic);
    roles.primary = take(pool.sort((a, b) => brandScore(b) - brandScore(a))[0] || null);
  }
  // Logo monocromático: el neutro más oscuro de la marca hace de primario
  if (!roles.primary) {
    const dark = free(swatches).sort((a, b) => a.l - b.l)[0];
    if (dark && dark.l < 0.7) roles.primary = take(dark);
  }

  const p = roles.primary;

  // Secundario: segundo color de marca, preferiblemente de otra familia de tono
  if (!roles.secondary && p) {
    const pool = free(chromatic);
    const distinct = pool
      .filter((s) => hueDistance(s.h, p.h) >= 20 || Math.abs(s.l - p.l) >= 0.15)
      .sort((a, b) => brandScore(b) - brandScore(a));
    roles.secondary = take(distinct[0] || null);
  }

  // Acento: el color más llamativo y distinto a los dos anteriores
  if (!roles.accent && p) {
    const ref = [p, roles.secondary].filter(Boolean);
    const pool = free(chromatic)
      .map((s) => ({ s, d: Math.min(...ref.map((r) => hueDistance(s.h, r.h))) }))
      .filter(({ d }) => d >= 25)
      .sort((a, b) => b.s.c * (b.s.population ** 0.3) * (1 + b.d / 180) - a.s.c * (a.s.population ** 0.3) * (1 + a.d / 180));
    roles.accent = take(pool[0]?.s || null);
  }

  // Texto: el tono oscuro que use el propio logo (si lo tiene)
  if (!roles.text) {
    const dark = swatches.filter((s) => s.l < 0.4 && s !== p).sort((a, b) => a.l - b.l)[0];
    roles.text = dark || null;
  }

  return roles;
};

// ─── 3. Construcción del tema ────────────────────────────────────────────────

const DEFAULT_PRIMARY = hexToOklch('#4D7182');
const MAX_UI_CHROMA = 0.17; // Evita tonos neón en la interfaz

/**
 * Ajusta un color a un contraste mínimo contra blanco bajando su luminosidad
 * (conserva el tono, recorta croma excesiva).
 */
/** Un neutro casi puro no tiene tono fiable: usar el azul pizarra oficial */
const safeHue = ({ c, h }) => (c < 0.012 ? DEFAULT_PRIMARY.h : h);

const calibrate = (color, minContrast, maxChroma = MAX_UI_CHROMA) => {
  const { l, c } = color;
  const h = safeHue(color);
  const chroma = Math.min(c, maxChroma);
  let L = clamp(l, 0.2, 0.85);
  let hex = oklchToHex(L, chroma, h);
  while (contrastRatio(hex, '#FFFFFF') < minContrast && L > 0.15) {
    L -= 0.01;
    hex = oklchToHex(L, chroma, h);
  }
  return { hex, l: L, c: chroma, h };
};

const tint = ({ c, h }, l, maxC) => oklchToHex(l, Math.min(c * 0.4, maxC), h);

/**
 * Construye el tema completo a partir de la paleta del logo.
 * Mantiene las claves del tema actual (bg, surface, border, primary, text, …)
 * y añade secondary, accent real, logoColors, etc.
 */
export const buildTheme = (swatches, { roles: suggested = null, background = null, source = 'algoritmo', name, desc } = {}) => {
  const roles = assignRoles(swatches, suggested);
  const pBase = roles.primary || { ...DEFAULT_PRIMARY };

  // Primario: contraste AA (4.5:1) contra blanco para botones con texto blanco
  const primary = calibrate(
    roles.primary?.isNeutral
      ? { l: clamp(pBase.l, 0.3, 0.45), c: Math.max(pBase.c, 0.02), h: safeHue(pBase) }
      : pBase,
    4.5
  );

  // Secundario: color real del logo o, si no existe, un tono hermano del primario
  const sBase = roles.secondary || {
    l: primary.l < 0.5 ? primary.l + 0.12 : primary.l - 0.1,
    c: primary.c * 0.8,
    h: primary.h,
  };
  const secondary = calibrate(sBase, 3);

  // Acento: tercer color real del logo; si no hay, se reutiliza el secundario
  const accent = roles.accent ? calibrate(roles.accent, 3) : secondary;

  // Texto: oscuro tintado con el tono de la marca (nunca #000000), contraste AAA
  const tBase = roles.text || primary;
  const textHue = tBase.c < 0.02 ? primary.h : safeHue(tBase);
  const textChroma = clamp(Math.min(tBase.c, primary.c) * 0.35, 0.012, 0.045);
  let textL = clamp(Math.min(tBase.l, 0.3), 0.2, 0.3);
  let text = oklchToHex(textL, textChroma, textHue);

  // Fondo: crema/perla ultra claro con el tinte del logo (nunca #FFFFFF)
  const bgHue = background && !background.isNeutral ? background.h : primary.h;
  let bg = oklchToHex(0.968, clamp(primary.c * 0.07, 0.005, 0.011), bgHue);
  if (bg === '#FFFFFF') bg = '#F6F3EC';
  while (contrastRatio(text, bg) < 7 && textL > 0.12) {
    textL -= 0.02;
    text = oklchToHex(textL, textChroma, textHue);
  }
  if (text === '#000000') text = oklchToHex(0.18, 0.02, textHue);

  // Borde: neutro apastelado, con un toque del secundario para variar la superficie
  const borderHue = roles.secondary && hueDistance(secondary.h, primary.h) < 60 ? (primary.h + secondary.h) / 2 : primary.h;
  const border = oklchToHex(0.86, clamp(primary.c * 0.15, 0.008, 0.024), borderHue);

  let textSecondaryL = 0.47;
  let textSecondary = oklchToHex(textSecondaryL, textChroma * 1.4, textHue);
  while (contrastRatio(textSecondary, bg) < 4.5 && textSecondaryL > 0.25) {
    textSecondaryL -= 0.02;
    textSecondary = oklchToHex(textSecondaryL, textChroma * 1.4, textHue);
  }

  const primaryHover = oklchToHex(primary.l - 0.07, primary.c, primary.h);
  const secondaryHover = oklchToHex(secondary.l - 0.07, secondary.c, secondary.h);

  const roleOf = (hex) =>
    ['primary', 'secondary', 'accent', 'text'].find((r) => roles[r]?.hex === hex) || null;

  return {
    key: 'custom_ia',
    name: name || 'Paleta Generada por IA',
    category: 'Inteligencia Visual (Paleta Completa del Logo)',
    desc: desc || `Tema construido con ${swatches.length || 1} colores reales detectados en el logotipo.`,
    source,
    bg,
    surface: '#FFFFFF',
    border,
    primary: primary.hex,
    primaryHover,
    primaryLight: tint(primary, 0.94, 0.04),
    secondary: secondary.hex,
    secondaryHover,
    secondaryLight: tint(secondary, 0.95, 0.04),
    accent: accent.hex,
    accentLight: tint(accent, 0.95, 0.045),
    text,
    textSecondary,
    inputBg: oklchToHex(0.985, 0.004, primary.h),
    rgbPrimary: hexToRgb(primary.hex),
    rgbSecondary: hexToRgb(secondary.hex),
    rgbAccent: hexToRgb(accent.hex),
    rgbBg: hexToRgb(bg),
    rgbBorder: hexToRgb(border),
    rgbText: hexToRgb(text),
    // Paleta original del logo (sin calibrar), para mostrarla al usuario
    logoColors: swatches.map((s) => ({
      hex: s.hex,
      population: Math.round(s.population * 1000) / 1000,
      role: roleOf(s.hex),
    })),
  };
};

/** Atajo: píxeles RGBA → tema completo */
export const themeFromPixels = (img, opts = {}) => {
  const { swatches, background } = extractSwatches(img, opts);
  return buildTheme(swatches, { ...opts, background });
};
