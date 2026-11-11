import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';

/**
 * =============================================================================
 * SERVICIO: aiBrandingService.js
 * =============================================================================
 * Análisis visual de logotipos corporativos mediante Google Gemini (Vision)
 * basado en las directrices maestras de diseño de 'ai-branding-designer.md'.
 * 
 * Genera una paleta de 5 colores esenciales (bg, surface, border, primary, text)
 * respetando el estándar de "Sofisticación Sutil" (fusión Helados La Catedral &
 * Eventos Imperial).
 * =============================================================================
 */

export const SYSTEM_PROMPT = `Actúa como el diseñador definido en 'ai-branding-designer.md'. Analiza los colores de este logotipo y genera un JSON estricto con 5 claves (bg, surface, border, primary, text). El 'primary' debe ser el acento del logo sin ser neón; el 'bg' un derivado muy claro/pastel; y el 'text' oscuro legible. Respeta la armonía visual.

Reglas críticas de diseño:
- bg: Tonos perla, marfil o crema ultra claros y desaturados derivados del logo (nunca blanco puro #FFFFFF).
- surface: Siempre #FFFFFF.
- border: Tono neutro o apastelado muy suave derivado del logo.
- primary: El color más icónico del logo, calibrado para no ser neón ni saturado en exceso.
- text: Tono índigo oscuro o gris carbón profundo con tinte del logo (ESTRICTAMENTE PROHIBIDO #000000).`;

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
 * garantizando cero caídas ante fallos de red o cuota en APIs externas.
 */
export const generarPaletaFallback = (imageBuffer) => {
  let seedR = 140, seedG = 74, seedB = 50; // Terracota cálido por defecto

  if (Buffer.isBuffer(imageBuffer) && imageBuffer.length > 64) {
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

  // Primario representativo no neón
  const primaryHex = `#${seedR.toString(16).padStart(2, '0')}${seedG.toString(16).padStart(2, '0')}${seedB.toString(16).padStart(2, '0')}`.toUpperCase();

  // Fondo pastel ultra claro (95-98% luminosidad, nunca #FFFFFF)
  const bgR = Math.min(255, Math.round(245 + (seedR * 0.04)));
  const bgG = Math.min(255, Math.round(242 + (seedG * 0.04)));
  const bgB = Math.min(255, Math.round(236 + (seedB * 0.04)));
  const bgHex = `#${bgR.toString(16).padStart(2, '0')}${bgG.toString(16).padStart(2, '0')}${bgB.toString(16).padStart(2, '0')}`.toUpperCase();

  // Borde muy suave
  const borderR = Math.min(255, Math.round(208 + (seedR * 0.06)));
  const borderG = Math.min(255, Math.round(202 + (seedG * 0.06)));
  const borderB = Math.min(255, Math.round(192 + (seedB * 0.06)));
  const borderHex = `#${borderR.toString(16).padStart(2, '0')}${borderG.toString(16).padStart(2, '0')}${borderB.toString(16).padStart(2, '0')}`.toUpperCase();

  // Texto índigo/carbón tintado (prohibido #000000)
  const textR = Math.max(20, Math.min(45, Math.round(seedR * 0.18)));
  const textG = Math.max(20, Math.min(45, Math.round(seedR * 0.18)));
  const textB = Math.max(28, Math.min(55, Math.round(seedB * 0.22)));
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
  // Asegurar que bg no sea blanco puro #FFFFFF
  let bg = isValidHex(rawPaleta?.bg) ? rawPaleta.bg.toUpperCase() : '#F5F2EB';
  if (bg === '#FFFFFF' || bg === '#FFF') {
    bg = '#F6F3EC';
  }

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
    desc: 'Paleta armónica extraída dinámicamente de la identidad gráfica del logotipo con Google Gemini.',
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
 * Analiza un logotipo (Buffer o Data URL) utilizando Google Gemini Vision
 * (@google/genai con gemini-1.5-flash / gemini-2.5-flash).
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

  // ── 1. Inferencia Principal: Google Gemini Vision (@google/genai) ─────────
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey && !geminiKey.includes('tu_clave') && !geminiKey.includes('placeholder')) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const promptText = `Actúa como el diseñador definido en 'ai-branding-designer.md'. Analiza los colores de este logotipo y genera un JSON estricto con 5 claves (bg, surface, border, primary, text). El 'primary' debe ser el acento del logo sin ser neón; el 'bg' un derivado muy claro/pastel; y el 'text' oscuro legible. Respeta la armonía visual. Responde estrictamente un objeto JSON con las 5 claves.`;

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

      // Probar prioritariamente gemini-1.5-flash o gemini-2.5-flash
      const visionModels = ['gemini-1.5-flash', 'gemini-2.5-flash', 'gemini-flash-latest'];
      for (const model of visionModels) {
        try {
          const response = await ai.models.generateContent({
            model,
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
        } catch (mErr) {
          // Continuar al siguiente modelo de visión si este falló
        }
      }
    } catch (err) {
      console.warn('[aiBrandingService] Gemini Vision falló:', err.message);
    }
  }

  // ── 2. Inferencia Secundaria de Respaldo: OpenAI GPT-4o Vision ───────────
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
      console.warn('[aiBrandingService] OpenAI Vision falló:', err.message);
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
