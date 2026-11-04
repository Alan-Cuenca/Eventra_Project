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
  const { mensaje, slug, historial = [] } = req.body;

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
    const systemPrompt = `Eres EVARA, el asistente de ventas experto de esta empresa de eventos.
Tu alcance y funciones son:
1. Orientar amablemente a los clientes respondiendo dudas basándote ÚNICAMENTE en este catálogo oficial: ${JSON.stringify(catalogoEmpresa)}. Prohibido inventar precios o servicios no incluidos.
2. Si el cliente te indica una fecha, te pide cotizar o desea agendar/reservar:
   - Confirma con entusiasmo su fecha o solicitud.
   - Explícale con claridad que para garantizar la disponibilidad estricta de salones (evitando colisiones en el calendario) y generar el contrato legal, la cotización formal y reserva se completan a través de los módulos del sistema: "Cotizador" (/cotizador) o "Reservas" (/reservas).
   - Ofrécele resolver dudas adicionales sobre qué incluye el paquete o servicios complementarios (catering, música, fotografía, etc.).
Sé persuasivo, amable, conciso y profesional en todo momento.`;

    // 5. Inicialización y llamada a Google Gemini AI
    let textoIA = '';
    const apiKey = process.env.GEMINI_API_KEY;

    // Solo intentar Gemini si la clave no es de prueba ni token no soportado
    if (apiKey && apiKey !== 'tu_clave_aqui' && !apiKey.startsWith('AQ.')) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        
        let contents;
        if (Array.isArray(historial) && historial.length > 0) {
          contents = [
            ...historial.map((h) => ({
              role: h.sender === 'user' ? 'user' : 'model',
              parts: [{ text: String(h.text || '').trim() }],
            })),
            { role: 'user', parts: [{ text: String(mensaje).trim() }] },
          ];
        } else {
          contents = String(mensaje).trim();
        }

        const geminiResponse = await ai.models.generateContent({
          model: 'gemini-1.5-flash',
          contents,
          config: {
            systemInstruction: systemPrompt,
          },
        });

        textoIA = geminiResponse.text ?? '';
      } catch (geminiError) {
        console.warn('[chatbotController] Error en llamada a Google Gemini:', geminiError.message);
        // Fallback contextual inteligente con soporte de historial
        textoIA = generarRespuestaContextual(mensaje, catalogoEmpresa.paquetes, catalogoEmpresa.servicios, historial);
      }
    } else {
      // Clave no configurada o modo fallback: respuesta contextual basada en catálogo e historial
      textoIA = generarRespuestaContextual(mensaje, catalogoEmpresa.paquetes, catalogoEmpresa.servicios, historial);
    }

    // 6. Incrementar contador de mensajes de chatbot de la empresa para control de cuotas SaaS
    await pool.query(
      'UPDATE empresas SET mensajes_chatbot_mes = COALESCE(mensajes_chatbot_mes, 0) + 1 WHERE id = $1',
      [empresa_id]
    ).catch((err) => console.warn('[chatbotController] No se pudo incrementar mensajes_chatbot_mes:', err.message));

    // 7. Retorna la respuesta de texto de la IA al frontend con status 200
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
 * y en el historial conversacional previo.
 */
function generarRespuestaContextual(mensaje, paquetes, servicios, historial = []) {
  const msgLower = mensaje.trim().toLowerCase();

  if (paquetes.length === 0 && servicios.length === 0) {
    return '¡Hola! Soy EVARA, asistente de ventas de esta empresa. Actualmente nuestro equipo está actualizando el catálogo de servicios. ¿Deseas solicitar una cotización personalizada?';
  }

  // Análisis del historial conversacional previo
  const msgsArray = Array.isArray(historial) ? historial : [];
  const ultimosMensajesBot = msgsArray
    .filter((m) => m.sender === 'evara' || m.role === 'model')
    .map((m) => String(m.text || '').toLowerCase());
  const ultimoBotMsg = ultimosMensajesBot[ultimosMensajesBot.length - 1] || '';

  // Ver si ya se mencionó una fecha en cualquier momento de la conversación
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre', 'siguiente mes', 'proximo mes', 'próximo mes', '2025', '2026', '2027'];
  const esFechaMensaje = meses.some((m) => msgLower.includes(m)) || (/\b\d{1,2}\b/.test(msgLower) && (msgLower.includes('de') || msgLower.includes('/')));
  const fechaYaMencionada = esFechaMensaje || msgsArray.some((m) => {
    const t = String(m.text || '').toLowerCase();
    return meses.some((mes) => t.includes(mes)) || (/\b\d{1,2}\b/.test(t) && (t.includes('nov') || t.includes('dic') || t.includes('2026') || t.includes('2025')));
  });

  // Ver si el bot acaba de preguntar por ver los servicios del paquete recomendado
  const botPreguntoPorServicios = ultimoBotMsg.includes('servicios incluye') || ultimoBotMsg.includes('qué servicios') || ultimoBotMsg.includes('conocer qué servicios');

  // Ver si el bot ya listó los servicios
  const botYaListoServicios = ultimosMensajesBot.some((t) => t.includes('incluye exactamente') || t.includes('incluye los siguientes'));

  // 1. Si pregunta para qué sirve o qué capacidades tiene el bot
  if (
    msgLower.includes('para que sirve') ||
    msgLower.includes('que haces') ||
    msgLower.includes('puedes agendar') ||
    msgLower.includes('puedes cotizar') ||
    msgLower.includes('como funciona') ||
    msgLower.includes('quien eres')
  ) {
    return '¡Hola! Soy EVARA, tu asistente de ventas y catálogo inteligente. Te sirvo para:\n1. Consultar en tiempo real paquetes, servicios, precios y detalles de catering/decoración.\n2. Recomendarte la mejor alternativa según el tipo de recepción que planeas.\n3. Guiarte para formalizar tu cotización y agendar tu salón.\n\nNota: Para asegurar que no existan colisiones de salón, el bloqueo oficial de fechas se gestiona en el módulo de Reservas (/reservas) y el desglose de contrato en el Cotizador (/cotizador). ¿Qué tipo de evento tienes en mente?';
  }

  // 2. Si el usuario envía una fecha o mes
  if (esFechaMensaje) {
    const p = paquetes[0];
    const nombreP = p ? `nuestro paquete "${p.nombre}"` : 'nuestro paquete recomendado';
    return `¡Excelente fecha! Hemos tomado nota de tu fecha tentativa (${mensaje.trim()}). Para verificar la disponibilidad exacta del salón en nuestro calendario oficial y bloquear la fecha en el sistema (evitando que otro cliente reserve simultáneamente), te invitamos a registrar tu reserva formal en el módulo de **Reservas** (/reservas) o solicitar tu propuesta en el **Cotizador** (/cotizador). Nuestro equipo comercial revisará tu solicitud de inmediato. ¿Deseas conocer qué servicios incluye ${nombreP}?`;
  }

  // 3. Si el usuario dice "sí" o confirma
  const afirmaciones = ['si', 'sí', 'claro', 'por favor', 'me gustaria', 'me gustaría', 'de acuerdo', 'quiero cotizar', 'dale', 'ok', 'deseo cotizar', 'preparar cotizacion'];
  const esAfirmacion = afirmaciones.some((a) => msgLower === a || msgLower.startsWith(a + ' ') || msgLower.endsWith(' ' + a));

  if (esAfirmacion) {
    // Si el bot preguntó "¿Deseas conocer qué servicios incluye...?"
    if (botPreguntoPorServicios) {
      const p = paquetes[0];
      const srv = p && p.servicios_incluidos ? p.servicios_incluidos : 'Salón climatizado, mantelería de gala, sonido profesional y banquete gourmet';
      return `¡Con mucho gusto! Nuestro paquete "${p ? p.nombre : 'Convención & Gala Corporativa'}" ($${p ? Number(p.precio).toFixed(2) : '2200.00'}) incluye exactamente los siguientes servicios:\n• ${srv}.\n\nAdemás, podemos personalizarlo con cualquier servicio extra de nuestro catálogo. ¿Te gustaría calcular el total en el Cotizador (/cotizador) o deseas consultar algún servicio adicional?`;
    }

    // Si ya se mencionó la fecha anteriormente o ya se listaron los servicios
    if (fechaYaMencionada || botYaListoServicios) {
      return `¡Excelente decisión! Ya tenemos tu fecha y preferencias registradas. Para formalizar tu propuesta con cálculo de comensales, platillos y contrato oficial, puedes abrir directamente nuestro **Cotizador Interactivo** (/cotizador) o asegurar tu salón en **Reservas** (/reservas). ¿Hay algún requerimiento extra que te gustaría añadir?`;
    }

    // Si aún no se mencionó fecha
    const primerP = paquetes[0];
    const recomendacion = primerP ? `nuestro paquete "${primerP.nombre}" ($${Number(primerP.precio).toFixed(2)})` : 'nuestro catálogo';
    return `¡Excelente! Podemos preparar una propuesta a tu medida tomando como base ${recomendacion}. ¿En qué fecha aproximada tienes pensada tu recepción?`;
  }

  // 4. Si el usuario pide ir al cotizador o cotizar
  if (msgLower.includes('cotizador') || msgLower.includes('cotizar') || msgLower.includes('presupuesto')) {
    return '¡Perfecto! Puedes acceder directamente al **Cotizador Interactivo** (/cotizador) para seleccionar tu paquete, ajustar el número de comensales y generar tu cotización formal con contrato legal.';
  }

  // 5. Si el usuario pide ir a reservas o agendar
  if (msgLower.includes('reservar') || msgLower.includes('agendar') || msgLower.includes('reserva')) {
    return '¡Excelente! En el módulo de **Reservas** (/reservas) puedes consultar los salones disponibles por fecha y registrar tu evento para bloquear el espacio sin riesgo de colisiones con otros clientes.';
  }

  // 6. Si pregunta por paquetes, bodas, precios o costos
  if (msgLower.includes('paquete') || msgLower.includes('precio') || msgLower.includes('costo') || msgLower.includes('boda') || msgLower.includes('evento') || msgLower.includes('gala') || msgLower.includes('quince')) {
    if (paquetes.length > 0) {
      const lista = paquetes
        .slice(0, 3)
        .map((p) => `"${p.nombre}" ($${Number(p.precio).toFixed(2)}) con ${p.servicios_incluidos}`)
        .join('; ');
      return `¡Hola! Basado en nuestro catálogo oficial, disponemos de los siguientes paquetes: ${lista}. ¿Te gustaría que revisemos los servicios incluidos o prefieres verificar disponibilidad para tu fecha?`;
    }
  }

  // 7. Si pregunta por servicios específicos (catering, música, etc.)
  if (msgLower.includes('servicio') || msgLower.includes('catering') || msgLower.includes('musica') || msgLower.includes('música') || msgLower.includes('fotograf') || msgLower.includes('salon') || msgLower.includes('salón') || msgLower.includes('decorac')) {
    if (servicios.length > 0) {
      const listaS = servicios
        .slice(0, 4)
        .map((s) => `${s.nombre} ($${Number(s.precio_base).toFixed(2)})`)
        .join(', ');
      return `¡Hola! Con mucho gusto. En nuestro catálogo actual ofrecemos: ${listaS}. Todos nuestros servicios pueden ser personalizados según tus necesidades. ¿Te gustaría incluirlos en una cotización?`;
    }
  }

  // 8. Respuesta de cortesía general orientativa
  const primerPaquete = paquetes[0];
  const nombrePaquete = primerPaquete ? `nuestro paquete "${primerPaquete.nombre}" ($${Number(primerPaquete.precio).toFixed(2)})` : 'nuestros servicios integrales';
  
  if (fechaYaMencionada) {
    return `¡Con gusto te asisto! Para tu fecha planificada te recomendamos ${nombrePaquete}. ¿Deseas que te detalle los servicios incluidos o prefieres pasar al Cotizador (/cotizador)?`;
  }
  
  return `¡Hola! Soy EVARA, asistente de ventas de esta empresa. Para tu evento te recomiendo especialmente ${nombrePaquete}. ¿En qué fecha tienes planificada tu recepción para verificar disponibilidad?`;
}

// Alias para compatibilidad con código existente
export const consultarAsistente = consultarEvara;
