/**
 * =============================================================================
 * imageColorExtractor.js — Extractor de la Paleta Completa del Logotipo (Canvas)
 * =============================================================================
 * Lee los píxeles reales de cualquier imagen que el navegador pueda dibujar
 * (PNG, JPG, SVG, WebP) mediante un canvas offscreen y delega en
 * `paletteEngine` para:
 *   - Detectar y descartar el fondo sólido (blanco, negro o gris).
 *   - Extraer TODOS los colores del logo (k-means en OKLab) con su presencia.
 *   - Asignar roles (primario, secundario, acento, texto) y calibrar el tema
 *     "Sofisticación Sutil" con contraste WCAG.
 *
 * El resultado incluye `logoColors`, que el backend reutiliza para que la IA
 * asigne roles sin inventar colores.
 * =============================================================================
 */

import { themeFromPixels, rgbToHex, hexToRgb, adjustBrightness } from './paletteEngine';

export { rgbToHex, hexToRgb, adjustBrightness };

const MAX_SIDE = 128;

/**
 * Extrae la paleta completa del logotipo y construye el tema.
 * @param {string|File|Blob} imageSource - Data URL, URL de imagen o File/Blob
 * @returns {Promise<Object>} Tema completo (bg, surface, border, primary, secondary, accent, text, logoColors, …)
 */
export const extractPaletteFromImage = (imageSource) =>
  new Promise((resolve, reject) => {
    if (!imageSource) {
      reject(new Error('No se proporcionó imagen para extraer colores.'));
      return;
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';

    let objectUrl = null;
    if (imageSource instanceof Blob) {
      objectUrl = URL.createObjectURL(imageSource);
      img.src = objectUrl;
    } else if (typeof imageSource === 'string') {
      img.src = imageSource;
    } else {
      reject(new Error('Formato de imagen no soportado.'));
      return;
    }

    const cleanup = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };

    img.onload = () => {
      cleanup();
      try {
        // Conservar la proporción del logo (los bordes sirven para detectar el fondo)
        const naturalW = img.naturalWidth || MAX_SIDE;
        const naturalH = img.naturalHeight || MAX_SIDE;
        const scale = Math.min(1, MAX_SIDE / Math.max(naturalW, naturalH));
        const width = Math.max(1, Math.round(naturalW * scale));
        const height = Math.max(1, Math.round(naturalH * scale));

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          reject(new Error('No se pudo inicializar el contexto 2D de canvas.'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const { data } = ctx.getImageData(0, 0, width, height);

        resolve(themeFromPixels({ data, width, height }));
      } catch (err) {
        // getImageData falla si la imagen remota no permite CORS
        reject(err);
      }
    };

    img.onerror = () => {
      cleanup();
      reject(new Error('No se pudo cargar la imagen para extraer colores.'));
    };
  });

export default extractPaletteFromImage;
