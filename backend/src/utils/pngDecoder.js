import fs from 'fs';
import zlib from 'zlib';

/**
 * Decodificador ligero de PNG nativo con zlib de Node.js
 */
export function decodePngRgb(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 8) return null;
  // Verificar firma PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buffer.readUInt32BE(0) !== 0x89504E47) return null;

  let offset = 8;
  let width = 0, height = 0, bitDepth = 0, colorType = 0;
  const idatChunks = [];

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    if (type === 'IHDR') {
      width = buffer.readUInt32BE(offset + 8);
      height = buffer.readUInt32BE(offset + 12);
      bitDepth = buffer.readUInt8(offset + 16);
      colorType = buffer.readUInt8(offset + 17);
    } else if (type === 'IDAT') {
      idatChunks.push(buffer.subarray(offset + 8, offset + 8 + length));
    } else if (type === 'IEND') {
      break;
    }
    offset += 12 + length;
  }

  if (idatChunks.length === 0 || width === 0 || height === 0) return null;

  try {
    const compressed = Buffer.concat(idatChunks);
    const decompressed = zlib.inflateSync(compressed);
    const pixels = [];

    // Formatos comunes: colorType 6 (RGBA), colorType 2 (RGB)
    const bytesPerPixel = colorType === 6 ? 4 : colorType === 2 ? 3 : 1;
    const stride = width * bytesPerPixel + 1;

    for (let y = 0; y < height; y += Math.max(1, Math.floor(height / 64))) {
      const rowOffset = y * stride;
      for (let x = 0; x < width; x += Math.max(1, Math.floor(width / 64))) {
        const px = rowOffset + 1 + x * bytesPerPixel;
        if (px + bytesPerPixel <= decompressed.length) {
          const r = decompressed[px];
          const g = decompressed[px + 1];
          const b = decompressed[px + 2];
          const a = colorType === 6 ? decompressed[px + 3] : 255;
          pixels.push({ r, g, b, a });
        }
      }
    }
    return pixels;
  } catch (err) {
    return null;
  }
}

console.log('PNG decoder module ready');
