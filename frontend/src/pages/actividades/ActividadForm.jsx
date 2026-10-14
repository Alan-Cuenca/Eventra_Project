import React, { useState, useEffect } from 'react';
import { eventraService } from '../../services/eventraService';
import { X, Save, Loader2, Calendar, User, CheckCircle2 } from 'lucide-react';

export const ActividadForm = ({ actividad, onClose, onSaved }) => {
  const isEditing = Boolean(actividad);
  const [form, setForm] = useState({
    descripcion: '',
    evento_id: '',
    responsable_id: '',
    fecha_limite: '',
    estado: 'Pendiente',
  });

  const [eventos, setEventos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (actividad) {
      const rawDate = actividad.fecha_vencimiento || actividad.fecha_limite || '';
      const formattedDate = rawDate ? (rawDate.includes('T') ? rawDate.split('T')[0] : rawDate) : '';
      setForm({
        descripcion: actividad.descripcion || actividad.titulo || '',
        evento_id: actividad.evento_id || '',
        responsable_id: actividad.responsable_id || '',
        fecha_limite: formattedDate,
        estado: actividad.estado || 'Pendiente',
      });
    }

    const loadDependencies = async () => {
      try {
        const [evtsData, usersData] = await Promise.all([
          eventraService.getEventos(),
          eventraService.getUsuarios(),
        ]);
        setEventos(Array.isArray(evtsData) ? evtsData : []);
        setUsuarios(Array.isArray(usersData) ? usersData : []);
      } catch (err) {
        setError('Error al cargar dependencias: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    loadDependencies();
  }, [actividad]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.evento_id) {
      setError('Debes seleccionar un evento.');
      return;
    }
    if (!form.descripcion.trim()) {
      setError('La descripción de la tarea es obligatoria.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      if (isEditing) {
        await eventraService.updateActividad(actividad.id, form);
      } else {
        await eventraService.createActividad(form);
      }
      onSaved();
    } catch (err) {
      setError(err.message || 'Error al guardar la actividad.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box animate-slide-up" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
              }}
            >
              <CheckCircle2 size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--primary-dark)', margin: 0 }}>
                {isEditing ? 'Editar Actividad Operativa' : 'Nueva Actividad Operativa'}
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                {isEditing ? 'Modifica los detalles y asignación' : 'Asigna tareas y fechas límites a tu equipo'}
              </p>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} disabled={submitting}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '0.75rem 1rem',
              background: 'var(--danger-light)',
              color: 'var(--danger)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.25rem',
              fontSize: '0.85rem',
              border: '1px solid rgba(201,92,92,0.3)',
            }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Loader2 className="animate-spin" size={28} style={{ margin: '0 auto 0.75rem', color: 'var(--primary)' }} />
            <p style={{ fontSize: '0.875rem' }}>Cargando eventos y personal...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Descripción de la Tarea *</label>
              <input
                type="text"
                className="form-input"
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                required
                placeholder="Ej. Asegurar climatización y pruebas de luces cálidas"
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Evento Vinculado *</label>
              <select
                className="form-select"
                name="evento_id"
                value={form.evento_id}
                onChange={handleChange}
                required
              >
                <option value="">-- Seleccionar Evento --</option>
                {eventos.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.titulo || e.nombre || `Evento #${e.id}`} {e.fecha ? `(${e.fecha})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Responsable Asignado</label>
              <select
                className="form-select"
                name="responsable_id"
                value={form.responsable_id}
                onChange={handleChange}
              >
                <option value="">-- Asignar Responsable (Opcional) --</option>
                {usuarios.map((u) => {
                  const nombre = u.nombre_completo || u.nombre || 'Personal';
                  return (
                    <option key={u.id} value={u.id}>
                      {nombre} {u.email ? `(${u.email})` : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isEditing ? '1fr 1fr' : '1fr', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Fecha Límite</label>
                <input
                  type="date"
                  className="form-input"
                  name="fecha_limite"
                  value={form.fecha_limite}
                  onChange={handleChange}
                />
              </div>

              {isEditing && (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Estado de la Tarea</label>
                  <select
                    className="form-select"
                    name="estado"
                    value={form.estado}
                    onChange={handleChange}
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="En Progreso">En Progreso</option>
                    <option value="Completada">Completada</option>
                    <option value="Cancelada">Cancelada</option>
                  </select>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                <span>{isEditing ? 'Guardar Cambios' : 'Crear Actividad'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
