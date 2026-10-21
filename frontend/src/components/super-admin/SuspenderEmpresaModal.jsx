import React, { useState } from 'react';
import { superAdminService } from '../../services/superAdminService';
import {
  X,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldAlert,
  Power,
  RotateCcw,
} from 'lucide-react';

/**
 * =============================================================================
 * SuspenderEmpresaModal
 * =============================================================================
 * Modal de confirmación para suspender o reactivar el acceso de una empresa SaaS
 * mediante PUT /api/empresas/:id/suspender.
 * Presenta advertencias claras sobre el impacto en los usuarios vinculados.
 * =============================================================================
 */
export const SuspenderEmpresaModal = ({
  isOpen,
  onClose,
  empresa,
  onEstadoModificado,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen || !empresa) return null;

  const estaActiva = empresa.estado_activo;
  const nuevoEstado = !estaActiva; // Si está activa se suspenderá (false), si está suspendida se reactivará (true)

  const handleConfirmar = async () => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await superAdminService.suspenderEmpresa(empresa.id, nuevoEstado);
      const accion = nuevoEstado ? 'reactivada' : 'suspendida';
      setSuccessMsg(res?.message || `Empresa ${accion} exitosamente.`);

      setTimeout(() => {
        onEstadoModificado();
        onClose();
      }, 1000);
    } catch (err) {
      console.error('[SuspenderEmpresaModal] Error al modificar estado:', err);
      if (err?.status === 404) {
        setErrorMsg('La empresa no fue encontrada.');
      } else if (err?.status === 403) {
        setErrorMsg('Acceso denegado: Se requieren permisos de Super Administrador.');
      } else {
        setErrorMsg(err?.data?.message || err?.message || 'Error al conectar con el servidor.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#233D49]/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-2xl border border-[#CEC8B8] shadow-xl overflow-hidden my-8 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="p-5 border-b border-[#CEC8B8] flex items-center justify-between bg-[#F3F0E4]/40">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                estaActiva
                  ? 'bg-[#C95C5C]/15 text-[#C95C5C]'
                  : 'bg-[#4D9A72]/15 text-[#4D9A72]'
              }`}
            >
              {estaActiva ? <Power size={22} /> : <RotateCcw size={22} />}
            </div>
            <div>
              <h3 className="font-bold text-base text-[#233D49] font-['Outfit']">
                {estaActiva ? 'Suspender Inquilino SaaS' : 'Reactivar Inquilino SaaS'}
              </h3>
              <p className="text-xs text-[#7d8f97] truncate max-w-[240px]">
                {empresa.nombre_comercial}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 rounded-xl text-[#7d8f97] hover:bg-[#CEC8B8]/30 transition-colors"
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mensajes */}
        <div className="px-6 pt-4">
          {errorMsg && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-[#C95C5C]/15 border border-[#C95C5C]/30 text-[#C95C5C] text-xs font-semibold flex items-center gap-2 animate-fade-in"
            >
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div
              role="status"
              className="p-3 rounded-xl bg-[#4D9A72]/15 border border-[#4D9A72]/30 text-[#4D9A72] text-xs font-semibold flex items-center gap-2 animate-fade-in"
            >
              <CheckCircle2 size={16} className="flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Contenido / Advertencia */}
        <div className="p-6 space-y-4">
          {estaActiva ? (
            <div className="p-4 rounded-xl border border-[#C95C5C]/30 bg-[#C95C5C]/10 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#C95C5C]">
                <AlertTriangle size={16} />
                <span>Advertencia de Impacto de Acceso</span>
              </div>
              <p className="text-xs text-[#233D49] leading-relaxed">
                Al suspender a <strong className="text-[#C95C5C]">{empresa.nombre_comercial}</strong>,
                todos los administradores, gerentes y trabajadores asignados a esta empresa{' '}
                <strong>perderán el acceso inmediato al sistema</strong> hasta que sea reactivada.
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-[#4D9A72]/30 bg-[#4D9A72]/10 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#4D9A72]">
                <ShieldAlert size={16} />
                <span>Restauración de Operaciones</span>
              </div>
              <p className="text-xs text-[#233D49] leading-relaxed">
                Al reactivar a <strong className="text-[#4D9A72]">{empresa.nombre_comercial}</strong>,
                se rehabilitará el inicio de sesión y la operativa para todos los usuarios y clientes
                pertenecientes a este inquilino.
              </p>
            </div>
          )}

          <div className="p-3 rounded-xl border border-[#CEC8B8] bg-[#FAFAF7] text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-[#7d8f97]">Estado actual:</span>
              <span className={`font-bold ${estaActiva ? 'text-[#4D9A72]' : 'text-[#C95C5C]'}`}>
                {estaActiva ? 'Activa' : 'Suspendida'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#7d8f97]">Usuarios afectados:</span>
              <span className="font-bold text-[#233D49]">
                {empresa.total_usuarios || 0} usuarios
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#7d8f97]">Plan:</span>
              <span className="font-bold text-[#4D7182]">
                {empresa.plan_suscripcion || 'Básico'}
              </span>
            </div>
          </div>

          {/* Botones */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#CEC8B8]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-[#CEC8B8] text-xs font-semibold text-[#233D49] hover:bg-[#F3F0E4] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmar}
              disabled={loading}
              className={`px-5 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 ${
                estaActiva
                  ? 'bg-[#C95C5C] hover:bg-[#b34949]'
                  : 'bg-[#4D9A72] hover:bg-[#3d8560]'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Procesando...</span>
                </>
              ) : estaActiva ? (
                <>
                  <Power size={14} />
                  <span>Confirmar Suspensión</span>
                </>
              ) : (
                <>
                  <RotateCcw size={14} />
                  <span>Reactivar Empresa</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuspenderEmpresaModal;
