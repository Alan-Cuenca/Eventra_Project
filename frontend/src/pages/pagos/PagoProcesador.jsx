import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { eventraService } from '../../services/eventraService';
import { api } from '../../services/api';
import { 
  CreditCard, 
  Banknote, 
  Building2, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  QrCode, 
  FileText, 
  Copy, 
  Calendar, 
  DollarSign,
  ArrowLeft,
  X,
  FileCheck
} from 'lucide-react';

export const PagoProcesador = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Estados del Formulario
  const [metodo, setMetodo] = useState('Deuna'); // 'Deuna' | 'Transferencia' | 'Efectivo'
  const [monto, setMonto] = useState('');
  const [concepto, setConcepto] = useState('Anticipo');
  const [eventoId, setEventoId] = useState(searchParams.get('evento_id') || searchParams.get('evento') || '');
  const [eventosDisponibles, setEventosDisponibles] = useState([]);
  const [archivo, setArchivo] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [toast, setToast] = useState(null);
  const [datosPago, setDatosPago] = useState({});

  useEffect(() => {
    api.get('/empresas/mi-branding')
      .then((res) => setDatosPago(res?.data?.datos_pago || {}))
      .catch(() => {});
  }, []);

  const ETIQUETAS_PAGO = {
    banco: 'Institución bancaria', tipo_cuenta: 'Tipo de cuenta', numero_cuenta: 'Número de cuenta',
    titular: 'Titular', identificacion: 'RUC / Cédula', correo: 'Correo de notificación', deuna: 'Deuna',
  };
  const datosPagoLista = Object.entries(ETIQUETAS_PAGO)
    .filter(([clave]) => datosPago?.[clave])
    .map(([clave, etiqueta]) => [etiqueta, datosPago[clave]]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Cargar lista de eventos para facilitar la selección al usuario
  useEffect(() => {
    const cargarEventos = async () => {
      try {
        const data = await eventraService.getEventos();
        if (Array.isArray(data) && data.length > 0) {
          setEventosDisponibles(data);
          if (!eventoId && data[0]?.id) {
            setEventoId(data[0].id);
          }
        }
      } catch (err) {
        console.warn('No se pudieron precargar los eventos:', err);
      }
    };
    cargarEventos();
  }, []);

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

  const copiarAlPortapapeles = (texto) => {
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    showToast('Datos bancarios copiados al portapapeles', 'success');
    setTimeout(() => setCopiado(false), 2500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!eventoId) {
      showToast('Por favor selecciona o especifica el evento a abonar.', 'error');
      return;
    }

    if (!monto || isNaN(monto) || Number(monto) <= 0) {
      showToast('Ingresa un monto válido mayor a 0.', 'error');
      return;
    }

    // Obligatoriedad del comprobante para Deuna y Transferencia
    if ((metodo === 'Deuna' || metodo === 'Transferencia') && !archivo) {
      showToast('El comprobante de pago es obligatorio para este método.', 'error');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('evento_id', eventoId);
      formData.append('monto', Number(monto).toFixed(2));
      formData.append('concepto', concepto);
      formData.append('metodo_pago', metodo);

      if (archivo && metodo !== 'Efectivo') {
        formData.append('comprobante', archivo);
      }

      await eventraService.uploadPago(formData);

      showToast(
        metodo === 'Efectivo'
          ? 'Registro de pago en efectivo enviado. Quedará pendiente hasta tu visita a caja.'
          : 'Comprobante recibido con éxito. Tu abono se encuentra en revisión contable.',
        'success'
      );

      // Limpiar formulario tras éxito
      setMonto('');
      removerArchivo();
      e.target.reset();

    } catch (error) {
      console.error('Error al registrar pago:', error);
      showToast(
        error.message || 'Error al procesar el pago. Por favor intenta de nuevo.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in text-[#233D49] pb-12">
      
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#CBC6B6]/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#233D49] tracking-tight">
            Portal de Pagos & Anticipos
          </h1>
          <p className="text-sm text-[#526F7D] mt-1">
            Realiza abonos a tus recepciones y eventos corporativos con verificación inmediata.
          </p>
        </div>

        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#FAF8F5] border border-[#CBC6B6] text-xs font-bold text-[#526F7D] shadow-sm transition-all self-start sm:self-auto"
        >
          <ArrowLeft size={14} />
          <span>Volver</span>
        </button>
      </div>

      {/* Selector de Pestañas (Tabs) de Métodos de Pago */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { id: 'Deuna', label: 'Deuna (QR)', icon: CreditCard, badge: 'Inmediato' },
          { id: 'Transferencia', label: 'Transferencia', icon: Building2, badge: 'Bancario' },
          { id: 'Efectivo', label: 'Efectivo', icon: Banknote, badge: 'En Oficina' },
        ].map((tab) => {
          const Icon = tab.icon;
          const activo = metodo === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setMetodo(tab.id);
                if (tab.id === 'Efectivo') removerArchivo();
              }}
              className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 ${
                activo
                  ? 'bg-white border-[#526F7D] shadow-md ring-2 ring-[#526F7D]/20'
                  : 'bg-white/80 hover:bg-white border-[#CBC6B6] shadow-sm opacity-80 hover:opacity-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  activo ? 'bg-[#526F7D] text-white' : 'bg-[#526F7D]/10 text-[#526F7D]'
                }`}>
                  <Icon size={18} />
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  activo ? 'bg-[#526F7D]/15 text-[#526F7D]' : 'bg-[#FAF8F5] text-[#7D8F97]'
                }`}>
                  {tab.badge}
                </span>
              </div>
              <div>
                <p className={`text-sm font-extrabold ${activo ? 'text-[#233D49]' : 'text-[#526F7D]'}`}>
                  {tab.label}
                </p>
                <p className="text-[11px] text-[#7D8F97] mt-0.5">
                  {tab.id === 'Deuna' && 'Pago rápido escaneando código QR'}
                  {tab.id === 'Transferencia' && 'Cuentas corrientes verificadas'}
                  {tab.id === 'Efectivo' && 'Registro para pago físico en caja'}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Formulario Principal */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Contenido Condicional por Pestaña */}
        
        {/* TAB 1 y 2: DEUNA / TRANSFERENCIA — datos de cobro definidos por la empresa */}
        {(metodo === 'Deuna' || metodo === 'Transferencia') && (
          <div className="bg-white rounded-2xl border border-[#CBC6B6] p-6 shadow-sm animate-fade-in space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-[#233D49]">
                <Building2 size={18} className="text-[#526F7D]" />
                <span>{metodo === 'Deuna' ? 'Datos para pagar por Deuna' : 'Datos bancarios para la transferencia'}</span>
              </div>
              {datosPagoLista.length > 0 && (
                <button
                  type="button"
                  onClick={() => copiarAlPortapapeles(datosPagoLista.map(([k, v]) => `${k}: ${v}`).join(' | '))}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF8F5] hover:bg-[#F3F0E4] border border-[#CBC6B6] text-xs font-bold text-[#526F7D] transition-colors"
                >
                  <Copy size={13} />
                  <span>{copiado ? '¡Copiado!' : 'Copiar Datos'}</span>
                </button>
              )}
            </div>

            {datosPagoLista.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-[#FAF8F5] border border-[#CBC6B6]/60 text-xs">
                {datosPagoLista.map(([k, v]) => (
                  <div key={k}>
                    <span className="text-[#526F7D] font-semibold">{k}:</span>
                    <p className="font-extrabold text-[#233D49] text-sm break-words">{v}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#526F7D] p-4 rounded-xl bg-[#FAF8F5] border border-[#CBC6B6]/60">
                Tu organizador aún no ha publicado los datos de pago. Consúltalos con él y luego adjunta el comprobante aquí.
              </p>
            )}
            <p className="text-[11px] text-[#7D8F97]">
              Realiza el pago por el valor exacto y adjunta la captura o el PDF del comprobante más abajo.
            </p>
          </div>
        )}

        {/* TAB 3: EFECTIVO */}
        {metodo === 'Efectivo' && (
          <div className="bg-[#FAF8F5] rounded-2xl border-2 border-[#C49A3A]/40 p-6 shadow-sm animate-fade-in space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-[#C49A3A]">
              <Banknote size={18} />
              <span>Instrucciones para Pago Presencial en Efectivo</span>
            </div>
            <p className="text-xs text-[#233D49]/80 leading-relaxed">
              Acércate a nuestras oficinas centrales en horario de atención (Lunes a Viernes de 08:30 a 17:30). 
              Indica en caja tu <strong>nombre completo</strong> y el <strong>código del evento</strong>.
            </p>
            <div className="p-3 rounded-xl bg-white border border-[#CBC6B6]/60 text-xs text-[#7D8F97] flex items-center gap-2">
              <CheckCircle2 size={16} className="text-[#C49A3A] shrink-0" />
              <span>Este registro creará un ticket en estado <strong>"Pendiente"</strong> que se confirmará una vez recibido el dinero en caja física.</span>
            </div>
          </div>
        )}

        {/* Datos Generales del Pago: Evento, Concepto, Monto */}
        <div className="bg-white rounded-2xl border border-[#CBC6B6] p-6 shadow-sm space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#526F7D]">
            Información del Abono
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Evento */}
            <div>
              <label className="block text-xs font-bold text-[#233D49] mb-1.5">
                Evento o Recepción <span className="text-[#C95C5C]">*</span>
              </label>
              {eventosDisponibles.length > 0 ? (
                <select
                  value={eventoId}
                  onChange={(e) => setEventoId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBC6B6] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:border-[#526F7D] text-xs font-semibold text-[#233D49]"
                >
                  <option value="">Selecciona un evento...</option>
                  {eventosDisponibles.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.titulo} ({ev.fecha_evento || ev.id.substring(0, 8)})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="ID del Evento (UUID)..."
                  value={eventoId}
                  onChange={(e) => setEventoId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBC6B6] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:border-[#526F7D] text-xs font-semibold text-[#233D49]"
                />
              )}
            </div>

            {/* Concepto */}
            <div>
              <label className="block text-xs font-bold text-[#233D49] mb-1.5">
                Concepto del Pago <span className="text-[#C95C5C]">*</span>
              </label>
              <select
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBC6B6] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:border-[#526F7D] text-xs font-semibold text-[#233D49]"
              >
                <option value="Anticipo">Anticipo (Reserva inicial)</option>
                <option value="Abono">Abono (Pago parcial intermedio)</option>
                <option value="Liquidación">Liquidación (Saldo final del evento)</option>
              </select>
            </div>

            {/* Monto */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#233D49] mb-1.5">
                Monto a Transferir ($ USD) <span className="text-[#C95C5C]">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#526F7D]">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  required
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-[#CBC6B6] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:border-[#526F7D] text-sm font-extrabold text-[#233D49]"
                />
              </div>
            </div>

          </div>

          {/* Subida de Comprobante (Obligatoria para Deuna y Transferencia) */}
          {metodo !== 'Efectivo' && (
            <div className="pt-2 space-y-2">
              <label className="block text-xs font-bold text-[#233D49]">
                Adjuntar Comprobante de Pago <span className="text-[#C95C5C]">*</span>
              </label>
              
              {!archivo ? (
                <div className="border-2 border-dashed border-[#CBC6B6] hover:border-[#526F7D] rounded-2xl p-6 text-center bg-[#FAF8F5] transition-colors relative">
                  <input
                    type="file"
                    id="comprobante-input"
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
                        Haz clic o arrastra tu comprobante aquí
                      </p>
                      <p className="text-[11px] text-[#7D8F97] mt-0.5">
                        Formatos soportados: JPG, PNG o PDF (Máximo 5MB)
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
                        {(archivo.size / 1024).toFixed(1)} KB · Comprobante cargado
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={removerArchivo}
                    className="p-1.5 rounded-lg text-[#C95C5C] hover:bg-[#C95C5C]/10 transition-colors"
                    title="Eliminar archivo"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Botón de Envío */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#526F7D] hover:bg-[#3E5763] text-white font-bold text-xs tracking-wide shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Procesando pago...</span>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>
                  Confirmar y Enviar Abono {monto ? `($${Number(monto).toFixed(2)})` : ''}
                </span>
              </>
            )}
          </button>

        </div>

      </form>

    </div>
  );
};

export default PagoProcesador;
