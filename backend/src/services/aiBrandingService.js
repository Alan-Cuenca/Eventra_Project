import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import { decodePng } from '../utils/pngDecoder.js';
import {
  extractSwatches,
  normalizeSwatches,
  buildTheme,
  isValidHex,
  hexToRgb,
  adjustBrightness,
} from '../utils/paletteEngine.js';

/**
 * =============================================================================
 * SERVICIO: aiBrandingService.js
 * =============================================================================
 * Genera el tema de marca blanca a partir de la PALETA COMPLETA del logotipo.
 *
 * Arquitectura híbrida (la IA nunca inventa colores):
 *   1. Extracción determinista: el motor `paletteEngine` obtiene todos los
 *      colores reales del logo (k-means en OKLab) desde el PNG en el servidor
 *      o desde la paleta que ya calculó el navegador (Canvas).
 *   2. Dirección de arte con IA (opcional): Gemini / GPT-4o ven el logo y la
 *      lista de colores reales y SOLO deciden qué color cumple cada rol
 *      (primario, secundario, acento, texto). Cualquier HEX que no exista en
 *      el logo se descarta.
 *   3. Calibración: `buildTheme` ajusta contraste WCAG, evita neón y genera
 *      los tokens "Sofisticación Sutil".
 * Si la IA falla o no hay claves, el paso 2 se resuelve algorítmicamente.
 * =============================================================================
 */

export const SYSTEM_PROMPT = `Actúa como el diseñador definido en 'ai-branding-designer.md' (estilo "Sofisticación Sutil": light mode, minimalista, sin neón).
Recibirás un logotipo y la lista COMPLETA de colores reales detectados en él, con su porcentaje de presencia.
Tu tarea es decidir el rol de cada color dentro de la interfaz de un SaaS de gestión de eventos:
- primary: el color más icónico de la marca (botones, estados activos).
- secondary: el segundo color de marca que acompañe al primario (o null si el logo solo tiene uno).
- accent: un color para destacar precios, íconos y badges, distinto de los anteriores (o null).
- text: el color oscuro del logo que sirva de base para el texto (o null si no hay ninguno oscuro).
Reglas: usa EXCLUSIVAMENTE códigos HEX de la lista recibida, no inventes ni modifiques colores. No uses el blanco del fondo como primary.
Además propone "nombre" (máx. 4 palabras, en español) y "descripcion" (una frase) para el tema.
Responde solo un objeto JSON: {"primary":"#RRGGBB","secondary":"#RRGGBB"|null,"accent":"#RRGGBB"|null,"text":"#RRGGBB"|null,"nombre":"...","descripcion":"..."}`;

const SYSTEM_PROMPT_SIN_LISTA = `Actúa como el diseñador definido en 'ai-branding-designer.md'.
Enumera TODOS los colores distintos que aparecen en este logotipo (máximo 8, sin contar un fondo blanco o transparente), con su porcentaje aproximado de presencia, y asigna roles.
Responde solo un objeto JSON: {"colores":[{"hex":"#RRGGBB","porcentaje":40}],"primary":"#RRGGBB","secondary":"#RRGGBB"|null,"accent":"#RRGGBB"|null,"text":"#RRGGBB"|null,"nombre":"...","descripcion":"..."}`;

export { hexToRgb, adjustBrightness };

/**
 * Limpia y parsea la respuesta JSON proveniente de modelos de IA
 */
const parseJsonResponse = (rawText) => {
  if (!rawText) return null;
  const cleaned = rawText.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
};

const isRealKey = (key) => Boolean(key) && !key.includes('tu_clave') && !key.includes('placeholder');

const safeText = (value, max) =>
  typeof value === 'string' ? value.replace(/[<>]/g, '').trim().slice(0, max) || undefined : undefined;

/**
 * Llama a un modelo de visión (Gemini → OpenAI) y devuelve el JSON parseado o null.
 * Desacoplado: cualquier fallo del proveedor devuelve null sin propagar errores.
 */
const consultarVisionIA = async ({ systemPrompt, userText, base64Data, mime, dataUrl }) => {
  if (isRealKey(process.env.GEMINI_API_KEY)) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const contents = [
        {
          role: 'user',
          parts: [
            { text: `${systemPrompt}\n\n${userText}` },
            ...(base64Data ? [{ inlineData: { mimeType: mime, data: base64Data } }] : []),
          ],
        },
      ];
      for (const model of ['gemini-2.5-flash', 'gemini-flash-latest']) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents,
            config: {
              responseMimeType: 'application/json',
              temperature: 0.2,
              abortSignal: AbortSignal.timeout(12000),
            },
          });
          const parsed = parseJsonResponse((response?.text ?? '').trim());
          if (parsed) return parsed;
        } catch {
          // Probar el siguiente modelo
        }
      }
    } catch (err) {
      console.warn('[aiBrandingService] Gemini Vision falló:', err.message);
    }
  }

  if (isRealKey(process.env.OPENAI_API_KEY)) {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 15000 });
      const content = [{ type: 'text', text: userText }];
      if (dataUrl && dataUrl.startsWith('data:')) {
        content.push({ type: 'image_url', image_url: { url: dataUrl, detail: 'low' } });
      }
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
        max_tokens: 500,
      });
      const parsed = parseJsonResponse(completion.choices[0]?.message?.content);
      if (parsed) return parsed;
    } catch (err) {
      console.warn('[aiBrandingService] OpenAI Vision falló:', err.message);
    }
  }

  return null;
};

/**
 * Obtiene la paleta completa real del logo: primero del PNG en el servidor,
 * luego de la paleta calculada por el navegador.
 */
const obtenerSwatches = (buffer, clientPalette) => {
  if (Buffer.isBuffer(buffer)) {
    const img = decodePng(buffer, { maxSide: 128 });
    if (img) {
      const { swatches, background } = extractSwatches(img);
      if (swatches.length) return { swatches, background };
    }
  }
  const fromClient = normalizeSwatches(clientPalette?.logoColors);
  return { swatches: fromClient, background: null };
};

/**
 * Normaliza una paleta heredada (formato de 5 colores) garantizando todas las
 * claves que consume ThemeBrandingContext. Se usa para paletas antiguas o
 * cuando no hay ningún color del logo disponible.
 */
export const normalizarPaleta = (rawPaleta) => {
  const pick = (key) => (isValidHex(rawPaleta?.[key]) ? rawPaleta[key] : null);
  const primary = pick('primary');
  const seeds = [primary, pick('secondary'), pick('accent'), pick('text')].filter(Boolean);
  const tema = buildTheme(normalizeSwatches(seeds), {
    roles: { primary, secondary: pick('secondary'), accent: pick('accent'), text: pick('text') },
    source: rawPaleta?.source || 'algoritmo',
    name: safeText(rawPaleta?.name, 60),
    desc: safeText(rawPaleta?.desc, 200),
  });
  if (Array.isArray(rawPaleta?.logoColors)) {
    tema.logoColors = normalizeSwatches(rawPaleta.logoColors).map((s) => ({
      hex: s.hex,
      population: Math.round(s.population * 1000) / 1000,
      role: ['primary', 'secondary', 'accent', 'text'].find((r) => rawPaleta[r] === s.hex) || null,
    }));
  }
  return tema;
};

/**
 * Fallback determinista sin IA (garantía de cero caídas).
 */
export const generarPaletaFallback = (imageBuffer, clientPalette = null) => {
  const { swatches, background } = obtenerSwatches(imageBuffer, clientPalette);
  if (swatches.length) return buildTheme(swatches, { background });
  if (clientPalette && isValidHex(clientPalette.primary)) return normalizarPaleta(clientPalette);
  return buildTheme([]);
};

/**
 * Analiza un logotipo y devuelve el tema completo.
 *
 * @param {Object} params
 * @param {Buffer} [params.buffer] - Imagen subida
 * @param {string} [params.mimetype]
 * @param {string} [params.dataUrl] - Imagen como Data URL (base64) o URL pública
 * @param {Object} [params.clientPalette] - Tema calculado por el navegador (incluye logoColors)
 */
export const analizarLogotipoConIA = async ({ buffer, mimetype = 'image/png', dataUrl, clientPalette }) => {
  let base64Data = '';
  let mime = mimetype;
  let fullDataUrl = '';

  if (buffer) {
    base64Data = buffer.toString('base64');
    fullDataUrl = `data:${mimetype};base64,${base64Data}`;
  } else if (typeof dataUrl === 'string' && dataUrl.startsWith('data:') && dataUrl.includes(';base64,')) {
    const [head, data] = dataUrl.split(';base64,');
    mime = head.replace('data:', '') || 'image/png';
    base64Data = data;
    fullDataUrl = dataUrl;
  }
  const effectiveBuffer = buffer || (base64Data ? Buffer.from(base64Data, 'base64') : null);

  // 1. Paleta completa real del logo
  const { swatches, background } = obtenerSwatches(effectiveBuffer, clientPalette);

  // 2. Dirección de arte con IA (solo asigna roles sobre colores reales)
  if (swatches.length) {
    const lista = swatches.map((s) => `${s.hex} (${Math.round(s.population * 100)}%)`).join(', ');
    const ia = await consultarVisionIA({
      systemPrompt: SYSTEM_PROMPT,
      userText: `Colores reales detectados en el logotipo: ${lista}. Asigna los roles en JSON.`,
      base64Data,
      mime,
      dataUrl: fullDataUrl,
    });
    if (ia && isValidHex(ia.primary)) {
      return buildTheme(swatches, {
        background,
        roles: ia,
        source: 'ia',
        name: safeText(ia.nombre, 60),
        desc: safeText(ia.descripcion, 200),
      });
    }
    return buildTheme(swatches, { background });
  }

  // Sin colores calculables (ej. JPG/SVG sin paleta del navegador): la IA enumera los colores
  if (base64Data) {
    const ia = await consultarVisionIA({
      systemPrompt: SYSTEM_PROMPT_SIN_LISTA,
      userText: 'Analiza este logotipo y responde el JSON solicitado.',
      base64Data,
      mime,
      dataUrl: fullDataUrl,
    });
    const colores = Array.isArray(ia?.colores)
      ? ia.colores.map((c) => ({ hex: c?.hex, population: Number(c?.porcentaje) / 100 }))
      : [];
    const iaSwatches = normalizeSwatches(colores);
    if (iaSwatches.length) {
      return buildTheme(iaSwatches, {
        roles: ia,
        source: 'ia',
        name: safeText(ia.nombre, 60),
        desc: safeText(ia.descripcion, 200),
      });
    }
  }

  // 3. Respaldo determinista
  console.log('[aiBrandingService] Empleando motor de análisis cromático real para extracción del logo.');
  return generarPaletaFallback(effectiveBuffer, clientPalette);
};

export default {
  analizarLogotipoConIA,
  normalizarPaleta,
  generarPaletaFallback,
};
