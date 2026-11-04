import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Check,
  X,
  Sparkles,
  ArrowRight,
  ChevronDown,
  Building2,
  Copy,
  UploadCloud,
  FileText,
  Mail,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Send,
  ShieldCheck,
} from 'lucide-react';
import {
  ModalPagoPlanTransferencia,
  DATOS_TRANSFERENCIA_EVENTRA,
} from '../../components/public/ModalPagoPlanTransferencia';

export const Pricing = () => {
  const [searchParams] = useSearchParams();
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'annual'
  const [openFaq, setOpenFaq] = useState(null);

  // Estado para selección de plan y modal de pago por transferencia
  const [planSeleccionado, setPlanSeleccionado] = useState('Premium');
  const [modalPagoAbierto, setModalPagoAbierto] = useState(false);

  // Estado para la sección directa de transferencia en la página de planes
  const [inlinePdfFile, setInlinePdfFile] = useState(null);
  const [inlineError, setInlineError] = useState('');
  const [copiedField, setCopiedField] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [correoCredenciales, setCorreoCredenciales] = useState('');
  const [nombreEmpresa, setNombreEmpresa] = useState('');
  const [mensajeFinalizado, setMensajeFinalizado] = useState(false);
  const inlineFileInputRef = useRef(null);
  const pagoSectionRef = useRef(null);

  useEffect(() => {
    document.title = 'Planes & Precios - EVENTRA SaaS';
    const planParam = searchParams.get('plan');
    if (planParam) {
      setPlanSeleccionado(planParam.toLowerCase().includes('basico') ? 'Basico' : 'Premium');
      setModalPagoAbierto(true);
    }
  }, [searchParams]);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const isAnnual = billingCycle === 'annual';
  const basicPrice = isAnnual ? 39 : 49;
  const premiumPrice = isAnnual ? 79 : 99;
  const selectedPrice = planSeleccionado === 'Basico' ? basicPrice : premiumPrice;
  const selectedPlanLabel = planSeleccionado === 'Basico' ? 'Plan Básico (Boutique)' : 'Plan Premium';

  const handleSeleccionarPlan = (planKey) => {
    setPlanSeleccionado(planKey);
    setMensajeFinalizado(false);
    setModalPagoAbierto(true);
  };

  const handleCopy = (key, value) => {
    navigator.clipboard.writeText(value);
    setCopiedField(key);
    setTimeout(() => setCopiedField(''), 2500);
  };

  const handleInlinePdfUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setInlineError('');

    const isPdf =
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setInlineError('Por favor selecciona únicamente un archivo en formato PDF (.pdf) del comprobante de pago.');
      return;
    }

    setInlinePdfFile(file);
    setMensajeFinalizado(false);
    // Una vez subido el PDF, abrir el modal para ingresar el correo de credenciales
    setShowEmailModal(true);
  };

  const handleConfirmarCorreo = (e) => {
    e.preventDefault();
    const emailLimpio = correoCredenciales.trim();
    if (!emailLimpio || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpio)) {
      setInlineError('Ingresa un correo electrónico válido para recibir las credenciales.');
      return;
    }
    setInlineError('');
    setShowEmailModal(false);
    setMensajeFinalizado(true);
  };

  const faqs = [
    {
      q: '¿Cómo garantiza EVENTRA que dos clientes no reserven el mismo salón?',
      a: 'A diferencia de las planillas en Excel o sistemas convencionales, EVENTRA cuenta con una restricción de unicidad estricta (UNIQUE constraint) a nivel de la base de datos PostgreSQL en Supabase. Si dos usuarios intentan confirmar una reserva para el mismo salón, fecha y turno, el sistema bloquea inmediatamente la segunda solicitud devolviendo un código 409 Conflict, erradicando el riesgo de colisión.',
    },
    {
      q: '¿Qué sucede si en el Plan Básico supero los 10 eventos en un mes?',
      a: 'Recibirás una notificación proactiva en tu panel administrativo cuando alcances el 80% de tu cupo. Si requieres registrar eventos adicionales, puedes escalar de forma instantánea al Plan Premium en cualquier momento sin perder tu configuración de salones, cotizaciones ni historial de clientes.',
    },
    {
      q: '¿EVARA AI puede atender consultas por WhatsApp además de la web?',
      a: 'Sí. En el Plan Premium, EVARA AI cuenta con endpoints desacoplados listos para conectarse con proveedores de WhatsApp Business API mediante Webhooks. El bot consulta en tiempo real tu catálogo de precios y disponibilidad para responder al cliente de inmediato.',
    },
    {
      q: '¿Puedo personalizar los paquetes, menús y comisiones de mis proveedores?',
      a: 'Totalmente. Tanto en el Plan Básico como en el Plan Premium tienes control total del catálogo: puedes dar de alta salones con su aforo, paquetes temáticos (bodas, quinceañeras, corporativos), costos por comensal y margen de ganancia protegido.',
    },
    {
      q: '¿Mis datos y los contratos de mis clientes están seguros?',
      a: 'Absolutamente. EVENTRA utiliza arquitectura desacoplada con cifrado en tránsito HTTPS/TLS 1.3, autenticación con tokens JWT, control de acceso basado en roles (RBAC) y almacenamiento redundante de archivos y comprobantes en Supabase Storage.',
    },
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
          Selecciona el plan ideal para tu empresa de eventos, realiza tu pago mediante transferencia bancaria y recibe las credenciales de acceso directamente en tu correo corporativo.
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

      {/* ── 2. TARJETAS COMPARATIVAS SELECCIONABLES ──────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 items-stretch">
          {/* PLAN BÁSICO (BOUTIQUE) */}
          <div
            onClick={() => setPlanSeleccionado('Basico')}
            className={`rounded-3xl p-8 sm:p-10 bg-white/95 border-2 shadow-sm flex flex-col justify-between relative transition-all duration-300 cursor-pointer ${
              planSeleccionado === 'Basico'
                ? 'border-[#4D7182] ring-4 ring-[#4D7182]/15 shadow-lg'
                : 'border-[#CBC6B6]/90 hover:border-[#526F7D]/50'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#526F7D] px-3 py-1 rounded-full bg-[#EEEBDD]">
                  Plan Boutique
                </span>
                <span className="text-xs text-[#233D49]/60 font-medium">Centros en crecimiento</span>
              </div>

              <h3 className="text-2xl font-bold text-[#233D49] mb-2">Básico</h3>

              <p className="text-sm text-[#233D49]/75 mb-6 min-h-[40px]">
                Ideal para quintas, fincas y centros de recepciones boutique que buscan erradicar el desorden de planillas de cálculo.
              </p>

              {/* Precio */}
              <div className="flex items-baseline gap-2 mb-8 pb-6 border-b border-[#CBC6B6]/60">
                <span className="text-4xl sm:text-5xl font-extrabold text-[#233D49]">
                  ${basicPrice}
                </span>
                <span className="text-sm font-semibold text-[#526F7D]">USD / mes</span>
                {isAnnual && (
                  <span className="text-xs text-[#233D49]/60 ml-1">(Facturado anualmente)</span>
                )}
              </div>

              {/* Lista de Características */}
              <div className="space-y-3.5 mb-8">
                <span className="text-xs font-bold uppercase tracking-wider text-[#526F7D] block mb-2">
                  Lo que incluye:
                </span>

                <div className="flex items-start gap-3 text-sm text-[#233D49]/85">
                  <Check className="w-4 h-4 text-[#4D9A72] shrink-0 mt-0.5" />
                  <span>
                    <strong>Hasta 10 eventos</strong> por mes
                  </span>
                </div>

                <div className="flex items-start gap-3 text-sm text-[#233D49]/85">
                  <Check className="w-4 h-4 text-[#4D9A72] shrink-0 mt-0.5" />
                  <span>
                    <strong>3 cuentas de usuario</strong> con roles (Admin, Gerente, Trabajador)
                  </span>
                </div>

                <div className="flex items-start gap-3 text-sm text-[#233D49]/85">
                  <Check className="w-4 h-4 text-[#4D9A72] shrink-0 mt-0.5" />
                  <span>
                    <strong>Control anti-colisión</strong> de agenda con bloqueo garantizado
                  </span>
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
                  <span className="line-through">
                    Cotizador dinámico completo (4 pasos con desglose de margen)
                  </span>
                </div>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSeleccionarPlan('Basico');
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-[#F3F0E4] text-[#233D49] border-2 border-[#526F7D] font-bold text-sm shadow-xs transition-all duration-200 cursor-pointer"
              >
                <span>Seleccionar Plan Boutique y Pagar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-[11px] text-center text-[#233D49]/60 mt-2">
                Pago directo mediante transferencia bancaria
              </p>
            </div>
          </div>

          {/* PLAN PREMIUM (DESTACADO) */}
          <div
            onClick={() => setPlanSeleccionado('Premium')}
            className={`rounded-3xl p-8 sm:p-10 bg-white border-2 shadow-xl flex flex-col justify-between relative transform md:-translate-y-2 transition-all duration-300 cursor-pointer ${
              planSeleccionado === 'Premium'
                ? 'border-[#4D7182] ring-4 ring-[#4D7182]/20'
                : 'border-[#526F7D]/80'
            }`}
          >
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

              <h3 className="text-2xl font-bold text-[#233D49] mb-2">Premium</h3>

              <p className="text-sm text-[#233D49]/75 mb-6 min-h-[40px]">
                Para empresas consolidadas y salones de alta demanda que buscan automatizar cotizaciones con IA y gestionar sin límites.
              </p>

              {/* Precio */}
              <div className="flex items-baseline gap-2 mb-8 pb-6 border-b border-[#CBC6B6]/60">
                <span className="text-4xl sm:text-5xl font-extrabold text-[#233D49]">
                  ${premiumPrice}
                </span>
                <span className="text-sm font-semibold text-[#526F7D]">USD / mes</span>
                {isAnnual && (
                  <span className="text-xs text-[#233D49]/60 ml-1">(Facturado anualmente)</span>
                )}
              </div>

              {/* Lista de Características */}
              <div className="space-y-3.5 mb-8">
                <span className="text-xs font-bold uppercase tracking-wider text-[#526F7D] block mb-2">
                  Todo lo del Plan Básico, más:
                </span>

                <div className="flex items-start gap-3 text-sm text-[#233D49] font-medium">
                  <Check className="w-4 h-4 text-[#4D9A72] shrink-0 mt-0.5" />
                  <span>
                    <strong>Eventos Ilimitados</strong> sin restricciones mensuales
                  </span>
                </div>

                <div className="flex items-start gap-3 text-sm text-[#233D49] font-medium">
                  <Check className="w-4 h-4 text-[#4D9A72] shrink-0 mt-0.5" />
                  <span>
                    <strong>Usuarios Ilimitados</strong> (Administradores, Gerentes y Personal de Piso)
                  </span>
                </div>

                <div className="flex items-start gap-3 text-sm text-[#233D49] font-medium">
                  <div className="w-4 h-4 rounded-full bg-[#526F7D]/15 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3 h-3 text-[#526F7D]" />
                  </div>
                  <span>
                    <strong>Asistente EVARA AI 24/7</strong> conectada a tu catálogo real
                  </span>
                </div>

                <div className="flex items-start gap-3 text-sm text-[#233D49] font-medium">
                  <Check className="w-4 h-4 text-[#4D9A72] shrink-0 mt-0.5" />
                  <span>
                    <strong>Cotizador Dinámico Completo</strong> (Stepper de 4 pasos con cálculo de márgenes)
                  </span>
                </div>

                <div className="flex items-start gap-3 text-sm text-[#233D49] font-medium">
                  <Check className="w-4 h-4 text-[#4D9A72] shrink-0 mt-0.5" />
                  <span>
                    <strong>Portal Premium del Anfitrión</strong> con firma de contrato y seguimiento de pagos
                  </span>
                </div>

                <div className="flex items-start gap-3 text-sm text-[#233D49] font-medium">
                  <Check className="w-4 h-4 text-[#4D9A72] shrink-0 mt-0.5" />
                  <span>
                    Almacenamiento ilimitado de comprobantes en <strong>Supabase Storage</strong>
                  </span>
                </div>

                <div className="flex items-start gap-3 text-sm text-[#233D49] font-medium">
                  <Check className="w-4 h-4 text-[#4D9A72] shrink-0 mt-0.5" />
                  <span>Soporte prioritario 24/7 con ejecutivo de cuenta asignado</span>
                </div>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSeleccionarPlan('Premium');
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-[#526F7D] hover:bg-[#3E5763] text-white font-bold text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              >
                <span>Seleccionar Plan Premium y Pagar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-[11px] text-center text-[#526F7D] font-medium mt-2">
                Activación inmediata por transferencia bancaria
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2.5 SECCIÓN DIRECTA DE PAGO POR TRANSFERENCIA Y SUBIDA DE PDF ── */}
      <section ref={pagoSectionRef} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <div className="bg-white rounded-3xl border-2 border-[#CBC6B6] shadow-md p-6 sm:p-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#CBC6B6]/70">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#4D7182] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Building2 size={24} />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#4D7182]">
                  Activación de Cuenta Corporativa · Transferencia Bancaria Únicamente
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#233D49]">
                  Pago por Transferencia — {selectedPlanLabel} (${selectedPrice} USD/mes)
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setPlanSeleccionado('Basico');
                  setMensajeFinalizado(false);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                  planSeleccionado === 'Basico'
                    ? 'bg-[#4D7182] text-white border-[#4D7182]'
                    : 'bg-[#FAF8F5] text-[#233D49] border-[#CBC6B6]'
                }`}
              >
                Plan Básico (${basicPrice})
              </button>
              <button
                type="button"
                onClick={() => {
                  setPlanSeleccionado('Premium');
                  setMensajeFinalizado(false);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                  planSeleccionado === 'Premium'
                    ? 'bg-[#4D7182] text-white border-[#4D7182]'
                    : 'bg-[#FAF8F5] text-[#233D49] border-[#CBC6B6]'
                }`}
              >
                Plan Premium (${premiumPrice})
              </button>
            </div>
          </div>

          {inlineError && (
            <div className="p-4 rounded-xl bg-[#C95C5C]/10 border border-[#C95C5C]/30 text-[#C95C5C] text-xs sm:text-sm font-semibold flex items-center gap-2.5">
              <AlertCircle size={18} className="shrink-0" />
              <span>{inlineError}</span>
            </div>
          )}

          {/* Mensaje en pantalla tras finalizar el ingreso del correo */}
          {mensajeFinalizado && (
            <div className="p-6 sm:p-8 rounded-2xl bg-[#4D9A72]/10 border-2 border-[#4D9A72] text-center space-y-4 animate-fade-in">
              <div className="w-14 h-14 rounded-2xl bg-[#4D9A72] text-white flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 size={30} />
              </div>
              <div className="space-y-1.5 max-w-xl mx-auto">
                <span className="text-xs font-bold uppercase tracking-wider text-[#4D9A72]">
                  Comprobante PDF Registrado Exitosamente
                </span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-[#233D49]">
                  ¡Solicitud de Suscripción Finalizada!
                </h3>
                <p className="text-sm sm:text-base text-[#233D49] font-medium leading-relaxed">
                  Se le enviará un correo electrónico a{' '}
                  <strong className="underline text-[#233D49]">{correoCredenciales}</strong> con las credenciales para el acceso a su cuenta
                  {nombreEmpresa ? ` corporativa (${nombreEmpresa})` : ''}.
                </p>
              </div>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#4D7182] hover:bg-[#3B5968] text-white text-xs font-bold shadow-xs transition-colors"
                >
                  <span>Ir al Login</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Datos Bancarios de Alejandro Falcon */}
            <div className="lg:col-span-7 bg-[#F3F0E4]/70 rounded-2xl p-5 border border-[#CBC6B6] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#233D49] flex items-center gap-1.5">
                  <CreditCard size={15} className="text-[#4D7182]" />
                  Datos Oficiales para Transferencia
                </span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white text-[#4D7182] border border-[#CBC6B6]">
                  Transferencia Únicamente
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white rounded-xl p-3 border border-[#CBC6B6]/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#4D7182] block">Nombre</span>
                    <span className="text-sm font-extrabold text-[#233D49]">{DATOS_TRANSFERENCIA_EVENTRA.nombre}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('inline-nombre', DATOS_TRANSFERENCIA_EVENTRA.nombre)}
                    className="p-1.5 rounded-lg hover:bg-[#F3F0E4] text-[#4D7182]"
                    title="Copiar Nombre"
                  >
                    {copiedField === 'inline-nombre' ? <Check size={14} className="text-[#4D9A72]" /> : <Copy size={14} />}
                  </button>
                </div>

                <div className="bg-white rounded-xl p-3 border border-[#CBC6B6]/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#4D7182] block">Cuenta</span>
                    <span className="text-sm font-mono font-extrabold text-[#233D49]">{DATOS_TRANSFERENCIA_EVENTRA.cuenta}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('inline-cuenta', DATOS_TRANSFERENCIA_EVENTRA.cuenta)}
                    className="p-1.5 rounded-lg hover:bg-[#F3F0E4] text-[#4D7182]"
                    title="Copiar Cuenta"
                  >
                    {copiedField === 'inline-cuenta' ? <Check size={14} className="text-[#4D9A72]" /> : <Copy size={14} />}
                  </button>
                </div>

                <div className="bg-white rounded-xl p-3 border border-[#CBC6B6]/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#4D7182] block">Cédula</span>
                    <span className="text-sm font-mono font-extrabold text-[#233D49]">{DATOS_TRANSFERENCIA_EVENTRA.cedula}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('inline-cedula', DATOS_TRANSFERENCIA_EVENTRA.cedula)}
                    className="p-1.5 rounded-lg hover:bg-[#F3F0E4] text-[#4D7182]"
                    title="Copiar Cédula"
                  >
                    {copiedField === 'inline-cedula' ? <Check size={14} className="text-[#4D9A72]" /> : <Copy size={14} />}
                  </button>
                </div>

                <div className="bg-white rounded-xl p-3 border border-[#CBC6B6]/80 flex items-center justify-between">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase text-[#4D7182] block">Correo</span>
                    <span className="text-sm font-mono font-bold text-[#233D49] truncate block">{DATOS_TRANSFERENCIA_EVENTRA.correo}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('inline-correo', DATOS_TRANSFERENCIA_EVENTRA.correo)}
                    className="p-1.5 rounded-lg hover:bg-[#F3F0E4] text-[#4D7182] shrink-0"
                    title="Copiar Correo"
                  >
                    {copiedField === 'inline-correo' ? <Check size={14} className="text-[#4D9A72]" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Botón para subir el PDF del comprobante */}
            <div className="lg:col-span-5 flex flex-col justify-between bg-[#FAF8F5] rounded-2xl p-5 border-2 border-dashed border-[#4D7182]/60 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#4D7182]/10 text-[#4D7182] flex items-center justify-center mx-auto">
                <UploadCloud size={24} />
              </div>

              <div>
                <h3 className="text-sm font-extrabold text-[#233D49]">
                  Subir PDF del Comprobante de Pago
                </h3>
                <p className="text-xs text-[#233D49]/70 mt-1">
                  Una vez realizada la transferencia por <strong>${selectedPrice}.00 USD</strong>, sube aquí el comprobante en formato <strong>PDF</strong> para ingresar el correo de tu empresa.
                </p>
              </div>

              {inlinePdfFile && (
                <div className="px-3 py-2 rounded-xl bg-[#4D9A72]/10 border border-[#4D9A72]/30 text-xs font-bold text-[#4D9A72] flex items-center justify-center gap-2">
                  <FileText size={14} />
                  <span className="truncate max-w-[200px]">{inlinePdfFile.name}</span>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => inlineFileInputRef.current?.click()}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#4D7182] hover:bg-[#3B5968] text-white text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer"
                >
                  <FileText size={16} />
                  <span>{inlinePdfFile ? 'Cambiar PDF del Comprobante' : 'Subir PDF del Comprobante'}</span>
                </button>

                {inlinePdfFile && (
                  <button
                    type="button"
                    onClick={() => setShowEmailModal(true)}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#4D7182] text-[#4D7182] text-xs font-bold hover:bg-[#F3F0E4] transition-colors cursor-pointer"
                  >
                    <Mail size={14} />
                    <span>Ingresar Correo para Credenciales</span>
                  </button>
                )}
              </div>

              <input
                ref={inlineFileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleInlinePdfUpload}
                className="hidden"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── MODAL PARA INGRESAR EL CORREO AL SUBIR EL PDF DESDE LA SECCIÓN DIRECTA ── */}
      {showEmailModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#233D49]/60 backdrop-blur-xs animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg bg-white rounded-3xl border-2 border-[#CBC6B6] shadow-2xl overflow-hidden">
            <div className="bg-[#F3F0E4] px-6 py-4 border-b border-[#CBC6B6] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#4D7182] text-white flex items-center justify-center">
                  <Mail size={18} />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#4D7182] block">
                    Comprobante PDF Cargado
                  </span>
                  <h3 className="text-base font-extrabold text-[#233D49]">
                    Envío de Credenciales de Acceso
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="p-1.5 rounded-lg hover:bg-white text-[#233D49]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmarCorreo} className="p-6 space-y-5">
              <div className="p-3.5 rounded-xl bg-[#4D9A72]/10 border border-[#4D9A72]/30 flex items-center gap-3 text-xs">
                <FileText size={18} className="text-[#4D9A72] shrink-0" />
                <div className="min-w-0">
                  <span className="font-bold text-[#233D49] block truncate">
                    {inlinePdfFile?.name}
                  </span>
                  <span className="text-[#4D9A72] font-semibold">
                    {selectedPlanLabel} · ${selectedPrice}.00 USD
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#233D49] mb-1.5">
                  Correo electrónico donde llegarán las credenciales <span className="text-[#C95C5C]">*</span>
                </label>
                <input
                  type="email"
                  required
                  autoFocus
                  value={correoCredenciales}
                  onChange={(e) => setCorreoCredenciales(e.target.value)}
                  placeholder="administracion@tuempresa.com"
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#CBC6B6] focus:border-[#4D7182] text-sm text-[#233D49] focus:outline-none"
                />
                <p className="text-xs text-[#233D49]/70 mt-1.5">
                  Ingresa el correo corporativo al cual te enviaremos el usuario y contraseña de acceso a tu cuenta de EVENTRA.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#233D49] mb-1.5">
                  Nombre de la Empresa (Opcional)
                </label>
                <input
                  type="text"
                  value={nombreEmpresa}
                  onChange={(e) => setNombreEmpresa(e.target.value)}
                  placeholder="Ej. Eventos & Recepciones Imperial"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#CBC6B6] focus:border-[#4D7182] text-sm text-[#233D49] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#CBC6B6] text-xs font-bold text-[#233D49] hover:bg-[#FAF8F5]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#4D7182] hover:bg-[#3B5968] text-white text-xs sm:text-sm font-bold shadow-sm transition-colors cursor-pointer"
                >
                  <Send size={15} />
                  <span>Finalizar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL COMPLETO AL PULSAR EN LAS TARJETAS DE PLANES ───────────── */}
      <ModalPagoPlanTransferencia
        isOpen={modalPagoAbierto}
        onClose={() => setModalPagoAbierto(false)}
        initialPlan={planSeleccionado}
        isAnnual={isAnnual}
      />

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
                  <ChevronDown
                    className={`w-5 h-5 text-[#526F7D] shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
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
            <button
              type="button"
              onClick={() => handleSeleccionarPlan('Premium')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#526F7D] hover:bg-[#3E5763] text-white font-semibold text-xs sm:text-sm shadow-xs transition-all duration-200 cursor-pointer"
            >
              <span>Contratar Plan Corporativo Ahora</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
