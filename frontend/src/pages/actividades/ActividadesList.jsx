import React, { useState, useEffect } from 'react';
import { eventraService } from '../../services/eventraService';
import { Card } from '../../components/common/Card';
import { CheckSquare, Loader2, Plus, Edit2, Trash2 } from 'lucide-react';
import { ActividadForm } from './ActividadForm';

export const ActividadesList = () => {
  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const fetchActividades = async () => {
    try {
      const data = await eventraService.getActividades();
      setActividades(data);
    } catch (err) {
      setError(err.message || 'Error al cargar actividades.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActividades();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta actividad?')) return;
    setDeletingId(id);
    try {
      await eventraService.deleteActividad(id);
      setActividades((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}><Loader2 className="animate-spin" /> Cargando panel de supervisión...</div>;
  if (error) return <div style={{ padding: '2rem', color: 'red' }}>{error}</div>;

  return (
    <div className="animate-fade-in" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--primary-dark)', marginBottom: '0.25rem' }}>Gestión de Actividades</h1>
          <p style={{ color: 'var(--text-muted)' }}>Supervisión y asignación de tareas operativas.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditTarget(null); setShowModal(true); }}>
          <Plus size={16} /> Nueva Actividad
        </button>
      </div>

      <Card noPadding style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Descripción</th>
              <th>Evento Vinculado</th>
              <th>Responsable</th>
              <th>Fecha Límite</th>
              <th>Estado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {actividades.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No hay actividades registradas.</td>
              </tr>
            ) : (
              actividades.map((act) => (
                <tr key={act.id}>
                  <td style={{ fontWeight: 600 }}>{act.descripcion}</td>
                  <td>{act.evento_titulo || `Evento #${act.evento_id}`}</td>
                  <td>{act.responsable_nombre || `Usuario #${act.responsable_id}`}</td>
                  <td>{act.fecha_limite || 'N/A'}</td>
                  <td>
                    <span style={{
                      padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 700,
                      background: act.estado === 'Completado' ? 'var(--success-light)' : 'var(--warning-light)',
                      color: act.estado === 'Completado' ? 'var(--success)' : 'var(--warning)'
                    }}>
                      {act.estado || 'Pendiente'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button className="btn btn-outline btn-sm" onClick={() => { setEditTarget(act); setShowModal(true); }}>
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="btn btn-outline btn-sm"
                        style={{ color: 'var(--danger)', borderColor: 'var(--danger-light)' }}
                        onClick={() => handleDelete(act.id)}
                        disabled={deletingId === act.id}
                      >
                        {deletingId === act.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {showModal && (
        <ActividadForm
          actividad={editTarget}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            fetchActividades();
          }}
        />
      )}
    </div>
  );
};
