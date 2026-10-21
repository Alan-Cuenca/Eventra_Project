import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Sparkles, ArrowRight, Star } from 'lucide-react';

export const PreciosPublic = () => {
  return (
    <section id="precios" className="scroll-mt-28 py-20 md:py-28 bg-[#EEEBDD] border-t border-[#CBC6B6]/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Encabezado */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-[#CBC6B6] text-xs font-semibold text-[#526F7D]">
            <Sparkles className="w-3.5 h-3.5 text-[#526F7D]" />
            <span>Precios Transparentes B2B</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#233D49] tracking-tight">
            Planes escalables para el crecimiento de tu empresa
          </h2>
          <p className="text-base sm:text-lg text-[#233D49]/75">
            Invierte en una infraestructura digital sólida. Sin contratos forzosos ni comisiones ocultas por evento.
          </p>
        </div>

        {/* Grid de Precios: Básico vs Premium Destacado */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto items-stretch">
          
          {/* ── Plan Básico ──────────────────────────────────────────────── */}
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#CBC6B6]/80 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#526F7D] bg-[#CBC6B6]/30 px-3 py-1 rounded-full">
                  Negocios Boutique
                </span>
              </div>

              <h3 className="text-2xl font-bold text-[#233D49]">Plan Básico</h3>
              <p className="text-sm text-[#233D49]/75 mt-2 min-h-[40px]">
                Diseñado para coordinadores independientes y salones con volumen moderado de eventos.
              </p>

              <div className="mt-6 pb-6 border-b border-[#CBC6B6]/40 flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-extrabold text-[#233D49]">$49</span>
                <span className="text-sm font-semibold text-[#526F7D]">USD / mes</span>
              </div>

              {/* Lista de características del Plan Básico */}
              <ul className="mt-6 space-y-3.5 text-sm text-[#233D49]/85">
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#526F7D]/10 text-[#526F7D] flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>Hasta <strong>10 eventos</strong> activos por mes</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#526F7D]/10 text-[#526F7D] flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>Hasta <strong>3 usuarios</strong> de equipo con roles</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#526F7D]/10 text-[#526F7D] flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>Control de reservas con bloqueo anti-colisión</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#526F7D]/10 text-[#526F7D] flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>Cotizador dinámico estándar por paquetes</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#526F7D]/10 text-[#526F7D] flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>Portal del Cliente con vista de recibos</span>
                </li>
                <li className="flex items-center gap-3 text-[#233D49]/50">
                  <span className="w-5 h-5 rounded-full bg-transparent border border-[#CBC6B6] flex items-center justify-center shrink-0 text-xs text-[#233D49]/40">
                    —
                  </span>
                  <span className="line-through">Asistente IA EVARA 24/7</span>
                </li>
              </ul>
            </div>

            <div className="pt-8 mt-6">
              <Link
                to="/login"
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl border border-[#526F7D] text-[#526F7D] hover:bg-[#526F7D] hover:text-white font-semibold text-sm transition-all duration-200"
              >
                <span>Comenzar con Plan Básico</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* ── Plan Premium (Destacado Visualmente) ──────────────────────── */}
          <div className="relative bg-white rounded-3xl p-8 sm:p-10 border-2 border-[#526F7D] shadow-xl hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between">
            
            {/* Badge de Recomendado */}
            <div className="absolute -top-4 right-8 bg-[#C49A3A] text-white text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 fill-white" />
              <span>Más Elegido · Recomendado</span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-white bg-[#526F7D] px-3 py-1 rounded-full">
                  Empresas de Alto Volumen
                </span>
              </div>

              <h3 className="text-2xl font-bold text-[#233D49]">Plan Premium</h3>
              <p className="text-sm text-[#233D49]/75 mt-2 min-h-[40px]">
                Operación integral sin límites para centros de recepciones y empresas de eventos consolidadas.
              </p>

              <div className="mt-6 pb-6 border-b border-[#CBC6B6]/40 flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-extrabold text-[#233D49]">$99</span>
                <span className="text-sm font-semibold text-[#526F7D]">USD / mes</span>
              </div>

              {/* Lista de características del Plan Premium */}
              <ul className="mt-6 space-y-3.5 text-sm text-[#233D49]/90">
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#4D9A72]/15 text-[#4D9A72] flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span><strong>Eventos y recepciones ilimitadas</strong></span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#4D9A72]/15 text-[#4D9A72] flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span><strong>Usuarios y colaboradores ilimitados</strong> (Admin, Gerente, Trabajador)</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#4D9A72]/15 text-[#4D9A72] flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span><strong>Asistente EVARA AI ilimitado</strong> para cotizaciones 24/7</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#4D9A72]/15 text-[#4D9A72] flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>Múltiples salones y espacios simultáneos sin traslapes</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#4D9A72]/15 text-[#4D9A72] flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>Almacenamiento ilimitado en la nube para contratos y comprobantes</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#4D9A72]/15 text-[#4D9A72] flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>Soporte prioritario y asesoría en migración de datos</span>
                </li>
              </ul>
            </div>

            <div className="pt-8 mt-6">
              <Link
                to="/login"
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-[#526F7D] hover:bg-[#3E5763] text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200"
              >
                <span>Activar Plan Premium</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
