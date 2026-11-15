import zlib from 'zlib';

/**
 * =============================================================================
 * pngDecoder.js — Decodificador PNG ligero (zlib nativo de Node.js)
 * =============================================================================
 * Soporta PNG no entrelazados de 8 bits por canal con los tipos de color
 * 0 (gris), 2 (RGB), 3 (paleta + tRNS), 4 (gris + alfa) y 6 (RGBA),
 * aplicando correctamente los filtros de fila (None, Sub, Up, Average, Paeth).
 * Para otros formatos devuelve null (el servicio usa la paleta del navegador).
 * =============================================================================
 */

const CHANNELS = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };

const paeth = (a, b, c) => {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  return pb <= pc ? b : c;
};

/**
 * Decodifica un PNG a píxeles RGBA planos, reduciendo la imagen a un máximo
 * de `maxSide` píxeles por lado (muestreo por vecino más cercano).
 * @returns {{ data: Uint8ClampedArray, width: number, height: number } | null}
 */
export function decodePng(buffer, { maxSide = 128 } = {}) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 33) return null;
  if (buffer.readUInt32BE(0) !== 0x89504e47 || buffer.readUInt32BE(4) !== 0x0d0a1a0a) return null;

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let interlace = 0;
  let palette = null;
  let trns = null;
  const idatChunks = [];

  while (offset + 8 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const start = offset + 8;
    if (start + length > buffer.length) break;
    if (type === 'IHDR') {
      width = buffer.readUInt32BE(start);
      height = buffer.readUInt32BE(start + 4);
      bitDepth = buffer.readUInt8(start + 8);
      colorType = buffer.readUInt8(start + 9);
      interlace = buffer.readUInt8(start + 12);
    } else if (type === 'PLTE') {
      palette = buffer.subarray(start, start + length);
    } else if (type === 'tRNS') {
      trns = buffer.subarray(start, start + length);
    } else if (type === 'IDAT') {
      idatChunks.push(buffer.subarray(start, start + length));
    } else if (type === 'IEND') {
      break;
    }
    offset += 12 + length;
  }

  const channels = CHANNELS[colorType];
  if (!channels || bitDepth !== 8 || interlace !== 0 || !width || !height || idatChunks.length === 0) return null;
  if (colorType === 3 && !palette) return null;
  // Protección ante imágenes descomunales (memoria)
  if (width * height > 25_000_000) return null;

  let raw;
  try {
    raw = zlib.inflateSync(Buffer.concat(idatChunks));
  } catch {
    return null;
  }

  const stride = width * channels;
  if (raw.length < (stride + 1) * height) return null;

  // Quitar filtros fila por fila (solo se conservan las filas muestreadas)
  const scale = Math.max(1, Math.max(width, height) / maxSide);
  const outW = Math.max(1, Math.round(width / scale));
  const outH = Math.max(1, Math.round(height / scale));
  const data = new Uint8ClampedArray(outW * outH * 4);
  const rowForOut = new Map();
  for (let oy = 0; oy < outH; oy++) {
    const sy = Math.min(height - 1, Math.floor(oy * scale));
    if (!rowForOut.has(sy)) rowForOut.set(sy, []);
    rowForOut.get(sy).push(oy);
  }

  let prev = new Uint8Array(stride);
  let cur = new Uint8Array(stride);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (stride + 1);
    const filter = raw[rowStart];
    for (let i = 0; i < stride; i++) {
      const x = raw[rowStart + 1 + i];
      const a = i >= channels ? cur[i - channels] : 0;
      const b = prev[i];
      const c = i >= channels ? prev[i - channels] : 0;
      let v;
      switch (filter) {
        case 0: v = x; break;
        case 1: v = x + a; break;
        case 2: v = x + b; break;
        case 3: v = x + ((a + b) >> 1); break;
        case 4: v = x + paeth(a, b, c); break;
        default: return null;
      }
      cur[i] = v & 255;
    }

    const targets = rowForOut.get(y);
    if (targets) {
      for (let ox = 0; ox < outW; ox++) {
        const sx = Math.min(width - 1, Math.floor(ox * scale));
        const p = sx * channels;
        let r;
        let g;
        let bl;
        let al = 255;
        if (colorType === 6) {
          [r, g, bl, al] = [cur[p], cur[p + 1], cur[p + 2], cur[p + 3]];
        } else if (colorType === 2) {
          [r, g, bl] = [cur[p], cur[p + 1], cur[p + 2]];
        } else if (colorType === 0) {
          r = g = bl = cur[p];
        } else if (colorType === 4) {
          r = g = bl = cur[p];
          al = cur[p + 1];
        } else {
          const idx = cur[p];
          r = palette[idx * 3] ?? 0;
          g = palette[idx * 3 + 1] ?? 0;
          bl = palette[idx * 3 + 2] ?? 0;
          al = trns && idx < trns.length ? trns[idx] : 255;
        }
        for (const oy of targets) {
          const o = (oy * outW + ox) * 4;
          data[o] = r;
          data[o + 1] = g;
          data[o + 2] = bl;
          data[o + 3] = al;
        }
      }
    }
    [prev, cur] = [cur, prev];
  }

  return { data, width: outW, height: outH };
}

/**
 * Compatibilidad con la API anterior: arreglo de píxeles { r, g, b, a }.
 */
export function decodePngRgb(buffer) {
  const img = decodePng(buffer, { maxSide: 64 });
  if (!img) return null;
  const pixels = [];
  for (let i = 0; i < img.data.length; i += 4) {
    pixels.push({ r: img.data[i], g: img.data[i + 1], b: img.data[i + 2], a: img.data[i + 3] });
  }
  return pixels;
}
