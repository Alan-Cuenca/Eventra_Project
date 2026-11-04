import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  Building2,
  Copy,
  Check,
  UploadCloud,
  FileText,
  Mail,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  User,
  CreditCard,
  Send,
} from 'lucide-react';

export const DATOS_TRANSFERENCIA_EVENTRA = {
  nombre: 'Alejandro Falcon',
  cuenta: '2210101010',
  cedula: '1850116508',
  correo: 'mfalcon6508@uta.edu.ec',
};

export const ModalPagoPlanTransferencia = ({
  isOpen,
  onClose,
  initialPlan = 'Premium',
  isAnnual = false,
}) => {
  const [selectedPlan, setSelectedPlan] = useState(initialPlan || 'Premium');
  // 'transferencia' | 'correo_credenciales' | 'finalizado'
  const [step, setStep] = useState('transferencia');
  const [pdfFile, setPdfFile] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedField, setCopiedField] = useState('');
  const [correoDestino, setCorreoDestino] = useState('');
  const [nombreEmpresa, setNombreEmpresa] = useState('');
  const [procesando, setProcesando] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedPlan(initialPlan || 'Premium');
      setStep('transferencia');
      setPdfFile(null);
      setErrorMsg('');
      setCorreoDestino('');
      setNombreEmpresa('');
      setProcesando(false);
    }
  }, [isOpen, initialPlan]);

  if (!isOpen) return null;

  const esPremium = selectedPlan.toLowerCase().includes('premium');
  const precioMensual = esPremium ? (isAnnual ? 79 : 99) : (isAnnual ? 39 : 49);
  const nombrePlanDisplay = esPremium ? 'Plan Premium' : 'Plan Básico (Boutique)';

  const handleCopy = (label, value) => {
    navigator.clipboard.writeText(value);
    setCopiedField(label);
    setTimeout(() => setCopiedField(''), 2500);
  };

  const handleCopyAll = () => {
    const texto = `Nombre: ${DATOS_TRANSFERENCIA_EVENTRA.nombre}\nCuenta: ${DATOS_TRANSFERENCIA_EVENTRA.cuenta}\nCédula: ${DATOS_TRANSFERENCIA_EVENTRA.cedula}\nCorreo: ${DATOS_TRANSFERENCIA_EVENTRA.correo}`;
    navigator.clipboard.writeText(texto);
    setCopiedField('all');
    setTimeout(() => setCopiedField(''), 2500);
  };

  const validarYProcesarArchivo = (file) => {
    if (!file) return;
    setErrorMsg('');

    const isPdf =
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      setErrorMsg('Por favor sube únicamente el comprobante de pago en formato PDF (.pdf).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('El archivo PDF no debe superar los 10 MB.');
      return;
    }

    setPdfFile(file);
    // Una vez subido el PDF, se muestra el modal para ingresar el correo de la empresa
    setStep('correo_credenciales');
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      validarYProcesarArchivo(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      validarYProcesarArchivo(file);
    }
  };

  const handleFinalizar = (e) => {
    e.preventDefault();
    setErrorMsg('');

    const emailLimpio = correoDestino.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailLimpio || !emailRegex.test(emailLimpio)) {
      setErrorMsg('Por favor ingresa un correo electrónico válido donde enviaremos las credenciales de tu empresa.');
      return;
    }

    setProcesando(true);
    setTimeout(() => {
      setProcesando(false);
      setStep('finalizado');
    }, 500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#233D49]/60 backdrop-blur-xs animate-fade-in overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-2xl backdrop-blur-xl backdrop-saturate-[180%] bg-[var(--ev-surface)]/80 rounded-3xl border-0 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6),_0_10px_25px_-5px_rgba(35,61,73,0.1)] overflow-hidden my-8">
        {/* Cabecera Superior */}
        <div className="bg-[var(--ev-surface)]/40 px-6 py-5 border-b border-[var(--ev-border)]/20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#4D7182] text-white flex items-center justify-center shadow-xs shrink-0">
              {step === 'transferencia' && <Building2 size={20} />}
              {step === 'correo_credenciales' && <Mail size={20} />}
              {step === 'finalizado' && <CheckCircle2 size={20} />}
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#4D7182] block">
                {step === 'transferencia' && 'Paso 1 de 2 · Pago por Transferencia Bancaria Únicamente'}
                {step === 'correo_credenciales' && 'Paso 2 de 2 · Entrega de Credenciales Corporativas'}
                {step === 'finalizado' && 'Suscripción Registrada · Envío de Credenciales'}
              </span>
              <h3 className="text-lg sm:text-xl font-extrabold text-[#233D49]">
                {step === 'transferencia' && `Contratar ${nombrePlanDisplay}`}
                {step === 'correo_credenciales' && '¿A qué correo enviamos tus credenciales?'}
                {step === 'finalizado' && '¡Solicitud de Activación Completada!'}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/80 hover:bg-white text-[#233D49] border border-[#CBC6B6] transition-colors"
            title="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-6 sm:p-8 space-y-6">
          {errorMsg && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[#C95C5C]/10 border border-[#C95C5C]/30 text-[#C95C5C] text-xs sm:text-sm font-semibold">
              <AlertCircle size={18} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ── PASO 1: DATOS DE TRANSFERENCIA Y SUBIDA DE PDF ───────────────── */}
          {step === 'transferencia' && (
            <div className="space-y-6">
              {/* Selector Rápido de Plan */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4D7182] mb-2">
                  1. Plan Seleccionado
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedPlan('Basico')}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                      !esPremium
                        ? 'border-[#4D7182] bg-[#F3F0E4]/60 shadow-xs'
                        : 'border-[#CBC6B6]/70 bg-white hover:bg-[#FAF8F5]'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold text-[#233D49] block">Plan Básico (Boutique)</span>
                      <span className="text-[11px] text-[#4D7182]">Hasta 10 eventos/mes · 3 usuarios</span>
                    </div>
                    <span className="text-base font-extrabold text-[#233D49] tabular-nums">
                      ${isAnnual ? 39 : 49}<span className="text-[11px] font-normal">/mes</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPlan('Premium')}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                      esPremium
                        ? 'border-[#4D7182] bg-[#F3F0E4]/60 shadow-xs'
                        : 'border-[#CBC6B6]/70 bg-white hover:bg-[#FAF8F5]'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold text-[#233D49] flex items-center gap-1">
                        <Sparkles size={13} className="text-[#C49A3A]" />
                        Plan Premium
                      </span>
                      <span className="text-[11px] text-[#4D7182]">Eventos y Usuarios Ilimitados + IA</span>
                    </div>
                    <span className="text-base font-extrabold text-[#233D49] tabular-nums">
                      ${isAnnual ? 79 : 99}<span className="text-[11px] font-normal">/mes</span>
                    </span>
                  </button>
                </div>
              </div>

              {/* Tarjeta de Datos Oficiales para Transferencia Bancaria Únicamente */}
              <div className="rounded-2xl bg-[#F3F0E4]/70 border border-[#CBC6B6] p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#CBC6B6]/70">
                  <div className="flex items-center gap-2">
                    <CreditCard size={18} className="text-[#4D7182]" />
                    <span className="text-xs sm:text-sm font-extrabold text-[#233D49]">
                      2. Datos para Pago por Transferencia Bancaria Únicamente
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyAll}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF8F5] border border-[#CBC6B6] text-xs font-bold text-[#4D7182] transition-colors self-start sm:self-auto"
                  >
                    {copiedField === 'all' ? (
                      <>
                        <Check size={13} className="text-[#4D9A72]" />
                        <span className="text-[#4D9A72]">Datos copiados</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        <span>Copiar todos los datos</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Nombre */}
                  <div className="bg-white rounded-xl p-3 border border-[#CBC6B6]/80 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#4D7182] block">
                        Nombre del Titular
                      </span>
                      <span className="text-sm font-extrabold text-[#233D49]">
                        {DATOS_TRANSFERENCIA_EVENTRA.nombre}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy('nombre', DATOS_TRANSFERENCIA_EVENTRA.nombre)}
                      className="p-1.5 rounded-lg hover:bg-[#F3F0E4] text-[#4D7182] transition-colors"
                      title="Copiar Nombre"
                    >
                      {copiedField === 'nombre' ? <Check size={14} className="text-[#4D9A72]" /> : <Copy size={14} />}
                    </button>
                  </div>

                  {/* Cuenta */}
                  <div className="bg-white rounded-xl p-3 border border-[#CBC6B6]/80 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#4D7182] block">
                        Número de Cuenta
                      </span>
                      <span className="text-sm font-mono font-extrabold text-[#233D49] tabular-nums">
                        {DATOS_TRANSFERENCIA_EVENTRA.cuenta}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy('cuenta', DATOS_TRANSFERENCIA_EVENTRA.cuenta)}
                      className="p-1.5 rounded-lg hover:bg-[#F3F0E4] text-[#4D7182] transition-colors"
                      title="Copiar Cuenta"
                    >
                      {copiedField === 'cuenta' ? <Check size={14} className="text-[#4D9A72]" /> : <Copy size={14} />}
                    </button>
                  </div>

                  {/* Cédula */}
                  <div className="bg-white rounded-xl p-3 border border-[#CBC6B6]/80 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#4D7182] block">
                        Cédula de Identidad
                      </span>
                      <span className="text-sm font-mono font-extrabold text-[#233D49] tabular-nums">
                        {DATOS_TRANSFERENCIA_EVENTRA.cedula}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy('cedula', DATOS_TRANSFERENCIA_EVENTRA.cedula)}
                      className="p-1.5 rounded-lg hover:bg-[#F3F0E4] text-[#4D7182] transition-colors"
                      title="Copiar Cédula"
                    >
                      {copiedField === 'cedula' ? <Check size={14} className="text-[#4D9A72]" /> : <Copy size={14} />}
                    </button>
                  </div>

                  {/* Correo */}
                  <div className="bg-white rounded-xl p-3 border border-[#CBC6B6]/80 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#4D7182] block">
                        Correo de Notificación
                      </span>
                      <span className="text-sm font-mono font-bold text-[#233D49] truncate block">
                        {DATOS_TRANSFERENCIA_EVENTRA.correo}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy('correo', DATOS_TRANSFERENCIA_EVENTRA.correo)}
                      className="p-1.5 rounded-lg hover:bg-[#F3F0E4] text-[#4D7182] transition-colors shrink-0"
                      title="Copiar Correo"
                    >
                      {copiedField === 'correo' ? <Check size={14} className="text-[#4D9A72]" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 text-xs text-[#233D49]/80">
                  <span>Monto total a transferir ({nombrePlanDisplay}):</span>
                  <span className="text-base font-extrabold text-[#233D49] tabular-nums">
                    ${precioMensual}.00 USD
                  </span>
                </div>
              </div>

              {/* Subida del PDF del Comprobante de Pago */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4D7182]">
                  3. Subir Comprobante de Pago en PDF <span className="text-[#C95C5C]">*</span>
                </label>

                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#4D7182]/60 hover:border-[#4D7182] bg-[#FAF8F5] hover:bg-[#F3F0E4]/50 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#4D7182]/10 text-[#4D7182] flex items-center justify-center">
                    <UploadCloud size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#233D49]">
                      Haz clic aquí o arrastra el PDF del comprobante de pago
                    </p>
                    <p className="text-xs text-[#233D49]/65 mt-0.5">
                      Formato admitido: Documento PDF (.pdf) · Al subirlo ingresarás el correo para tus credenciales
                    </p>
                  </div>
                  <button
                    type="button"
                    className="mt-1 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4D7182] hover:bg-[#3B5968] text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    <FileText size={15} />
                    <span>Seleccionar PDF del Comprobante</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── PASO 2: MODAL PARA INGRESAR EL CORREO DE CREDENCIALES ─────────── */}
          {step === 'correo_credenciales' && (
            <form onSubmit={handleFinalizar} className="space-y-6 animate-fade-in">
              {/* Confirmación del PDF Subido */}
              <div className="p-4 rounded-2xl bg-[#4D9A72]/10 border border-[#4D9A72]/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#4D9A72] text-white flex items-center justify-center shrink-0">
                    <FileText size={20} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#4D9A72] block">
                      Comprobante PDF Cargado Correctamente
                    </span>
                    <p className="text-xs sm:text-sm font-bold text-[#233D49] truncate">
                      {pdfFile?.name || 'comprobante_transferencia.pdf'} ({((pdfFile?.size || 102400) / 1024).toFixed(1)} KB)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('transferencia')}
                  className="text-xs font-bold text-[#4D7182] hover:text-[#233D49] underline shrink-0"
                >
                  Cambiar PDF
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#233D49] mb-1.5">
                    Correo Electrónico para Recepción de Credenciales <span className="text-[#C95C5C]">*</span>
                  </label>
                  <div className="relative">
                    <Mail size={18} className="w-4 h-4 text-[#4D7182] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={correoDestino}
                      onChange={(e) => setCorreoDestino(e.target.value)}
                      placeholder="gerencia@tuempresa.com"
                      autoFocus
                      className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-[#CBC6B6] focus:border-[#4D7182] bg-white text-sm text-[#233D49] font-medium focus:outline-none"
                    />
                  </div>
                  <p className="text-xs text-[#233D49]/70 mt-1.5">
                    A este correo electrónico se enviarán el usuario administrador, contraseña temporal y enlace de acceso a tu cuenta corporativa de EVENTRA.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#233D49] mb-1.5">
                    Nombre de tu Empresa o Centro de Eventos (Opcional)
                  </label>
                  <div className="relative">
                    <User size={18} className="w-4 h-4 text-[#4D7182] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={nombreEmpresa}
                      onChange={(e) => setNombreEmpresa(e.target.value)}
                      placeholder="Ej. Recepciones & Eventos Imperial"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#CBC6B6] focus:border-[#4D7182] bg-white text-sm text-[#233D49] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('transferencia')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-[#CBC6B6] text-xs font-bold text-[#233D49] hover:bg-[#FAF8F5] transition-colors"
                >
                  <ArrowLeft size={15} />
                  <span>Volver a Datos Bancarios</span>
                </button>

                <button
                  type="submit"
                  disabled={procesando}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-[#4D7182] hover:bg-[#3B5968] text-white text-sm font-bold shadow-md transition-all"
                >
                  <Send size={16} />
                  <span>{procesando ? 'Procesando...' : 'Finalizar'}</span>
                </button>
              </div>
            </form>
          )}

          {/* ── PASO 3: MENSAJE EN PANTALLA DE ENVÍO DE CREDENCIALES ─────────── */}
          {step === 'finalizado' && (
            <div className="text-center py-4 space-y-6 animate-fade-in">
              <div className="w-16 h-16 rounded-3xl bg-[#4D9A72]/15 text-[#4D9A72] flex items-center justify-center mx-auto shadow-xs border border-[#4D9A72]/30">
                <CheckCircle2 size={36} />
              </div>

              <div className="space-y-2 max-w-lg mx-auto">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4D9A72]/15 text-[#4D9A72] text-xs font-bold">
                  <ShieldCheck size={14} />
                  Comprobante PDF Recibido
                </span>
                <h4 className="text-2xl font-extrabold text-[#233D49]">
                  ¡Gracias por adquirir el {nombrePlanDisplay}!
                </h4>
                <p className="text-sm sm:text-base text-[#233D49]/85 leading-relaxed bg-[#F3F0E4] p-4 rounded-2xl border border-[#CBC6B6]">
                  Se le enviará un correo electrónico a{' '}
                  <strong className="text-[#233D49] underline decoration-[#4D7182]">
                    {correoDestino}
                  </strong>{' '}
                  con las credenciales para el acceso a su cuenta
                  {nombreEmpresa ? ` de ${nombreEmpresa}` : ''}.
                </p>
              </div>

              <div className="bg-[#FAF8F5] rounded-2xl p-4 border border-[#CBC6B6]/80 max-w-md mx-auto text-left text-xs space-y-1.5 text-[#233D49]/80">
                <div className="flex justify-between">
                  <span className="font-semibold">Plan seleccionado:</span>
                  <span className="font-bold text-[#233D49]">{nombrePlanDisplay} (${precioMensual}/mes)</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Titular de transferencia:</span>
                  <span className="font-bold text-[#233D49]">{DATOS_TRANSFERENCIA_EVENTRA.nombre} ({DATOS_TRANSFERENCIA_EVENTRA.cuenta})</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Comprobante PDF:</span>
                  <span className="font-mono text-[#4D7182] truncate max-w-[180px]">{pdfFile?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Correo de credenciales:</span>
                  <span className="font-bold text-[#4D9A72]">{correoDestino}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl border border-[#CBC6B6] bg-white hover:bg-[#FAF8F5] text-xs font-bold text-[#233D49] transition-colors"
                >
                  Cerrar Ventana
                </button>
                <Link
                  to="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#4D7182] hover:bg-[#3B5968] text-white text-xs font-bold shadow-sm transition-colors"
                >
                  <span>Ir al Inicio de Sesión</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalPagoPlanTransferencia;
