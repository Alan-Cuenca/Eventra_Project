import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  CalendarDays, 
  CheckSquare, 
  UserCheck, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  DollarSign, 
  Users, 
  Layers, 
  Database, 
  Smartphone,
  ChevronRight,
  Eye,
  Sliders,
  Send
} from 'lucide-react';

export const Features = () => {
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    document.title = 'Funcionalidades & Módulos - EVENTRA SaaS';
  }, []);

  const modules = [
    {
      id: 'cotizador',
      title: 'Cotizador Dinámico',
      subtitle: 'Stepper de 4 pasos con cálculo instantáneo y margen protegido',
      icon: FileText,
      badge: 'Ventas & Proformas',
      description: 'Genera cotizaciones profesionales y transparentes en minutos. El sistema calcula automáticamente tarifas por comensal, servicios a la carta y alquiler del salón, asegurando que tus márgenes nunca queden vulnerables.',
      highlights: [
        'Paso 1: Parámetros del Evento (Tipo, número de invitados, salón seleccionado y turno)',
        'Paso 2: Selección de Paquete Base (Boda de Ensueño, Graduación Deluxe, Fiesta Corporativa)',
        'Paso 3: Servicios Adicionales (Catering gourmet, mobiliario de lujo, coctelería, iluminación)',
        'Paso 4: Resumen Comercial con desglose por persona, margen de ganancia y exportación en PDF'
      ],
      technicalNote: 'El cotizador sincroniza con el catálogo de precios de la empresa y actualiza totales en tiempo real al alterar el número de invitados.'
    },
    {
      id: 'reservas',
      title: 'Control de Reservas & Agenda',
      subtitle: 'Garantía Zero Double-Booking respaldada por PostgreSQL',
      icon: CalendarDays,
      badge: 'Cero Colisiones',
      description: 'El corazón operativo de EVENTRA. Administra salones, fechas y turnos sin margen para el error humano. Si un salón ya tiene una reserva en ese horario, el sistema bloquea inmediatamente cualquier intento de cruce.',
      highlights: [
        'Restricción estricta UNIQUE a nivel de base de datos relacional (salon_id, fecha, turno)',
        'Respuesta HTTP 409 Conflict inmediata ante intentos de concurrencia duplicada',
        'Vista de calendario interactivo con código de colores por estado (Pendiente, Confirmada, Finalizada)',
        'Transición formal de cotización aprobada hacia reserva definitiva en un solo clic'
      ],
      technicalNote: 'La validación se realiza a nivel transaccional en PostgreSQL, no en memoria del frontend, erradicando fallos de red o desincronizaciones.'
    },
    {
      id: 'cronograma',
      title: 'Cronograma & Checklist del Personal',
      subtitle: 'Coordinación milimétrica para el equipo operativo en piso',
      icon: CheckSquare,
      badge: 'Operación Exacta',
      description: 'Empodera a tus coordinadores, decoradores, cocineros y técnicos de audio con un checklist móvil en vivo. Cada integrante sabe exactamente qué debe estar listo y a qué hora para cada fase del evento.',
      highlights: [
        'Desglose por fases cronológicas: Pre-evento, Montaje, Recepción, Protocolo y Desmontaje',
        'Asignación específica por rol (Cocina, Decoración, Seguridad, Sonido e Iluminación)',
        'Barra de completitud porcentual visible en tiempo real para gerentes y supervisores',
        'Vista móvil adaptada para que el trabajador marque sus tareas desde su propio teléfono'
      ],
      technicalNote: 'Control de acceso granular RBAC: los trabajadores solo visualizan las tareas que les han sido asignadas para la jornada.'
    },
    {
      id: 'portal',
      title: 'Portal Exclusivo para el Anfitrión',
      subtitle: 'Experiencia premium y transparente para tus clientes (Rol Cliente)',
      icon: UserCheck,
      badge: 'Fidelización & Confianza',
      description: 'Brinda a la pareja o anfitrión corporativo un portal privado y elegante donde pueden consultar el avance de su evento, revisar su menú, confirmar número de asistentes y validar sus pagos.',
      highlights: [
        'Acceso seguro con credenciales exclusivas generadas al aprobar la reserva',
        'Visualización del cronograma del día para total tranquilidad del anfitrión',
        'Desglose claro de pagos: anticipo abonado, saldo restante y fechas límites',
        'Carga directa de comprobantes de pago y visualización de notas del organizador'
      ],
      technicalNote: 'Desacopla la gestión operativa del contacto diario: disminuye hasta un 70% los mensajes de WhatsApp solicitando estados.'
    }
  ];

  const currentMod = modules[activeTab];

  return (
    <div className="py-12 md:py-16">
      
      {/* ── Encabezado de la Página ─────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#CBC6B6] text-xs font-semibold text-[#526F7D] shadow-xs mb-4">
          <Sparkles className="w-3.5 h-3.5 text-[#526F7D]" />
          <span>Tour Completo del Producto</span>
        </div>

        <h1 
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#233D49] tracking-tight max-w-4xl mx-auto leading-tight"
        >
          Cada fase de tu evento, orquestada con precisión milimétrica.
        </h1>

        <p className="mt-4 text-lg text-[#233D49]/80 max-w-2xl mx-auto">
          Descubre los cuatro pilares tecnológicos de EVENTRA diseñados para eliminar la fricción operativa y multiplicar la rentabilidad de tu centro de recepciones.
        </p>
      </div>

      {/* ── Navegación por Tabs ─────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="flex flex-wrap items-center justify-center gap-3 p-1.5 bg-[#CBC6B6]/30 rounded-2xl border border-[#CBC6B6]/60 max-w-4xl mx-auto">
          {modules.map((m, index) => {
            const Icon = m.icon;
            const isSelected = activeTab === index;
            return (
              <button
                key={m.id}
                onClick={() => setActiveTab(index)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 focus:outline-none ${
                  isSelected
                    ? 'bg-white text-[#233D49] shadow-sm border border-[#CBC6B6]/70 scale-[1.02]'
                    : 'text-[#233D49]/70 hover:text-[#233D49] hover:bg-white/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-[#526F7D]' : 'text-[#233D49]/50'}`} />
                <span>{m.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Desglose Detallado del Módulo Activo ─────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-md border border-[#CBC6B6]/80 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Lado Izquierdo: Descripción B2B */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#526F7D]/10 text-xs font-bold text-[#526F7D]">
              <currentMod.icon className="w-3.5 h-3.5" />
              <span>{currentMod.badge}</span>
            </div>

            <h2 
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              className="text-3xl sm:text-4xl font-bold text-[#233D49] leading-tight"
            >
              {currentMod.title}
            </h2>

            <p className="text-base text-[#526F7D] font-semibold">
              {currentMod.subtitle}
            </p>

            <p className="text-sm sm:text-base text-[#233D49]/80 leading-relaxed">
              {currentMod.description}
            </p>

            {/* Checklist de Características */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#526F7D]">
                Capacidades Clave
              </h4>
              <ul className="space-y-2.5">
                {currentMod.highlights.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#233D49]/85">
                    <CheckCircle2 className="w-4 h-4 text-[#4D9A72] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Guardrail Técnico */}
            <div className="p-4 rounded-xl bg-[#EEEBDD]/60 border border-[#CBC6B6]/70 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#526F7D] shrink-0 mt-0.5" />
              <div className="text-xs text-[#233D49]/80">
                <span className="font-bold text-[#233D49] block mb-0.5">Arquitectura & Seguridad:</span>
                {currentMod.technicalNote}
              </div>
            </div>
          </div>

          {/* Lado Derecho: Mockup Visual Interactivo Específico */}
          <div className="lg:col-span-6">
            
            {/* 1. MOCKUP COTIZADOR (STEPPER 4 PASOS) */}
            {activeTab === 0 && (
              <div className="bg-[#EEEBDD]/40 rounded-2xl p-6 border border-[#CBC6B6]/80 shadow-inner space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-[#CBC6B6]/50">
                  <span className="text-xs font-bold text-[#526F7D] uppercase tracking-wide">
                    Simulación del Cotizador Inteligente
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white text-[#233D49] border border-[#CBC6B6]">
                    Paso 3 de 4
                  </span>
                </div>

                {/* Barra Stepper de 4 Pasos */}
                <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold">
                  <div className="p-1.5 rounded-lg bg-[#4D9A72] text-white">1. Parámetros</div>
                  <div className="p-1.5 rounded-lg bg-[#4D9A72] text-white">2. Paquete</div>
                  <div className="p-1.5 rounded-lg bg-[#526F7D] text-white">3. Servicios</div>
                  <div className="p-1.5 rounded-lg bg-white text-[#233D49]/60 border border-[#CBC6B6]">4. Proforma</div>
                </div>

                {/* Tarjeta de cálculo en vivo */}
                <div className="bg-white rounded-xl p-4 border border-[#CBC6B6]/70 shadow-xs space-y-3">
                  <div className="flex justify-between items-center text-xs pb-2 border-b border-[#CBC6B6]/40">
                    <div>
                      <span className="font-bold text-[#233D49]">Paquete Boda de Ensueño</span>
                      <span className="block text-[11px] text-[#526F7D]">150 Invitados · Salón Imperial</span>
                    </div>
                    <span className="font-bold text-[#233D49] text-sm">$4,500</span>
                  </div>

                  <div className="space-y-1.5 text-xs text-[#233D49]/80">
                    <div className="flex justify-between">
                      <span>Catering 3 Tiempos Gourmet ($28/pax)</span>
                      <span className="font-semibold text-[#233D49]">$4,200</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Barra Libre Premium & Mixología</span>
                      <span className="font-semibold text-[#233D49]">$1,200</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Iluminación Arquitectónica DMX</span>
                      <span className="font-semibold text-[#233D49]">$650</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#CBC6B6]/60 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-bold text-[#4D9A72] uppercase tracking-wider block">
                        Margen Protegido: 38%
                      </span>
                      <span className="text-base font-extrabold text-[#233D49]">
                        Total Estimado: $10,550
                      </span>
                    </div>
                    <button className="px-4 py-2 rounded-lg bg-[#526F7D] text-white text-xs font-bold hover:bg-[#3E5763] transition-colors">
                      Emitir Proforma
                    </button>
                  </div>
                </div>

                <div className="text-[11px] text-[#233D49]/70 text-center italic">
                  *Los cambios en el número de asistentes recalculan catering e insumos al instante.
                </div>
              </div>
            )}

            {/* 2. MOCKUP CONTROL DE RESERVAS & AGENDA */}
            {activeTab === 1 && (
              <div className="bg-[#EEEBDD]/40 rounded-2xl p-6 border border-[#CBC6B6]/80 shadow-inner space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#CBC6B6]/50">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-[#526F7D]" />
                    <span className="text-xs font-bold text-[#233D49]">
                      Matriz de Concurrencia de Salones
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#4D9A72]/20 text-[#4D9A72]">
                    UNIQUE Guard Activo
                  </span>
                </div>

                {/* Calendario Simulador de Salones */}
                <div className="space-y-2.5">
                  {[
                    { salon: 'Salón Imperial', fecha: 'Sábado 14 Nov', turno: 'Noche (19:00 - 03:00)', estado: 'Confirmado & Bloqueado', color: 'bg-[#C95C5C]/15 text-[#C95C5C] border-[#C95C5C]/30', icon: ShieldCheck },
                    { salon: 'Jardín de Cristal', fecha: 'Sábado 14 Nov', turno: 'Tarde (12:00 - 18:00)', estado: 'Disponible', color: 'bg-[#4D9A72]/15 text-[#4D9A72] border-[#4D9A72]/30', icon: CheckCircle2 },
                    { salon: 'Terraza Lounge VIP', fecha: 'Sábado 14 Nov', turno: 'Noche (20:00 - 02:00)', estado: 'En Cotización (Pre-bloqueo)', color: 'bg-[#C49A3A]/15 text-[#C49A3A] border-[#C49A3A]/30', icon: Clock }
                  ].map((row, idx) => (
                    <div key={idx} className="bg-white p-3.5 rounded-xl border border-[#CBC6B6]/60 flex items-center justify-between shadow-xs">
                      <div>
                        <div className="text-xs font-bold text-[#233D49]">{row.salon}</div>
                        <div className="text-[11px] text-[#526F7D]">{row.fecha} · {row.turno}</div>
                      </div>
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg border ${row.color}`}>
                        <row.icon className="w-3 h-3" />
                        {row.estado}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Alerta de Colisión Prevenida */}
                <div className="p-3 rounded-xl bg-white border border-[#526F7D]/40 text-xs text-[#233D49] flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-[#526F7D] text-white flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold">Colisión bloqueada con éxito:</span> Intento concurrente en Salón Imperial rechazado automáticamente con código 409 Conflict.
                  </div>
                </div>
              </div>
            )}

            {/* 3. MOCKUP CRONOGRAMA & CHECKLIST */}
            {activeTab === 2 && (
              <div className="bg-[#EEEBDD]/40 rounded-2xl p-6 border border-[#CBC6B6]/80 shadow-inner space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#CBC6B6]/50">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-[#526F7D]" />
                    <span className="text-xs font-bold text-[#233D49]">
                      Tablero Móvil de Operaciones (Personal)
                    </span>
                  </div>
                  <span className="text-xs font-bold text-[#526F7D]">
                    Gala 14 Noviembre
                  </span>
                </div>

                {/* Lista de Tareas Operativas */}
                <div className="space-y-2">
                  {[
                    { rol: 'Decoración', tarea: 'Montaje de centro floral y arco principal', hora: '14:00', done: true },
                    { rol: 'Cocina / Catering', tarea: 'Prueba de temperatura y mise en place banquete', hora: '16:30', done: true },
                    { rol: 'Audio / DJ', tarea: 'Soundcheck con micrófonos inalámbricos en atril', hora: '17:45', done: true },
                    { rol: 'Coordinador de Sala', tarea: 'Recepción oficial de anfitriones y brindis', hora: '19:00', done: false },
                    { rol: 'Seguridad', tarea: 'Control de accesos y valet parking en garita', hora: '19:15', done: false }
                  ].map((task, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-xl border border-[#CBC6B6]/60 flex items-center justify-between shadow-xs">
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center text-white ${task.done ? 'bg-[#4D9A72]' : 'bg-[#CBC6B6]'}`}>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className={`text-xs font-semibold ${task.done ? 'line-through text-[#233D49]/60' : 'text-[#233D49]'}`}>
                            {task.tarea}
                          </div>
                          <span className="text-[10px] text-[#526F7D] font-medium">
                            {task.rol} · {task.hora}
                          </span>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${task.done ? 'bg-[#4D9A72]/15 text-[#4D9A72]' : 'bg-[#CBC6B6]/40 text-[#233D49]/70'}`}>
                        {task.done ? 'Listo' : 'Pendiente'}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-white rounded-xl border border-[#CBC6B6]/60 flex items-center justify-between text-xs">
                  <span className="text-[#233D49]/80 font-medium">Avance Global del Montaje:</span>
                  <span className="font-extrabold text-[#526F7D]">60% Completado</span>
                </div>
              </div>
            )}

            {/* 4. MOCKUP PORTAL DEL ANFITRIÓN */}
            {activeTab === 3 && (
              <div className="bg-[#EEEBDD]/40 rounded-2xl p-6 border border-[#CBC6B6]/80 shadow-inner space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#CBC6B6]/50">
                  <span className="text-xs font-bold text-[#526F7D] uppercase tracking-wide">
                    Vista Exclusiva del Anfitrión (Cliente)
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white text-[#4D9A72] border border-[#4D9A72]/30">
                    Acceso Activo
                  </span>
                </div>

                <div className="bg-white rounded-xl p-4 border border-[#CBC6B6]/70 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-[#233D49]">
                        Boda Valentina & Mateo
                      </h4>
                      <span className="text-[11px] text-[#526F7D]">Faltan 18 días para el gran día</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-[#233D49]/60 uppercase font-bold block">Presupuesto</span>
                      <span className="text-sm font-extrabold text-[#233D49]">$8,900 USD</span>
                    </div>
                  </div>

                  {/* Estado de Pagos */}
                  <div className="p-3 rounded-lg bg-[#EEEBDD]/50 border border-[#CBC6B6]/50 space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>Estado Financiero</span>
                      <span className="text-[#4D9A72]">Abonado 50% ($4,450)</span>
                    </div>
                    <div className="w-full bg-white rounded-full h-2 overflow-hidden border border-[#CBC6B6]/40">
                      <div className="bg-[#4D9A72] h-2 rounded-full w-1/2" />
                    </div>
                    <div className="flex justify-between text-[10px] text-[#233D49]/70 pt-0.5">
                      <span>Abono inicial registrado</span>
                      <span>Saldo límite: 07 de Noviembre</span>
                    </div>
                  </div>

                  {/* Atajos del cliente */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="p-2.5 rounded-lg border border-[#CBC6B6]/60 text-center hover:bg-[#EEEBDD]/40 transition-colors">
                      <Eye className="w-4 h-4 mx-auto text-[#526F7D] mb-1" />
                      <span className="text-[11px] font-semibold text-[#233D49] block">Ver Menú Aprobado</span>
                    </div>
                    <div className="p-2.5 rounded-lg border border-[#CBC6B6]/60 text-center hover:bg-[#EEEBDD]/40 transition-colors">
                      <FileText className="w-4 h-4 mx-auto text-[#526F7D] mb-1" />
                      <span className="text-[11px] font-semibold text-[#233D49] block">Subir Comprobante</span>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-[#233D49]/70 text-center">
                  Total transparencia para el anfitrión. Menos estrés, mayor profesionalismo.
                </div>
              </div>
            )}

          </div>

        </div>
      </section>

      {/* ── SECCIÓN INTERCALADA: ARQUITECTURA TÉCNICA ──────────────────── */}
      <section className="bg-white/80 border-t border-[#CBC6B6]/60 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#526F7D] px-3 py-1 rounded-full bg-[#526F7D]/10">
              Ingeniería Confiable
            </span>
            <h2 
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              className="text-3xl sm:text-4xl font-bold text-[#233D49]"
            >
              Construido sobre estándares empresariales sólidos
            </h2>
            <p className="text-base text-[#233D49]/75">
              EVENTRA no es un prototipo improvisado. Es una arquitectura desacoplada diseñada para disponibilidad continua y alta concurrencia.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#EEEBDD]/40 rounded-2xl p-7 border border-[#CBC6B6]/70 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#526F7D] text-white flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#233D49]">PostgreSQL & Supabase</h3>
              <p className="text-xs sm:text-sm text-[#233D49]/80 leading-relaxed">
                Base de datos relacional con claves foráneas, restricciones UNIQUE a nivel de esquema e índices optimizados para consultas veloces de disponibilidad.
              </p>
            </div>

            <div className="bg-[#EEEBDD]/40 rounded-2xl p-7 border border-[#CBC6B6]/70 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#526F7D] text-white flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#233D49]">Control RBAC Estricto</h3>
              <p className="text-xs sm:text-sm text-[#233D49]/80 leading-relaxed">
                4 roles independientes (Administrador, Gerente, Trabajador y Anfitrión) con validación mediante JWT en cada petición al backend.
              </p>
            </div>

            <div className="bg-[#EEEBDD]/40 rounded-2xl p-7 border border-[#CBC6B6]/70 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#526F7D] text-white flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#233D49]">EVARA AI Desacoplada</h3>
              <p className="text-xs sm:text-sm text-[#233D49]/80 leading-relaxed">
                El motor de IA opera de forma asíncrona. Si el proveedor externo de IA tiene intermitencia, tu sistema de reservas y cobros continúa 100% operativo.
              </p>
            </div>
          </div>

          {/* CTA hacia Precios */}
          <div className="mt-16 text-center">
            <Link
              to="/precios"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#526F7D] hover:bg-[#3E5763] text-white font-semibold shadow-md transition-all duration-200"
            >
              <span>Elige el Plan para tu Empresa</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </section>

    </div>
  );
};
