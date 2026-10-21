import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { eventraService } from '../../services/eventraService';
import { 
  CheckSquare, 
  Loader2, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Check
} from 'lucide-react';

export const MisActividades = () => {
  const { user } = useAuth();
  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchActividades = async () => {
      try {
        const data = await eventraService.getActividades({ responsable_id: user?.id });
        setActividades(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || 'Error al cargar actividades.');
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchActividades();
  }, [user]);

  const toggleStatus = async (actividad) => {
    if (updatingId) return;
    setUpdatingId(actividad.id);
    const newStatus = actividad.estado === 'Completado' ? 'Pendiente' : 'Completado';
    try {
      await eventraService.updateActividad(actividad.id, { ...actividad, estado: newStatus });
      setActividades((prev) =>
        prev.map((a) => (a.id === actividad.id ? { ...a, estado: newStatus } : a))
      );
      showToast(newStatus === 'Completado' ? 'Tarea completada con éxito' : 'Tarea reabierta como pendiente');
    } catch (err) {
      showToast('Error al actualizar el estado: ' + err.message, 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-[#4D7182] bg-white rounded-2xl border border-[#CEC8B8] space-y-2">
        <Loader2 className="w-8 h-8 mx-auto animate-spin text-[#4D7182]" />
        <p className="text-sm font-semibold">Cargando tu checklist operativo...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-[#C95C5C]/15 border border-[#C95C5C]/30 text-[#C95C5C] text-sm font-semibold">
        {error}
      </div>
    );
  }

  // Agrupar actividades por evento
  const grouped = actividades.reduce((acc, act) => {
    const key = act.evento_titulo || `Evento #${act.evento_id || 'Principal'}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(act);
    return acc;
  }, {});

  const totalTareas = actividades.length;
  const completadas = actividades.filter(a => a.estado === 'Completado').length;
  const porcentajeGlobal = totalTareas > 0 ? Math.round((completadas / totalTareas) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in text-[#233D49]">
      
      {/* Toast Feedback */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold animate-fade-in ${
          toast.type === 'error'
            ? 'bg-[#C95C5C] text-white border-[#C95C5C]'
            : 'bg-[#4D9A72] text-white border-[#4D9A72]'
        }`}>
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#CEC8B8]/60">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#4D7182] mb-1">
            <CheckSquare size={14} />
            <span>Coordinación de Personal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#233D49] tracking-tight">
            Mis Actividades Asignadas
          </h1>
          <p className="text-sm text-[#4D7182]">
            Checklist operativo en tiempo real para eventos y recepciones.
          </p>
        </div>

        {/* Métrica Global de Progreso */}
        <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white border border-[#CEC8B8] shadow-sm">
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#4D7182]">
              Tu Rendimiento
            </span>
            <p className="text-base font-extrabold text-[#233D49] leading-tight">
              {completadas} de {totalTareas} Tareas
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#4D9A72]/15 text-[#4D9A72] font-extrabold flex items-center justify-center text-xs">
            {porcentajeGlobal}%
          </div>
        </div>
      </div>

      {actividades.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#CEC8B8] shadow-sm space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#4D9A72]/15 text-[#4D9A72] mx-auto flex items-center justify-center">
            <CheckCircle2 size={28} />
          </div>
          <h3 className="text-lg font-bold text-[#233D49]">
            ¡Estás completamente al día!
          </h3>
          <p className="text-xs text-[#7D8F97] max-w-sm mx-auto">
            No tienes actividades pendientes asignadas en este momento. Cuando el coordinador programe nuevas tareas aparecerán aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([eventoTitulo, tareas]) => {
            const tareasTotal = tareas.length;
            const tareasDone = tareas.filter(t => t.estado === 'Completado').length;
            const pct = Math.round((tareasDone / tareasTotal) * 100);

            return (
              <div 
                key={eventoTitulo} 
                className="bg-white rounded-3xl p-6 sm:p-7 border border-[#CEC8B8] shadow-sm space-y-5"
              >
                {/* Cabecera del Evento + Progreso */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#CEC8B8]/50">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#4D7182]/10 text-[#4D7182]">
                      Evento Asignado
                    </span>
                    <h3 className="text-lg font-bold text-[#233D49] mt-1">
                      {eventoTitulo}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-[#4D7182]">
                      {tareasDone} de {tareasTotal} completadas ({pct}%)
                    </span>
                    <div className="w-28 h-2.5 rounded-full bg-[#CEC8B8]/40 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#4D9A72] transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Lista de Tareas Interactivas */}
                <div className="space-y-2.5">
                  {tareas.map((tarea) => {
                    const isDone = tarea.estado === 'Completado';
                    const isUpdating = updatingId === tarea.id;

                    return (
                      <div
                        key={tarea.id}
                        className={`group flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 ${
                          isDone
                            ? 'bg-[#F3F0E4]/40 border-[#CEC8B8]/60 text-[#7D8F97]'
                            : 'bg-white border-[#CEC8B8] hover:border-[#4D7182] hover:shadow-sm'
                        }`}
                      >
                        {/* Checkbox personalizado */}
                        <button
                          type="button"
                          onClick={() => toggleStatus(tarea)}
                          disabled={isUpdating}
                          className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border transition-all cursor-pointer ${
                            isDone
                              ? 'bg-[#4D9A72] border-[#4D9A72] text-white'
                              : 'bg-white border-[#CEC8B8] group-hover:border-[#4D7182]'
                          }`}
                          aria-label={isDone ? 'Marcar como pendiente' : 'Marcar como completada'}
                        >
                          {isUpdating ? (
                            <Loader2 size={12} className="animate-spin text-[#4D7182]" />
                          ) : isDone ? (
                            <Check size={14} className="stroke-[3]" />
                          ) : null}
                        </button>

                        {/* Descripción de la Tarea */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold leading-snug ${
                            isDone ? 'line-through text-[#7D8F97]' : 'text-[#233D49]'
                          }`}>
                            {tarea.descripcion}
                          </p>
                          {tarea.fecha_limite && (
                            <div className="flex items-center gap-1.5 text-[11px] text-[#4D7182] mt-0.5">
                              <Calendar size={12} />
                              <span>Límite: {new Date(tarea.fecha_limite).toLocaleDateString('es-ES')}</span>
                            </div>
                          )}
                        </div>

                        {/* Estado Badge */}
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                          isDone
                            ? 'bg-[#4D9A72]/15 text-[#4D9A72] border border-[#4D9A72]/30'
                            : 'bg-[#C49A3A]/15 text-[#C49A3A] border border-[#C49A3A]/30'
                        }`}>
                          {isDone ? 'Completado' : 'Pendiente'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default MisActividades;
