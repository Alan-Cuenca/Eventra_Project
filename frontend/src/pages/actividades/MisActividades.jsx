import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { eventraService } from '../../services/eventraService';
import { Card } from '../../components/common/Card';
import { CheckSquare, Loader2, Calendar, CheckCircle2, Clock } from 'lucide-react';

export const MisActividades = () => {
  const { user } = useAuth();
  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    const fetchActividades = async () => {
      try {
        const data = await eventraService.getActividades({ responsable_id: user.id });
        setActividades(data);
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
    } catch (err) {
      alert('Error al actualizar: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}><Loader2 className="animate-spin" /> Cargando checklist...</div>;
  if (error) return <div style={{ padding: '2rem', color: 'red' }}>{error}</div>;

  // Group by evento_id (assuming the API returns evento_titulo or we group by evento_id)
  const grouped = actividades.reduce((acc, act) => {
    const key = act.evento_titulo || `Evento #${act.evento_id}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(act);
    return acc;
  }, {});

  return (
    <div className="animate-fade-in" style={{ padding: '1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', color: 'var(--primary-dark)', marginBottom: '0.25rem' }}>Mis Actividades</h1>
        <p style={{ color: 'var(--text-muted)' }}>Checklist operativo de tus tareas asignadas.</p>
      </div>

      {actividades.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '3rem' }}>
          <CheckSquare size={40} style={{ color: 'var(--border-subtle)', margin: '0 auto 1rem' }} />
          <h3>No tienes tareas pendientes</h3>
          <p style={{ color: 'var(--text-muted)' }}>Estás al día con tus asignaciones.</p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {Object.entries(grouped).map(([eventoTitulo, tareas]) => (
            <Card key={eventoTitulo}>
              <div style={{ paddingBottom: '1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--primary-dark)' }}>{eventoTitulo}</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {tareas.map((tarea) => (
                  <div
                    key={tarea.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      background: tarea.estado === 'Completado' ? 'var(--success-light)' : 'var(--bg-input)',
                      border: `1px solid ${tarea.estado === 'Completado' ? 'rgba(77, 154, 114, 0.2)' : 'var(--border-subtle)'}`,
                      opacity: updatingId === tarea.id ? 0.6 : 1,
                    }}
                  >
                    <button
                      onClick={() => toggleStatus(tarea)}
                      disabled={updatingId === tarea.id}
                      style={{
                        width: '24px', height: '24px',
                        borderRadius: '6px',
                        border: `2px solid ${tarea.estado === 'Completado' ? 'var(--success)' : 'var(--border-subtle)'}`,
                        background: tarea.estado === 'Completado' ? 'var(--success)' : 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', flexShrink: 0
                      }}
                    >
                      {updatingId === tarea.id ? (
                        <Loader2 size={14} color="var(--primary)" className="animate-spin" />
                      ) : tarea.estado === 'Completado' ? (
                        <CheckCircle2 size={16} color="white" />
                      ) : null}
                    </button>
                    <div style={{ flex: 1, textDecoration: tarea.estado === 'Completado' ? 'line-through' : 'none', color: tarea.estado === 'Completado' ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                      <div style={{ fontWeight: 600 }}>{tarea.descripcion}</div>
                      {tarea.fecha_limite && (
                        <div style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          <Calendar size={13} /> {tarea.fecha_limite}
                        </div>
                      )}
                    </div>
                    {tarea.estado === 'Completado' ? (
                      <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>Completado</span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--warning)', fontWeight: 600 }}><Clock size={12} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> Pendiente</span>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
