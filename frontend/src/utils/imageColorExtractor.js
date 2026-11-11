/**
 * =============================================================================
 * imageColorExtractor.js — Extractor de Colores Reales de Logotipos (HTML5 Canvas)
 * =============================================================================
 * Analiza los píxeles reales de cualquier imagen (PNG, JPG, SVG, WebP) mediante
 * un canvas offscreen.
 * 
 * Filtra fondos blancos, negros y transparentes, y detecta el color cromático
 * más vibrante y representativo (ej: verde Nvidia #76B900, azul Facebook #1877F2,
 * rojo UTA #D32F2F).
 * 
 * Construye la paleta minimalista oficial de 5 tokens (Sofisticación Sutil):
 *   - bg: Tono pastel ultra claro (96-98% luminosidad, nunca #FFFFFF)
 *   - surface: #FFFFFF
 *   - border: Tono neutro/pastel suave derivado del primario
 *   - primary: El color real más icónico del logo
 *   - text: Índigo oscuro o carbón profundo tintado (prohibido #000000)
 * =============================================================================
 */

/**
 * Convierte RGB a Hex
 */
export const rgbToHex = (r, g, b) => {
  const toHex = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
};

/**
 * Convierte Hex a RGB [r, g, b]
 */
export const hexToRgb = (hex, fallback = [82, 111, 125]) => {
  if (!hex || typeof hex !== 'string') return fallback;
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) clean = clean.split('').map((c) => c + c).join('');
  if (clean.length !== 6) return fallback;
  const num = parseInt(clean, 16);
  if (Number.isNaN(num)) return fallback;
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
};

/**
 * Oscurece o aclara un color HEX porcentualmente (-1 a 1)
 */
export const adjustBrightness = (hex, percent) => {
  const [r, g, b] = hexToRgb(hex);
  const adjust = (c) => {
    const val = percent > 0 ? c + (255 - c) * percent : c * (1 + percent);
    return Math.min(255, Math.max(0, Math.round(val))).toString(16).padStart(2, '0');
  };
  return `#${adjust(r)}${adjust(g)}${adjust(b)}`.toUpperCase();
};

/**
 * Calcula Saturación y Luminosidad de un píxel RGB
 */
const getHslMetrics = (r, g, b) => {
  const rf = r / 255;
  const gf = g / 255;
  const bf = b / 255;
  const max = Math.max(rf, gf, bf);
  const min = Math.min(rf, gf, bf);
  const delta = max - min;

  const l = (max + min) / 2;
  const s = max === 0 || delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  return { s, l, delta };
};

/**
 * Extrae los colores dominantes reales de una imagen a través de HTML5 Canvas
 * @param {string|File|Blob} imageSource - Data URL, URL de imagen o File/Blob
 * @returns {Promise<Object>} Paleta completa de 5 colores con tokens derivados
 */
export const extractPaletteFromImage = (imageSource) => {
  return new Promise((resolve, reject) => {
    if (!imageSource) {
      return reject(new Error('No se proporcionó imagen para extraer colores.'));
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';

    let objectUrl = null;
    if (typeof imageSource === 'object' && imageSource instanceof Blob) {
      objectUrl = URL.createObjectURL(imageSource);
      img.src = objectUrl;
    } else if (typeof imageSource === 'string') {
      img.src = imageSource;
    } else {
      return reject(new Error('Formato de imagen no soportado.'));
    }

    img.onload = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);

      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return reject(new Error('No se pudo inicializar el contexto 2D de canvas.'));

        // Redimensionar a una matriz de muestreo óptima (ej: 80x80 = 6400 píxeles)
        const size = 80;
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, 0, 0, size, size);

        const imgData = ctx.getImageData(0, 0, size, size);
        const data = imgData.data;

        // Buckets para agrupar colores similares (cuantización a 4 bits por canal = 16 niveles)
        const colorBuckets = new Map();
        let totalChromaticPixels = 0;
        let averageR = 0, averageG = 0, averageB = 0;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          // 1. Ignorar píxeles transparentes
          if (a < 60) continue;

          const { s, l } = getHslMetrics(r, g, b);

          // 2. Ignorar fondos blancos/casi blancos (L > 0.92) y fondos negros puros (L < 0.08)
          const isWhite = l > 0.90 || (r > 235 && g > 235 && b > 235);
          const isBlack = l < 0.09 || (r < 24 && g < 24 && b < 24);
          const isGray = s < 0.16;

          // Ponderar píxeles cromáticos (con color real)
          if (!isWhite && !isBlack && !isGray) {
            // Cuantizar canal a intervalos de 16
            const qR = Math.round(r / 16) * 16;
            const qG = Math.round(g / 16) * 16;
            const qB = Math.round(b / 16) * 16;
            const key = `${qR},${qG},${qB}`;

            // Puntuación: favorece colores saturados y vivos pero no ciegos
            const weight = 1 + (s * 3.5) + (l > 0.2 && l < 0.8 ? 1.5 : 0);

            if (colorBuckets.has(key)) {
              const current = colorBuckets.get(key);
              current.count += 1;
              current.weight += weight;
              current.totalR += r;
              current.totalG += g;
              current.totalB += b;
            } else {
              colorBuckets.set(key, {
                count: 1,
                weight,
                totalR: r,
                totalG: g,
                totalB: b,
              });
            }
            totalChromaticPixels++;
          } else if (!isWhite && !isBlack) {
            // Registrar para fallback si el logo es totalmente monocromático
            averageR += r;
            averageG += g;
            averageB += b;
          }
        }

        let primaryR = 82, primaryG = 111, primaryB = 125; // Default azul petróleo

        if (colorBuckets.size > 0) {
          // Seleccionar el bucket con mayor peso (el color cromático más representativo del logo)
          let bestBucket = null;
          let maxWeight = -1;

          for (const bucket of colorBuckets.values()) {
            if (bucket.weight > maxWeight) {
              maxWeight = bucket.weight;
              bestBucket = bucket;
            }
          }

          if (bestBucket && bestBucket.count > 0) {
            primaryR = Math.round(bestBucket.totalR / bestBucket.count);
            primaryG = Math.round(bestBucket.totalG / bestBucket.count);
            primaryB = Math.round(bestBucket.totalB / bestBucket.count);
          }
        } else {
          // Caso monocromático / blanco y negro (ej: Apple, Nike en negro)
          primaryR = 40;
          primaryG = 50;
          primaryB = 60;
        }

        const primaryHex = rgbToHex(primaryR, primaryG, primaryB);

        // 3. Generar tokens Sofisticación Sutil a partir del color real extraído
        // bg: Tono pastel ultra claro (96-98% luminosidad) tintado con el color del logo
        const bgR = Math.min(255, Math.round(247 + (primaryR * 0.03)));
        const bgG = Math.min(255, Math.round(247 + (primaryG * 0.03)));
        const bgB = Math.min(255, Math.round(247 + (primaryB * 0.03)));
        const bgHex = rgbToHex(bgR, bgG, bgB);

        // border: Tono neutro o apastelado suave
        const borderR = Math.min(255, Math.round(215 + (primaryR * 0.06)));
        const borderG = Math.min(255, Math.round(215 + (primaryG * 0.06)));
        const borderB = Math.min(255, Math.round(215 + (primaryB * 0.06)));
        const borderHex = rgbToHex(borderR, borderG, borderB);

        // text: Índigo oscuro o carbón profundo tintado (ESTRICTAMENTE PROHIBIDO #000000)
        const textR = Math.max(18, Math.min(42, Math.round(primaryR * 0.16)));
        const textG = Math.max(22, Math.min(48, Math.round(primaryG * 0.16)));
        const textB = Math.max(26, Math.min(54, Math.round(primaryB * 0.20)));
        const textHex = rgbToHex(textR, textG, textB);

        const primaryHover = adjustBrightness(primaryHex, -0.15);
        const primaryLight = adjustBrightness(primaryHex, 0.78);
        const textSecondary = adjustBrightness(textHex, 0.35);

        const rgbPrimary = [primaryR, primaryG, primaryB];
        const rgbBg = [bgR, bgG, bgB];
        const rgbBorder = [borderR, borderG, borderB];
        const rgbText = [textR, textG, textB];

        const paleta = {
          key: 'custom_ia',
          name: 'Paleta Generada por IA',
          category: 'Inteligencia Visual (Color Real del Logo)',
          desc: 'Paleta cromática extraída fielmente de la identidad visual del logotipo.',
          bg: bgHex,
          surface: '#FFFFFF',
          border: borderHex,
          primary: primaryHex,
          primaryHover,
          primaryLight,
          text: textHex,
          textSecondary,
          accent: primaryHex,
          inputBg: adjustBrightness(bgHex, 0.4),
          rgbPrimary,
          rgbBg,
          rgbBorder,
          rgbText,
        };

        resolve(paleta);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      reject(new Error('No se pudo cargar la imagen para extraer colores.'));
    };
  });
};

export default extractPaletteFromImage;

