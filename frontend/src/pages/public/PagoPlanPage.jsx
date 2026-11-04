import React, { useState, useRef, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Building2,
  Copy,
  Check,
  UploadCloud,
  FileText,
  Mail,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Sparkles,
  CreditCard,
  Send,
  ShieldCheck,
  X,
} from 'lucide-react';
import { DATOS_TRANSFERENCIA_EVENTRA } from '../../components/public/ModalPagoPlanTransferencia';

export const PagoPlanPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const planParam = searchParams.get('plan') || 'Premium';
  const cicloParam = searchParams.get('ciclo') || 'monthly';

  const [selectedPlan, setSelectedPlan] = useState(
    planParam.toLowerCase().includes('basico') ? 'Basico' : 'Premium'
  );
  const [billingCycle, setBillingCycle] = useState(
    cicloParam === 'annual' ? 'annual' : 'monthly'
  );

  const [pdfFile, setPdfFile] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedField, setCopiedField] = useState('');

  // Modal de ingreso de correo una vez subido el PDF
  const [modalCorreoAbierto, setModalCorreoAbierto] = useState(false);
  const [correoCredenciales, setCorreoCredenciales] = useState('');
  const [nombreEmpresa, setNombreEmpresa] = useState('');
  const [pagoFinalizado, setPagoFinalizado] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    document.title = 'Pago por Transferencia · Planes EVENTRA';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const isAnnual = billingCycle === 'annual';
  const basicPrice = isAnnual ? 39 : 49;
  const premiumPrice = isAnnual ? 79 : 99;

  const planInfo =
    selectedPlan === 'Basico'
      ? {
          key: 'Basico',
          nombre: 'Plan Básico (Boutique)',
          precio: basicPrice,
          resumen: 'Hasta 10 eventos/mes · 3 cuentas de usuario · Bloqueo anti-colisión',
        }
      : {
          key: 'Premium',
          nombre: 'Plan Premium',
          precio: premiumPrice,
          resumen: 'Eventos y Usuarios Ilimitados · Asistente EVARA AI 24/7 · Portal Premium',
        };

  const cambiarPlan = (nuevoPlan) => {
    setSelectedPlan(nuevoPlan);
    setPagoFinalizado(false);
    setSearchParams({ plan: nuevoPlan, ciclo: billingCycle });
  };

  const handleCopy = (fieldKey, value) => {
    navigator.clipboard.writeText(value);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(''), 2200);
  };

  const handleCopyAll = () => {
    const texto = `Nombre: ${DATOS_TRANSFERENCIA_EVENTRA.nombre}\nCuenta: ${DATOS_TRANSFERENCIA_EVENTRA.cuenta}\nCédula: ${DATOS_TRANSFERENCIA_EVENTRA.cedula}\nCorreo: ${DATOS_TRANSFERENCIA_EVENTRA.correo}`;
    handleCopy('all', texto);
  };

  const handlePdfSelect = (file) => {
    setErrorMsg('');
    if (!file) return;

    const isPdf =
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setErrorMsg(
        'Formato no permitido. Por favor sube únicamente el comprobante de pago en formato PDF (.pdf).'
      );
      return;
    }

    if (file.size > 12 * 1024 * 1024) {
      setErrorMsg('El archivo PDF supera el límite máximo permitido de 12 MB.');
      return;
    }

    setPdfFile(file);
    setPagoFinalizado(false);
    // Una vez subido el PDF, mostrar el modal para que el usuario ingrese el correo donde llegarán las credenciales
    setModalCorreoAbierto(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handlePdfSelect(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handlePdfSelect(file);
  };

  const handleFinalizarSolicitud = (e) => {
    e.preventDefault();
    setErrorMsg('');

    const correoLimpio = correoCredenciales.trim();
    if (!correoLimpio || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoLimpio)) {
      setErrorMsg(
        'Por favor ingresa un correo electrónico válido al cual enviaremos las credenciales de acceso.'
      );
      return;
    }

    setModalCorreoAbierto(false);
    setPagoFinalizado(true);
  };

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Barra superior de retorno y pasos */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <Link
          to="/precios"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#233D49] hover:text-[#526F7D] bg-white px-4 py-2 rounded-xl border border-[#CBC6B6] shadow-xs transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Volver a Planes y Precios</span>
        </Link>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#CBC6B6] text-xs font-bold text-[#233D49]">
          <ShieldCheck size={15} className="text-[#4D9A72]" />
          <span>Activación Corporativa · Pago por Transferencia Bancaria Únicamente</span>
        </div>
      </div>

      {/* Mensaje en pantalla cuando el usuario pulsa Finalizar en el modal */}
      {pagoFinalizado && (
        <div className="mb-6 bg-white rounded-3xl border-2 border-[#4D9A72] shadow-lg p-6 sm:p-8 text-center space-y-4 animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-[#4D9A72] text-white flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 size={30} />
          </div>

          <div className="space-y-1.5 max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4D9A72]/15 text-[#4D9A72] text-xs font-extrabold uppercase tracking-wider">
              Comprobante PDF Registrado · {planInfo.nombre}
            </span>
            <h2
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              className="text-2xl sm:text-3xl font-bold text-[#233D49]"
            >
              ¡Proceso de Suscripción Finalizado!
            </h2>
            <p className="text-sm sm:text-base text-[#233D49] font-medium leading-relaxed">
              Se le enviará un correo electrónico a{' '}
              <strong className="text-[#233D49] underline decoration-[#4D9A72] decoration-2">
                {correoCredenciales}
              </strong>{' '}
              con las credenciales para el acceso a su cuenta
              {nombreEmpresa ? ` corporativa (${nombreEmpresa})` : ''}.
            </p>
          </div>

          <div className="max-w-lg mx-auto bg-[#F3F0E4] rounded-2xl p-4 border border-[#CBC6B6] text-left text-xs text-[#233D49] space-y-1.5">
            <div className="flex justify-between">
              <span className="font-bold text-[#526F7D]">Plan contratado:</span>
              <span className="font-extrabold">{planInfo.nombre} (${planInfo.precio}.00 USD/mes)</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-[#526F7D]">Comprobante adjunto:</span>
              <span className="font-mono font-bold truncate max-w-[240px]">{pdfFile?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-[#526F7D]">Correo de credenciales:</span>
              <span className="font-mono font-bold">{correoCredenciales}</span>
            </div>
          </div>

          <div className="pt-1 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#526F7D] hover:bg-[#3E5763] text-white text-xs sm:text-sm font-bold shadow-sm transition-colors"
            >
              <span>Ir al Portal de Acceso (Login)</span>
              <ArrowRight size={15} />
            </Link>
            <Link
              to="/precios"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#F3F0E4] hover:bg-[#CEC8B8]/50 text-[#233D49] border border-[#CBC6B6] text-xs sm:text-sm font-bold transition-colors"
            >
              <span>Ver Planes</span>
            </Link>
          </div>
        </div>
      )}

      {/* Contenedor Principal en Grid Compacto (cabe en pantalla al 100% sin desbordar) */}
      <div className="bg-white rounded-3xl border border-[#CBC6B6] shadow-md overflow-hidden">
        {/* Cabecera de la página de pago */}
        <div className="bg-[#F3F0E4]/80 px-6 sm:px-8 py-5 border-b border-[#CBC6B6] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#526F7D] text-white flex items-center justify-center shadow-xs shrink-0">
              <Building2 size={22} />
            </div>
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#526F7D] block">
                Suscripción Oficial EVENTRA SaaS
              </span>
              <h1
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                className="text-xl sm:text-2xl font-bold text-[#233D49]"
              >
                Pago por Transferencia Bancaria — {planInfo.nombre}
              </h1>
            </div>
          </div>

          {/* Selector rápido de Plan y Ciclo */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => cambiarPlan('Basico')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                selectedPlan === 'Basico'
                  ? 'bg-[#233D49] text-white border-[#233D49] shadow-xs'
                  : 'bg-white text-[#233D49] border-[#CBC6B6] hover:border-[#526F7D]'
              }`}
            >
              Plan Básico (${basicPrice}/mes)
            </button>
            <button
              type="button"
              onClick={() => cambiarPlan('Premium')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedPlan === 'Premium'
                  ? 'bg-[#233D49] text-white border-[#233D49] shadow-xs'
                  : 'bg-white text-[#233D49] border-[#CBC6B6] hover:border-[#526F7D]'
              }`}
            >
              <Sparkles size={13} className={selectedPlan === 'Premium' ? 'text-[#C49A3A]' : 'text-[#526F7D]'} />
              <span>Plan Premium (${premiumPrice}/mes)</span>
            </button>
          </div>
        </div>

        {/* Cuerpo en 2 columnas balanceadas */}
        <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* COLUMNA IZQUIERDA (7 cols): Datos de Transferencia */}
          <div className="lg:col-span-7 flex flex-col justify-between bg-[#F3F0E4]/60 rounded-2xl p-5 sm:p-6 border border-[#CBC6B6] space-y-5">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#526F7D] flex items-center gap-1.5">
                    <CreditCard size={14} />
                    Paso 1 · Realiza la Transferencia Bancaria
                  </span>
                  <h2 className="text-base sm:text-lg font-extrabold text-[#233D49] mt-0.5">
                    Datos Oficiales para Transferir
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={handleCopyAll}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#EEEBDD] text-[#233D49] border border-[#CBC6B6] text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                >
                  {copiedField === 'all' ? (
                    <>
                      <Check size={13} className="text-[#4D9A72]" />
                      <span className="text-[#4D9A72]">¡Datos copiados!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} className="text-[#526F7D]" />
                      <span>Copiar todos los datos</span>
                    </>
                  )}
                </button>
              </div>

              {/* Grid 2x2 con los datos exactos de transferencia */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Nombre */}
                <div className="bg-white rounded-xl p-3.5 border border-[#CBC6B6] flex items-center justify-between gap-2 shadow-2xs">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#526F7D] block">
                      Nombre del Titular
                    </span>
                    <span className="text-sm sm:text-base font-extrabold text-[#233D49]">
                      {DATOS_TRANSFERENCIA_EVENTRA.nombre}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('nombre', DATOS_TRANSFERENCIA_EVENTRA.nombre)}
                    className="p-2 rounded-lg bg-[#F3F0E4] hover:bg-[#CEC8B8]/60 text-[#233D49] transition-colors cursor-pointer"
                    title="Copiar Nombre"
                  >
                    {copiedField === 'nombre' ? <Check size={15} className="text-[#4D9A72]" /> : <Copy size={15} />}
                  </button>
                </div>

                {/* Cuenta */}
                <div className="bg-white rounded-xl p-3.5 border border-[#CBC6B6] flex items-center justify-between gap-2 shadow-2xs">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#526F7D] block">
                      Número de Cuenta
                    </span>
                    <span className="text-sm sm:text-base font-mono font-extrabold text-[#233D49]">
                      {DATOS_TRANSFERENCIA_EVENTRA.cuenta}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('cuenta', DATOS_TRANSFERENCIA_EVENTRA.cuenta)}
                    className="p-2 rounded-lg bg-[#F3F0E4] hover:bg-[#CEC8B8]/60 text-[#233D49] transition-colors cursor-pointer"
                    title="Copiar Cuenta"
                  >
                    {copiedField === 'cuenta' ? <Check size={15} className="text-[#4D9A72]" /> : <Copy size={15} />}
                  </button>
                </div>

                {/* Cédula */}
                <div className="bg-white rounded-xl p-3.5 border border-[#CBC6B6] flex items-center justify-between gap-2 shadow-2xs">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#526F7D] block">
                      Cédula de Identidad
                    </span>
                    <span className="text-sm sm:text-base font-mono font-extrabold text-[#233D49]">
                      {DATOS_TRANSFERENCIA_EVENTRA.cedula}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('cedula', DATOS_TRANSFERENCIA_EVENTRA.cedula)}
                    className="p-2 rounded-lg bg-[#F3F0E4] hover:bg-[#CEC8B8]/60 text-[#233D49] transition-colors cursor-pointer"
                    title="Copiar Cédula"
                  >
                    {copiedField === 'cedula' ? <Check size={15} className="text-[#4D9A72]" /> : <Copy size={15} />}
                  </button>
                </div>

                {/* Correo */}
                <div className="bg-white rounded-xl p-3.5 border border-[#CBC6B6] flex items-center justify-between gap-2 shadow-2xs">
                  <div className="min-w-0">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#526F7D] block">
                      Correo de Notificación
                    </span>
                    <span className="text-xs sm:text-sm font-mono font-extrabold text-[#233D49] truncate block">
                      {DATOS_TRANSFERENCIA_EVENTRA.correo}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('correo', DATOS_TRANSFERENCIA_EVENTRA.correo)}
                    className="p-2 rounded-lg bg-[#F3F0E4] hover:bg-[#CEC8B8]/60 text-[#233D49] transition-colors shrink-0 cursor-pointer"
                    title="Copiar Correo"
                  >
                    {copiedField === 'correo' ? <Check size={15} className="text-[#4D9A72]" /> : <Copy size={15} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Resumen del Monto a Transferir */}
            <div className="bg-white rounded-xl p-4 border border-[#CBC6B6] flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-xs font-extrabold text-[#233D49] block">
                  Monto exacto a transferir ({planInfo.nombre}):
                </span>
                <span className="text-[11px] text-[#233D49]/75">{planInfo.resumen}</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-extrabold text-[#233D49]">
                  ${planInfo.precio}.00 USD
                </span>
                <span className="text-[11px] font-bold text-[#526F7D] block">
                  {isAnnual ? 'Tarifa Anual Preferencial' : 'Suscripción Mensual'}
                </span>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA (5 cols): Subida del Comprobante PDF */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-[#FAF8F5] rounded-2xl p-5 sm:p-6 border-2 border-dashed border-[#526F7D]/60 space-y-4">
            <div className="space-y-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#526F7D] block">
                Paso 2 · Verificación de Comprobante
              </span>
              <h2 className="text-base sm:text-lg font-extrabold text-[#233D49]">
                Subir PDF del Comprobante de Pago
              </h2>
              <p className="text-xs text-[#233D49]/80 leading-relaxed">
                Adjunta el comprobante bancario en formato <strong>PDF (.pdf)</strong>. Al subirlo se abrirá la ventana para ingresar el correo donde recibirás tus credenciales.
              </p>
            </div>

            {errorMsg && !modalCorreoAbierto && (
              <div className="p-3 rounded-xl bg-[#C95C5C]/10 border border-[#C95C5C]/30 text-[#C95C5C] text-xs font-bold flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Zona interactiva para soltar o seleccionar el PDF */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex-1 min-h-[160px] rounded-2xl p-5 border transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-3 ${
                pdfFile
                  ? 'bg-[#4D9A72]/10 border-[#4D9A72]'
                  : 'bg-white hover:bg-[#F3F0E4]/60 border-[#CBC6B6]'
              }`}
            >
              {pdfFile ? (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-[#4D9A72] text-white flex items-center justify-center shadow-xs">
                    <FileText size={24} />
                  </div>
                  <div className="space-y-0.5 max-w-[240px]">
                    <span className="text-xs font-extrabold text-[#4D9A72] uppercase tracking-wider block">
                      Archivo PDF Cargado
                    </span>
                    <p className="text-sm font-bold text-[#233D49] truncate">
                      {pdfFile.name}
                    </p>
                    <p className="text-[11px] text-[#233D49]/65">
                      {(pdfFile.size / 1024).toFixed(1)} KB · Haz clic si deseas reemplazarlo
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-[#526F7D]/15 text-[#526F7D] flex items-center justify-center">
                    <UploadCloud size={24} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-extrabold text-[#233D49]">
                      Haz clic aquí o arrastra el PDF del comprobante
                    </p>
                    <p className="text-[11px] text-[#233D49]/70">
                      Acepta únicamente archivos <strong>.PDF</strong> (máx. 12 MB)
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Botones de acción directa */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-[#526F7D] hover:bg-[#3E5763] text-white text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer"
              >
                <FileText size={16} />
                <span>
                  {pdfFile ? 'Cambiar PDF del Comprobante' : 'Seleccionar PDF del Comprobante'}
                </span>
              </button>

              {pdfFile && (
                <button
                  type="button"
                  onClick={() => setModalCorreoAbierto(true)}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#233D49] hover:bg-[#182B34] text-white text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer"
                >
                  <Mail size={16} />
                  <span>Ingresar Correo para Recibir Credenciales</span>
                </button>
              )}
            </div>

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

      {/* ── MODAL COMPACTO Y CENTRADO PARA INGRESAR CORREO Y FINALIZAR ───── */}
      {modalCorreoAbierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#233D49]/65 backdrop-blur-xs animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-correo-credenciales-title"
        >
          <div className="w-full max-w-md bg-white rounded-3xl border-2 border-[#CBC6B6] shadow-2xl overflow-hidden">
            {/* Cabecera del modal */}
            <div className="bg-[#F3F0E4] px-6 py-4 border-b border-[#CBC6B6] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#526F7D] text-white flex items-center justify-center">
                  <Mail size={18} />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#526F7D] block">
                    Comprobante PDF Verificado
                  </span>
                  <h3
                    id="modal-correo-credenciales-title"
                    className="text-base font-extrabold text-[#233D49]"
                  >
                    Envío de Credenciales de Acceso
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalCorreoAbierto(false)}
                className="p-1.5 rounded-lg hover:bg-white text-[#233D49] transition-colors cursor-pointer"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            {/* Formulario compacto */}
            <form onSubmit={handleFinalizarSolicitud} className="p-6 space-y-4">
              <div className="p-3 rounded-xl bg-[#4D9A72]/10 border border-[#4D9A72]/30 flex items-center gap-3 text-xs">
                <FileText size={18} className="text-[#4D9A72] shrink-0" />
                <div className="min-w-0">
                  <span className="font-extrabold text-[#233D49] block truncate">
                    {pdfFile?.name}
                  </span>
                  <span className="text-[#4D9A72] font-bold">
                    {planInfo.nombre} · ${planInfo.precio}.00 USD
                  </span>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-[#C95C5C]/10 border border-[#C95C5C]/30 text-[#C95C5C] text-xs font-bold flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#233D49] mb-1.5">
                  Correo electrónico para recibir credenciales <span className="text-[#C95C5C]">*</span>
                </label>
                <input
                  type="email"
                  required
                  autoFocus
                  value={correoCredenciales}
                  onChange={(e) => setCorreoCredenciales(e.target.value)}
                  placeholder="ejemplo@tuempresa.com"
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#CBC6B6] focus:border-[#526F7D] text-sm font-medium text-[#233D49] bg-white focus:outline-none"
                />
                <p className="text-[11px] text-[#233D49]/75 mt-1">
                  A este correo enviaremos las credenciales de acceso para tu cuenta corporativa en EVENTRA.
                </p>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#233D49] mb-1.5">
                  Nombre de tu Empresa o Salón (Opcional)
                </label>
                <input
                  type="text"
                  value={nombreEmpresa}
                  onChange={(e) => setNombreEmpresa(e.target.value)}
                  placeholder="Ej. Recepciones & Eventos Imperial"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#CBC6B6] focus:border-[#526F7D] text-sm text-[#233D49] bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#CBC6B6]/50">
                <button
                  type="button"
                  onClick={() => setModalCorreoAbierto(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#CBC6B6] text-xs font-bold text-[#233D49] hover:bg-[#F3F0E4] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#526F7D] hover:bg-[#3E5763] text-white text-xs sm:text-sm font-bold shadow-sm transition-colors cursor-pointer"
                >
                  <Send size={15} />
                  <span>Finalizar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
