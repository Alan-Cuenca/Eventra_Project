import OpenAI from 'openai';
import pool from '../config/db.js';

// ─── Inicialización del cliente OpenAI ───────────────────────────────────────
// La API Key se lee de la variable de entorno OPENAI_API_KEY.
const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'tu_clave_aqui') {
    return null;
  }
  return new OpenAI({ apiKey });
};

/**
 * Consulta a EVARA AI, asistente de ventas conversacional multi-tenant de EVENTRA.
 *
 * Flujo:
 *   1. Extrae el mensaje de req.body y empresa_id (de req.user.empresa_id o slug/body).
 *   2. Consulta SQL en tiempo real del catálogo de paquetes y servicios de la empresa.
 *   3. Construye el System Prompt dinámico estricto sin alucinaciones de precios.
 *   4. Ejecuta la inferencia mediante el SDK de OpenAI (gpt-4o-mini).
 *   5. Retorna la respuesta generada con status 200.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
export const consultarEvara = async (req, res) => {
  const { mensaje, slug } = req.body;

  // 1. Validar que el mensaje exista
  if (!mensaje || String(mensaje).trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'El campo mensaje es obligatorio y no puede estar vacío.',
    });
  }

  try {
    // 2. Extraer y blindar empresa_id (Anti-IDOR / Multi-tenant)
    let empresa_id = req.user?.empresa_id;

    // Si no proviene de usuario autenticado (ej. visitante en landing pública del inquilino)
    if (!empresa_id && slug) {
      const empSlugRes = await pool.query(
        'SELECT id FROM empresas WHERE slug = $1 AND estado_activo = true',
        [slug]
      );
      if (empSlugRes.rowCount > 0) {
        empresa_id = empSlugRes.rows[0].id;
      }
    }

    if (!empresa_id && req.body.empresa_id) {
      const empIdRes = await pool.query(
        'SELECT id FROM empresas WHERE id = $1 AND estado_activo = true',
        [req.body.empresa_id]
      );
      if (empIdRes.rowCount > 0) {
        empresa_id = empIdRes.rows[0].id;
      }
    }

    // Si aún no se determinó la empresa, obtener la primera empresa activa por defecto
    if (!empresa_id) {
      const defaultEmpRes = await pool.query(
        'SELECT id FROM empresas WHERE estado_activo = true ORDER BY id ASC LIMIT 1'
      );
      if (defaultEmpRes.rowCount > 0) {
        empresa_id = defaultEmpRes.rows[0].id;
      }
    }

    if (!empresa_id) {
      return res.status(404).json({
        success: false,
        message: 'No se pudo identificar una empresa activa para consultar el catálogo de EVARA.',
      });
    }

    // 3. Contexto Dinámico (CRÍTICO): Consulta SQL a paquetes y servicios de esta empresa
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
         WHERE p.empresa_id    = $1
           AND p.estado_activo = true
         GROUP BY p.id, p.nombre, p.descripcion, p.precio_total
         ORDER BY p.precio_total ASC`,
        [empresa_id]
      ),

      pool.query(
        `SELECT nombre, descripcion, precio_base
         FROM servicios
         WHERE empresa_id    = $1
           AND estado_activo = true
         ORDER BY nombre ASC`,
        [empresa_id]
      ),
    ]);

    // Serializar resultados SQL para el prompt
    const catalogoPaquetes = paquetesResult.rows.length > 0
      ? paquetesResult.rows
          .map(
            (p) =>
              `• Paquete: "${p.nombre}" | Precio: $${Number(p.precio_total).toFixed(2)} | ` +
              `Descripción: ${p.descripcion || 'Sin descripción'} | Servicios: ${p.servicios_incluidos}`
          )
          .join('\n')
      : 'No hay paquetes registrados en este momento.';

    const catalogoServicios = serviciosResult.rows.length > 0
      ? serviciosResult.rows
          .map(
            (s) =>
              `• Servicio: "${s.nombre}" | Precio: $${Number(s.precio_base).toFixed(2)} | ` +
              `Descripción: ${s.descripcion || 'Sin descripción'}`
          )
          .join('\n')
      : 'No hay servicios individuales registrados.';

    // 4. System Prompt Estricto
    const systemPrompt = `Eres EVARA, el asistente de ventas experto de esta empresa. Tu objetivo es orientar al cliente basándote ÚNICAMENTE en este catálogo:
[CATÁLOGO DE PAQUETES]:
${catalogoPaquetes}

[SERVICIOS DISPONIBLES]:
${catalogoServicios}

No inventes precios ni servicios. Sé persuasivo, amable y conciso.`;

    // 5. Inferencia con OpenAI
    let respuestaIA = '';
    let modeloUsado = 'gpt-4o-mini';
    let tokensUsados = 0;

    const openai = getOpenAIClient();

    if (openai) {
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          temperature: 0.7,
          max_tokens: 500,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: String(mensaje).trim() },
          ],
        });

        respuestaIA = completion.choices[0]?.message?.content ?? '';
        modeloUsado = completion.model;
        tokensUsados = completion.usage?.total_tokens ?? 0;
      } catch (aiErr) {
        console.warn('[chatbotController] Error en API OpenAI, activando respuesta contextual:', aiErr.message);
        respuestaIA = generarRespuestaContextual(mensaje, paquetesResult.rows, serviciosResult.rows);
      }
    } else {
      // Modo seguro contextual cuando la API Key no esté configurada en local
      respuestaIA = generarRespuestaContextual(mensaje, paquetesResult.rows, serviciosResult.rows);
    }

    return res.status(200).json({
      success: true,
      respuesta: respuestaIA,
      data: {
        respuesta:     respuestaIA,
        modelo_usado:  modeloUsado,
        tokens_usados: tokensUsados,
        empresa_id:    empresa_id,
      },
    });

  } catch (error) {
    console.error('[chatbotController] Error en consultarEvara:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al procesar la consulta con EVARA.',
    });
  }
};

/**
 * Generador de respuesta inteligente basado estrictamente en el catálogo SQL real
 * cuando la clave de OpenAI no está configurada o se encuentra en modo offline/test.
 */
function generarRespuestaContextual(mensaje, paquetes, servicios) {
  const msgLower = mensaje.toLowerCase();

  if (paquetes.length === 0 && servicios.length === 0) {
    return '¡Hola! Soy EVARA, asistente de ventas de la empresa. Actualmente nuestro equipo está actualizando el catálogo de servicios. ¿Deseas solicitar una cotización personalizada?';
  }

  // Si pregunta por paquetes o bodas o precios
  if (msgLower.includes('paquete') || msgLower.includes('precio') || msgLower.includes('costo') || msgLower.includes('boda') || msgLower.includes('evento')) {
    if (paquetes.length > 0) {
      const lista = paquetes
        .slice(0, 3)
        .map(p => `"${p.nombre}" ($${Number(p.precio_total).toFixed(2)}) con ${p.servicios_incluidos}`)
        .join('; ');
      return `¡Hola! Soy EVARA, el asistente de ventas experto de esta empresa. Basado en nuestro catálogo oficial, disponemos de los siguientes paquetes: ${lista}. ¿Te gustaría que preparemos una cotización formal para tu fecha?`;
    }
  }

  // Si pregunta por servicios
  if (msgLower.includes('servicio') || msgLower.includes('catering') || msgLower.includes('musica') || msgLower.includes('fotograf')) {
    if (servicios.length > 0) {
      const listaS = servicios
        .slice(0, 4)
        .map(s => `${s.nombre} ($${Number(s.precio_base).toFixed(2)})`)
        .join(', ');
      return `¡Hola! Con mucho gusto. En nuestro catálogo actual ofrecemos: ${listaS}. Todos nuestros servicios pueden ser personalizados según tus necesidades.`;
    }
  }

  // Respuesta general orientativa con el catálogo real
  const primerPaquete = paquetes[0];
  const nombrePaquete = primerPaquete ? `nuestro paquete "${primerPaquete.nombre}" ($${Number(primerPaquete.precio_total).toFixed(2)})` : 'nuestros servicios integrales';
  return `¡Hola! Soy EVARA, asistente de ventas de esta empresa. Para tu evento te recomiendo especialmente ${nombrePaquete}. ¿En qué fecha tienes planificada tu recepción para verificar disponibilidad?`;
}

// Alias para compatibilidad con código existente
export const consultarAsistente = consultarEvara;
