import React, { useState, useEffect } from 'react';
import { superAdminService } from '../../services/superAdminService';
import {
  X,
  Layers,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  HelpCircle,
} from 'lucide-react';

const PLANES_DISPONIBLES = [
  { id: 'Basico', nombre: 'Básico', color: '#4D7182' },
  { id: 'Premium', nombre: 'Premium', color: '#C49A3A' },
  { id: 'Enterprise', nombre: 'Enterprise', color: '#7059a6' },
  { id: 'Profesional', nombre: 'Profesional', color: '#2b78a0' },
];

/**
 * =============================================================================
 * CambiarPlanModal
 * =============================================================================
 * Modal para modificar el plan de suscripción de un inquilino SaaS mediante
 * PUT /api/empresas/:id/plan, con confirmación explícita de transición.
 * =============================================================================
 */
export const CambiarPlanModal = ({ isOpen, onClose, empresa, onPlanActualizado }) => {
  const [nuevoPlan, setNuevoPlan] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (empresa) {
      setNuevoPlan(empresa.plan_suscripcion || 'Basico');
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [empresa]);

  if (!isOpen || !empresa) return null;

  const planActual = empresa.plan_suscripcion || 'Basico';
  const hayCambio = nuevoPlan.toLowerCase() !== planActual.toLowerCase();

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!hayCambio) {
      setErrorMsg('Debes seleccionar un plan diferente al actual.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await superAdminService.actualizarPlan(empresa.id, nuevoPlan);
      setSuccessMsg(res?.message || `Plan actualizado exitosamente a ${nuevoPlan}.`);

      setTimeout(() => {
        onPlanActualizado();
        onClose();
      }, 1000);
    } catch (err) {
      console.error('[CambiarPlanModal] Error al actualizar plan:', err);
      if (err?.status === 400) {
        setErrorMsg(err?.data?.message || 'Plan inválido.');
      } else if (err?.status === 404) {
        setErrorMsg('La empresa solicitada no existe.');
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
        className="bg-white w-full max-w-lg rounded-2xl border border-[#CEC8B8] shadow-xl overflow-hidden my-8 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="p-5 border-b border-[#CEC8B8] flex items-center justify-between bg-[#F3F0E4]/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4D7182]/10 text-[#4D7182] flex items-center justify-center">
              <Layers size={22} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#233D49] font-['Outfit']">
                Cambio de Plan de Suscripción
              </h3>
              <p className="text-xs text-[#7d8f97] truncate max-w-xs">
                Inquilino: <span className="font-semibold text-[#233D49]">{empresa.nombre_comercial}</span>
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

        {/* Cuerpo */}
        <form onSubmit={handleGuardar} className="p-6 space-y-5">
          {/* Selector de nuevo plan */}
          <div>
            <label className="block text-xs font-bold text-[#233D49] mb-2">
              Selecciona el Nuevo Plan de Suscripción:
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {PLANES_DISPONIBLES.map((plan) => {
                const seleccionado = nuevoPlan.toLowerCase() === plan.id.toLowerCase();
                const esActual = planActual.toLowerCase() === plan.id.toLowerCase();

                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => {
                      setNuevoPlan(plan.id);
                      setErrorMsg('');
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                      seleccionado
                        ? 'border-[#4D7182] bg-[#4D7182]/10 shadow-sm'
                        : 'border-[#CEC8B8] bg-[#FAFAF7] hover:border-[#4D7182]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[#233D49]">
                        {plan.nombre}
                      </span>
                      {esActual && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#CEC8B8]/60 text-[#233D49]">
                          Actual
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#7d8f97] mt-1">
                      Tier SaaS oficial
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cuadro de Confirmación de Transición */}
          <div className="p-4 rounded-xl border border-[#CEC8B8] bg-[#F3F0E4]/30 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#4D7182]">
              <HelpCircle size={14} />
              <span>Confirmación de Transición</span>
            </div>

            <div className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white border border-[#CEC8B8]/60">
              <div className="text-center flex-1">
                <span className="text-[10px] text-[#7d8f97] uppercase font-bold block">
                  Plan Anterior
                </span>
                <span className="font-bold text-[#233D49]">{planActual}</span>
              </div>
              <ArrowRight size={16} className="text-[#4D7182] mx-2" />
              <div className="text-center flex-1">
                <span className="text-[10px] text-[#7d8f97] uppercase font-bold block">
                  Nuevo Plan
                </span>
                <span className="font-bold text-[#4D7182]">{nuevoPlan}</span>
              </div>
            </div>

            <p className="text-[11px] text-[#7d8f97]">
              Se actualizará el esquema de suscripción para <strong className="text-[#233D49]">{empresa.nombre_comercial}</strong>.
            </p>
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
              type="submit"
              disabled={loading || !hayCambio}
              className="px-5 py-2 rounded-xl bg-[#4D7182] hover:bg-[#3d5f6e] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Actualizando...</span>
                </>
              ) : (
                <span>Confirmar Cambio de Plan</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CambiarPlanModal;
