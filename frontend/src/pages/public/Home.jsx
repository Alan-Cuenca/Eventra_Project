import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  CalendarCheck, 
  TrendingUp, 
  Clock, 
  Users, 
  DollarSign, 
  FileText, 
  AlertTriangle,
  Layers,
  ChevronRight
} from 'lucide-react';

export const Home = () => {
  useEffect(() => {
    document.title = 'EVENTRA - Gestión Inteligente para Empresas de Eventos';
  }, []);

  return (
    <div className="overflow-hidden">
      
      {/* ── 1. HERO SECTION (ASIMÉTRICO 7:5) ────────────────────────────── */}
      <section className="relative pt-12 pb-20 md:pt-16 md:pb-28">
        {/* Luces sutiles decorativas */}
        <div className="absolute top-10 -left-20 w-80 h-80 rounded-full bg-[#526F7D]/8 blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-0 w-96 h-96 rounded-full bg-[#CBC6B6]/25 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Columna Izquierda (7 columnas): Copy B2B SaaS */}
            <div className="lg:col-span-7 flex flex-col items-start space-y-6">
              
              {/* Badge de Categoría */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 border border-[#CBC6B6] text-xs font-semibold text-[#526F7D] shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-[#526F7D]" />
                <span>Plataforma SaaS para Centros de Eventos & Recepciones</span>
              </div>

              {/* Título H1 Serif Elegante */}
              <h1 
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#233D49] tracking-tight leading-[1.12]"
              >
                Gestión inteligente para empresas de eventos.
              </h1>

              {/* Subtítulo enfocado en erradicar colisiones */}
              <p className="text-lg sm:text-xl text-[#233D49]/80 font-normal leading-relaxed max-w-2xl">
                Centraliza cotizaciones dinámicas, reservas blindadas sin colisiones, pagos y coordinación de equipo. Diseñado con la sofisticación y exactitud que exige la alta recepción.
              </p>

              {/* Dos Botones de Acción */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto pt-2">
                <Link
                  to="/precios"
                  className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-[#526F7D] hover:bg-[#3E5763] text-white font-semibold text-base shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                >
                  <span>Comenzar Prueba / Ver Planes</span>
                  <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1.5 transition-transform duration-200" />
                </Link>

                <Link
                  to="/funcionalidades"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white/90 hover:bg-white text-[#233D49] border border-[#CBC6B6] font-semibold text-base shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                >
                  <span>Explorar Módulos</span>
                </Link>
              </div>

              {/* Métricas Rápidas en el Hero */}
              <div className="pt-6 border-t border-[#CBC6B6]/60 w-full grid grid-cols-3 gap-4 text-left">
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-[#233D49]">100%</p>
                  <p className="text-xs sm:text-sm text-[#526F7D] font-medium">Cero colisiones de agenda</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-[#233D49]">24/7</p>
                  <p className="text-xs sm:text-sm text-[#526F7D] font-medium">Asistencia EVARA AI</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-[#233D49]">+1,200</p>
                  <p className="text-xs sm:text-sm text-[#526F7D] font-medium">Eventos coordinados</p>
                </div>
              </div>

            </div>

            {/* Columna Derecha (5 columnas): Mockup Visual Abstracto del Panel */}
            <div className="lg:col-span-5 relative animate-fade-in-up">
              
              {/* Card Principal del Mockup */}
              <div className="relative bg-white rounded-2xl p-6 sm:p-7 shadow-xl border border-[#CBC6B6]/80 transform transition-transform duration-300 hover:scale-[1.01]">
                
                {/* Cabecera de Ventana tipo Aplicación */}
                <div className="flex items-center justify-between pb-4 border-b border-[#CBC6B6]/40 mb-5">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#C95C5C]/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-[#C49A3A]/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-[#4D9A72]/80 inline-block" />
                    <span className="text-xs font-semibold text-[#526F7D] ml-2 tracking-wide font-mono">
                      app.eventra.com/dashboard
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#4D9A72]/15 text-[#4D9A72] text-[11px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4D9A72] animate-pulse" />
                    En vivo
                  </div>
                </div>

                {/* KPI Cards simuladas en el panel */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="p-3.5 rounded-xl bg-[#EEEBDD]/50 border border-[#CBC6B6]/50">
                    <div className="flex items-center justify-between text-[#526F7D] text-xs font-medium mb-1">
                      <span>Salón Imperial</span>
                      <CalendarCheck className="w-3.5 h-3.5 text-[#526F7D]" />
                    </div>
                    <div className="text-lg font-bold text-[#233D49]">100% Bloqueado</div>
                    <span className="text-[10px] text-[#4D9A72] font-semibold flex items-center gap-1 mt-0.5">
                      <ShieldCheck className="w-3 h-3" /> Sin conflicto
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#EEEBDD]/50 border border-[#CBC6B6]/50">
                    <div className="flex items-center justify-between text-[#526F7D] text-xs font-medium mb-1">
                      <span>Cotizaciones Mes</span>
                      <TrendingUp className="w-3.5 h-3.5 text-[#526F7D]" />
                    </div>
                    <div className="text-lg font-bold text-[#233D49]">$38,450</div>
                    <span className="text-[10px] text-[#526F7D] font-medium mt-0.5 block">
                      14 proformas activas
                    </span>
                  </div>
                </div>

                {/* Tarjeta de Próximo Evento / Timeline */}
                <div className="p-4 rounded-xl bg-white border border-[#CBC6B6]/60 shadow-xs space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#526F7D]">
                        Evento en Curso
                      </span>
                      <h4 className="text-sm font-bold text-[#233D49]">
                        Gala Nupcial Salazar & Vega
                      </h4>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-[#526F7D]/10 text-[#526F7D] border border-[#526F7D]/20">
                      180 Pax
                    </span>
                  </div>

                  {/* Barra de progreso de checklist de montaje */}
                  <div>
                    <div className="flex justify-between text-[11px] font-medium text-[#233D49]/80 mb-1">
                      <span>Fase 3: Montaje y Catering</span>
                      <span className="font-bold text-[#526F7D]">85%</span>
                    </div>
                    <div className="w-full bg-[#EEEBDD] rounded-full h-2 overflow-hidden">
                      <div className="bg-[#526F7D] h-2 rounded-full w-[85%] transition-all duration-500" />
                    </div>
                  </div>

                  {/* Checklist Rápido de Personal */}
                  <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-[#233D49]/80">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#4D9A72]" />
                      <span>Degustación Ok</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#4D9A72]" />
                      <span>Audio y Luces Listo</span>
                    </div>
                  </div>
                </div>

                {/* Badge Flotante de Concurrencia PostgreSQL */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#526F7D]/10 border border-[#526F7D]/30 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#526F7D] flex items-center justify-center text-white">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-semibold text-[#233D49]">
                      EVARA AI cotizando en segundo plano
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-[#526F7D] uppercase tracking-wider">
                    Activa
                  </span>
                </div>

              </div>

              {/* Decoración Flotante Externa */}
              <div className="absolute -bottom-5 -left-5 bg-white py-2.5 px-4 rounded-xl shadow-lg border border-[#CBC6B6] flex items-center gap-2.5 text-xs font-semibold text-[#233D49] hidden sm:flex">
                <ShieldCheck className="w-4 h-4 text-[#4D9A72]" />
                <span>Zero Double-Booking Garantizado</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 2. SECCIÓN "EL CAOS VS LA SOLUCIÓN EVENTRA" ──────────────────── */}
      <section className="py-20 bg-white/70 border-y border-[#CBC6B6]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#526F7D] px-3 py-1 rounded-full bg-[#526F7D]/10">
              Transformación Operativa
            </span>
            <h2 
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              className="text-3xl sm:text-4xl font-bold text-[#233D49]"
            >
              El Caos Tradicional vs La Certeza EVENTRA
            </h2>
            <p className="text-base sm:text-lg text-[#233D49]/75">
              Comparativa entre operar con herramientas desarticuladas y contar con un ecosistema blindado de extremo a extremo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            
            {/* Columna Izquierda: Forma Tradicional */}
            <div className="rounded-2xl p-7 sm:p-9 bg-[#FAFAF8] border border-[#C95C5C]/30 shadow-xs relative">
              <div className="flex items-center gap-3 pb-6 border-b border-[#CBC6B6]/40">
                <div className="w-10 h-10 rounded-xl bg-[#C95C5C]/15 flex items-center justify-center text-[#C95C5C]">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#233D49]">
                    La forma tradicional
                  </h3>
                  <p className="text-xs text-[#233D49]/70 font-medium">
                    Hojas de cálculo en Excel, chats de WhatsApp y libretas
                  </p>
                </div>
              </div>

              <ul className="space-y-4 pt-6">
                {[
                  {
                    title: 'Riesgo constante de colisión (Double-Booking)',
                    desc: 'Dos ejecutivos de ventas prometen el mismo salón en idéntica fecha porque la planilla de Excel no se sincronizó a tiempo.'
                  },
                  {
                    title: 'Cotizaciones con márgenes rotos',
                    desc: 'Fórmulas manuales desactualizadas omiten costos de insumos, horas extra de personal o tarifas cambiantes por comensal.'
                  },
                  {
                    title: 'Comprobantes de pago perdidos',
                    desc: 'Capturas de transferencias bancarias extraviadas en hilos de WhatsApp sin conciliación formal con el saldo pendiente.'
                  },
                  {
                    title: 'Desconexión con el personal de piso',
                    desc: 'Meseros, cocineros y decoradores sin un cronograma unificado, provocando retrasos en el montaje de la recepción.'
                  },
                  {
                    title: 'Falta de atención fuera de horario',
                    desc: 'Prospectos interesados que escriben en la noche o fines de semana esperan horas por una cotización y eligen a la competencia.'
                  }
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-[#C95C5C] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-[#233D49]">{item.title}</h4>
                      <p className="text-xs text-[#233D49]/70 leading-relaxed mt-0.5">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Columna Derecha: Con EVENTRA */}
            <div className="rounded-2xl p-7 sm:p-9 bg-white border-2 border-[#526F7D]/50 shadow-md relative">
              <div className="absolute -top-3.5 right-6 px-3 py-1 rounded-full bg-[#526F7D] text-white text-[11px] font-bold uppercase tracking-wider shadow-sm">
                Solución Blindada
              </div>

              <div className="flex items-center gap-3 pb-6 border-b border-[#CBC6B6]/40">
                <div className="w-10 h-10 rounded-xl bg-[#526F7D] flex items-center justify-center text-white">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#233D49]">
                    Con EVENTRA SaaS
                  </h3>
                  <p className="text-xs text-[#526F7D] font-medium">
                    Tablero centralizado, reservas bloqueadas y control total
                  </p>
                </div>
              </div>

              <ul className="space-y-4 pt-6">
                {[
                  {
                    title: 'Bloqueo estricto de concurrencia en base de datos',
                    desc: 'El motor PostgreSQL valida restricciones únicas de salón, fecha y turno en milisegundos. Es matemáticamente imposible un doble turno.'
                  },
                  {
                    title: 'Cotizador dinámico con cálculo automático',
                    desc: 'Desglose exacto en 4 pasos por paquete, comensales y extras con protección automática del margen de utilidad.'
                  },
                  {
                    title: 'Conciliación y almacenamiento seguro en Supabase',
                    desc: 'Carga de comprobantes con seguimiento de estado (Abono 50%, Saldo pendiente) y trazabilidad para el administrador.'
                  },
                  {
                    title: 'Checklist móvil en tiempo real para el equipo',
                    desc: 'El personal operativo visualiza sus tareas asignadas desde su smartphone con barra de completitud por fase de evento.'
                  },
                  {
                    title: 'Asistencia comercial EVARA AI activa 24/7',
                    desc: 'Responde de inmediato consultas, calcula estimaciones basadas en tu catálogo real y captura pre-reservas mientras descansas.'
                  }
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#4D9A72] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-[#233D49]">{item.title}</h4>
                      <p className="text-xs text-[#233D49]/75 leading-relaxed mt-0.5">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          <div className="mt-12 text-center">
            <Link
              to="/funcionalidades"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#526F7D] hover:text-[#3E5763] transition-colors"
            >
              <span>Descubre el funcionamiento de cada uno de los módulos en detalle</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </section>

      {/* ── 3. BARRA DE MÉTRICAS RÁPIDAS Y CONFIANZA ────────────────────── */}
      <section className="py-16 bg-[#EEEBDD]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="bg-white rounded-2xl p-8 sm:p-10 shadow-sm border border-[#CBC6B6]/80">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 divide-y lg:divide-y-0 lg:divide-x divide-[#CBC6B6]/60">
              
              <div className="text-center px-4">
                <div className="text-3xl sm:text-4xl font-extrabold text-[#233D49] mb-1">
                  100%
                </div>
                <div className="text-sm font-bold text-[#526F7D] mb-0.5">
                  Cero Colisiones
                </div>
                <p className="text-xs text-[#233D49]/70">
                  Garantía estricta de concurrencia en la agenda de salones
                </p>
              </div>

              <div className="text-center px-4 pt-6 lg:pt-0">
                <div className="text-3xl sm:text-4xl font-extrabold text-[#233D49] mb-1">
                  24/7
                </div>
                <div className="text-sm font-bold text-[#526F7D] mb-0.5">
                  Asistencia EVARA AI
                </div>
                <p className="text-xs text-[#233D49]/70">
                  Cotizaciones instantáneas según catálogo sin esperas
                </p>
              </div>

              <div className="text-center px-4 pt-6 lg:pt-0">
                <div className="text-3xl sm:text-4xl font-extrabold text-[#233D49] mb-1">
                  4x
                </div>
                <div className="text-sm font-bold text-[#526F7D] mb-0.5">
                  Más Velocidad
                </div>
                <p className="text-xs text-[#233D49]/70">
                  En la emisión y aprobación de propuestas comerciales
                </p>
              </div>

              <div className="text-center px-4 pt-6 lg:pt-0">
                <div className="text-3xl sm:text-4xl font-extrabold text-[#233D49] mb-1">
                  99.9%
                </div>
                <div className="text-sm font-bold text-[#526F7D] mb-0.5">
                  Uptime Cloud
                </div>
                <p className="text-xs text-[#233D49]/70">
                  Infraestructura segura en Node.js, Render y Supabase
                </p>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ── 4. BANNER FINAL CTA ─────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-b from-[#EEEBDD] to-[#E5E0CE] text-center border-t border-[#CBC6B6]/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#526F7D]/10 text-xs font-bold text-[#526F7D]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Empieza hoy mismo</span>
          </div>

          <h2 
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#233D49] tracking-tight leading-tight"
          >
            Lleva la gestión de tus eventos al estándar de sofisticación que merecen.
          </h2>

          <p className="text-base sm:text-lg text-[#233D49]/80 max-w-2xl mx-auto">
            Únete a las empresas de eventos que eliminaron los errores de agenda y multiplicaron sus ventas con EVENTRA y EVARA AI.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/precios"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#526F7D] hover:bg-[#3E5763] text-white font-semibold text-base shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
            >
              <span>Ver Planes y Comenzar</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/evara-ai"
              className="inline-flex items-center gap-2 px-6 py-4 rounded-xl bg-white hover:bg-[#FAFAF8] text-[#233D49] border border-[#CBC6B6] font-semibold text-base shadow-xs hover:shadow-md transition-all duration-200"
            >
              <Sparkles className="w-4 h-4 text-[#526F7D]" />
              <span>Conocer EVARA AI</span>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};
