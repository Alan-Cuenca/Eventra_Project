import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { eventraService } from '../../services/eventraService';
import {
  CreditCard,
  ShieldCheck,
  Zap,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Sparkles,
  ExternalLink,
  RefreshCw,
  Building2,
  X,
  FileCheck,
  BarChart3,
  ArrowRight,
  Mail,
  Send,
  Copy,
  Check,
} from 'lucide-react';
import { formatMoney, aFechaLocal } from '../../utils/format';

export const MiSuscripcion = () => {
  const { user } = useAuth();
  const [suscripciones, setSuscripciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [planSeleccionado, setPlanSeleccionado] = useState('Premium');
  const [archivo, setArchivo] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [toast, setToast] = useState(null);
  const [copiedField, setCopiedField] = useState('');

  // Modal de correo para credenciales tras subir el PDF
  const [modalCorreoAbierto, setModalCorreoAbierto] = useState(false);
  const [correoCredenciales, setCorreoCredenciales] = useState(user?.email || '');
  const [confirmacionPantalla, setConfirmacionPantalla] = useState(null);
  const [saasConfig, setSaasConfig] = useState(null);

  // null hasta que responde la API: nunca se muestran cifras de consumo inventadas
  const [consumo, setConsumo] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    cargarHistorial();
  }, []);

  useEffect(() => {
    if (user?.email && !correoCredenciales) {
      setCorreoCredenciales(user.email);
    }
  }, [user]);

  const cargarHistorial = async () => {
    setLoading(true);
    try {
      const [data, consumoData, configData] = await Promise.all([
        eventraService.getSuscripciones(),
        eventraService.getConsumoSuscripcion(),
        eventraService.getConfiguracionGlobal(),
      ]);
      setSuscripciones(Array.isArray(data) ? data : []);
      if (consumoData && consumoData.limites && consumoData.uso) {
        setConsumo(consumoData);
      }
      if (configData) {
        setSaasConfig(configData);
      }
    } catch (error) {
      console.error('Error cargando suscripciones:', error);
      showToast('Error al cargar historial de suscripción', 'error');
    } finally {
      setLoading(false);
    }
  };

  const datosTransferencia = {
    nombre: saasConfig?.transferencia?.titular || '—',
    cuenta: saasConfig?.transferencia?.numero_cuenta || '—',
    cedula: saasConfig?.transferencia?.cedula || '—',
    correo: saasConfig?.transferencia?.correo_notificacion || '—',
  };

  const precioBasico = Number(saasConfig?.planes?.basico_precio) || 49;
  const precioPremium = Number(saasConfig?.planes?.premium_precio) || 99;
  const montoPlan = planSeleccionado === 'Premium' ? precioPremium : precioBasico;

  const handleCopy = (key, val) => {
    navigator.clipboard.writeText(val);
    setCopiedField(key);
    setTimeout(() => setCopiedField(''), 2500);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setArchivo(file);
      setConfirmacionPantalla(null);
      if (file.type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        setPreviewUrl(null);
      }
      // Mostrar modal para ingresar el correo al cual deben llegar las credenciales
      setModalCorreoAbierto(true);
    }
  };

  const removerArchivo = () => {
    setArchivo(null);
    setModalCorreoAbierto(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleSubmitPago = async (e) => {
    if (e) e.preventDefault();

    if (!archivo) {
      showToast('Por favor adjunta el PDF del comprobante de transferencia bancaria.', 'error');
      return;
    }

    const emailLimpio = (correoCredenciales || '').trim();
    if (!emailLimpio || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpio)) {
      setModalCorreoAbierto(true);
      showToast('Ingresa el correo electrónico al cual enviaremos las credenciales.', 'error');
      return;
    }

    setEnviando(true);
    try {
      const formData = new FormData();
      formData.append('plan_nombre', planSeleccionado);
      formData.append('monto', montoPlan.toFixed(2)); // informativo: el backend calcula el monto con la configuración
      formData.append('comprobante', archivo);
      formData.append('correo_credenciales', emailLimpio);

      await eventraService.pagarSuscripcion(formData);

      setModalCorreoAbierto(false);
      setConfirmacionPantalla({
        correo: emailLimpio,
        plan: planSeleccionado,
        monto: montoPlan.toFixed(2),
        archivoNombre: archivo.name,
      });
      showToast(
        'Comprobante enviado. Tu plan quedó en revisión y se activará cuando sea aprobado.',
        'success'
      );
      removerArchivo();
      await cargarHistorial();
    } catch (error) {
      // No se confirma nada en pantalla si el backend rechazó el pago
      showToast(error?.message || 'No se pudo registrar el pago. Intenta nuevamente.', 'error');
    } finally {
      setEnviando(false);
    }
  };

  // Plan actual de la empresa desde el usuario o el último registro
  const planActual = user?.plan_suscripcion || suscripciones[0]?.empresa_plan_actual || 'Basico';
  const esPremium = planActual.toLowerCase().includes('premium');
  const costoActual = esPremium ? precioPremium : precioBasico;

  // Estado general de la cuenta
  const tienePagoPendiente = suscripciones.some((s) => s.estado === 'En Revisión');

  return (
    <div className="space-y-6 animate-fade-in text-[#233D49]">
      {/* Toast Notification Flotante */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold animate-fade-in ${
            toast.type === 'error'
              ? 'bg-[#C95C5C] text-white border-[#C95C5C]'
              : 'bg-[#4D9A72] text-white border-[#4D9A72]'
          }`}
        >
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#CBC6B6]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#233D49] tracking-tight">
            Mi Suscripción SaaS
          </h1>
          <p className="text-sm text-[#526F7D] mt-1">
            Administra el plan corporativo de <strong>{user?.empresa_nombre || 'tu empresa'}</strong> y renueva tu membresía mensual por transferencia bancaria.
          </p>
        </div>

        <button
          onClick={cargarHistorial}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-[#FAF8F5] border border-[#CBC6B6] text-xs font-bold text-[#526F7D] shadow-sm transition-all self-start sm:self-auto"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Tarjetas KPI de Estado de Suscripción */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Plan Actual */}
        <div className="bg-white shadow-sm rounded-2xl border border-[#CBC6B6] p-5 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#526F7D]">
                Plan Contratado
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#526F7D]/10 text-[#526F7D] flex items-center justify-center">
                <Zap size={18} />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1 min-w-0">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#233D49]">
                Plan {planActual}
              </h3>
              <span className="text-sm font-bold text-[#526F7D] tabular-nums whitespace-nowrap">
                {formatMoney(costoActual)}/mes
              </span>
            </div>
          </div>
          <p className="text-xs text-[#566D7A] mt-3 pt-2 border-t border-[#CBC6B6]/40 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#4D9A72]"></span>
            <span>Módulos y soporte SaaS activo</span>
          </p>
        </div>

        {/* KPI 2: Estado de la Cuenta */}
        <div className="bg-white shadow-sm rounded-2xl border border-[#CBC6B6] p-5 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#526F7D]">
                Estado de Cuenta
              </span>
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  tienePagoPendiente ? 'bg-[#C49A3A]/15 text-[#7A5C14]' : 'bg-[#4D9A72]/15 text-[#2F7A55]'
                }`}
              >
                <ShieldCheck size={18} />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                  tienePagoPendiente
                    ? 'bg-[#C49A3A]/15 text-[#7A5C14] border-[#C49A3A]/30'
                    : 'bg-[#4D9A72]/15 text-[#2F7A55] border-[#4D9A72]/30'
                }`}
              >
                {tienePagoPendiente ? 'En Revisión' : 'Activa y Vigente'}
              </span>
            </div>
          </div>
          <p className="text-xs text-[#566D7A] mt-3 pt-2 border-t border-[#CBC6B6]/40">
            {tienePagoPendiente
              ? 'Comprobante en auditoría por el equipo global.'
              : 'Sin vencimientos pendientes.'}
          </p>
        </div>

        {/* KPI 3: Total Facturado */}
        <div className="bg-white shadow-sm rounded-2xl border border-[#CBC6B6] p-5 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#526F7D]">
                Facturas Aprobadas
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#526F7D]/10 text-[#526F7D] flex items-center justify-center">
                <FileText size={18} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <p className="text-2xl sm:text-3xl font-extrabold text-[#233D49] tabular-nums">
                {suscripciones.filter((s) => s.estado === 'Aprobado').length}
              </p>
              <span className="text-xs font-semibold text-[#566D7A]">meses pagos</span>
            </div>
          </div>
          <p className="text-xs text-[#566D7A] mt-3 pt-2 border-t border-[#CBC6B6]/40 flex items-center gap-1.5">
            <Clock size={13} className="text-[#526F7D]" />
            <span>Facturación unificada</span>
          </p>
        </div>

        {/* KPI 4: Consumo del Plan */}
        <div className="bg-white shadow-sm rounded-2xl border border-[#CBC6B6] p-5 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#526F7D]">
                Consumo del Plan
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#526F7D]/10 text-[#526F7D] flex items-center justify-center">
                <BarChart3 size={18} />
              </div>
            </div>

            <div className="mt-3 space-y-2" data-cy="consumo-plan">
              {[
                ['usuarios', 'Usuarios'],
                ['clientes', 'Clientes'],
                ['chatbot', 'Mensajes de IA'],
              ].map(([clave, etiqueta]) => (
                <BarraConsumo key={clave} etiqueta={etiqueta} uso={consumo?.uso?.[clave]} limite={consumo?.limites?.[clave]} />
              ))}
            </div>
          </div>

          <p className="text-[11px] text-[#566D7A] mt-3 pt-2 border-t border-[#CBC6B6]/40">
            Cuota mensual asignada
          </p>
        </div>
      </div>

      {/* Banner Destacado para Upgrade a Plan Premium */}
      {!esPremium && (
        <div className="bg-gradient-to-r from-[#F3F0E4] via-[#FAF8F2] to-white border border-[#C49A3A]/40 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5 animate-fade-in">
          <div className="space-y-1.5 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#C49A3A]/15 text-[#7A5C14] border border-[#C49A3A]/30">
              <Sparkles size={13} />
              Oportunidad de Crecimiento SaaS
            </span>
            <h3 className="text-lg sm:text-xl font-extrabold text-[#233D49]">
              ¿Tu empresa necesita más capacidad? Pasa a Premium por ${precioPremium}/mes
            </h3>
            <p className="text-xs sm:text-sm text-[#233D49]/80 leading-relaxed">
              Desbloquea hasta <strong>{saasConfig?.planes?.premium_max_clientes ?? 200} clientes</strong> en tu directorio, <strong>{saasConfig?.planes?.premium_max_usuarios ?? 10} colaboradores</strong> simultáneos, <strong>{saasConfig?.planes?.premium_max_servicios ?? 50} servicios</strong> en tu catálogo y hasta <strong>{saasConfig?.planes?.premium_max_chatbot ? Number(saasConfig.planes.premium_max_chatbot).toLocaleString() : '1,500'} consultas mensuales</strong> con nuestro asistente inteligente <strong>EVARA AI 24/7</strong>.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setPlanSeleccionado('Premium');
              const el = document.getElementById('seccion-formulario-pago');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#526F7D] hover:bg-[#3E5763] text-white text-xs sm:text-sm font-bold shadow-md transition-all shrink-0 hover:scale-[1.02] cursor-pointer"
          >
            <span>Mejorar a Premium (${precioPremium})</span>
            <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* Mensaje en pantalla tras finalizar el proceso de pago y correo */}
      {confirmacionPantalla && (
        <div className="p-6 sm:p-8 rounded-2xl bg-[#4D9A72]/10 border-2 border-[#4D9A72] text-center space-y-3 animate-fade-in">
          <div className="w-12 h-12 rounded-2xl bg-[#4D9A72] text-white flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 size={26} />
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-[#233D49]">
            ¡Pago del Plan {confirmacionPantalla.plan} Registrado con Éxito!
          </h3>
          <p className="text-sm sm:text-base text-[#233D49] max-w-xl mx-auto">
            Se le enviará un correo electrónico a{' '}
            <strong className="underline">{confirmacionPantalla.correo}</strong> con las credenciales para el acceso a su cuenta.
          </p>
          <p className="text-xs text-[#526F7D]">
            Comprobante recibido: {confirmacionPantalla.archivoNombre} (${confirmacionPantalla.monto} USD)
          </p>
        </div>
      )}

      {/* Formulario de Pago y Renovación de Mensualidad por Transferencia */}
      <div id="seccion-formulario-pago" className="bg-white shadow-sm rounded-2xl border border-[#CBC6B6] p-6 space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-[#CBC6B6]/60">
          <div className="w-9 h-9 rounded-xl bg-[#526F7D]/10 text-[#526F7D] flex items-center justify-center">
            <CreditCard size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#233D49]">
              Renovar o Mejorar Plan de Suscripción (Transferencia Bancaria Únicamente)
            </h2>
            <p className="text-xs text-[#566D7A]">
              Selecciona el plan, realiza la transferencia con los datos indicados y sube el comprobante en PDF.
            </p>
          </div>
        </div>

        {/* Selector de Plan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            aria-pressed={planSeleccionado === 'Basico'}
            data-cy="plan-basico"
            onClick={() => setPlanSeleccionado('Basico')}
            className={`w-full text-left p-4 rounded-2xl border cursor-pointer transition-all ${
              planSeleccionado === 'Basico'
                ? 'border-[#526F7D] bg-[#F3F0E4]/40 ring-2 ring-[#526F7D]/20 shadow-sm'
                : 'border-[#CBC6B6] bg-white hover:bg-[#FAF8F5]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#526F7D]">
                Plan Básico
              </span>
              <span className="text-sm font-extrabold text-[#233D49] tabular-nums">
                ${precioBasico.toFixed(2)} <span className="text-xs font-normal text-[#566D7A]">/mes</span>
              </span>
            </div>
            <p className="text-xs text-[#566D7A] mt-1">
              Hasta {saasConfig?.planes?.basico_max_eventos ?? 20} eventos activos, {saasConfig?.planes?.basico_max_usuarios ?? 3} colaboradores y EVARA AI ({saasConfig?.planes?.basico_max_chatbot ?? 300} mensajes/mes).
            </p>
          </button>

          <button
            type="button"
            aria-pressed={planSeleccionado === 'Premium'}
            data-cy="plan-premium"
            onClick={() => setPlanSeleccionado('Premium')}
            className={`w-full text-left p-4 rounded-2xl border cursor-pointer transition-all relative overflow-hidden ${
              planSeleccionado === 'Premium'
                ? 'border-[#526F7D] bg-[#F3F0E4]/40 ring-2 ring-[#526F7D]/20 shadow-sm'
                : 'border-[#CBC6B6] bg-white hover:bg-[#FAF8F5]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#526F7D] flex items-center gap-1">
                <Sparkles size={13} className="text-[#7A5C14]" />
                Plan Premium (Recomendado)
              </span>
              <span className="text-sm font-extrabold text-[#233D49] tabular-nums">
                ${precioPremium.toFixed(2)} <span className="text-xs font-normal text-[#566D7A]">/mes</span>
              </span>
            </div>
            <p className="text-xs text-[#566D7A] mt-1">
              Hasta {saasConfig?.planes?.premium_max_eventos ?? 100} eventos activos, {saasConfig?.planes?.premium_max_usuarios ?? 10} colaboradores y EVARA AI ({saasConfig?.planes?.premium_max_chatbot ?? 1500} mensajes/mes).
            </p>
          </button>
        </div>

        {/* Datos Oficiales para la Transferencia SaaS */}
        <div className="p-5 rounded-2xl bg-[#F3F0E4]/60 border border-[#CBC6B6] text-xs space-y-3">
          <div className="flex items-center justify-between gap-2 font-bold text-[#233D49]">
            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-[#526F7D]" />
              <span>Datos Oficiales para Transferencia Bancaria Únicamente ({saasConfig?.transferencia?.entidad_bancaria || 'Banco Pichincha'}):</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            <div className="bg-white p-3 rounded-xl border border-[#CBC6B6]/80 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase text-[#526F7D] block">Titular</span>
                <span className="text-xs font-extrabold text-[#233D49]">{datosTransferencia.nombre}</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy('nombre', datosTransferencia.nombre)}
                className="p-1.5 rounded-lg hover:bg-[#F3F0E4] text-[#526F7D]"
                title="Copiar Titular"
              >
                {copiedField === 'nombre' ? <Check size={14} className="text-[#2F7A55]" /> : <Copy size={14} />}
              </button>
            </div>

            <div className="bg-white p-3 rounded-xl border border-[#CBC6B6]/80 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase text-[#526F7D] block">Cuenta</span>
                <span className="text-xs font-mono font-extrabold text-[#233D49]">{datosTransferencia.cuenta}</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy('cuenta', datosTransferencia.cuenta)}
                className="p-1.5 rounded-lg hover:bg-[#F3F0E4] text-[#526F7D]"
                title="Copiar Cuenta"
              >
                {copiedField === 'cuenta' ? <Check size={14} className="text-[#2F7A55]" /> : <Copy size={14} />}
              </button>
            </div>

            <div className="bg-white p-3 rounded-xl border border-[#CBC6B6]/80 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase text-[#526F7D] block">Cédula / RUC</span>
                <span className="text-xs font-mono font-extrabold text-[#233D49]">{datosTransferencia.cedula}</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy('cedula', datosTransferencia.cedula)}
                className="p-1.5 rounded-lg hover:bg-[#F3F0E4] text-[#526F7D]"
                title="Copiar Identificación"
              >
                {copiedField === 'cedula' ? <Check size={14} className="text-[#2F7A55]" /> : <Copy size={14} />}
              </button>
            </div>

            <div className="bg-white p-3 rounded-xl border border-[#CBC6B6]/80 flex items-center justify-between">
              <div className="min-w-0">
                <span className="text-[11px] font-bold uppercase text-[#526F7D] block">Correo</span>
                <span className="text-xs font-mono font-bold text-[#233D49] truncate block">{datosTransferencia.correo}</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy('correo', datosTransferencia.correo)}
                className="p-1.5 rounded-lg hover:bg-[#F3F0E4] text-[#526F7D] shrink-0"
                title="Copiar Correo"
              >
                {copiedField === 'correo' ? <Check size={14} className="text-[#2F7A55]" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        </div>

        {/* Formulario de Carga de Comprobante PDF */}
        <form onSubmit={handleSubmitPago} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#233D49] mb-1.5">
              Subir PDF del Comprobante de Pago ({planSeleccionado === 'Basico' ? 'Básico' : 'Premium'} — ${montoPlan.toFixed(2)}) <span className="text-[#B04646]">*</span>
            </label>

            {!archivo ? (
              <div className="border-2 border-dashed border-[#CBC6B6] hover:border-[#526F7D] rounded-2xl p-6 text-center bg-[#FAF8F5] transition-colors relative">
                <input
                  type="file"
                  id="comprobante-suscripcion"
                  accept="application/pdf,.pdf,image/*"
                  onChange={handleFileChange}
                  required
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-[#526F7D]/10 text-[#526F7D] flex items-center justify-center">
                    <UploadCloud size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#233D49]">
                      Haz clic o arrastra el PDF del comprobante de transferencia bancaria
                    </p>
                    <p className="text-[11px] text-[#566D7A] mt-0.5">
                      Formato recomendado: PDF (.pdf) · Al subirlo ingresarás el correo para el envío de tus credenciales
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#CBC6B6] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-12 h-12 rounded-xl object-cover border border-[#CBC6B6]"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-[#526F7D]/10 text-[#526F7D] flex items-center justify-center font-bold">
                      <FileCheck size={20} />
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-bold text-[#233D49] truncate max-w-xs">
                      {archivo.name}
                    </p>
                    <p className="text-[11px] text-[#566D7A]">
                      {(archivo.size / 1024).toFixed(1)} KB · Comprobante listo para finalizar
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setModalCorreoAbierto(true)}
                    className="px-3 py-1.5 rounded-lg bg-[#526F7D] text-white text-xs font-bold"
                  >
                    Ingresar Correo y Finalizar
                  </button>
                  <button
                    type="button"
                    onClick={removerArchivo}
                    className="p-1.5 rounded-lg text-[#B04646] hover:bg-[#C95C5C]/10 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Modal para Ingresar el Correo al cual llegarán las Credenciales */}
      {modalCorreoAbierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#233D49]/60 backdrop-blur-xs animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg backdrop-blur-xl backdrop-saturate-[180%] bg-ev-surface/80 rounded-3xl border-0 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6),_0_10px_25px_-5px_rgba(35,61,73,0.1)] overflow-hidden">
            <div className="bg-ev-surface/40 px-6 py-4 border-b border-ev-border/20 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#4D7182] text-white flex items-center justify-center">
                  <Mail size={18} />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#4D7182] block">
                    Comprobante Subido Correctamente
                  </span>
                  <h3 className="text-base font-extrabold text-[#233D49]">
                    Correo para Envío de Credenciales
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalCorreoAbierto(false)}
                className="p-1.5 rounded-lg hover:bg-white text-[#233D49]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitPago} className="p-6 space-y-5">
              <div className="p-3.5 rounded-xl bg-[#4D9A72]/10 border border-[#4D9A72]/30 flex items-center gap-3 text-xs">
                <FileText size={18} className="text-[#2F7A55] shrink-0" />
                <div className="min-w-0">
                  <span className="font-bold text-[#233D49] block truncate">
                    {archivo?.name}
                  </span>
                  <span className="text-[#2F7A55] font-semibold">
                    Plan {planSeleccionado} · ${montoPlan.toFixed(2)} USD
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#233D49] mb-1.5">
                  Correo electrónico para recibir credenciales <span className="text-[#B04646]">*</span>
                </label>
                <input
                  type="email"
                  required
                  autoFocus
                  value={correoCredenciales}
                  onChange={(e) => setCorreoCredenciales(e.target.value)}
                  placeholder="gerencia@tuempresa.com"
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#CBC6B6] focus:border-[#4D7182] text-sm text-[#233D49] focus:outline-none"
                />
                <p className="text-xs text-[#566D7A] mt-1.5">
                  Al finalizar, enviaremos a este correo las credenciales de acceso para tu cuenta corporativa.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalCorreoAbierto(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#CBC6B6] text-xs font-bold text-[#233D49] hover:bg-[#FAF8F5]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviando}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#4D7182] hover:bg-[#3B5968] text-white text-xs sm:text-sm font-bold shadow-sm transition-colors cursor-pointer"
                >
                  <Send size={15} />
                  <span>{enviando ? 'Procesando...' : 'Finalizar'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Historial de Facturas */}
      <div className="bg-white rounded-2xl border border-[#CBC6B6] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#CBC6B6]/60 flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#233D49]">
            Historial de Facturación y Comprobantes
          </h2>
          <span className="text-xs text-[#566D7A]">
            {suscripciones.length} registros
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-[#CBC6B6] text-[11px] font-bold uppercase tracking-wider text-[#526F7D]">
                <th className="py-3 px-4">Ref / ID</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">Monto</th>
                <th className="py-3 px-4">Fecha Pago</th>
                <th className="py-3 px-4">Comprobante</th>
                <th className="py-3 px-4">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#CBC6B6]/40 text-[#233D49]">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-[#566D7A]">
                    Cargando historial de facturas...
                  </td>
                </tr>
              ) : suscripciones.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-[#566D7A]">
                    No se han registrado pagos previos de suscripción.
                  </td>
                </tr>
              ) : (
                suscripciones.map((susc) => {
                  const isApproved = susc.estado === 'Aprobado';
                  const isPending = susc.estado === 'En Revisión';
                  const isRejected = susc.estado === 'Rechazado';

                  return (
                    <tr key={susc.id} className="hover:bg-[#FAF8F2] transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-[#566D7A] tabular-nums">
                        #{String(susc.id).substring(0, 8)}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#233D49]">
                        Plan {susc.plan_nombre}
                      </td>
                      <td className="py-3 px-4 font-bold tabular-nums font-mono text-sm">
                        {formatMoney(susc.monto)}
                      </td>
                      <td className="py-3 px-4 text-[#566D7A] tabular-nums">
                        {aFechaLocal(susc.fecha_pago || susc.fecha_registro).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4">
                        {susc.comprobante_url ? (
                          <a
                            href={susc.comprobante_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[#526F7D] hover:text-[#233D49] font-bold underline"
                          >
                            <ExternalLink size={12} />
                            <span>Ver Comprobante</span>
                          </a>
                        ) : (
                          <span className="text-[#566D7A] italic">Sin archivo</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            isApproved
                              ? 'bg-[#4D9A72]/15 text-[#2F7A55] border-[#4D9A72]/30'
                              : isPending
                              ? 'bg-[#C49A3A]/15 text-[#7A5C14] border-[#C49A3A]/30'
                              : 'bg-[#C95C5C]/15 text-[#B04646] border-[#C95C5C]/30'
                          }`}
                        >
                          {isApproved && <CheckCircle2 size={11} />}
                          {isPending && <Clock size={11} />}
                          {isRejected && <AlertCircle size={11} />}
                          <span>{susc.estado}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MiSuscripcion;

/** Barra de consumo de un recurso del plan; muestra "—" mientras no hay datos reales. */
function BarraConsumo({ etiqueta, uso, limite }) {
  const hayDatos = Number.isFinite(Number(uso)) && Number(limite) > 0 && uso !== null && uso !== undefined;
  const porcentaje = hayDatos ? Math.min(100, Math.round((Number(uso) / Number(limite)) * 100)) : 0;
  return (
    <div>
      <div className="flex justify-between text-[11px] mb-0.5">
        <span className="font-semibold text-[#233D49]">{etiqueta}</span>
        <span className="font-mono text-[#566D7A] font-bold">{hayDatos ? `${uso} / ${limite}` : '—'}</span>
      </div>
      <div className="w-full bg-[#F3F0E4] rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${hayDatos && Number(uso) >= Number(limite) ? 'bg-[#C95C5C]' : 'bg-[#526F7D]'}`}
          style={{ width: `${porcentaje}%` }}
        />
      </div>
    </div>
  );
}
