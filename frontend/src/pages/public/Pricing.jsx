import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Check, 
  X, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  HelpCircle, 
  Zap, 
  Calendar, 
  Users, 
  Database,
  ChevronDown,
  Building
} from 'lucide-react';

export const Pricing = () => {
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'annual'
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    document.title = 'Planes & Precios - EVENTRA SaaS';
  }, []);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const isAnnual = billingCycle === 'annual';

  const basicPrice = isAnnual ? 39 : 49;
  const premiumPrice = isAnnual ? 79 : 99;

  const faqs = [
    {
      q: '¿Cómo garantiza EVENTRA que dos clientes no reserven el mismo salón?',
      a: 'A diferencia de las planillas en Excel o sistemas convencionales, EVENTRA cuenta con una restricción de unicidad estricta (UNIQUE constraint) a nivel de la base de datos PostgreSQL en Supabase. Si dos usuarios intentan confirmar una reserva para el mismo salón, fecha y turno, el sistema bloquea inmediatamente la segunda solicitud devolviendo un código 409 Conflict, erradicando el riesgo de colisión.'
    },
    {
      q: '¿Qué sucede si en el Plan Básico supero los 10 eventos en un mes?',
      a: 'Recibirás una notificación proactiva en tu panel administrativo cuando alcances el 80% de tu cupo. Si requieres registrar eventos adicionales, puedes escalar de forma instantánea al Plan Premium en cualquier momento sin perder tu configuración de salones, cotizaciones ni historial de clientes.'
    },
    {
      q: '¿EVARA AI puede atender consultas por WhatsApp además de la web?',
      a: 'Sí. En el Plan Premium, EVARA AI cuenta con endpoints desacoplados listos para conectarse con proveedores de WhatsApp Business API mediante Webhooks. El bot consulta en tiempo real tu catálogo de precios y disponibilidad para responder al cliente de inmediato.'
    },
    {
      q: '¿Puedo personalizar los paquetes, menús y comisiones de mis proveedores?',
      a: 'Totalmente. Tanto en el Plan Básico como en el Plan Premium tienes control total del catálogo: puedes dar de alta salones con su aforo, paquetes temáticos (bodas, quinceañeras, corporativos), costos por comensal y margen de ganancia protegido.'
    },
    {
      q: '¿Mis datos y los contratos de mis clientes están seguros?',
      a: 'Absolutamente. EVENTRA utiliza arquitectura desacoplada con cifrado en tránsito HTTPS/TLS 1.3, autenticación con tokens JWT, control de acceso basado en roles (RBAC) y almacenamiento redundante de archivos y comprobantes en Supabase Storage.'
    }
  ];

  return (
    <div className="py-12 md:py-16">
      
      {/* ── 1. ENCABEZADO DE PRECIOS ─────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#CBC6B6] text-xs font-semibold text-[#526F7D] shadow-xs mb-4">
          <Sparkles className="w-3.5 h-3.5 text-[#526F7D]" />
          <span>Inversión Transparente y Escalable</span>
        </div>

        <h1 
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#233D49] tracking-tight max-w-3xl mx-auto leading-tight"
        >
          Planes diseñados para escalar tu operación.
        </h1>

        <p className="mt-4 text-lg text-[#233D49]/80 max-w-2xl mx-auto">
          Sin comisiones ocultas por evento ni contratos forzosos. Centraliza tu centro de eventos con el estándar de sofisticación que tus anfitriones merecen.
        </p>

        {/* Selector de Facturación (Mensual / Anual) */}
        <div className="mt-8 inline-flex items-center gap-3 p-1.5 bg-[#CBC6B6]/30 rounded-2xl border border-[#CBC6B6]/60">
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 focus:outline-none ${
              !isAnnual 
                ? 'bg-white text-[#233D49] shadow-xs border border-[#CBC6B6]/60' 
                : 'text-[#233D49]/70 hover:text-[#233D49]'
            }`}
          >
            Facturación Mensual
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('annual')}
            className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 focus:outline-none ${
              isAnnual 
                ? 'bg-white text-[#233D49] shadow-xs border border-[#CBC6B6]/60' 
                : 'text-[#233D49]/70 hover:text-[#233D49]'
            }`}
          >
            <span>Facturación Anual</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#4D9A72]/20 text-[#4D9A72]">
              Ahorra 20%
            </span>
          </button>
        </div>
      </section>

      {/* ── 2. TARJETAS COMPARATIVAS TRANSPARENTES ───────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 items-stretch">
          
          {/* PLAN BÁSICO (BOUTIQUE) */}
          <div className="rounded-3xl p-8 sm:p-10 bg-white/90 border border-[#CBC6B6]/90 shadow-sm flex flex-col justify-between relative hover:border-[#526F7D]/40 transition-all duration-300">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#526F7D] px-3 py-1 rounded-full bg-[#EEEBDD]">
                  Plan Boutique
                </span>
                <span className="text-xs text-[#233D49]/60 font-medium">Centros en crecimiento</span>
              </div>

              <h3 className="text-2xl font-bold text-[#233D49] mb-2">
                Básico
              </h3>

              <p className="text-sm text-[#233D49]/75 mb-6 min-h-[40px]">
                Ideal para quintas, fincas y centros de recepciones boutique que buscan erradicar el desorden de planillas de cálculo.
              </p>

              {/* Precio */}
              <div className="flex items-baseline gap-2 mb-8 pb-6 border-b border-[#CBC6B6]/60">
                <span className="text-4xl sm:text-5xl font-extrabold text-[#233D49]">
                  ${basicPrice}
                </span>
                <span className="text-sm font-semibold text-[#526F7D]">
                  USD / mes
                </span>
                {isAnnual && (
                  <span className="text-xs text-[#233D49]/60 ml-1">
                    (Facturado anualmente)
                  </span>
                )}
              </div>

              {/* Lista de Características */}
              <div className="space-y-3.5 mb-8">
                <span className="text-xs font-bold uppercase tracking-wider text-[#526F7D] block mb-2">
                  Lo que incluye:
                </span>

                <div className="flex items-start gap-3 text-sm text-[#233D49]/85">
                  <Check className="w-4 h-4 text-[#4D9A72] shrink-0 mt-0.5" />
                  <span><strong>Hasta 10 eventos</strong> por mes</span>
                </div>

                <div className="flex items-start gap-3 text-sm text-[#233D49]/85">
                  <Check className="w-4 h-4 text-[#4D9A72] shrink-0 mt-0.5" />
                  <span><strong>3 cuentas de usuario</strong> con roles (Admin, Gerente, Trabajador)</span>
                </div>

                <div className="flex items-start gap-3 text-sm text-[#233D49]/85">
                  <Check className="w-4 h-4 text-[#4D9A72] shrink-0 mt-0.5" />
                  <span><strong>Control anti-colisión</strong> de agenda con bloqueo garantizado</span>
                </div>

                <div className="flex items-start gap-3 text-sm text-[#233D49]/85">
                  <Check className="w-4 h-4 text-[#4D9A72] shrink-0 mt-0.5" />
                  <span>Cotizador ágil estructurado por paquetes base</span>
                </div>

                <div className="flex items-start gap-3 text-sm text-[#233D49]/85">
                  <Check className="w-4 h-4 text-[#4D9A72] shrink-0 mt-0.5" />
                  <span>Portal estándar para el anfitrión con cronograma</span>
                </div>

                <div className="flex items-start gap-3 text-sm text-[#233D49]/50">
                  <X className="w-4 h-4 text-[#C95C5C]/60 shrink-0 mt-0.5" />
                  <span className="line-through">Asistente comercial EVARA AI (24/7)</span>
                </div>

                <div className="flex items-start gap-3 text-sm text-[#233D49]/50">
                  <X className="w-4 h-4 text-[#C95C5C]/60 shrink-0 mt-0.5" />
                  <span className="line-through">Cotizador dinámico completo (4 pasos con desglose de margen)</span>
                </div>
              </div>
            </div>

            <div>
              <Link
                to="/login"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-[#FAFAF8] text-[#233D49] border-2 border-[#CBC6B6] hover:border-[#526F7D] font-bold text-sm shadow-xs transition-all duration-200"
              >
                <span>Elegir Plan Boutique</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-[11px] text-center text-[#233D49]/60 mt-2">
                Sin tarjeta de crédito requerida para demostración
              </p>
            </div>
          </div>

          {/* PLAN PREMIUM (DESTACADO) */}
          <div className="rounded-3xl p-8 sm:p-10 bg-white border-2 border-[#526F7D] shadow-xl flex flex-col justify-between relative transform md:-translate-y-2">
            
            {/* Badge de Plan Destacado */}
            <div className="absolute -top-3.5 right-8 px-4 py-1 rounded-full bg-[#526F7D] text-white text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Más Popular · Recomendado</span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#526F7D] px-3 py-1 rounded-full bg-[#526F7D]/10">
                  Escala Total
                </span>
                <span className="text-xs text-[#4D9A72] font-bold">Máxima Automatización</span>
              </div>

              <h3 className="text-2xl font-bold text-[#233D49] mb-2">
                Premium
              </h3>

              <p className="text-sm text-[#233D49]/75 mb-6 min-h-[40px]">
                Para empresas consolidadas y salones de alta demanda que buscan automatizar cotizaciones con IA y gestionar sin límites.
              </p>

              {/* Precio */}
              <div className="flex items-baseline gap-2 mb-8 pb-6 border-b border-[#CBC6B6]/60">
                <span className="text-4xl sm:text-5xl font-extrabold text-[#233D49]">
                  ${premiumPrice}
                </span>
                <span className="text-sm font-semibold text-[#526F7D]">
                  USD / mes
                </span>
                {isAnnual && (
                  <span className="text-xs text-[#233D49]/60 ml-1">
                    (Facturado anualmente)
                  </span>
                )}
              </div>

              {/* Lista de Características */}
              <div className="space-y-3.5 mb-8">
                <span className="text-xs font-bold uppercase tracking-wider text-[#526F7D] block mb-2">
                  Todo lo del Plan Básico, más:
                </span>

                <div className="flex items-start gap-3 text-sm text-[#233D49] font-medium">
                  <Check className="w-4 h-4 text-[#4D9A72] shrink-0 mt-0.5" />
                  <span><strong>Eventos Ilimitados</strong> sin restricciones mensuales</span>
                </div>

                <div className="flex items-start gap-3 text-sm text-[#233D49] font-medium">
                  <Check className="w-4 h-4 text-[#4D9A72] shrink-0 mt-0.5" />
                  <span><strong>Usuarios Ilimitados</strong> (Administradores, Gerentes y Personal de Piso)</span>
                </div>

                <div className="flex items-start gap-3 text-sm text-[#233D49] font-medium">
                  <div className="w-4 h-4 rounded-full bg-[#526F7D]/15 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3 h-3 text-[#526F7D]" />
                  </div>
                  <span><strong>Asistente EVARA AI 24/7</strong> conectada a tu catálogo real</span>
                </div>

                <div className="flex items-start gap-3 text-sm text-[#233D49] font-medium">
                  <Check className="w-4 h-4 text-[#4D9A72] shrink-0 mt-0.5" />
                  <span><strong>Cotizador Dinámico Completo</strong> (Stepper de 4 pasos con cálculo de márgenes)</span>
                </div>

                <div className="flex items-start gap-3 text-sm text-[#233D49] font-medium">
                  <Check className="w-4 h-4 text-[#4D9A72] shrink-0 mt-0.5" />
                  <span><strong>Portal Premium del Anfitrión</strong> con firma de contrato y seguimiento de pagos</span>
                </div>

                <div className="flex items-start gap-3 text-sm text-[#233D49] font-medium">
                  <Check className="w-4 h-4 text-[#4D9A72] shrink-0 mt-0.5" />
                  <span>Almacenamiento ilimitado de comprobantes en <strong>Supabase Storage</strong></span>
                </div>

                <div className="flex items-start gap-3 text-sm text-[#233D49] font-medium">
                  <Check className="w-4 h-4 text-[#4D9A72] shrink-0 mt-0.5" />
                  <span>Soporte prioritario 24/7 con ejecutivo de cuenta asignado</span>
                </div>
              </div>
            </div>

            <div>
              <Link
                to="/login"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-[#526F7D] hover:bg-[#3E5763] text-white font-bold text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
              >
                <span>Comenzar con Plan Premium</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-[11px] text-center text-[#526F7D] font-medium mt-2">
                Activación inmediata con migración de catálogo asistida
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ── 3. PREGUNTAS FRECUENTES (FAQ ACORDEÓN) ───────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="text-center mb-12 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#526F7D] px-3 py-1 rounded-full bg-[#526F7D]/10">
            Dudas Comunes
          </span>
          <h2 
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            className="text-3xl font-bold text-[#233D49]"
          >
            Preguntas Frecuentes
          </h2>
          <p className="text-sm text-[#233D49]/75">
            Resolvemos las dudas técnicas y operativas de los directores de centros de eventos.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div 
                key={index}
                className="bg-white rounded-2xl border border-[#CBC6B6]/80 overflow-hidden shadow-xs transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 focus:outline-none hover:bg-[#FAFAF8]"
                >
                  <span className="text-sm sm:text-base font-bold text-[#233D49]">
                    {faq.q}
                  </span>
                  <ChevronDown className={`w-5 h-5 text-[#526F7D] shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[#233D49]/80 leading-relaxed border-t border-[#CBC6B6]/40">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 4. BANNER DE CIERRE ─────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="p-10 rounded-3xl bg-[#EEEBDD] border border-[#CBC6B6] shadow-sm space-y-4">
          <h3 
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            className="text-2xl sm:text-3xl font-bold text-[#233D49]"
          >
            ¿Necesitas una configuración empresarial a medida?
          </h3>
          <p className="text-sm text-[#233D49]/80 max-w-xl mx-auto">
            Si operas una cadena hotelera o múltiples complejos de recepciones con más de 10 salones, nuestro equipo de ingeniería configura esquemas multi-tenant dedicados.
          </p>
          <div className="pt-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#526F7D] hover:bg-[#3E5763] text-white font-semibold text-xs sm:text-sm shadow-xs transition-all duration-200"
            >
              <span>Contactar con Asesoría Especializada</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};
