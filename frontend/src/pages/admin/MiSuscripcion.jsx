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
  ArrowRight
} from 'lucide-react';

export const MiSuscripcion = () => {
  const { user } = useAuth();
  const [suscripciones, setSuscripciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [planSeleccionado, setPlanSeleccionado] = useState('Premium');
  const [archivo, setArchivo] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [toast, setToast] = useState(null);
  const [consumo, setConsumo] = useState({
    plan: 'Basico',
    limites: { usuarios: 3, clientes: 50, servicios: 20, chatbot: 300 },
    uso: { usuarios: 3, clientes: 50, servicios: 20, chatbot: 300 },
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    cargarHistorial();
  }, []);

  const cargarHistorial = async () => {
    setLoading(true);
    try {
      const [data, consumoData] = await Promise.all([
        eventraService.getSuscripciones(),
        eventraService.getConsumoSuscripcion(),
      ]);
      setSuscripciones(Array.isArray(data) ? data : []);
      if (consumoData && consumoData.limites && consumoData.uso) {
        setConsumo(consumoData);
      }
    } catch (error) {
      console.error('Error cargando suscripciones:', error);
      showToast('Error al cargar historial de suscripción', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setArchivo(file);
      if (file.type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const removerArchivo = () => {
    setArchivo(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleSubmitPago = async (e) => {
    e.preventDefault();

    if (!archivo) {
      showToast('Por favor adjunta el comprobante de transferencia bancaria.', 'error');
      return;
    }

    setEnviando(true);
    try {
      const formData = new FormData();
      formData.append('plan_nombre', planSeleccionado);
      formData.append('monto', planSeleccionado === 'Premium' ? '99.00' : '49.00');
      formData.append('comprobante', archivo);

      await eventraService.pagarSuscripcion(formData);

      showToast('Comprobante enviado exitosamente. Tu plan está en revisión por el Super_Admin.', 'success');
      removerArchivo();
      await cargarHistorial();
    } catch (error) {
      console.error('Error registrando pago:', error);
      showToast(error.response?.data?.message || 'Error al enviar comprobante de pago.', 'error');
    } finally {
      setEnviando(false);
    }
  };

  // Plan actual de la empresa desde el usuario o el último registro
  const planActual = user?.plan_suscripcion || suscripciones[0]?.empresa_plan_actual || 'Basico';
  const esPremium = planActual.toLowerCase().includes('premium');
  const costoActual = esPremium ? 99.00 : 49.00;

  // Estado general de la cuenta
  const tienePagoPendiente = suscripciones.some((s) => s.estado === 'En Revisión');

  return (
    <div className="space-y-6 animate-fade-in text-[#233D49]">
      
      {/* Toast Notification Flotante */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold animate-fade-in ${
          toast.type === 'error'
            ? 'bg-[#C95C5C] text-white border-[#C95C5C]'
            : 'bg-[#4D9A72] text-white border-[#4D9A72]'
        }`}>
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
            Administra el plan corporativo de <strong>{user?.empresa_nombre || 'tu empresa'}</strong> y renueva tu membresía mensual.
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
            <div className="mt-3 flex items-baseline gap-2">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#233D49]">
                Plan {planActual}
              </h3>
              <span className="text-sm font-bold text-[#526F7D] tabular-nums">
                ${costoActual.toFixed(2)}/mes
              </span>
            </div>
          </div>
          <p className="text-xs text-[#7D8F97] mt-3 pt-2 border-t border-[#CBC6B6]/40 flex items-center gap-1.5">
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
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                tienePagoPendiente ? 'bg-[#C49A3A]/15 text-[#C49A3A]' : 'bg-[#4D9A72]/15 text-[#4D9A72]'
              }`}>
                <ShieldCheck size={18} />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                tienePagoPendiente 
                  ? 'bg-[#C49A3A]/15 text-[#C49A3A] border-[#C49A3A]/30'
                  : 'bg-[#4D9A72]/15 text-[#4D9A72] border-[#4D9A72]/30'
              }`}>
                {tienePagoPendiente ? 'En Revisión' : 'Activa y Vigente'}
              </span>
            </div>
          </div>
          <p className="text-xs text-[#7D8F97] mt-3 pt-2 border-t border-[#CBC6B6]/40">
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
              <span className="text-xs font-semibold text-[#7D8F97]">meses pagos</span>
            </div>
          </div>
          <p className="text-xs text-[#7D8F97] mt-3 pt-2 border-t border-[#CBC6B6]/40 flex items-center gap-1.5">
            <Clock size={13} className="text-[#526F7D]" />
            <span>Facturación unificada</span>
          </p>
        </div>

        {/* KPI 4: Consumo del Plan (Toss-style) */}
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

            <div className="mt-3 space-y-2">
              {/* Barra: Usuarios */}
              <div>
                <div className="flex justify-between text-[11px] mb-0.5">
                  <span className="font-semibold text-[#233D49]">Usuarios</span>
                  <span className="font-mono text-[#7D8F97] font-bold">
                    {consumo.uso?.usuarios ?? 3} / {consumo.limites?.usuarios ?? 3}
                  </span>
                </div>
                <div className="w-full bg-[#F3F0E4] rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      (consumo.uso?.usuarios ?? 3) >= (consumo.limites?.usuarios ?? 3)
                        ? 'bg-[#C95C5C]'
                        : 'bg-[#526F7D]'
                    }`}
                    style={{
                      width: `${Math.min(100, Math.round(((consumo.uso?.usuarios ?? 3) / (consumo.limites?.usuarios ?? 3)) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              {/* Barra: Clientes */}
              <div>
                <div className="flex justify-between text-[11px] mb-0.5">
                  <span className="font-semibold text-[#233D49]">Clientes</span>
                  <span className="font-mono text-[#7D8F97] font-bold">
                    {consumo.uso?.clientes ?? 50} / {consumo.limites?.clientes ?? 50}
                  </span>
                </div>
                <div className="w-full bg-[#F3F0E4] rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      (consumo.uso?.clientes ?? 50) >= (consumo.limites?.clientes ?? 50)
                        ? 'bg-[#C95C5C]'
                        : 'bg-[#526F7D]'
                    }`}
                    style={{
                      width: `${Math.min(100, Math.round(((consumo.uso?.clientes ?? 50) / (consumo.limites?.clientes ?? 50)) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              {/* Barra: Mensajes de IA */}
              <div>
                <div className="flex justify-between text-[11px] mb-0.5">
                  <span className="font-semibold text-[#233D49]">Mensajes de IA</span>
                  <span className="font-mono text-[#7D8F97] font-bold">
                    {consumo.uso?.chatbot ?? 300} / {consumo.limites?.chatbot ?? 300}
                  </span>
                </div>
                <div className="w-full bg-[#F3F0E4] rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      (consumo.uso?.chatbot ?? 300) >= (consumo.limites?.chatbot ?? 300)
                        ? 'bg-[#C95C5C]'
                        : 'bg-[#526F7D]'
                    }`}
                    style={{
                      width: `${Math.min(100, Math.round(((consumo.uso?.chatbot ?? 300) / (consumo.limites?.chatbot ?? 300)) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-[#7D8F97] mt-3 pt-2 border-t border-[#CBC6B6]/40">
            Cuota mensual asignada
          </p>
        </div>

      </div>

      {/* Banner Destacado para Upgrade a Plan Premium */}
      {!esPremium && (
        <div className="bg-gradient-to-r from-[#F3F0E4] via-[#FAF8F2] to-white border border-[#C49A3A]/40 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5 animate-fade-in">
          <div className="space-y-1.5 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#C49A3A]/15 text-[#9A7422] border border-[#C49A3A]/30">
              <Sparkles size={13} />
              Oportunidad de Crecimiento SaaS
            </span>
            <h3 className="text-lg sm:text-xl font-extrabold text-[#233D49]">
              ¿Tu empresa necesita más capacidad? Pasa a Premium por $99/mes
            </h3>
            <p className="text-xs sm:text-sm text-[#233D49]/80 leading-relaxed">
              Desbloquea hasta <strong>200 clientes</strong> en tu directorio, <strong>10 colaboradores</strong> simultáneos, <strong>50 servicios</strong> en tu catálogo y hasta <strong>1,500 consultas mensuales</strong> con nuestro asistente inteligente <strong>EVARA AI 24/7</strong>.
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
            <span>Mejorar a Premium ($99)</span>
            <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* Formulario de Pago y Renovación de Mensualidad */}
      <div id="seccion-formulario-pago" className="bg-white shadow-sm rounded-2xl border border-[#CBC6B6] p-6 space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-[#CBC6B6]/60">
          <div className="w-9 h-9 rounded-xl bg-[#526F7D]/10 text-[#526F7D] flex items-center justify-center">
            <CreditCard size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#233D49]">
              Renovar o Mejorar Plan de Suscripción
            </h2>
            <p className="text-xs text-[#7D8F97]">
              Transfiere la mensualidad correspondiente y sube el comprobante para activación instantánea.
            </p>
          </div>
        </div>

        {/* Selector de Plan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Plan Básico */}
          <div
            onClick={() => setPlanSeleccionado('Basico')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
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
                $49.00 <span className="text-xs font-normal text-[#7D8F97]">/mes</span>
              </span>
            </div>
            <p className="text-xs text-[#7D8F97] mt-1">
              Ideal para empresas con gestión de hasta 10 eventos simultáneos y catálogo esencial.
            </p>
          </div>

          {/* Plan Premium */}
          <div
            onClick={() => setPlanSeleccionado('Premium')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all relative overflow-hidden ${
              planSeleccionado === 'Premium'
                ? 'border-[#526F7D] bg-[#F3F0E4]/40 ring-2 ring-[#526F7D]/20 shadow-sm'
                : 'border-[#CBC6B6] bg-white hover:bg-[#FAF8F5]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#526F7D] flex items-center gap-1">
                <Sparkles size={13} className="text-[#C49A3A]" />
                Plan Premium (Recomendado)
              </span>
              <span className="text-sm font-extrabold text-[#233D49] tabular-nums">
                $99.00 <span className="text-xs font-normal text-[#7D8F97]">/mes</span>
              </span>
            </div>
            <p className="text-xs text-[#7D8F97] mt-1">
              Eventos ilimitados, Asistente AI EVARA, cotizador predictivo y soporte prioritario 24/7.
            </p>
          </div>

        </div>

        {/* Datos Bancarios para la Transferencia SaaS */}
        <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#CBC6B6]/60 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-[#233D49]">
            <Building2 size={16} className="text-[#526F7D]" />
            <span>Datos Bancarios para Depósito de Suscripción EVENTRA SaaS:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[#233D49]/90 pt-1">
            <p><strong>Banco:</strong> Banco Pichincha</p>
            <p><strong>Cuenta Corriente:</strong> <span className="font-mono tabular-nums">2100889922</span></p>
            <p><strong>Titular:</strong> EVENTRA HOLDINGS S.A.</p>
          </div>
        </div>

        {/* Formulario de Carga de Comprobante */}
        <form onSubmit={handleSubmitPago} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#233D49] mb-1.5">
              Subir Comprobante de Pago ({planSeleccionado} — ${planSeleccionado === 'Premium' ? '99.00' : '49.00'}) <span className="text-[#C95C5C]">*</span>
            </label>

            {!archivo ? (
              <div className="border-2 border-dashed border-[#CBC6B6] hover:border-[#526F7D] rounded-2xl p-6 text-center bg-[#FAF8F5] transition-colors relative">
                <input
                  type="file"
                  id="comprobante-suscripcion"
                  accept="image/*,application/pdf"
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
                      Haz clic o arrastra el comprobante de transferencia bancaria
                    </p>
                    <p className="text-[11px] text-[#7D8F97] mt-0.5">
                      Formatos: PNG, JPG o PDF (Máximo 5MB)
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
                    <p className="text-[11px] text-[#7D8F97]">
                      {(archivo.size / 1024).toFixed(1)} KB · Comprobante listo para enviar
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={removerArchivo}
                  className="p-1.5 rounded-lg text-[#C95C5C] hover:bg-[#C95C5C]/10 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={enviando}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#526F7D] hover:bg-[#3E5763] text-white text-xs font-bold tracking-wide shadow-sm hover:shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {enviando ? (
              <span>Enviando comprobante...</span>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>Enviar Pago de Mensualidad ({planSeleccionado} - ${planSeleccionado === 'Premium' ? '99.00' : '49.00'})</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Historial de Facturas (Tabla Densa con tabular-nums) */}
      <div className="bg-white rounded-2xl border border-[#CBC6B6] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#CBC6B6]/60 flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#233D49]">
            Historial de Facturación y Comprobantes
          </h2>
          <span className="text-xs text-[#7D8F97]">
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
                  <td colSpan="6" className="py-8 text-center text-[#7D8F97]">
                    Cargando historial de facturas...
                  </td>
                </tr>
              ) : suscripciones.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-[#7D8F97]">
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
                      <td className="py-3 px-4 font-mono text-[11px] text-[#7D8F97] tabular-nums">
                        #{String(susc.id).substring(0, 8)}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#233D49]">
                        Plan {susc.plan_nombre}
                      </td>
                      <td className="py-3 px-4 font-bold tabular-nums font-mono text-sm">
                        ${Number(susc.monto).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-[#7D8F97] tabular-nums">
                        {new Date(susc.fecha_pago || susc.fecha_registro).toLocaleDateString('es-ES', {
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
                          <span className="text-[#7D8F97] italic">Sin archivo</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          isApproved
                            ? 'bg-[#4D9A72]/15 text-[#4D9A72] border-[#4D9A72]/30'
                            : isPending
                            ? 'bg-[#C49A3A]/15 text-[#C49A3A] border-[#C49A3A]/30'
                            : 'bg-[#C95C5C]/15 text-[#C95C5C] border-[#C95C5C]/30'
                        }`}>
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

