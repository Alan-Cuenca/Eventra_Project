import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, X, Sparkles } from 'lucide-react';

export const GlobalPlanLimitToast = () => {
  const [alertData, setAlertData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handlePlanLimit = (event) => {
      const detail = event.detail || {};
      setAlertData({
        message: detail.message || 'Has alcanzado el límite de tu plan de suscripción actual.',
        recurso: detail.recurso,
        plan: detail.plan || 'Básico',
      });
    };

    window.addEventListener('eventra:plan-limit-exceeded', handlePlanLimit);
    return () => {
      window.removeEventListener('eventra:plan-limit-exceeded', handlePlanLimit);
    };
  }, []);

  if (!alertData) return null;

  return (
    <div className="fixed top-5 right-4 sm:right-6 z-50 max-w-md w-[calc(100vw-2rem)] animate-slide-up">
      <div className="bg-[#C95C5C] text-white p-4 rounded-2xl shadow-2xl border border-white/20 flex items-start gap-3.5">
        <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
          <AlertCircle size={18} className="text-white" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-white/90">
            <Sparkles size={11} />
            <span>Límite de Plan SaaS</span>
          </div>
          <p className="text-xs sm:text-sm font-semibold mt-0.5 leading-snug break-words">
            {alertData.message}
          </p>
          <div className="mt-2.5 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setAlertData(null);
                navigate('/mi-suscripcion');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-[#C95C5C] hover:bg-[#FAF8F5] text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <span>Mejorar a Premium</span>
              <ArrowRight size={13} />
            </button>

            <button
              type="button"
              onClick={() => setAlertData(null)}
              className="px-2.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setAlertData(null)}
          className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          title="Cerrar notificación"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default GlobalPlanLimitToast;

