import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bot, 
  Sparkles, 
  Send, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  Calendar, 
  FileText, 
  ArrowRight, 
  Layers, 
  User, 
  Database, 
  Zap, 
  MessageSquare,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

export const EvaraAI = () => {
  useEffect(() => {
    document.title = 'EVARA AI - Asistente Inteligente de Ventas 24/7 | EVENTRA';
  }, []);

  const [activeScenario, setActiveScenario] = useState('boda');

  return (
    <div className="py-12 md:py-16">
      
      {/* ── 1. HERO DE EVARA AI ─────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#CBC6B6] text-xs font-semibold text-[#526F7D] shadow-xs mb-4">
          <Sparkles className="w-3.5 h-3.5 text-[#526F7D]" />
          <span>Inteligencia Artificial para Centros de Eventos</span>
        </div>

        <h1 
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#233D49] tracking-tight max-w-4xl mx-auto leading-tight"
        >
          EVARA AI: Tu ejecutiva comercial experta que nunca duerme.
        </h1>

        <p className="mt-5 text-lg sm:text-xl text-[#233D49]/80 max-w-3xl mx-auto leading-relaxed">
          Atiende a tus prospectos en WhatsApp o en tu sitio web a cualquier hora. Consulta en tiempo real tu catálogo de servicios, calcula presupuestos exactos y bloquea pre-reservas sin inventar información.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
          <Link
            to="/precios"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#526F7D] hover:bg-[#3E5763] text-white font-semibold text-base shadow-sm hover:shadow-md transition-all duration-200"
          >
            <Zap className="w-4 h-4" />
            <span>Obtener EVARA con el Plan Premium</span>
          </Link>
          <a
            href="#simulador"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white text-[#233D49] border border-[#CBC6B6] font-semibold text-base shadow-xs hover:bg-[#FAFAF8] transition-all duration-200"
          >
            <MessageSquare className="w-4 h-4 text-[#526F7D]" />
            <span>Ver Simulador de Conversación</span>
          </a>
        </div>
      </section>

      {/* ── 2. LOS 4 PILARES DE EVARA AI (ANTI-ALUCINACIÓN) ─────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="bg-white p-6 rounded-2xl border border-[#CBC6B6]/80 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#526F7D]/15 text-[#526F7D] flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#233D49]">Consulta en Tiempo Real</h3>
            <p className="text-xs text-[#233D49]/75 leading-relaxed">
              No genera datos ficticios. Accede a tu base de datos en Supabase para obtener precios vigentes de salones, menús por cubierto y extras autorizados.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#CBC6B6]/80 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#4D9A72]/15 text-[#4D9A72] flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#233D49]">Consciencia de Agenda</h3>
            <p className="text-xs text-[#233D49]/75 leading-relaxed">
              Verifica la disponibilidad de fechas y turnos antes de responder. Si un salón está ocupado, ofrece alternativas disponibles de forma inmediata.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#CBC6B6]/80 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#C49A3A]/15 text-[#C49A3A] flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#233D49]">Cotizaciones Estructuradas</h3>
            <p className="text-xs text-[#233D49]/75 leading-relaxed">
              Transforma una charla casual en una propuesta comercial formal con desglose por invitado, política de anticipos y validez de la oferta.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#CBC6B6]/80 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#526F7D]/15 text-[#526F7D] flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#233D49]">Escalamiento Humano</h3>
            <p className="text-xs text-[#233D49]/75 leading-relaxed">
              Si el cliente formula peticiones atípicas o fuera del catálogo, EVARA sintetiza la conversación y notifica a tu equipo comercial con el caso listo.
            </p>
          </div>

        </div>
      </section>

      {/* ── 3. SIMULADOR DE CHAT ESTÁTICO / VISUAL (BODA 120 PAX) ───────── */}
      <section id="simulador" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-24 scroll-mt-28">
        
        <div className="bg-white rounded-3xl border border-[#CBC6B6]/90 shadow-lg overflow-hidden">
          
          {/* Header de la Ventana de Chat */}
          <div className="p-4 sm:p-5 bg-[#EEEBDD]/70 border-b border-[#CBC6B6]/70 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-[#526F7D] flex items-center justify-center text-white shadow-xs">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#4D9A72] border-2 border-white rounded-full" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[#233D49]">EVARA AI</h3>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#526F7D]/15 text-[#526F7D] uppercase">
                    Asistente Oficial
                  </span>
                </div>
                <p className="text-xs text-[#526F7D]">
                  Conectada al Catálogo de Recepciones & Reservas
                </p>
              </div>
            </div>

            <div className="text-right hidden sm:block">
              <span className="text-xs font-semibold text-[#4D9A72] flex items-center gap-1 justify-end">
                <span className="w-2 h-2 rounded-full bg-[#4D9A72] animate-pulse" />
                Respuesta en 1.2 segundos
              </span>
              <span className="text-[10px] text-[#233D49]/60">Garantía Anti-Alucinación</span>
            </div>
          </div>

          {/* Cuerpo de la Conversación Simulada */}
          <div className="p-6 sm:p-8 space-y-6 bg-[#FAFAF8]/50 min-h-[440px]">
            
            {/* Mensaje 1: Cliente interesado */}
            <div className="flex items-start justify-end gap-3 max-w-xl ml-auto">
              <div className="p-4 rounded-2xl rounded-tr-none bg-[#526F7D] text-white text-xs sm:text-sm shadow-xs leading-relaxed">
                ¡Hola! Buenas noches. Estamos planeando nuestra boda para <strong className="underline">120 personas</strong> a mediados de Noviembre. Nos encantaría tener salón con jardín y un menú de 3 tiempos gourmet. ¿Qué opciones tienen disponibles y cuál sería el presupuesto estimado?
              </div>
              <div className="w-8 h-8 rounded-full bg-[#CBC6B6]/60 flex items-center justify-center text-[#233D49] shrink-0 font-bold text-xs">
                <User className="w-4 h-4" />
              </div>
            </div>

            {/* Mensaje 2: EVARA AI respondiendo con catálogo en tiempo real */}
            <div className="flex items-start gap-3 max-w-2xl">
              <div className="w-8 h-8 rounded-full bg-[#526F7D] flex items-center justify-center text-white shrink-0 shadow-xs">
                <Bot className="w-4 h-4" />
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl rounded-tl-none bg-white border border-[#CBC6B6]/70 text-xs sm:text-sm text-[#233D49] shadow-xs leading-relaxed space-y-2">
                  <p>
                    ¡Hola! Qué gran noticia, muchísimas felicidades por su compromiso. 💍✨
                  </p>
                  <p>
                    He consultado en tiempo real la disponibilidad de nuestros salones para mediados de noviembre: el <strong>Jardín de Cristal</strong> está 100% disponible para el sábado 14 de noviembre en turno nocturno (18:00 - 02:00).
                  </p>
                  <p>
                    Para <strong>120 invitados</strong> con menú de 3 tiempos gourmet, he estructurado la siguiente propuesta basada en nuestro catálogo oficial:
                  </p>
                </div>

                {/* Tarjeta de Cotización Ficticia Estructurada */}
                <div className="p-5 rounded-2xl bg-[#EEEBDD]/60 border border-[#CBC6B6] shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#CBC6B6]/60">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#526F7D]">
                        Proforma Estimada #EV-8921
                      </span>
                      <h4 className="text-sm font-bold text-[#233D49]">
                        Paquete Nupcial Esmeralda (120 Pax)
                      </h4>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-white text-[#4D9A72] border border-[#CBC6B6]/70">
                      Disponibilidad Confirmada
                    </span>
                  </div>

                  {/* Detalle de ítems */}
                  <div className="space-y-1.5 text-xs text-[#233D49]/85">
                    <div className="flex justify-between">
                      <span>• Banquete 3 Tiempos Gourmet ($38 por comensal)</span>
                      <span className="font-semibold text-[#233D49]">$4,560 USD</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Alquiler Jardín de Cristal & Pista LED (Turno Nocturno)</span>
                      <span className="font-semibold text-[#233D49]">$1,200 USD</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Barra Libre de Mixología & Cristalería (5 horas)</span>
                      <span className="font-semibold text-[#233D49]">$960 USD</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#CBC6B6]/60 flex justify-between items-center">
                    <div>
                      <span className="text-[11px] text-[#233D49]/70">Total inversión estimada:</span>
                      <div className="text-base font-extrabold text-[#233D49]">$6,720 USD</div>
                    </div>
                    <div className="flex gap-2">
                      <span className="px-3 py-1.5 rounded-lg bg-[#526F7D] text-white font-bold text-xs flex items-center gap-1 shadow-xs">
                        <FileText className="w-3.5 h-3.5" />
                        <span>Ver Cotización Formal</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#CBC6B6]/60 text-xs text-[#233D49]/80 flex items-center justify-between">
                  <span>¿Desean agendar una visita guiada para degustación y conocer el Jardín de Cristal?</span>
                  <span className="font-bold text-[#526F7D] hover:underline cursor-pointer">
                    Agendar Visita →
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Footer simulado de envío */}
          <div className="p-4 bg-white border-t border-[#CBC6B6]/70 flex items-center justify-between text-xs text-[#233D49]/70">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#4D9A72]" />
              <span>Conexión cifrada directa con API REST de EVENTRA</span>
            </div>
            <span className="italic">Simulación generada con datos del catálogo de la empresa</span>
          </div>

        </div>

      </section>

      {/* ── 4. ARQUITECTURA TÉCNICA DE EVARA AI ──────────────────────────── */}
      <section className="bg-white/70 border-t border-[#CBC6B6]/60 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#526F7D] px-3 py-1 rounded-full bg-[#526F7D]/10">
              Cero Alucinaciones
            </span>
            <h2 
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              className="text-3xl sm:text-4xl font-bold text-[#233D49]"
            >
              ¿Cómo garantiza EVENTRA que EVARA AI no cometa errores?
            </h2>
            <p className="text-base text-[#233D49]/75">
              A diferencia de los chatbots genéricos, EVARA cuenta con barreras de ingeniería estrictas para proteger la reputación de tu marca.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-[#EEEBDD]/40 border border-[#CBC6B6]/70 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-[#526F7D] text-white flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h4 className="text-base font-bold text-[#233D49]">Grounding de Catálogo Estricto</h4>
              <p className="text-xs sm:text-sm text-[#233D49]/80 leading-relaxed">
                El prompt del sistema prohíbe taxativamente inventar servicios o precios que no figuren en la tabla de productos y salones de tu empresa.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#EEEBDD]/40 border border-[#CBC6B6]/70 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-[#526F7D] text-white flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h4 className="text-base font-bold text-[#233D49]">Aislamiento Multi-Tenant</h4>
              <p className="text-xs sm:text-sm text-[#233D49]/80 leading-relaxed">
                La información de tus recetas, costos de proveedores y márgenes de ganancia está segregada por tenant; ninguna otra empresa tiene acceso a tus datos.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#EEEBDD]/40 border border-[#CBC6B6]/70 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-[#526F7D] text-white flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h4 className="text-base font-bold text-[#233D49]">Tolerancia a Fallos</h4>
              <p className="text-xs sm:text-sm text-[#233D49]/80 leading-relaxed">
                Diseñado como microservicio desacoplado. Si el proveedor de LLM experimenta lentitud, el sistema administrativo principal sigue registrando reservas sin interrupción.
              </p>
            </div>
          </div>

          <div className="mt-14 text-center">
            <Link
              to="/precios"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#526F7D] hover:bg-[#3E5763] text-white font-semibold shadow-md transition-all duration-200"
            >
              <span>Activa EVARA AI con el Plan Premium ($99/mes)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </section>

    </div>
  );
};
