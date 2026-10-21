import React from 'react';
import {
  X,
  Building2,
  Calendar,
  Users,
  CalendarDays,
  DollarSign,
  ShieldCheck,
  ShieldAlert,
  Layers,
  FileText,
} from 'lucide-react';

/**
 * =============================================================================
 * DetalleEmpresaModal
 * =============================================================================
 * Presenta el desglose informativo completo de un inquilino a partir de los
 * datos reales devueltos por el backend (GET /api/empresas).
 * =============================================================================
 */
export const DetalleEmpresaModal = ({
  isOpen,
  onClose,
  empresa,
  onAbrirCambiarPlan,
  onAbrirSuspender,
}) => {
  if (!isOpen || !empresa) return null;

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return 'No disponible';
    try {
      const f = new Date(fechaStr);
      return f.toLocaleDateString('es-EC', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return fechaStr;
    }
  };

  const formatearMoneda = (monto) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Number(monto || 0));
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#233D49]/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-xl rounded-2xl border border-[#CEC8B8] shadow-xl overflow-hidden my-8 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="p-5 border-b border-[#CEC8B8] flex items-center justify-between bg-[#F3F0E4]/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#4D7182] text-white flex items-center justify-center font-bold text-lg shadow-sm">
              {empresa.nombre_comercial ? empresa.nombre_comercial[0].toUpperCase() : 'E'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-[#233D49] font-['Outfit']">
                  {empresa.nombre_comercial}
                </h3>
                {empresa.estado_activo ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#4D9A72]/15 text-[#4D9A72] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4D9A72]"></span>
                    Activa
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C95C5C]/15 text-[#C95C5C] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C95C5C]"></span>
                    Suspendida
                  </span>
                )}
              </div>
              <p className="text-xs text-[#7d8f97] font-mono mt-0.5">
                RUC: {empresa.ruc || 'No registrado'} · ID Tenant: #{empresa.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#7d8f97] hover:bg-[#CEC8B8]/30 transition-colors"
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-6">
          {/* Métricas clave del Inquilino */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#4D7182] mb-3">
              Métricas Consolidadas del Inquilino
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl border border-[#CEC8B8] bg-[#FAFAF7] text-center">
                <div className="w-7 h-7 mx-auto mb-1.5 rounded-lg bg-[#4D7182]/10 text-[#4D7182] flex items-center justify-center">
                  <Users size={16} />
                </div>
                <div className="text-xl font-extrabold text-[#233D49]">
                  {empresa.total_usuarios || 0}
                </div>
                <div className="text-[10px] font-bold uppercase text-[#7d8f97] mt-0.5">
                  Usuarios Totales
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-[#CEC8B8] bg-[#FAFAF7] text-center">
                <div className="w-7 h-7 mx-auto mb-1.5 rounded-lg bg-[#C49A3A]/10 text-[#C49A3A] flex items-center justify-center">
                  <CalendarDays size={16} />
                </div>
                <div className="text-xl font-extrabold text-[#233D49]">
                  {empresa.total_eventos || 0}
                </div>
                <div className="text-[10px] font-bold uppercase text-[#7d8f97] mt-0.5">
                  Eventos Totales
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-[#CEC8B8] bg-[#FAFAF7] text-center">
                <div className="w-7 h-7 mx-auto mb-1.5 rounded-lg bg-[#4D9A72]/10 text-[#4D9A72] flex items-center justify-center">
                  <DollarSign size={16} />
                </div>
                <div className="text-xl font-extrabold text-[#233D49]">
                  {formatearMoneda(empresa.total_ingresos)}
                </div>
                <div className="text-[10px] font-bold uppercase text-[#7d8f97] mt-0.5" title="Pagos completados registrados en eventos de esta empresa">
                  Ingresos por eventos
                </div>
              </div>
            </div>
          </div>

          {/* Ficha técnica del inquilino */}
          <div className="rounded-xl border border-[#CEC8B8] overflow-hidden text-xs">
            <div className="p-3 bg-[#F3F0E4]/30 border-b border-[#CEC8B8] font-bold text-[#233D49]">
              Ficha Técnica de la Cuenta
            </div>
            <div className="divide-y divide-[#CEC8B8]/60 bg-white">
              <div className="p-3 flex justify-between items-center">
                <span className="text-[#7d8f97] flex items-center gap-1.5">
                  <FileText size={14} /> Identificador de Empresa:
                </span>
                <span className="font-mono font-bold text-[#233D49]">
                  TENANT-{empresa.id}
                </span>
              </div>

              <div className="p-3 flex justify-between items-center">
                <span className="text-[#7d8f97] flex items-center gap-1.5">
                  <Layers size={14} /> Plan de Suscripción:
                </span>
                <span className="px-2 py-0.5 rounded-full font-bold bg-[#4D7182]/10 text-[#4D7182]">
                  Plan {empresa.plan_suscripcion || 'Básico'}
                </span>
              </div>

              <div className="p-3 flex justify-between items-center">
                <span className="text-[#7d8f97] flex items-center gap-1.5">
                  <Calendar size={14} /> Fecha de Registro:
                </span>
                <span className="font-medium text-[#233D49]">
                  {formatearFecha(empresa.fecha_registro)}
                </span>
              </div>

              <div className="p-3 flex justify-between items-center">
                <span className="text-[#7d8f97] flex items-center gap-1.5">
                  {empresa.estado_activo ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                  Estado Operativo:
                </span>
                <span className={`font-bold ${empresa.estado_activo ? 'text-[#4D9A72]' : 'text-[#C95C5C]'}`}>
                  {empresa.estado_activo ? 'Habilitada (Sin restricciones)' : 'Suspendida temporalmente'}
                </span>
              </div>
            </div>
          </div>

          {/* Nota semántica de aclaración */}
          <p className="text-[11px] text-[#7d8f97] italic bg-[#FAFAF7] p-2.5 rounded-lg border border-[#CEC8B8]">
            * La métrica de ingresos corresponde a los pagos registrados y completados por concepto de eventos dentro del inquilino, no a cuotas de suscripción SaaS.
          </p>

          {/* Acciones directas */}
          <div className="flex items-center justify-between pt-2 border-t border-[#CEC8B8]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onAbrirCambiarPlan(empresa);
                }}
                className="px-3 py-2 rounded-xl bg-[#4D7182]/15 text-[#4D7182] hover:bg-[#4D7182] hover:text-white transition-all text-xs font-bold"
              >
                Cambiar Plan
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onAbrirSuspender(empresa);
                }}
                className={`px-3 py-2 rounded-xl transition-all text-xs font-bold ${
                  empresa.estado_activo
                    ? 'bg-[#C95C5C]/15 text-[#C95C5C] hover:bg-[#C95C5C] hover:text-white'
                    : 'bg-[#4D9A72]/15 text-[#4D9A72] hover:bg-[#4D9A72] hover:text-white'
                }`}
              >
                {empresa.estado_activo ? 'Suspender Acceso' : 'Reactivar Acceso'}
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#CEC8B8] text-xs font-semibold text-[#233D49] hover:bg-[#F3F0E4] transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetalleEmpresaModal;
