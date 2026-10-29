import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Sparkles, ArrowRight, X } from 'lucide-react';

/**
 * PlanLimitAlert
 * ============================================================================
 * Alerta visual reutilizable bajo los lineamientos de "Sofisticación Sutil".
 * Informa al usuario que ha alcanzado el límite de cuota de su plan SaaS
 * y proporciona un CTA directo para mejorar su suscripción al Plan Premium.
 *
 * @param {object} props
 * @param {string} [props.message]    Mensaje descriptivo del límite.
 * @param {string} [props.recurso]    Nombre del recurso (ej. 'clientes', 'servicios', 'usuarios', 'eventos').
 * @param {string} [props.plan]       Nombre del plan actual (ej. 'Básico', 'Premium').
 * @param {function} [props.onUpgrade] Callback al pulsar 'Mejorar a Premium'.
 * @param {function} [props.onClose]   Callback para cerrar la alerta.
 * @param {string} [props.className]  Clases adicionales de Tailwind.
 */
export const PlanLimitAlert = ({
  message,
  recurso = 'recursos',
  plan = 'Básico',
  onUpgrade,
  onClose,
  className = '',
}) => {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    if (typeof onUpgrade === 'function') {
      onUpgrade();
    } else {
      navigate('/mi-suscripcion');
    }
  };

  const defaultMessage = `Has alcanzado el límite de ${recurso} permitido para tu plan ${plan}.`;

  return (
    <div
      role="alert"
      className={`bg-[#C49A3A]/15 border border-[#C49A3A]/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all animate-fade-in ${className}`}
    >
      {/* Contenido Izquierdo: Icono e Información */}
      <div className="flex items-start sm:items-center gap-3.5 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-[#C49A3A]/20 flex items-center justify-center shrink-0 text-[#9A7422]">
          <AlertTriangle size={20} className="text-[#9A7422]" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#9A7422]">
            <Sparkles size={12} />
            <span>Límite de Suscripción Alcanzado</span>
          </div>
          <p className="text-sm font-semibold text-[#233D49] mt-0.5 leading-snug break-words">
            {message || defaultMessage}
          </p>
          <p className="text-xs text-[#233D49]/70 mt-0.5">
            Pasa al Plan Premium para expandir tu capacidad sin restricciones.
          </p>
        </div>
      </div>

      {/* Acciones Derecha: Botón Upgrade y Cerrar */}
      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
        <button
          type="button"
          onClick={handleUpgrade}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#526F7D] hover:bg-[#3E5763] text-white text-xs font-bold shadow-sm transition-all hover:shadow-md cursor-pointer focus:outline-none"
        >
          <span>Mejorar a Premium</span>
          <ArrowRight size={14} />
        </button>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9A7422] hover:bg-[#C49A3A]/25 transition-colors"
            title="Cerrar advertencia"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default PlanLimitAlert;

