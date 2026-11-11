import { GoogleGenAI } from '@google/genai';
import pool from '../config/db.js';

/**
 * Modelos de Gemini en orden de preferencia. El primero es un alias "latest" que Google
 * actualiza automáticamente, para que el chatbot no deje de funcionar cuando se retire una
 * versión concreta (como ocurrió con gemini-1.5-flash). Configurable con GEMINI_MODELS.
 */
export const MODELOS_POR_DEFECTO = [
  'gemini-flash-lite-latest',
  'gemini-3.5-flash-lite',
  'gemini-3-flash-preview',
];

/** Valor de modelo_usado cuando ningún modelo respondió y se usó el generador por reglas. */
export const MODELO_RESPALDO = 'respuesta-contextual-sin-ia';

const obtenerModelos = () => {
  const configurados = (process.env.GEMINI_MODELS || '')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean);
  return configurados.length > 0 ? configurados : MODELOS_POR_DEFECTO;
};

const tiempoLimiteMs = () => {
  const n = Number.parseInt(process.env.GEMINI_TIMEOUT_MS, 10);
  return Number.isFinite(n) && n > 0 ? n : 12000; // el cliente está esperando en el chat
};

// Errores que no se arreglan cambiando de modelo (clave inválida, sin permisos, petición mal formada)
const esErrorDefinitivo = (error) => /"code":\s*(400|401|403)\b|API key|PERMISSION_DENIED|INVALID_ARGUMENT/i.test(String(error?.message));

/**
 * Intenta generar la respuesta con cada modelo configurado, con tiempo límite por intento.
 * @returns {Promise<{ texto: string, modelo: string } | null>} null si ningún modelo respondió.
 */
const generarConGemini = async ({ apiKey, contents, systemPrompt }) => {
  const ai = new GoogleGenAI({ apiKey });
  const fallos = [];

  for (const modelo of obtenerModelos()) {
    try {
      const respuesta = await ai.models.generateContent({
        model: modelo,
        contents,
        config: {
          systemInstruction: systemPrompt,
          abortSignal: AbortSignal.timeout(tiempoLimiteMs()),
        },
      });
      const texto = (respuesta?.text ?? '').trim();
      if (texto) return { texto, modelo };
      fallos.push(`${modelo}: respuesta vacía`);
    } catch (error) {
      fallos.push(`${modelo}: ${String(error?.message || error).slice(0, 160)}`);
      if (esErrorDefinitivo(error)) break;
    }
  }

  // console.error (no warn) para que el fallo de la IA sea visible en los logs de producción
  console.error(`[chatbotController] Ningún modelo de Gemini respondió; se usa la respuesta por reglas. ${fallos.join(' | ')}`);
  return null;
};

/**
 * Consulta a EVARA AI, asistente de ventas conversacional multi-tenant de EVENTRA.
 * Desarrollado con Google Gemini (SDK oficial @google/genai).
 *
 * Flujo:
 *   1. Extrae el mensaje de req.body y empresa_id (de req.user.empresa_id o slug/body).
 *   2. Consulta SQL en tiempo real de paquetes y servicios de la empresa (Anti-Alucinaciones).
 *   3. Construye el System Prompt dinámico estricto basado ÚNICAMENTE en el catálogo JSON.
 *   4. Ejecuta la inferencia con el primer modelo disponible de GEMINI_MODELS (con respaldos y tiempo límite).
 *   5. Si la IA no está disponible, responde con el generador contextual por reglas e indica
 *      modelo_usado = 'respuesta-contextual-sin-ia' e ia_disponible = false.
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

    // 5. Llamada a Google Gemini AI (con modelos de respaldo y tiempo límite)
    let textoIA = '';
    let modeloUsado = MODELO_RESPALDO;
    const apiKey = process.env.GEMINI_API_KEY;

    // Solo intentar Gemini si la clave no es de prueba ni token no soportado
    if (apiKey && apiKey !== 'tu_clave_aqui' && !apiKey.startsWith('AQ.')) {
      // Se descartan turnos vacíos del historial: Gemini rechaza partes sin texto (400)
      const turnosPrevios = (Array.isArray(historial) ? historial : [])
        .map((h) => ({ role: h?.sender === 'user' ? 'user' : 'model', text: String(h?.text || '').trim() }))
        .filter((h) => h.text);

      const contents = turnosPrevios.length > 0
        ? [
            ...turnosPrevios.map((h) => ({ role: h.role, parts: [{ text: h.text }] })),
            { role: 'user', parts: [{ text: String(mensaje).trim() }] },
          ]
        : String(mensaje).trim();

      const generado = await generarConGemini({ apiKey, contents, systemPrompt });
      if (generado) {
        textoIA = generado.texto;
        modeloUsado = generado.modelo;
      }
    } else {
      console.warn('[chatbotController] GEMINI_API_KEY no configurada: EVARA responde solo con reglas del catálogo.');
    }

    if (!textoIA) {
      // Respaldo contextual basado en catálogo e historial
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
        modelo_usado: modeloUsado,
        ia_disponible: modeloUsado !== MODELO_RESPALDO,
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
 * y diseñado para concluir la asesoría comercial con una recomendación clara.
 */
function generarRespuestaContextual(mensaje, paquetes, servicios, historial = []) {
  const msgLower = mensaje.trim().toLowerCase();

  const pRecomendado = paquetes[0] || null;
  const nombreP = pRecomendado ? pRecomendado.nombre : 'Convención & Gala Corporativa';
  const precioP = pRecomendado ? Number(pRecomendado.precio).toFixed(2) : '2200.00';
  const serviciosP = pRecomendado && pRecomendado.servicios_incluidos
    ? pRecomendado.servicios_incluidos
    : 'Salón Imperial Platinum climatizado, servicio de catering gourmet, amplificación e iluminación profesional y mantelería de gala';

  if (paquetes.length === 0 && servicios.length === 0) {
    return '¡Hola! Soy EVARA, asistente de ventas de esta empresa. Actualmente nuestro equipo está actualizando el catálogo de servicios. ¿Deseas solicitar una cotización personalizada?';
  }

  // 1. Despedidas y agradecimientos: Cierre definitivo de cortesía
  const despedidas = ['gracias', 'muchas gracias', 'adios', 'adiós', 'chao', 'hasta luego', 'nos vemos', 'perfecto gracias', 'listo gracias'];
  if (despedidas.some((d) => msgLower === d || msgLower.startsWith(d + ' ') || msgLower.endsWith(' ' + d))) {
    return '¡Con muchísimo gusto! Fue un placer asesorarte. Toda tu información y paquetes están disponibles en el sistema. Puedes volver a consultar en cualquier momento o avanzar en el Cotizador (/cotizador). ¡Que tengas un excelente día y muchos éxitos con tu evento!';
  }

  // 2. Si pregunta para qué sirve o qué capacidades tiene el bot
  if (
    msgLower.includes('para que sirve') ||
    msgLower.includes('que haces') ||
    msgLower.includes('puedes agendar') ||
    msgLower.includes('puedes cotizar') ||
    msgLower.includes('como funciona') ||
    msgLower.includes('quien eres')
  ) {
    return `¡Hola! Soy EVARA, tu asistente de ventas y catálogo inteligente. Te sirvo para:\n1. Recomendarte el paquete ideal según tu evento y presupuesto (ej. "${nombreP}" por $${precioP}).\n2. Detallarte los servicios de banquete, salón y música incluidos.\n3. Guiarte para que cierres tu cotización formal y asegures tu fecha.\n\nEl bloqueo oficial de salón se gestiona en Reservas (/reservas) y el desglose de contrato en el Cotizador (/cotizador). ¿Para qué fecha o tipo de evento deseas que te recomiende?`;
  }

  // 3. Detección de fechas o períodos (ej. "4 de noviembre de 2026", "el próximo mes", etc.)
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre', 'siguiente mes', 'proximo mes', 'próximo mes', '2025', '2026', '2027'];
  const esFechaMensaje = meses.some((m) => msgLower.includes(m)) || (/\b\d{1,2}\b/.test(msgLower) && (msgLower.includes('de') || msgLower.includes('/')));

  if (esFechaMensaje) {
    return `¡Excelente fecha! Hemos tomado nota de tu fecha tentativa (${mensaje.trim()}).\n\n` +
      `Para tu celebración te recomendamos especialmente nuestro paquete estrella:\n` +
      `✨ "${nombreP}" — Inversión base: $${precioP}\n\n` +
      `📦 Servicios incluidos en esta propuesta:\n` +
      `• ${serviciosP}\n\n` +
      `Para garantizar la disponibilidad del salón en esa fecha y generar tu cotización formal con contrato legal, te invitamos a dar el siguiente paso en:\n` +
      `• Cotizador Interactivo (/cotizador)\n` +
      `• Ver Disponibilidad en Reservas (/reservas)\n\n` +
      `¿Deseas formalizar esta recomendación en el Cotizador o requieres consultar algún servicio adicional?`;
  }

  // 4. Confirmación del usuario ("sí", "de acuerdo", "me gusta", "dale", "ok", etc.) -> CONCLUSIÓN Y CIERRE DE LA ASESORÍA
  const afirmaciones = ['si', 'sí', 'claro', 'por favor', 'me gustaria', 'me gustaría', 'de acuerdo', 'quiero cotizar', 'dale', 'ok', 'deseo cotizar', 'preparar cotizacion', 'me gusta', 'perfecto', 'listo', 'avanzar', 'continuar'];
  const esAfirmacion = afirmaciones.some((a) => msgLower === a || msgLower.startsWith(a + ' ') || msgLower.endsWith(' ' + a));

  if (esAfirmacion) {
    return `¡Excelente elección! Damos por concluida tu asesoría comercial con éxito. 🎉\n\n` +
      `Tu propuesta recomendada queda definida con el paquete "${nombreP}" ($${precioP}), que incluye:\n` +
      `• ${serviciosP}\n\n` +
      `Todo está listo para que formalices tu evento y asegures tu fecha en el calendario oficial antes de que otro cliente la reserve:\n` +
      `👉 Haz clic en Ir al Cotizador (/cotizador) para calcular comensales, platillos y contrato formal.\n` +
      `👉 O ingresa a Reservas (/reservas) para apartar el salón.\n\n` +
      `¡Ha sido un verdadero placer atenderte! Nuestro equipo estará listo para recibirte y hacer de tu evento una experiencia inolvidable.`;
  }

  // 5. Si el usuario pide ir directo al cotizador o a reservas
  if (msgLower.includes('cotizador') || msgLower.includes('cotizar') || msgLower.includes('presupuesto')) {
    return `¡Perfecto! Puedes acceder directamente al **Cotizador Interactivo** (/cotizador) para seleccionar tu paquete "${nombreP}" ($${precioP}), ajustar el número de comensales y generar tu cotización formal con contrato legal. ¡Todo está listo para ti!`;
  }

  if (msgLower.includes('reservar') || msgLower.includes('agendar') || msgLower.includes('reserva')) {
    return `¡Excelente! En el módulo de **Reservas** (/reservas) puedes consultar los salones disponibles por fecha y registrar tu evento para bloquear el espacio sin riesgo de colisiones con otros clientes.`;
  }

  // 6. Si pregunta por paquetes, bodas, precios o costos
  if (msgLower.includes('paquete') || msgLower.includes('precio') || msgLower.includes('costo') || msgLower.includes('boda') || msgLower.includes('evento') || msgLower.includes('gala') || msgLower.includes('quince')) {
    if (paquetes.length > 0) {
      const lista = paquetes
        .slice(0, 3)
        .map((p) => `"${p.nombre}" ($${Number(p.precio).toFixed(2)}) con ${p.servicios_incluidos}`)
        .join('; ');
      return `¡Hola! Basado en nuestro catálogo oficial, disponemos de los siguientes paquetes destacados: ${lista}.\n\nPara eventos sociales y galas te recomendamos especialmente "${nombreP}" ($${precioP}). ¿Para qué fecha estás planificando tu recepción para verificar disponibilidad?`;
    }
  }

  // 7. Si pregunta por servicios específicos (catering, música, etc.)
  if (msgLower.includes('servicio') || msgLower.includes('catering') || msgLower.includes('musica') || msgLower.includes('música') || msgLower.includes('fotograf') || msgLower.includes('salon') || msgLower.includes('salón') || msgLower.includes('decorac')) {
    if (servicios.length > 0) {
      const listaS = servicios
        .slice(0, 4)
        .map((s) => `${s.nombre} ($${Number(s.precio_base).toFixed(2)})`)
        .join(', ');
      return `¡Hola! Con mucho gusto. En nuestro catálogo actual ofrecemos: ${listaS}. Todos estos servicios se pueden integrar al paquete "${nombreP}" en el Cotizador (/cotizador). ¿Te gustaría avanzar con la cotización?`;
    }
  }

  // 8. Respuesta de cortesía general orientativa
  return `¡Hola! Soy EVARA, asistente de ventas de esta empresa. Te recomiendo especialmente nuestro paquete "${nombreP}" ($${precioP}) con ${serviciosP}.\n\nPuedes indicarme tu fecha estimada para recomendarte disponibilidad o ingresar directamente al Cotizador (/cotizador) para ver el contrato legal. ¿En qué fecha tienes planificado tu evento?`;
}

// Alias para compatibilidad con código existente
export const consultarAsistente = consultarEvara;
