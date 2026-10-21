import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  CalendarCheck, 
  Bot, 
  TrendingUp,
  Clock,
  Users
} from 'lucide-react';

export const HeroPublic = () => {
  const handleScrollTo = (e, targetId) => {
    e.preventDefault();
    const elem = document.querySelector(targetId);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-[#EEEBDD]">
      {/* Elementos decorativos sutiles de fondo */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 rounded-full bg-[#526F7D]/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-96 h-96 rounded-full bg-[#CBC6B6]/20 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* ── Columna Izquierda (7 columnas): Copy Comercial B2B ──────── */}
          <div className="lg:col-span-7 flex flex-col items-start space-y-6">
            
            {/* Badge de Categoría */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-[#CBC6B6] text-xs font-semibold text-[#526F7D] shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#526F7D]" />
              <span>Plataforma SaaS para Centros de Eventos & Recepciones</span>
            </div>

            {/* Gran H1 con Tipografía Serif Elegante */}
            <h1 
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#233D49] tracking-tight leading-[1.12]"
            >
              Gestión inteligente para empresas de eventos.
            </h1>

            {/* Subtítulo Moderno y Claro */}
            <p className="text-lg sm:text-xl text-[#233D49]/80 font-normal leading-relaxed max-w-2xl">
              Centraliza cotizaciones dinámicas, control estricto de reservas sin colisiones, seguimiento de pagos y coordinación de equipo. Diseñado con la sofisticación que exige la industria de recepciones.
            </p>

            {/* Acciones Principales */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto pt-2">
              <a
                href="#precios"
                onClick={(e) => handleScrollTo(e, '#precios')}
                className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-[#526F7D] hover:bg-[#3E5763] text-white font-semibold text-base shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <span>Explorar Planes SaaS</span>
                <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1.5 transition-transform duration-300" />
              </a>

              <a
                href="#modulos"
                onClick={(e) => handleScrollTo(e, '#modulos')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white/80 hover:bg-white text-[#233D49] border border-[#CBC6B6] font-semibold text-base shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
              >
                <span>Conocer Módulos</span>
              </a>
            </div>

            {/* Métricas y Social Proof B2B */}
            <div className="pt-6 border-t border-[#CBC6B6]/60 w-full grid grid-cols-3 gap-4 text-left">
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-[#233D49]">100%</p>
                <p className="text-xs sm:text-sm text-[#526F7D] font-medium">Cero colisiones de agenda</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-[#233D49]">24/7</p>
                <p className="text-xs sm:text-sm text-[#526F7D] font-medium">Asistencia con EVARA AI</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-[#233D49]">+1,200</p>
                <p className="text-xs sm:text-sm text-[#526F7D] font-medium">Eventos gestionados</p>
              </div>
            </div>

          </div>

          {/* ── Columna Derecha (5 columnas): Mockup Abstracto Flotante ── */}
          <div className="lg:col-span-5 relative animate-fade-in-up">
            
            {/* Card Principal del Dashboard Mockup */}
            <div className="relative bg-white rounded-2xl p-6 sm:p-7 shadow-xl border border-[#CBC6B6]/70 transform transition-transform duration-500 hover:scale-[1.01]">
              
              {/* Barra superior de la ventana */}
              <div className="flex items-center justify-between pb-4 border-b border-[#CBC6B6]/40 mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#C95C5C]/60" />
                  <div className="w-3 h-3 rounded-full bg-[#C49A3A]/60" />
                  <div className="w-3 h-3 rounded-full bg-[#4D9A72]/60" />
                  <span className="ml-2 text-xs font-semibold text-[#526F7D]">Panel Operativo EVENTRA</span>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#4D9A72] bg-[#4D9A72]/10 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4D9A72] animate-pulse" />
                  En Vivo
                </span>
              </div>

              {/* Tarjeta de Evento Próximo */}
              <div className="bg-[#EEEBDD]/50 border border-[#CBC6B6]/60 rounded-xl p-4 mb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#526F7D]">
                      Próxima Recepción Principal
                    </span>
                    <h2 className="text-base font-bold text-[#233D49] mt-0.5">
                      Boda San Andrés & Mendoza
                    </h2>
                    <p className="text-xs text-[#233D49]/70 flex items-center gap-1.5 mt-1">
                      <Clock className="w-3.5 h-3.5 text-[#526F7D]" />
                      Sábado, 18:00 hrs · Salón Cristal Imperial
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#4D9A72]/15 text-[#4D9A72]">
                    Confirmado
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-[#CBC6B6]/40 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-[#233D49]/80 font-medium">
                    <Users className="w-3.5 h-3.5 text-[#526F7D]" />
                    180 Comensales
                  </span>
                  <span className="font-bold text-[#233D49]">
                    Total: $8,450.00
                  </span>
                </div>
              </div>

              {/* Mini métricas operativas */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3.5 rounded-xl bg-white border border-[#CBC6B6]/60 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#526F7D] font-medium">Ocupación Mensual</span>
                    <TrendingUp className="w-4 h-4 text-[#4D9A72]" />
                  </div>
                  <p className="text-xl font-bold text-[#233D49] mt-1">94%</p>
                  <p className="text-[10px] text-[#4D9A72] font-semibold mt-0.5">+12% vs. mes anterior</p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-[#CBC6B6]/60 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#526F7D] font-medium">Cotizaciones Activas</span>
                    <CalendarCheck className="w-4 h-4 text-[#526F7D]" />
                  </div>
                  <p className="text-xl font-bold text-[#233D49] mt-1">18</p>
                  <p className="text-[10px] text-[#526F7D] font-semibold mt-0.5">8 listas para cierre</p>
                </div>
              </div>

              {/* Burbuja flotante de EVARA AI Assistant */}
              <div className="p-3.5 rounded-xl bg-[#526F7D] text-white shadow-md flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold tracking-wide">EVARA AI Asistente</span>
                    <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded bg-white/20 text-white">
                      Concurrencia OK
                    </span>
                  </div>
                  <p className="text-[11px] text-white/90 mt-1 leading-snug">
                    "Disponibilidad validada para el Salón Diamante el 25 de Octubre. Cero conflictos con reservas existentes."
                  </p>
                </div>
              </div>

            </div>

            {/* Elemento de fondo para dar profundidad */}
            <div className="absolute -bottom-4 -right-4 w-full h-full rounded-2xl bg-[#CBC6B6]/40 -z-10" />

          </div>

        </div>
      </div>
    </section>
  );
};
