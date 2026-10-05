import React, { useState, useEffect } from 'react';
import { eventraService } from '../../services/eventraService';
import { X, Save, Loader2 } from 'lucide-react';

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
  const [usuarios, setUsuarios] = useState([]); // Trabajadores
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Inicializar form si se edita
    if (actividad) {
      setForm({
        descripcion: actividad.descripcion || '',
        evento_id: actividad.evento_id || '',
        responsable_id: actividad.responsable_id || '',
        fecha_limite: actividad.fecha_limite || '',
        estado: actividad.estado || 'Pendiente',
      });
    }

    // Cargar dependencias (eventos y trabajadores)
    const loadDependencies = async () => {
      try {
        const [evtsData, usersData] = await Promise.all([
          eventraService.getEventos(),
          // Se asume que el backend permite obtener usuarios o trabajadores
          // Como placeholder, si no hay endpoint para getUsuarios, se carga un array vacío
          // Para esta demostración, si no falla el de eventos, asumimos dependencias
          Promise.resolve([{ id: 3, nombres: 'Jorge', apellidos: 'Sailema', rol_id: 3 }])
        ]);
        setEventos(evtsData);
        setUsuarios(usersData);
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
      setError(err.message || 'Error al guardar actividad.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content animate-fade-in" style={{ maxWidth: '500px' }}>
        <div className="modal-header" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--primary-dark)' }}>{isEditing ? 'Editar Actividad' : 'Nueva Actividad'}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} disabled={submitting}>
            <X size={20} />
          </button>
        </div>

        {error && <div style={{ padding: '0.75rem', background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>{error}</div>}

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}><Loader2 className="animate-spin" /> Cargando formulario...</div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Descripción de la Tarea *</label>
              <input type="text" className="form-input" name="descripcion" value={form.descripcion} onChange={handleChange} required placeholder="Ej. Verificación de climatización" />
            </div>

            <div className="form-group">
              <label className="form-label">Evento Vinculado *</label>
              <select className="form-input" name="evento_id" value={form.evento_id} onChange={handleChange} required>
                <option value="">-- Seleccionar Evento --</option>
                {eventos.map((e) => (
                  <option key={e.id} value={e.id}>{e.titulo || `Evento #${e.id}`}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Trabajador Asignado *</label>
              <select className="form-input" name="responsable_id" value={form.responsable_id} onChange={handleChange} required>
                <option value="">-- Seleccionar Trabajador --</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>{`${u.nombres} ${u.apellidos}`}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Fecha Límite</label>
              <input type="date" className="form-input" name="fecha_limite" value={form.fecha_limite} onChange={handleChange} />
            </div>

            {isEditing && (
              <div className="form-group">
                <label className="form-label">Estado</label>
                <select className="form-input" name="estado" value={form.estado} onChange={handleChange}>
                  <option value="Pendiente">Pendiente</option>
                  <option value="En progreso">En progreso</option>
                  <option value="Completado">Completado</option>
                </select>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
              <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Guardar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
