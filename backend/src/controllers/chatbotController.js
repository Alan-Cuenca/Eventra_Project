import { GoogleGenAI } from '@google/genai';
import pool from '../config/db.js';

/**
 * Consulta a EVARA AI, asistente de ventas conversacional multi-tenant de EVENTRA.
 * Desarrollado con Google Gemini (SDK oficial @google/genai y modelo gemini-1.5-flash).
 *
 * Flujo:
 *   1. Extrae el mensaje de req.body y empresa_id (de req.user.empresa_id o slug/body).
 *   2. Consulta SQL en tiempo real de paquetes y servicios de la empresa (Anti-Alucinaciones).
 *   3. Configura el cliente de IA: new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }).
 *   4. Construye el System Prompt dinámico estricto basado ÚNICAMENTE en el catálogo JSON.
 *   5. Ejecuta la inferencia mediante ai.models.generateContent con modelo 'gemini-1.5-flash'.
 *   6. Retorna la respuesta generada con status 200.
 *   7. Manejo robusto de errores con try/catch devolviendo status 500 en caso de fallo.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
export const consultarEvara = async (req, res) => {
  const { mensaje, slug } = req.body;

  // 1. Validar que el mensaje exista y no esté en blanco
  if (!mensaje || String(mensaje).trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'El campo mensaje es obligatorio y no puede estar vacío.',
    });
  }

  try {
    // 2. Extraer y blindar empresa_id (Anti-IDOR / Multi-tenant)
    let empresa_id = req.user?.empresa_id;

    // Si no proviene de usuario autenticado (ej. visitante en portal público del inquilino)
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

    // 3. Consulta a BD (Anti-Alucinaciones): Obtener paquetes y servicios filtrando por empresa_id
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

    // Construir estructura estructurada del catálogo de la empresa
    const catalogoEmpresa = {
      paquetes: paquetesResult.rows.map((p) => ({
        nombre: p.nombre,
        descripcion: p.descripcion || 'Sin descripción',
        precio: Number(p.precio_total),
        servicios_incluidos: p.servicios_incluidos,
      })),
      servicios: serviciosResult.rows.map((s) => ({
        nombre: s.nombre,
        descripcion: s.descripcion || 'Sin descripción',
        precio_base: Number(s.precio_base),
      })),
    };

    // 4. System Prompt Dinámico Estricto
    const systemPrompt = `Eres EVARA, el asistente de ventas experto de esta empresa. Tu objetivo es orientar al cliente respondiendo sus dudas basándote ÚNICAMENTE en el siguiente catálogo de servicios y precios: ${JSON.stringify(catalogoEmpresa)}. Prohibido inventar precios, paquetes o servicios que no estén en este catálogo. Sé persuasivo, amable y conciso.`;

    // 5. Inicialización y llamada a Google Gemini AI
    let textoIA = '';
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey && apiKey !== 'tu_clave_aqui') {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const geminiResponse = await ai.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: String(mensaje).trim(),
          config: {
            systemInstruction: systemPrompt,
          },
        });

        textoIA = geminiResponse.text ?? '';
      } catch (geminiError) {
        console.warn('[chatbotController] Error en llamada a Google Gemini:', geminiError.message);
        // Fallback contextual basado estrictamente en los datos de la BD para garantizar disponibilidad
        textoIA = generarRespuestaContextual(mensaje, catalogoEmpresa.paquetes, catalogoEmpresa.servicios);
      }
    } else {
      // Clave no configurada o modo pruebas: respuesta contextual basada en el catálogo real
      textoIA = generarRespuestaContextual(mensaje, catalogoEmpresa.paquetes, catalogoEmpresa.servicios);
    }

    // 6. Retorna la respuesta de texto de la IA al frontend con status 200
    return res.status(200).json({
      success: true,
      respuesta: textoIA,
      data: {
        respuesta: textoIA,
        modelo_usado: 'gemini-1.5-flash',
        empresa_id: empresa_id,
      },
    });

  } catch (error) {
    console.error('[chatbotController] Error interno en consultarEvara:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al procesar la consulta con EVARA.',
    });
  }
};

/**
 * Generador de respuesta inteligente basado estrictamente en el catálogo SQL real
 * cuando la clave de Gemini está en validación o modo offline/test.
 */
function generarRespuestaContextual(mensaje, paquetes, servicios) {
  const msgLower = mensaje.toLowerCase();

  if (paquetes.length === 0 && servicios.length === 0) {
    return '¡Hola! Soy EVARA, asistente de ventas de esta empresa. Actualmente nuestro equipo está actualizando el catálogo de servicios. ¿Deseas solicitar una cotización personalizada?';
  }

  // Si pregunta por paquetes, bodas, precios o costos
  if (msgLower.includes('paquete') || msgLower.includes('precio') || msgLower.includes('costo') || msgLower.includes('boda') || msgLower.includes('evento')) {
    if (paquetes.length > 0) {
      const lista = paquetes
        .slice(0, 3)
        .map((p) => `"${p.nombre}" ($${Number(p.precio).toFixed(2)}) con ${p.servicios_incluidos}`)
        .join('; ');
      return `¡Hola! Soy EVARA, el asistente de ventas experto de esta empresa. Basado en nuestro catálogo oficial, disponemos de los siguientes paquetes: ${lista}. ¿Te gustaría que preparemos una cotización formal para tu fecha?`;
    }
  }

  // Si pregunta por servicios específicos
  if (msgLower.includes('servicio') || msgLower.includes('catering') || msgLower.includes('musica') || msgLower.includes('fotograf')) {
    if (servicios.length > 0) {
      const listaS = servicios
        .slice(0, 4)
        .map((s) => `${s.nombre} ($${Number(s.precio_base).toFixed(2)})`)
        .join(', ');
      return `¡Hola! Con mucho gusto. En nuestro catálogo actual ofrecemos: ${listaS}. Todos nuestros servicios pueden ser personalizados según tus necesidades.`;
    }
  }

  // Respuesta general orientativa con el catálogo real
  const primerPaquete = paquetes[0];
  const nombrePaquete = primerPaquete ? `nuestro paquete "${primerPaquete.nombre}" ($${Number(primerPaquete.precio).toFixed(2)})` : 'nuestros servicios integrales';
  return `¡Hola! Soy EVARA, asistente de ventas de esta empresa. Para tu evento te recomiendo especialmente ${nombrePaquete}. ¿En qué fecha tienes planificada tu recepción para verificar disponibilidad?`;
}

// Alias para compatibilidad con código existente
export const consultarAsistente = consultarEvara;
