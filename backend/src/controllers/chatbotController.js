import OpenAI from 'openai';
import pool from '../config/db.js';

// ─── Inicialización del cliente OpenAI ───────────────────────────────────────
// La API Key se lee de la variable de entorno OPENAI_API_KEY.
// Si no está definida, el SDK lanza un error descriptivo al importar.
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Consulta al asistente de IA de EVENTRA con contexto dinámico del catálogo.
 *
 * Flujo de Ingeniería de Prompts:
 *   1. Recibe el mensaje del usuario (req.body.mensaje).
 *   2. Consulta en tiempo real el catálogo de paquetes y servicios
 *      de la empresa autenticada (aislamiento SaaS por empresa_id).
 *   3. Construye un System Prompt dinámico que incluye ese catálogo.
 *   4. Llama a la API de OpenAI con el modelo gpt-4o-mini.
 *   5. Devuelve la respuesta generada al cliente.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
export const consultarAsistente = async (req, res) => {
  const empresa_id = req.user.empresa_id;
  const { mensaje } = req.body;

  // --- Validar que el mensaje no esté vacío ---
  if (!mensaje || String(mensaje).trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'El campo mensaje es obligatorio y no puede estar vacío.',
    });
  }

  // --- Validar que la API Key de OpenAI esté configurada ---
  if (!process.env.OPENAI_API_KEY) {
    console.error('[chatbotController] OPENAI_API_KEY no está definida en las variables de entorno.');
    return res.status(503).json({
      success: false,
      message: 'El servicio de IA no está disponible en este momento. Contacta al administrador.',
    });
  }

  try {
    // ─── Paso 1: Obtener catálogo real de la empresa (SaaS) ─────────────────
    // Se ejecutan en paralelo para minimizar la latencia antes de llamar a OpenAI
    const [paquetesResult, serviciosResult] = await Promise.all([

      pool.query(
        `SELECT
           p.nombre,
           p.descripcion,
           p.precio_total,
           COALESCE(
             string_agg(s.nombre, ', ' ORDER BY s.nombre),
             'Sin servicios asignados'
           ) AS servicios_incluidos
         FROM paquetes p
         LEFT JOIN paquete_servicios ps ON p.id = ps.paquete_id
         LEFT JOIN servicios s          ON ps.servicio_id = s.id
         WHERE p.empresa_id   = $1
           AND p.estado_activo = true
         GROUP BY p.id, p.nombre, p.descripcion, p.precio_total
         ORDER BY p.precio_total ASC`,
        [empresa_id]
      ),

      pool.query(
        `SELECT nombre, descripcion, precio_base
         FROM servicios
         WHERE empresa_id   = $1
           AND estado_activo = true
         ORDER BY nombre ASC`,
        [empresa_id]
      ),

    ]);

    // ─── Paso 2: Serializar el catálogo para el System Prompt ────────────────
    const catalogoPaquetes = paquetesResult.rows.length > 0
      ? paquetesResult.rows
          .map(p =>
            `• Paquete: "${p.nombre}" | Precio: $${Number(p.precio_total).toFixed(2)} | ` +
            `Descripción: ${p.descripcion || 'Sin descripción'} | ` +
            `Servicios incluidos: ${p.servicios_incluidos}`
          )
          .join('\n')
      : 'No hay paquetes disponibles en este momento.';

    const catalogoServicios = serviciosResult.rows.length > 0
      ? serviciosResult.rows
          .map(s =>
            `• Servicio: "${s.nombre}" | Precio base: $${Number(s.precio_base).toFixed(2)} | ` +
            `Descripción: ${s.descripcion || 'Sin descripción'}`
          )
          .join('\n')
      : 'No hay servicios individuales disponibles.';

    // ─── Paso 3: Construir el System Prompt dinámico ─────────────────────────
    const systemPrompt = `Eres EVARA, el asistente de ventas experto de EVENTRA, una plataforma de gestión de eventos.
Tu objetivo es ayudar al cliente a elegir el paquete o servicio ideal para su evento de forma amable, persuasiva y concisa.

INSTRUCCIONES DE COMPORTAMIENTO:
- Responde siempre en español, con un tono profesional pero cercano.
- Basa tus respuestas ÚNICAMENTE en el catálogo real que se te proporciona a continuación.
- Si el cliente pregunta por algo que no está en el catálogo, indícalo amablemente y sugiere las alternativas más cercanas.
- No inventes precios ni servicios que no aparezcan en el catálogo.
- Sé conciso: respuestas de máximo 3-4 párrafos.
- Si el cliente parece interesado, invítalo a solicitar una cotización formal.

CATÁLOGO ACTUAL DE PAQUETES:
${catalogoPaquetes}

SERVICIOS INDIVIDUALES DISPONIBLES:
${catalogoServicios}`;

    // ─── Paso 4: Llamada a la API de OpenAI ──────────────────────────────────
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',        // Modelo económico y capaz, ideal para chatbots
      temperature: 0.7,            // Respuestas creativas pero coherentes
      max_tokens: 500,             // Limita el costo y mantiene respuestas concisas
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: String(mensaje).trim(),
        },
      ],
    });

    // ─── Paso 5: Extraer y retornar la respuesta de la IA ───────────────────
    const respuestaIA = completion.choices[0]?.message?.content ?? 'No se pudo generar una respuesta.';

    return res.status(200).json({
      success: true,
      data: {
        respuesta:      respuestaIA,
        modelo_usado:   completion.model,
        tokens_usados:  completion.usage?.total_tokens ?? 0,
      },
    });

  } catch (error) {
    // Error específico de la API de OpenAI (cuota, autenticación, etc.)
    if (error?.status === 401) {
      console.error('[chatbotController] API Key de OpenAI inválida o sin permisos.');
      return res.status(503).json({
        success: false,
        message: 'Error de autenticación con el servicio de IA. Verifica la configuración.',
      });
    }

    if (error?.status === 429) {
      console.error('[chatbotController] Límite de cuota de OpenAI alcanzado.');
      return res.status(429).json({
        success: false,
        message: 'El asistente de IA ha alcanzado su límite de uso. Intenta más tarde.',
      });
    }

    console.error('[chatbotController] Error en consultarAsistente:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno al procesar tu consulta con el asistente de IA.',
    });
  }
};
