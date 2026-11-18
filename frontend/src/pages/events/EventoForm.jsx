import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { PlanLimitAlert } from '../../components/ui/PlanLimitAlert';
import { eventraService } from '../../services/eventraService';
import { Save, X, Loader2, ArrowLeft, Calendar } from 'lucide-react';

export const EventoForm = () => {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    reserva_id: '',
  });

  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [planLimitError, setPlanLimitError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isEditing) {
          const evento = await eventraService.getEvento(id);
          setForm({
            titulo: evento.titulo || evento.nombre || '',
            descripcion: evento.descripcion || '',
            reserva_id: evento.reserva_id || '',
          });
        } else {
          const reservasData = await eventraService.getReservas();
          setReservas(reservasData || []);
        }
      } catch (err) {
        setError('No se pudieron cargar los datos. Intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, isEditing]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setPlanLimitError(null);

    try {
      if (isEditing) {
        await eventraService.updateEvento(id, { titulo: form.titulo, descripcion: form.descripcion });
      } else {
        await eventraService.createEvento({
          reserva_id: form.reserva_id,
          titulo: form.titulo,
          descripcion: form.descripcion,
        });
      }
      navigate('/eventos');
    } catch (err) {
      if (err.status === 403 || err.isPlanLimit) {
        setPlanLimitError(err.message || 'Has alcanzado el límite permitido para tu plan actual.');
      } else {
        setError(err.message || 'Error al guardar el evento.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}><Loader2 className="animate-spin" /> Cargando formulario...</div>;

  return (
    <div className="animate-fade-in" style={{ padding: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/eventos" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.875rem' }}>
          <ArrowLeft size={16} /> Volver a eventos
        </Link>
        <h1 style={{ fontSize: '1.8rem', color: 'var(--primary-dark)' }}>
          {isEditing ? 'Editar Evento' : 'Nuevo Evento'}
        </h1>
      </div>

      {planLimitError && (
        <div style={{ marginBottom: '1.5rem' }}>
          <PlanLimitAlert
            message={planLimitError}
            recurso="eventos"
            onClose={() => setPlanLimitError(null)}
          />
        </div>
      )}

      {error && (
        <div style={{ padding: '1rem', background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label">Nombre / Código del Evento *</label>
            <input type="text" className="form-input" name="titulo" value={form.titulo} onChange={handleChange} required placeholder="Ej. Boda Civil García" />
          </div>

          {!isEditing && (
            <div className="form-group">
              <label className="form-label"><Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} /> Reserva asociada *</label>
              <select className="form-input" name="reserva_id" value={form.reserva_id} onChange={handleChange} required>
                <option value="">-- Seleccionar Reserva --</option>
                {reservas.map((r) => (
                  <option key={r.id} value={r.id}>
                    {`${r.salon || r.salon_o_lugar || 'Reserva'} · ${String(r.fecha || r.fecha_evento || '').split('T')[0]}`}
                  </option>
                ))}
              </select>
              {reservas.length === 0 && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                  No hay reservas disponibles. Crea primero una reserva.
                </p>
              )}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Descripción</label>
            <textarea className="form-input" name="descripcion" value={form.descripcion} onChange={handleChange} rows={3} placeholder="Detalles del evento (opcional)" />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
            <Link to="/eventos" className="btn btn-outline">
              <X size={16} /> Cancelar
            </Link>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Guardar Evento
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};
