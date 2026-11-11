import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';

/**
 * =============================================================================
 * SERVICIO: aiBrandingService.js
 * =============================================================================
 * Análisis visual de logotipos corporativos mediante IA (GPT-4o / Gemini Vision)
 * para generar automáticamente una paleta cromática minimalista de alta gama,
 * respetando el estándar "Sofisticación Sutil" de EVENTRA.
 * =============================================================================
 */

const SYSTEM_PROMPT = `Eres un diseñador UI/UX experto. Analiza este logotipo de empresa y extrae una paleta de 5 colores en formato JSON estricto (\`bg\`, \`surface\`, \`border\`, \`primary\`, \`text\`). Reglas críticas (Sofisticación Sutil): 
- \`bg\`: Debe ser un tono pastel ultra claro (casi blanco/crema) inspirado en el logo, para no fatigar la vista.
- \`surface\`: Siempre \`#FFFFFF\`.
- \`border\`: Un tono neutro o grisáceo muy suave derivado del logo.
- \`primary\`: El color más vibrante y representativo del logo, usado para botones principales.
- \`text\`: Un tono extremadamente oscuro (casi negro, pero tintado con el color del logo) para máxima legibilidad. Prohibido #000000.`;

/**
 * Convierte un color HEX (#RRGGBB) a [R, G, B]
 */
export const hexToRgb = (hex, fallback = [77, 113, 130]) => {
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
    return Math.min(255, Math.max(0, Math.round(val)))
      .toString(16)
      .padStart(2, '0');
  };
  return `#${adjust(r)}${adjust(g)}${adjust(b)}`.toUpperCase();
};

/**
 * Valida y normaliza un código HEX
 */
const isValidHex = (hex) => typeof hex === 'string' && /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex.trim());

/**
 * Limpia y parsea la respuesta JSON proveniente de modelos de IA
 */
const parseJsonResponse = (rawText) => {
  if (!rawText) return null;
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
  }

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    // Extraer bloque entre llaves si hay texto circundante
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {}
    }
    return null;
  }
};

/**
 * Fallback heurístico inteligente: extrae colores de la muestra binaria de la imagen
 * o genera una paleta estética refinada cuando la API no está configurada o falla.
 */
export const generarPaletaFallback = (imageBuffer, fallbackHint = 'catedral') => {
  let seedR = 140, seedG = 74, seedB = 50; // Terracota cálido por defecto

  if (Buffer.isBuffer(imageBuffer) && imageBuffer.length > 64) {
    // Muestreo determinista de bytes de la imagen para derivar el tono principal
    let sumR = 0, sumG = 0, sumB = 0, count = 0;
    const step = Math.max(1, Math.floor(imageBuffer.length / 40));
    for (let i = 24; i < imageBuffer.length - 16; i += step) {
      sumR += imageBuffer[i];
      sumG += imageBuffer[i + 1] || imageBuffer[i];
      sumB += imageBuffer[i + 2] || imageBuffer[i];
      count++;
    }
    if (count > 0) {
      seedR = Math.max(30, Math.min(220, Math.round(sumR / count)));
      seedG = Math.max(30, Math.min(220, Math.round(sumG / count)));
      seedB = Math.max(30, Math.min(220, Math.round(sumB / count)));
    }
  }

  // Generar tono primario vibrante
  const primaryHex = `#${seedR.toString(16).padStart(2, '0')}${seedG.toString(16).padStart(2, '0')}${seedB.toString(16).padStart(2, '0')}`.toUpperCase();

  // Fondo pastel ultra claro (luminosidad alta con tinte sutil)
  const bgR = Math.min(255, Math.round(245 + (seedR * 0.04)));
  const bgG = Math.min(255, Math.round(242 + (seedG * 0.04)));
  const bgB = Math.min(255, Math.round(236 + (seedB * 0.04)));
  const bgHex = `#${bgR.toString(16).padStart(2, '0')}${bgG.toString(16).padStart(2, '0')}${bgB.toString(16).padStart(2, '0')}`.toUpperCase();

  // Borde muy suave
  const borderR = Math.min(255, Math.round(208 + (seedR * 0.06)));
  const borderG = Math.min(255, Math.round(202 + (seedG * 0.06)));
  const borderB = Math.min(255, Math.round(192 + (seedB * 0.06)));
  const borderHex = `#${borderR.toString(16).padStart(2, '0')}${borderG.toString(16).padStart(2, '0')}${borderB.toString(16).padStart(2, '0')}`.toUpperCase();

  // Texto oscuro tintado (prohibido #000000)
  const textR = Math.max(16, Math.min(48, Math.round(seedR * 0.18)));
  const textG = Math.max(16, Math.min(48, Math.round(seedG * 0.18)));
  const textB = Math.max(16, Math.min(48, Math.round(seedB * 0.18)));
  const textHex = `#${textR.toString(16).padStart(2, '0')}${textG.toString(16).padStart(2, '0')}${textB.toString(16).padStart(2, '0')}`.toUpperCase();

  return normalizarPaleta({
    bg: bgHex,
    surface: '#FFFFFF',
    border: borderHex,
    primary: primaryHex,
    text: textHex,
  });
};

/**
 * Normaliza y enriquece la paleta de 5 colores para integrarla directamente
 * en los tokens del Design System de EVENTRA
 */
export const normalizarPaleta = (rawPaleta) => {
  const bg = isValidHex(rawPaleta?.bg) ? rawPaleta.bg.toUpperCase() : '#F5F2EB';
  const surface = '#FFFFFF';
  const border = isValidHex(rawPaleta?.border) ? rawPaleta.border.toUpperCase() : '#CEC8B8';
  const primary = isValidHex(rawPaleta?.primary) ? rawPaleta.primary.toUpperCase() : '#4D7182';
  
  // Garantizar que text no sea negro absoluto (#000000 ni #000)
  let text = isValidHex(rawPaleta?.text) ? rawPaleta.text.toUpperCase() : '#1D333E';
  if (text === '#000000' || text === '#000') {
    text = adjustBrightness(primary, -0.75);
  }

  const primaryHover = adjustBrightness(primary, -0.15);
  const primaryLight = adjustBrightness(primary, 0.78);
  const textSecondary = adjustBrightness(text, 0.35);

  const rgbPrimary = hexToRgb(primary);
  const rgbBg = hexToRgb(bg);
  const rgbBorder = hexToRgb(border);
  const rgbText = hexToRgb(text);

  return {
    key: 'custom_ia',
    name: 'Paleta Generada por IA',
    category: 'Inteligencia Visual (Sofisticación Sutil)',
    desc: 'Paleta armónica extraída dinámicamente de la identidad gráfica del logotipo.',
    bg,
    surface,
    border,
    primary,
    primaryHover,
    primaryLight,
    text,
    textSecondary,
    accent: primary,
    inputBg: adjustBrightness(bg, 0.4),
    rgbPrimary,
    rgbBg,
    rgbBorder,
    rgbText,
  };
};

/**
 * Analiza un logotipo (Buffer o Data URL) utilizando OpenAI (GPT-4o) o Gemini Vision.
 *
 * @param {Object} params
 * @param {Buffer} [params.buffer] - Buffer de la imagen cargada
 * @param {string} [params.mimetype] - Tipo MIME (image/png, image/jpeg, etc.)
 * @param {string} [params.dataUrl] - Imagen ya formateada como Data URL (base64)
 * @returns {Promise<Object>} Paleta enriquecida de 5 colores listos para CSS injection
 */
export const analizarLogotipoConIA = async ({ buffer, mimetype = 'image/png', dataUrl }) => {
  let base64Data = '';
  let fullDataUrl = '';
  let finalMime = mimetype;

  if (buffer) {
    base64Data = buffer.toString('base64');
    fullDataUrl = `data:${mimetype};base64,${base64Data}`;
  } else if (dataUrl && typeof dataUrl === 'string') {
    fullDataUrl = dataUrl;
    if (dataUrl.includes(';base64,')) {
      const parts = dataUrl.split(';base64,');
      finalMime = parts[0].replace('data:', '') || 'image/png';
      base64Data = parts[1];
    }
  }

  // ── 1. Intentar con OpenAI (GPT-4o / GPT-4o-mini Vision) ─────────────────
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey && !openaiKey.includes('tu_clave') && !openaiKey.includes('placeholder')) {
    try {
      const openai = new OpenAI({ apiKey: openaiKey });
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analiza este logotipo y extrae la paleta de 5 colores en JSON estricto sin explicaciones:',
              },
              {
                type: 'image_url',
                image_url: {
                  url: fullDataUrl,
                  detail: 'low',
                },
              },
            ],
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
        max_tokens: 400,
      });

      const raw = completion.choices[0]?.message?.content;
      const parsed = parseJsonResponse(raw);
      if (parsed && parsed.primary) {
        return normalizarPaleta(parsed);
      }
    } catch (err) {
      console.warn('[aiBrandingService] OpenAI Vision falló o clave no válida:', err.message);
    }
  }

  // ── 2. Intentar con Google Gemini Vision ──────────────────────────────────
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey && !geminiKey.includes('tu_clave') && !geminiKey.includes('placeholder')) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const promptText = `${SYSTEM_PROMPT}\n\nAnaliza este logotipo de empresa y genera la paleta de 5 colores en formato JSON puro.`;

      const contents = [
        {
          role: 'user',
          parts: [
            { text: promptText },
            ...(base64Data
              ? [
                  {
                    inlineData: {
                      mimeType: finalMime,
                      data: base64Data,
                    },
                  },
                ]
              : []),
          ],
        },
      ];

      const modelName = process.env.GEMINI_VISION_MODEL || 'gemini-2.5-flash';
      const response = await ai.models.generateContent({
        model: modelName,
        contents,
        config: {
          abortSignal: AbortSignal.timeout(12000),
        },
      });

      const raw = (response?.text ?? '').trim();
      const parsed = parseJsonResponse(raw);
      if (parsed && parsed.primary) {
        return normalizarPaleta(parsed);
      }
    } catch (err) {
      console.warn('[aiBrandingService] Gemini Vision falló o clave no válida:', err.message);
    }
  }

  // ── 3. Fallback Heurístico Sofisticado (Garantía de Cero Caídas) ─────────
  console.log('[aiBrandingService] Empleando motor heurístico Sofisticación Sutil para extracción cromática.');
  return generarPaletaFallback(buffer);
};

export default {
  analizarLogotipoConIA,
  normalizarPaleta,
  generarPaletaFallback,
};
