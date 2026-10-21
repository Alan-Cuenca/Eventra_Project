import React, { useState } from 'react';
import { 
  FileText, 
  CalendarDays, 
  CheckSquare, 
  CreditCard, 
  UserCheck, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const ModulosPublic = () => {
  const [activeTab, setActiveTab] = useState(0);

  const modulos = [
    {
      id: 'cotizaciones',
      icon: FileText,
      name: 'Cotizaciones & Catálogo',
      headline: 'Propuestas comerciales transparentes y automatizadas',
      description: 'Construye presupuestos precisos combinando paquetes preconfigurados, salones y servicios específicos (catering, mobiliario, audio y luces). Emite cotizaciones con fecha límite y márgenes protegidos.',
      features: [
        'Desglose detallado por comensal y tarifa fija',
        'Actualización automática según cambios de invitados',
        'Conversión directa de cotización aprobada a reserva oficial',
        'Exportación rápida y seguimiento de estados'
      ],
      badge: 'Ventas Ágiles'
    },
    {
      id: 'reservas',
      icon: CalendarDays,
      name: 'Reservas Anti-Colisión',
      headline: 'Calendario inteligente con bloqueo de concurrencia',
      description: 'Visualiza la ocupación de salones en tiempo real. El motor de EVENTRA impide que dos clientes o ejecutivos reserven el mismo espacio en idéntico turno o fecha.',
      features: [
        'Control estricto de concurrencia y unicidad',
        'Filtro por salón, fecha y estado de preparación',
        'Transición ordenada de estados (Pendiente, Confirmada, Finalizada)',
        'Alertas de disponibilidad inmediata'
      ],
      badge: 'Cero Conflictos'
    },
    {
      id: 'actividades',
      icon: CheckSquare,
      name: 'Cronograma & Tareas',
      headline: 'Coordinación milimétrica para el equipo de producción',
      description: 'Asigna tareas y checklist específicos para cada fase del evento (montaje, recepción, banquete, desmontaje). Los trabajadores visualizan sus asignaciones desde su móvil.',
      features: [
        'Checklist por evento y por rol operativo',
        'Seguimiento de avance en porcentaje en tiempo real',
        'Vista de actividades personales para el personal operativo',
        'Registro de observaciones y contingencias'
      ],
      badge: 'Operación Exacta'
    },
    {
      id: 'pagos',
      icon: CreditCard,
      name: 'Gestión Financiera & Pagos',
      headline: 'Cobranza clara, abonos parciales y comprobantes seguros',
      description: 'Lleva la contabilidad de cada evento al centavo. Registra abonos iniciales, saldos pendientes y comprobantes de depósito con almacenamiento seguro en la nube.',
      features: [
        'Cálculo automático de saldos y porcentajes abonados',
        'Historial de transacciones con fecha y método',
        'Almacenamiento de comprobantes de pago en la nube',
        'Reportes de ingresos y flujo de caja proyectado'
      ],
      badge: 'Control Total'
    },
    {
      id: 'portal',
      icon: UserCheck,
      name: 'Portal del Cliente',
      headline: 'Experiencia premium y transparente para los anfitriones',
      description: 'Ofrece a los novios o directores de empresas anfitrionas una vista privada para dar seguimiento a su recepción, revisar pagos realizados y consultar el cronograma.',
      features: [
        'Acceso exclusivo con credenciales de cliente (RBAC)',
        'Visualización del estado de su evento y servicios contratados',
        'Descarga de recibos y cotizaciones aprobadas',
        'Comunicación clara y profesional sin saturar WhatsApp'
      ],
      badge: 'Prestigio de Marca'
    }
  ];

  const current = modulos[activeTab];
  const CurrentIcon = current.icon;

  return (
    <section id="modulos" className="scroll-mt-28 py-20 md:py-28 bg-[#EEEBDD] border-t border-[#CBC6B6]/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Cabecera */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-[#CBC6B6] text-xs font-semibold text-[#526F7D]">
            <Sparkles className="w-3.5 h-3.5 text-[#526F7D]" />
            <span>Arquitectura Modular Integral</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#233D49] tracking-tight">
            Cada aspecto de tu empresa de eventos, bajo control
          </h2>
          <p className="text-base sm:text-lg text-[#233D49]/75">
            Explora cómo interactúan los módulos de EVENTRA para brindar una experiencia impecable a administradores, personal y clientes.
          </p>
        </div>

        {/* Selector de pestañas / módulos */}
        <div className="flex items-center justify-start lg:justify-center gap-2 overflow-x-auto pb-4 mb-10 no-scrollbar">
          {modulos.map((modulo, idx) => {
            const Icon = modulo.icon;
            const isSelected = activeTab === idx;
            return (
              <button
                key={modulo.id}
                type="button"
                onClick={() => setActiveTab(idx)}
                className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-[#526F7D] text-white shadow-md'
                    : 'bg-white/80 text-[#233D49] border border-[#CBC6B6]/60 hover:bg-white hover:text-[#526F7D]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-[#526F7D]'}`} />
                <span>{modulo.name}</span>
              </button>
            );
          })}
        </div>

        {/* Contenedor Detallado del Módulo Seleccionado */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#CBC6B6]/70 shadow-lg">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Lado Izquierdo: Descripción */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#526F7D]/10 text-xs font-bold text-[#526F7D]">
                <CurrentIcon className="w-4 h-4" />
                <span>{current.badge}</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-bold text-[#233D49]">
                {current.headline}
              </h3>

              <p className="text-base text-[#233D49]/80 leading-relaxed">
                {current.description}
              </p>

              {/* Lista de características */}
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {current.features.map((feat, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-[#4D9A72]/15 text-[#4D9A72] flex items-center justify-center shrink-0 mt-0.5">
                      ✓
                    </div>
                    <span className="text-sm text-[#233D49]/90 font-medium">
                      {feat}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-4">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm font-bold text-[#526F7D] hover:text-[#233D49] transition-colors"
                >
                  <span>Probar este módulo en la plataforma</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Lado Derecho: Tarjeta Visual Ilustrativa */}
            <div className="lg:col-span-5">
              <div className="bg-[#EEEBDD]/60 rounded-2xl p-6 sm:p-8 border border-[#CBC6B6] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#CBC6B6]/50">
                  <span className="text-xs font-bold text-[#526F7D] uppercase tracking-wider">
                    Vista Operativa
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white text-[#233D49] border border-[#CBC6B6]/50">
                    EVENTRA Core
                  </span>
                </div>

                <div className="bg-white rounded-xl p-5 border border-[#CBC6B6]/60 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#526F7D]">Estado del Proceso</span>
                    <span className="text-xs font-bold text-[#4D9A72] bg-[#4D9A72]/10 px-2 py-0.5 rounded">
                      En Regla
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-[#233D49]">
                    {current.name}
                  </h4>
                  <p className="text-xs text-[#233D49]/70 leading-relaxed">
                    Sincronización bidireccional automática con la base de datos PostgreSQL en Supabase.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white/70 border border-[#CBC6B6]/50 text-xs text-[#233D49]/80 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#526F7D] text-white flex items-center justify-center shrink-0">
                    <CurrentIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-[#233D49]">Auditoría Integrada</p>
                    <p className="text-[11px] text-[#526F7D]">Trazabilidad de cambios por usuario y fecha</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
