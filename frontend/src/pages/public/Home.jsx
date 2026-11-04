import React, { useEffect, useState } from 'react';
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
  ChevronRight,
  Send,
  Building2,
  Lock,
  Check
} from 'lucide-react';

export const Home = () => {
  // Estado para el Cotizador Dinámico Interactivo en la Hero Feature Card del Bento Grid
  const [cotizadorPax, setCotizadorPax] = useState(150);
  const [cotizadorPaquete, setCotizadorPaquete] = useState('platino'); // 'platino' | 'imperial'

  // Precios base interactivos para el Cotizador del Bento
  const paquetesConfig = {
    platino: {
      nombre: 'Gala Platino',
      precioPax: 68,
      salonBase: 1200,
      incluye: ['Catering 3 tiempos gourmet', 'Barra libre de autor', 'Iluminación robótica & audio', 'Personal de sala calificado'],
    },
    imperial: {
      nombre: 'Gran Imperial',
      precioPax: 95,
      salonBase: 1800,
      incluye: ['Catering 5 tiempos premium', 'Cava internacional & coctelería', 'Escenografía y mapping', 'Coordinador exclusivo de gala'],
    },
  };

  const paqueteActivo = paquetesConfig[cotizadorPaquete];
  const costoTotal = paqueteActivo.salonBase + (cotizadorPax * paqueteActivo.precioPax);
  const anticipoRequerido = Math.round(costoTotal * 0.5);

  // Estado para el switcher de roles en la Multi-tenant Control Card
  const [rolActivo, setRolActivo] = useState('admin');

  // Estado de mensajes en la tarjeta interactiva de EVARA AI
  const [promptActivo, setPromptActivo] = useState(0);
  const promptsEvara = [
    {
      pregunta: '¿Tienen disponibilidad en el Salón Versalles para el 14 de Noviembre?',
      respuesta: '¡Disponible! La agenda no registra solapamientos para el 14 de Noviembre. Puedo apartar el turno noche con un anticipo del 50%.',
    },
    {
      pregunta: '¿Cuánto costaría una recepción para 180 personas con el Paquete Platino?',
      respuesta: 'Para 180 personas el total estimado es $13,440 ($68/pax + $1,200 salón base). Margen comercial protegido al 32%.',
    },
    {
      pregunta: '¿Qué personal se asigna automáticamente para esta escala de evento?',
      respuesta: 'Se asignan automáticamente 1 Gerente de Piso, 12 Meseros, 2 Barmans y 1 Técnico Audiovisual bajo control RBAC.',
    },
  ];

  useEffect(() => {
    document.title = 'EVENTRA — Plataforma SaaS de Gestión Inteligente de Eventos';
  }, []);

  return (
    <div className="overflow-hidden bg-[var(--ev-bg-base)] text-[var(--ev-text-main)] transition-colors duration-300">
      
      {/* ── 1. HERO SECTION ASIMÉTRICO (7:5) CON PROFUNDIDAD ÓPTICA ────────── */}
      <section className="relative pt-8 pb-20 md:pt-14 md:pb-28">
        
        {/* Luces especulares ambientales suaves */}
        <div 
          className="absolute top-10 -left-20 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-40 transition-colors duration-500"
          style={{ backgroundColor: 'var(--ev-primary)' }}
        />
        <div 
          className="absolute bottom-10 right-0 w-[30rem] h-[30rem] rounded-full blur-3xl pointer-events-none opacity-30 transition-colors duration-500"
          style={{ backgroundColor: 'var(--ev-border)' }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Columna Izquierda (7 cols): Copy Editorial B2B SaaS */}
            <div className="lg:col-span-7 flex flex-col items-start space-y-6">
              
              {/* Eyebrow de Categoría (Apple HIG Display Optics) */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full ev-liquid-glass shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--ev-primary)]" />
                <span className="text-[11px] uppercase tracking-[0.16em] font-semibold text-[var(--ev-primary)]">
                  Plataforma SaaS · Centros de Eventos & Recepciones
                </span>
              </div>

              {/* Título H1 Serif Display Elegante */}
              <h1 
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[var(--ev-text-main)] tracking-[-0.03em] leading-[1.06]"
              >
                Gestión inteligente para empresas de eventos.
              </h1>

              {/* Subtítulo con Jerarquía por Voz (Estilo Apple) */}
              <p className="text-lg sm:text-xl leading-relaxed max-w-2xl">
                <span className="text-[var(--ev-text-main)] font-semibold">
                  Centraliza cotizaciones dinámicas, reservas blindadas y conciliación de pagos en un solo lugar.&nbsp;
                </span>
                <span className="text-[var(--ev-text-muted)] font-normal">
                  Diseñado bajo arquitectura de concurrencia para erradicar el doble agendamiento y orquestar recepciones con precisión absoluta.
                </span>
              </p>

              {/* Doble Acción (CTA Primario + Acción Secundaria en Liquid Glass) */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto pt-2">
                <Link
                  to="/precios"
                  className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[var(--ev-primary)] hover:bg-[var(--ev-primary-hover)] text-white font-semibold text-base shadow-sm hover:shadow-md active:scale-[0.98] apple-spring"
                >
                  <span>Comenzar Prueba / Ver Planes</span>
                  <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 apple-spring" />
                </Link>

                <a
                  href="#bento-grid"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full ev-liquid-glass text-[var(--ev-text-main)] font-semibold text-base hover:bg-[var(--ev-surface)] active:scale-[0.98] apple-spring shadow-xs"
                >
                  <span>Explorar Bento Grid</span>
                </a>
              </div>

              {/* Métricas Tabulares Rápidas */}
              <div className="pt-6 border-t border-[var(--ev-border)]/60 w-full grid grid-cols-3 gap-4 text-left">
                <div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-[var(--ev-text-main)] tabular-nums tracking-tight">
                    0%
                  </p>
                  <p className="text-xs sm:text-sm text-[var(--ev-text-muted)] font-medium mt-0.5">
                    Colisiones de agenda
                  </p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-[var(--ev-text-main)] tabular-nums tracking-tight">
                    24/7
                  </p>
                  <p className="text-xs sm:text-sm text-[var(--ev-text-muted)] font-medium mt-0.5">
                    Asistencia EVARA AI
                  </p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-[var(--ev-text-main)] tabular-nums tracking-tight">
                    +1,200
                  </p>
                  <p className="text-xs sm:text-sm text-[var(--ev-text-muted)] font-medium mt-0.5">
                    Eventos orquestados
                  </p>
                </div>
              </div>

            </div>

            {/* Columna Derecha (5 cols): Composición Multicapa con Perspectiva Óptica */}
            <div className="lg:col-span-5 relative">
              
              {/* Tarjeta Principal Externa con Radios Concéntricos (R_ext 28px - p-4 = R_int 12px) */}
              <div className="relative rounded-[28px] p-4 sm:p-5 ev-liquid-glass-elevated shadow-xl border border-[var(--ev-border)]/70 transform hover:scale-[1.008] apple-spring">
                
                {/* Cabecera de la Aplicación */}
                <div className="flex items-center justify-between pb-3.5 border-b border-[var(--ev-border)]/50 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#C95C5C]/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#C49A3A]/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#4D9A72]/80 inline-block" />
                    <span className="text-xs font-semibold text-[var(--ev-primary)] ml-2 tracking-wide font-mono">
                      app.eventra.com/workspace
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#4D9A72]/15 text-[#4D9A72] text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4D9A72] animate-pulse" />
                    En vivo
                  </div>
                </div>

                {/* KPI Cards Interiores simuladas (R_int 12px) */}
                <div className="grid grid-cols-2 gap-2.5 mb-4">
                  <div className="p-3 rounded-[12px] bg-[var(--ev-bg-base)]/60 border border-[var(--ev-border)]/60">
                    <div className="flex items-center justify-between text-[var(--ev-primary)] text-xs font-medium mb-1">
                      <span>Salón Imperial</span>
                      <CalendarCheck className="w-3.5 h-3.5 text-[var(--ev-primary)]" />
                    </div>
                    <div className="text-base font-bold text-[var(--ev-text-main)]">100% Bloqueado</div>
                    <span className="text-[10px] text-[#4D9A72] font-semibold flex items-center gap-1 mt-0.5">
                      <ShieldCheck className="w-3 h-3" /> Sin conflicto
                    </span>
                  </div>

                  <div className="p-3 rounded-[12px] bg-[var(--ev-bg-base)]/60 border border-[var(--ev-border)]/60">
                    <div className="flex items-center justify-between text-[var(--ev-primary)] text-xs font-medium mb-1">
                      <span>Cotizaciones Mes</span>
                      <TrendingUp className="w-3.5 h-3.5 text-[var(--ev-primary)]" />
                    </div>
                    <div className="text-base font-bold text-[var(--ev-text-main)]">$38,450</div>
                    <span className="text-[10px] text-[var(--ev-primary)] font-medium mt-0.5 block">
                      14 proformas activas
                    </span>
                  </div>
                </div>

                {/* Tarjeta de Evento en Curso (R_int 16px) */}
                <div className="p-4 rounded-[16px] bg-[var(--ev-surface)] border border-[var(--ev-border)]/70 shadow-xs space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ev-primary)]">
                        Evento en Curso · Hoy
                      </span>
                      <h4 className="text-sm font-bold text-[var(--ev-text-main)]">
                        Gala Nupcial Salazar & Vega
                      </h4>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[var(--ev-primary)]/10 text-[var(--ev-primary)] border border-[var(--ev-primary)]/20">
                      180 Pax
                    </span>
                  </div>

                  {/* Barra de progreso de montaje */}
                  <div>
                    <div className="flex justify-between text-[11px] font-medium text-[var(--ev-text-main)]/80 mb-1">
                      <span>Fase 3: Montaje y Catering</span>
                      <span className="font-bold text-[var(--ev-primary)]">85%</span>
                    </div>
                    <div className="w-full bg-[var(--ev-bg-base)] rounded-full h-2 overflow-hidden">
                      <div 
                        className="h-2 rounded-full w-[85%] transition-all duration-500" 
                        style={{ backgroundColor: 'var(--ev-primary)' }}
                      />
                    </div>
                  </div>

                  {/* Checklist Rápido de Personal */}
                  <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-[var(--ev-text-main)]/80">
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

                {/* Sub-tarjeta de EVARA AI en segundo plano */}
                <div className="flex items-center justify-between p-3 rounded-[14px] bg-[var(--ev-primary)]/10 border border-[var(--ev-primary)]/25 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[var(--ev-primary)] flex items-center justify-center text-white shadow-xs">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-semibold text-[var(--ev-text-main)]">
                      EVARA AI cotizando catálogo en tiempo real
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-[var(--ev-primary)] uppercase tracking-wider">
                    Activa
                  </span>
                </div>

              </div>

              {/* Badge Flotante en Liquid Glass con Iluminación Especular Superior */}
              <div className="absolute -bottom-5 -left-5 py-2.5 px-4 rounded-[18px] ev-liquid-glass shadow-lg border border-[var(--ev-border)]/80 flex items-center gap-2.5 text-xs font-semibold text-[var(--ev-text-main)] hidden sm:flex">
                <ShieldCheck className="w-4 h-4 text-[#4D9A72]" />
                <span>Zero Double-Booking Garantizado</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 2. SECCIÓN "EL CAOS VS LA CERTEZA EVENTRA" ──────────────────── */}
      <section className="py-20 bg-[var(--ev-surface)]/70 border-y border-[var(--ev-border)]/60 scroll-mt-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-[11px] uppercase tracking-[0.16em] font-semibold text-[var(--ev-primary)] px-3 py-1 rounded-full bg-[var(--ev-primary)]/10">
              Transformación Operativa
            </span>
            <h2 
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              className="text-3xl sm:text-4xl font-bold text-[var(--ev-text-main)] tracking-[-0.02em]"
            >
              El Caos Tradicional vs La Certeza EVENTRA
            </h2>
            <p className="text-base sm:text-lg">
              <span className="text-[var(--ev-text-main)] font-semibold">
                La diferencia entre operar con herramientas desarticuladas&nbsp;
              </span>
              <span className="text-[var(--ev-text-muted)] font-normal">
                y contar con un ecosistema transaccional blindado de extremo a extremo.
              </span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            
            {/* Columna Izquierda: Forma Tradicional */}
            <div className="rounded-[28px] p-7 sm:p-9 bg-[var(--ev-bg-base)]/50 border border-[#C95C5C]/35 shadow-xs relative">
              <div className="flex items-center gap-3 pb-6 border-b border-[var(--ev-border)]/50">
                <div className="w-10 h-10 rounded-[14px] bg-[#C95C5C]/15 flex items-center justify-center text-[#C95C5C]">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[var(--ev-text-main)]">
                    La forma tradicional
                  </h3>
                  <p className="text-xs text-[var(--ev-text-muted)] font-medium">
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
                      <h4 className="text-sm font-semibold text-[var(--ev-text-main)]">{item.title}</h4>
                      <p className="text-xs text-[var(--ev-text-muted)] leading-relaxed mt-0.5">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Columna Derecha: Con EVENTRA */}
            <div className="rounded-[28px] p-7 sm:p-9 bg-[var(--ev-surface)] border-2 border-[var(--ev-primary)]/50 shadow-md relative ev-liquid-glass">
              <div className="absolute -top-3.5 right-6 px-3.5 py-1 rounded-full bg-[var(--ev-primary)] text-white text-[11px] font-bold uppercase tracking-wider shadow-sm">
                Solución Blindada
              </div>

              <div className="flex items-center gap-3 pb-6 border-b border-[var(--ev-border)]/50">
                <div className="w-10 h-10 rounded-[14px] bg-[var(--ev-primary)] flex items-center justify-center text-white shadow-xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[var(--ev-text-main)]">
                    Con EVENTRA SaaS
                  </h3>
                  <p className="text-xs text-[var(--ev-primary)] font-medium">
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
                      <h4 className="text-sm font-semibold text-[var(--ev-text-main)]">{item.title}</h4>
                      <p className="text-xs text-[var(--ev-text-muted)] leading-relaxed mt-0.5">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          <div className="mt-12 text-center">
            <Link
              to="/funcionalidades"
              className="inline-flex items-center gap-2 text-sm font-bold text-[var(--ev-primary)] hover:text-[var(--ev-primary-hover)] transition-colors"
            >
              <span>Descubre el funcionamiento de cada uno de los módulos en detalle</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </section>

      {/* ── 3. BENTO GRID DE BENEFICIOS (12 COLUMNAS DE ALTA DENSIDAD) ────── */}
      <section id="bento-grid" className="py-24 scroll-mt-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Encabezado de Sección */}
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-[11px] uppercase tracking-[0.16em] font-semibold text-[var(--ev-primary)] px-3 py-1 rounded-full ev-liquid-glass">
              Arquitectura & Capacidades
            </span>
            <h2 
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              className="text-3xl sm:text-5xl font-bold text-[var(--ev-text-main)] tracking-[-0.03em]"
            >
              Potencia operativa en cada píxel.
            </h2>
            <p className="text-base sm:text-lg">
              <span className="text-[var(--ev-text-main)] font-semibold">
                Cuatro pilares de tecnología de vanguardia&nbsp;
              </span>
              <span className="text-[var(--ev-text-muted)] font-normal">
                articulados para transformar la rentabilidad y reputación de tu centro de recepciones.
              </span>
            </p>
          </div>

          {/* Grilla Asimétrica Bento Grid de 12 Columnas */}
          <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* ARQUETIPO 1: Hero Feature Card (col-span-12 lg:col-span-7)
                Cotizador Dinámico en tiempo real con micro-UI interactiva que sangra por el borde inferior */}
            <div className="col-span-12 lg:col-span-7 rounded-[28px] p-6 sm:p-7 bg-[var(--ev-surface)] border border-[var(--ev-border)]/70 shadow-sm relative overflow-hidden flex flex-col justify-between group hover:shadow-md apple-spring">
              
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] uppercase tracking-[0.16em] font-bold text-[var(--ev-primary)]">
                    Micro-UI Interactiva · Proforma Viva
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[var(--ev-primary)]/15 text-[var(--ev-primary)]">
                    Margen Protegido
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-[var(--ev-text-main)] tracking-tight mb-2">
                  Cotizador Dinámico de Alta Precisión
                </h3>
                <p className="text-sm text-[var(--ev-text-muted)] mb-6 max-w-xl">
                  Prueba el selector en vivo: calcula costos por comensal, alquiler de salón y anticipo requerido con desglose exacto sin fórmulas rotas.
                </p>

                {/* Controles del Simulador Interactivo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {/* Selector de Paquete */}
                  <div className="p-3 rounded-[16px] bg-[var(--ev-bg-base)]/50 border border-[var(--ev-border)]/60">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--ev-text-muted)] block mb-1.5">
                      Paquete de Gala
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {['platino', 'imperial'].map((pKey) => (
                        <button
                          key={pKey}
                          type="button"
                          onClick={() => setCotizadorPaquete(pKey)}
                          className={`px-2.5 py-1.5 rounded-[10px] text-xs font-semibold transition-all active:scale-[0.98] ${
                            cotizadorPaquete === pKey
                              ? 'bg-[var(--ev-primary)] text-white shadow-xs'
                              : 'bg-[var(--ev-surface)] text-[var(--ev-text-main)] hover:bg-[var(--ev-border)]/30 border border-[var(--ev-border)]/50'
                          }`}
                        >
                          {paquetesConfig[pKey].nombre}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Selector de Comensales (Pax) */}
                  <div className="p-3 rounded-[16px] bg-[var(--ev-bg-base)]/50 border border-[var(--ev-border)]/60">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--ev-text-muted)]">
                        Número de Invitados
                      </label>
                      <span className="text-xs font-extrabold text-[var(--ev-primary)] tabular-nums">
                        {cotizadorPax} Pax
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {[50, 100, 150, 250].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setCotizadorPax(num)}
                          className={`flex-1 py-1 rounded-[8px] text-[11px] font-bold transition-all active:scale-[0.98] ${
                            cotizadorPax === num
                              ? 'bg-[var(--ev-text-main)] text-[var(--ev-bg-base)]'
                              : 'bg-[var(--ev-surface)] text-[var(--ev-text-main)] hover:bg-[var(--ev-border)]/30 border border-[var(--ev-border)]/50'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Micro-UI que Sangra por el Borde Inferior (Concentric squircle math: R_ext 28px - p-6 = R_int 16px) */}
              <div className="mt-2 -mb-8 -mx-7 pt-4 px-6 pb-8 bg-[var(--ev-bg-base)]/80 border-t border-[var(--ev-border)]/60 rounded-b-[28px]">
                <div className="p-4 rounded-[16px] bg-[var(--ev-surface)] border border-[var(--ev-border)]/70 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[var(--ev-border)]/40 gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ev-primary)]">
                        Desglose en Tiempo Real
                      </span>
                      <h4 className="text-sm font-bold text-[var(--ev-text-main)]">
                        {paqueteActivo.nombre} ({cotizadorPax} invitados)
                      </h4>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-[var(--ev-text-muted)] font-medium block">Total Estimado</span>
                      <span className="text-xl sm:text-2xl font-black text-[var(--ev-text-main)] tabular-nums">
                        ${costoTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-3 text-[11px]">
                    <div className="p-2 rounded-[10px] bg-[var(--ev-bg-base)]/40">
                      <span className="text-[10px] text-[var(--ev-text-muted)] block">Tarifa por Invitado</span>
                      <span className="font-bold text-[var(--ev-text-main)]">${paqueteActivo.precioPax} / pax</span>
                    </div>
                    <div className="p-2 rounded-[10px] bg-[var(--ev-bg-base)]/40">
                      <span className="text-[10px] text-[var(--ev-text-muted)] block">Alquiler de Salón</span>
                      <span className="font-bold text-[var(--ev-text-main)]">${paqueteActivo.salonBase}</span>
                    </div>
                    <div className="p-2 rounded-[10px] bg-[var(--ev-primary)]/10 text-[var(--ev-primary)] col-span-2 sm:col-span-1">
                      <span className="text-[10px] block font-semibold">Anticipo 50%</span>
                      <span className="font-bold">${anticipoRequerido.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* ARQUETIPO 2: Typographic Stat Card (col-span-12 lg:col-span-5)
                Cifra masiva tabular sobre superficie de contraste */}
            <div className="col-span-12 lg:col-span-5 rounded-[28px] p-7 sm:p-8 bg-[var(--ev-text-main)] text-[var(--ev-surface)] relative overflow-hidden shadow-xl flex flex-col justify-between group hover:scale-[1.008] apple-spring">
              
              {/* Resplandor superior sutil */}
              <div 
                className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
                style={{ backgroundColor: 'var(--ev-primary)' }}
              />

              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-[0.16em] font-bold text-[var(--ev-border)]">
                    Motor Transaccional PostgreSQL
                  </span>
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
                    <Lock className="w-4 h-4" />
                  </div>
                </div>

                {/* Cifra Masiva Tabular */}
                <div className="py-2">
                  <p className="text-6xl sm:text-7xl font-black tracking-tight tabular-nums text-white leading-none">
                    0%
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-white/90 mt-2">
                    Colisiones de Agenda
                  </p>
                </div>

                <p className="text-sm text-white/75 leading-relaxed">
                  Las reservas están protegidas por aislamiento de concurrencia y restricciones <code className="px-1.5 py-0.5 rounded bg-white/15 text-white font-mono text-xs">UNIQUE (salon_id, fecha, turno)</code>. Es computacionalmente imposible confirmar dos eventos en el mismo espacio.
                </p>
              </div>

              <div className="relative z-10 pt-6 mt-6 border-t border-white/15 flex items-center justify-between text-xs">
                <span className="text-white/70">Aislamiento SERIALIZABLE</span>
                <span className="inline-flex items-center gap-1.5 text-[#56BA85] font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#56BA85] animate-pulse" />
                  Activo en Supabase
                </span>
              </div>

            </div>

            {/* ARQUETIPO 3: Interactive AI Card (col-span-12 lg:col-span-5)
                Previsualización viva del chatbot EVARA AI */}
            <div className="col-span-12 lg:col-span-5 rounded-[28px] p-6 sm:p-7 ev-liquid-glass shadow-sm flex flex-col justify-between relative group hover:shadow-md apple-spring">
              
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] uppercase tracking-[0.16em] font-bold text-[var(--ev-primary)]">
                    Inteligencia Artificial Conversacional
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--ev-primary)]/15 text-[var(--ev-primary)]">
                    <Sparkles className="w-3 h-3" />
                    24/7
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-[var(--ev-text-main)] tracking-tight mb-2">
                  EVARA AI Assistant
                </h3>
                <p className="text-sm text-[var(--ev-text-muted)] mb-5">
                  Atiende a tus clientes mientras descansas. Conoce tu catálogo, disponibilidad y cotiza con exactitud corporativa.
                </p>

                {/* Selector de Pregunta de Prueba */}
                <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1">
                  {promptsEvara.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPromptActivo(idx)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all active:scale-[0.98] ${
                        promptActivo === idx
                          ? 'bg-[var(--ev-primary)] text-white shadow-xs'
                          : 'bg-[var(--ev-surface)] text-[var(--ev-text-main)] hover:bg-[var(--ev-border)]/30 border border-[var(--ev-border)]/50'
                      }`}
                    >
                      Ejemplo {idx + 1}
                    </button>
                  ))}
                </div>

                {/* Simulación del Chat en Vivo (Concentric Squircle: R_ext 28px - p-6 = R_int 16px) */}
                <div className="p-4 rounded-[16px] bg-[var(--ev-surface)] border border-[var(--ev-border)]/60 shadow-xs space-y-3">
                  {/* Mensaje del Usuario */}
                  <div className="flex items-start gap-2 justify-end">
                    <div className="p-3 rounded-2xl rounded-tr-xs bg-[var(--ev-primary)] text-white text-xs max-w-[85%] shadow-xs">
                      {promptsEvara[promptActivo].pregunta}
                    </div>
                  </div>

                  {/* Mensaje de EVARA AI */}
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-[var(--ev-primary)]/15 text-[var(--ev-primary)] flex items-center justify-center shrink-0 mt-1">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div className="p-3 rounded-2xl rounded-tl-xs bg-[var(--ev-bg-base)]/70 text-[var(--ev-text-main)] text-xs max-w-[85%] border border-[var(--ev-border)]/50 leading-relaxed">
                      {promptsEvara[promptActivo].respuesta}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-[var(--ev-border)]/50 flex items-center justify-between text-xs">
                <span className="text-[var(--ev-text-muted)]">Integrado con Google Gemini & OpenAI</span>
                <Link
                  to="/evara-ai"
                  className="inline-flex items-center gap-1 font-bold text-[var(--ev-primary)] hover:underline"
                >
                  <span>Conocer EVARA</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

            </div>

            {/* ARQUETIPO 4: Multi-tenant Control Card (col-span-12 lg:col-span-7)
                Control de reservas, pagos y roles multi-empresa */}
            <div className="col-span-12 lg:col-span-7 rounded-[28px] p-6 sm:p-7 bg-[var(--ev-surface)] border border-[var(--ev-border)]/70 shadow-sm flex flex-col justify-between group hover:shadow-md apple-spring">
              
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] uppercase tracking-[0.16em] font-bold text-[var(--ev-primary)]">
                    Seguridad & Multi-Inquilino (RBAC)
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#4D9A72]/15 text-[#4D9A72]">
                    4 Roles Estrictos
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-[var(--ev-text-main)] tracking-tight mb-2">
                  Gobernanza y Conciliación Financiera
                </h3>
                <p className="text-sm text-[var(--ev-text-muted)] mb-5 max-w-xl">
                  Cada empresa opera en su propio espacio seguro. El control basado en roles separa la administración de la operación en pista y el portal del anfitrión.
                </p>

                {/* Switcher de Roles Interactivo */}
                <div className="flex items-center gap-1.5 p-1 rounded-full bg-[var(--ev-bg-base)]/60 border border-[var(--ev-border)]/50 mb-5 overflow-x-auto">
                  {[
                    { id: 'admin', label: 'Administrador', desc: 'Control total de facturación, contratos y reportes ejecutivos.' },
                    { id: 'gerente', label: 'Gerente', desc: 'Supervisión de cotizaciones, salones y asignación de colaboradores.' },
                    { id: 'trabajador', label: 'Trabajador', desc: 'Checklist móvil de tareas de montaje y protocolo sin acceso a finanzas.' },
                    { id: 'cliente', label: 'Cliente', desc: 'Portal exclusivo para ver proformas, subir comprobantes y seguir su gala.' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRolActivo(r.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-[0.98] ${
                        rolActivo === r.id
                          ? 'bg-[var(--ev-primary)] text-white shadow-xs'
                          : 'text-[var(--ev-text-main)]/80 hover:bg-[var(--ev-surface)]'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>

                {/* Pipeline de Pagos & Auditoría (Concentric Squircle: R_int 16px) */}
                <div className="p-4 rounded-[16px] bg-[var(--ev-bg-base)]/40 border border-[var(--ev-border)]/60 space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-[var(--ev-text-main)]">
                    <span>Flujo de Conciliación Bancaria</span>
                    <span className="text-[var(--ev-primary)] font-mono text-[11px]">Storage Supabase</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div className="p-2.5 rounded-[12px] bg-[var(--ev-surface)] border border-[var(--ev-border)]/50">
                      <div className="flex items-center gap-1.5 text-[#4D9A72] font-bold mb-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Anticipo 50%</span>
                      </div>
                      <p className="text-[11px] text-[var(--ev-text-muted)]">Conciliado con comprobante</p>
                    </div>

                    <div className="p-2.5 rounded-[12px] bg-[var(--ev-surface)] border border-[var(--ev-border)]/50">
                      <div className="flex items-center gap-1.5 text-[#C49A3A] font-bold mb-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Saldo 50%</span>
                      </div>
                      <p className="text-[11px] text-[var(--ev-text-muted)]">Exigido 48h antes de gala</p>
                    </div>

                    <div className="p-2.5 rounded-[12px] bg-[var(--ev-surface)] border border-[var(--ev-border)]/50">
                      <div className="flex items-center gap-1.5 text-[var(--ev-primary)] font-bold mb-1">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Marca Blanca</span>
                      </div>
                      <p className="text-[11px] text-[var(--ev-text-muted)]">Logo y paleta propia</p>
                    </div>
                  </div>
                </div>

              </div>

              <div className="pt-4 mt-4 border-t border-[var(--ev-border)]/50 flex items-center justify-between text-xs">
                <span className="text-[var(--ev-text-muted)]">Cumplimiento con auditoría estricta</span>
                <span className="font-bold text-[var(--ev-primary)]">TLS 1.3 · JWT Auth</span>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ── 4. SECCIÓN DE PLANES (PRICING CON ANCLAJE VISUAL) ─────────────── */}
      <section className="py-24 bg-[var(--ev-surface)]/60 border-t border-[var(--ev-border)]/60 scroll-mt-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-[11px] uppercase tracking-[0.16em] font-semibold text-[var(--ev-primary)] px-3 py-1 rounded-full ev-liquid-glass">
              Precios Transparentes
            </span>
            <h2 
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              className="text-3xl sm:text-5xl font-bold text-[var(--ev-text-main)] tracking-[-0.03em]"
            >
              Inversión clara para escalar tu empresa.
            </h2>
            <p className="text-base sm:text-lg">
              <span className="text-[var(--ev-text-main)] font-semibold">
                Sin comisiones ocultas por evento.&nbsp;
              </span>
              <span className="text-[var(--ev-text-muted)] font-normal">
                Comienza en el plan que mejor se adapte al volumen de tu centro de recepciones.
              </span>
            </p>
          </div>

          {/* Comparativa entre Plan Básico y Plan Premium */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto items-stretch">
            
            {/* PLAN BÁSICO (Superficie Estándar Pulida) */}
            <div className="rounded-[28px] p-7 sm:p-9 bg-[var(--ev-surface)] border border-[var(--ev-border)]/80 shadow-sm flex flex-col justify-between apple-spring hover:shadow-md">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-[var(--ev-text-main)]">
                      Plan Básico
                    </h3>
                    <p className="text-xs text-[var(--ev-text-muted)] font-medium mt-0.5">
                      Para salones boutique y empresas emergentes
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[var(--ev-border)]/40 text-[var(--ev-text-main)]">
                    Esencial
                  </span>
                </div>

                <div className="my-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl sm:text-5xl font-extrabold text-[var(--ev-text-main)] tabular-nums">
                      $29
                    </span>
                    <span className="text-sm text-[var(--ev-text-muted)] font-medium">/ mes</span>
                  </div>
                  <p className="text-xs text-[var(--ev-text-muted)] mt-1">Facturación mensual o anual</p>
                </div>

                {/* Lista de Capacidades con Radios Concéntricos */}
                <div className="p-4 rounded-[16px] bg-[var(--ev-bg-base)]/40 border border-[var(--ev-border)]/50 mb-6">
                  <ul className="space-y-3 text-xs text-[var(--ev-text-main)]/85">
                    {[
                      'Hasta 3 colaboradores del equipo',
                      'Hasta 15 eventos gestionados al mes',
                      'Cotizador dinámico con catálogo base',
                      'Prevención estricta de doble agendamiento',
                      'Recepción de comprobantes de pago',
                      'Soporte estándar por correo',
                    ].map((feat, i) => (
                      <li key={i} className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-[var(--ev-primary)] shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <Link
                to="/precios"
                className="w-full text-center py-3.5 px-6 rounded-full bg-[var(--ev-surface)] hover:bg-[var(--ev-border)]/25 text-[var(--ev-text-main)] border border-[var(--ev-border)] font-semibold text-sm active:scale-[0.98] apple-spring shadow-xs"
              >
                Comenzar con Plan Básico
              </Link>
            </div>

            {/* PLAN PREMIUM (Tarjeta Destacada con Superficie Diferenciada y Anclaje Visual) */}
            <div className="rounded-[28px] p-7 sm:p-9 bg-[var(--ev-text-main)] text-[var(--ev-surface)] border-2 border-[var(--ev-primary)]/60 shadow-2xl relative flex flex-col justify-between apple-spring hover:scale-[1.01]">
              
              {/* Badge Flotante Luminoso */}
              <div className="absolute -top-3.5 right-8 px-4 py-1 rounded-full bg-[var(--ev-primary)] text-white text-[11px] font-bold uppercase tracking-wider shadow-md">
                Recomendado · Más Popular
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      Plan Premium
                    </h3>
                    <p className="text-xs text-white/70 font-medium mt-0.5">
                      Para centros de convenciones y alta demanda
                    </p>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[var(--ev-primary)]">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                </div>

                <div className="my-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl sm:text-5xl font-extrabold text-white tabular-nums">
                      $79
                    </span>
                    <span className="text-sm text-white/70 font-medium">/ mes</span>
                  </div>
                  <p className="text-xs text-white/60 mt-1">Acceso ilimitado con todas las funciones pro</p>
                </div>

                {/* Lista de Capacidades Premium (R_int 16px) */}
                <div className="p-4 rounded-[16px] bg-white/10 border border-white/15 mb-6">
                  <ul className="space-y-3 text-xs text-white/90">
                    {[
                      'Eventos y cotizaciones ilimitadas',
                      'Colaboradores ilimitados (Admin, Gerente, Trabajador)',
                      'Asistente comercial EVARA AI 24/7 sin límites',
                      'Marca Blanca completa (logo, slug y paleta propia)',
                      'Aislamiento PostgreSQL multi-salón blindado',
                      'Portal del Cliente interactivo con seguimiento',
                      'Soporte prioritario y asesoría de onboarding',
                    ].map((feat, i) => (
                      <li key={i} className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-[#56BA85] shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <Link
                to="/precios"
                className="w-full text-center py-3.5 px-6 rounded-full bg-[var(--ev-primary)] hover:bg-[var(--ev-primary-hover)] text-white font-semibold text-sm active:scale-[0.98] apple-spring shadow-lg hover:shadow-xl"
              >
                Suscribirse al Plan Premium
              </Link>
            </div>

          </div>

          <div className="mt-12 text-center">
            <Link
              to="/precios"
              className="inline-flex items-center gap-2 text-sm font-bold text-[var(--ev-primary)] hover:underline"
            >
              <span>Ver tabla comparativa detallada y métodos de pago</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </section>

      {/* ── 5. BANNER FINAL CTA (LIQUID GLASS ELEVATED) ─────────────────── */}
      <section className="py-20 border-t border-[var(--ev-border)]/60 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 relative z-10">
          
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full ev-liquid-glass text-xs font-bold text-[var(--ev-primary)]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Empieza hoy mismo con tu centro de eventos</span>
          </div>

          <h2 
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--ev-text-main)] tracking-[-0.03em] leading-tight"
          >
            Lleva la orquestación de tus eventos al estándar de sofisticación que merecen.
          </h2>

          <p className="text-base sm:text-lg max-w-2xl mx-auto">
            <span className="text-[var(--ev-text-main)] font-semibold">
              Únete a las empresas de eventos que eliminaron los errores de agenda&nbsp;
            </span>
            <span className="text-[var(--ev-text-muted)] font-normal">
              y multiplicaron sus cierres comerciales con EVENTRA y EVARA AI.
            </span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/precios"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[var(--ev-primary)] hover:bg-[var(--ev-primary-hover)] text-white font-semibold text-base shadow-md hover:shadow-lg active:scale-[0.98] apple-spring"
            >
              <span>Ver Planes y Comenzar</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/evara-ai"
              className="inline-flex items-center gap-2 px-7 py-4 rounded-full ev-liquid-glass text-[var(--ev-text-main)] font-semibold text-base hover:bg-[var(--ev-surface)] active:scale-[0.98] apple-spring shadow-xs"
            >
              <Sparkles className="w-4 h-4 text-[var(--ev-primary)]" />
              <span>Conocer EVARA AI</span>
            </Link>
          </div>

        </div>
      </section>

    </div>
  );
};
