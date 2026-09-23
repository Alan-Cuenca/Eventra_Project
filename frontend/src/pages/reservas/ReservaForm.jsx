/**
 * EVENTRA — Formulario de Nueva Reserva
 * Permite agendar un evento en un salón y horario específico,
 * con prevención de conflictos (Double-Booking).
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { eventraService } from '../../services/eventraService';
import { CalendarCheck, ArrowLeft, Send, Loader2, AlertCircle, CheckCircle2, Clock, MapPin, CalendarDays, PartyPopper } from 'lucide-react';

export const ReservaForm = () => {
  const navigate = useNavigate();

  const [eventos, setEventos] = useState([]);
  const [salones, setSalones] = useState([]);
  const [loadingInit, setLoadingInit] = useState(true);
  
  const [form, setForm] = useState({
    evento_id: '',
    salon: '',
    fecha: '',
    horario: '19:00 - 02:00', // Valor por defecto
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [conflictError, setConflictError] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [evtData, srvData] = await Promise.all([
          eventraService.getEventos(),
          eventraService.getServicios()
        ]);
        
        // Filtramos solo los servicios que son de categoría Espacio/Salón
        const espacios = (srvData || []).filter(s => s.categoria === 'Espacio y Salón');
        
        setEventos(evtData || []);
        setSalones(espacios);
      } catch (err) {
        setError('Error al cargar datos base. Intenta recargar la página.');
      } finally {
        setLoadingInit(false);
      }
    };
    fetchInitialData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    // Si cambia el salón, la fecha o el horario, limpiamos el error de conflicto
    if (name === 'salon' || name === 'fecha' || name === 'horario') {
      setConflictError(false);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.evento_id || !form.salon || !form.fecha || !form.horario) {
      setError('Por favor, completa todos los campos requeridos.');
      return;
    }

    setError('');
    setConflictError(false);
    setSubmitting(true);

    try {
      // Mock de validación de conflicto para testing en frontend si usamos mockData
      // En un entorno real, el backend (POST /reservas) devolvería un 409 o 400.
      const reservasActuales = await eventraService.getReservas();
      const isConflict = reservasActuales.some(
        r => r.salon === form.salon && r.fecha === form.fecha && r.horario === form.horario
      );

      if (isConflict) {
        // Simulamos el error 409 Conflict
        const conflictErr = new Error('Conflicto de reserva');
        conflictErr.status = 409;
        throw conflictErr;
      }

      // Buscar info del evento para guardarlo
      const eventoSeleccionado = eventos.find(ev => ev.id === form.evento_id);

      await eventraService.createReserva({
        evento_id: form.evento_id,
        evento_titulo: eventoSeleccionado ? eventoSeleccionado.titulo : 'Evento Personalizado',
        cliente_nombre: eventoSeleccionado ? eventoSeleccionado.cliente_nombre : 'Cliente Genérico',
        salon: form.salon,
        fecha: form.fecha,
        horario: form.horario,
        estado: 'Confirmada'
      });
      
      setSuccess(true);
      setTimeout(() => navigate('/reservas', { replace: true }), 1800);

    } catch (err) {
      if (err.status === 409 || err.status === 400 || err.message === 'Conflicto de reserva') {
        setConflictError(true);
        setError('El salón seleccionado ya está reservado en esa fecha y horario. Por favor, elige otro salón u otra fecha/horario.');
      } else {
        setError(err.message || 'Error al agendar la reserva.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0' }}>
        <CheckCircle2 size={48} color="var(--success)" style={{ margin: '0 auto 1rem' }} />
        <h2>¡Reserva Confirmada!</h2>
        <p style={{ color: 'var(--text-secondary)' }}>El espacio ha sido bloqueado exitosamente para tu evento.</p>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '1rem' }}>Redirigiendo a la agenda...</p>
      </div>
    );
  }

  if (loadingInit) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-secondary)' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem', color: 'var(--primary)' }} />
        Cargando salones y eventos disponibles...
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <CalendarCheck size={24} color="var(--accent)" />
            <h1 style={{ margin: 0 }}>Agendar Nueva Reserva</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Asigna un salón físico y un bloque de tiempo a un evento.
          </p>
        </div>
        <Link to="/reservas" className="btn btn-secondary">
          <ArrowLeft size={16} /> Volver
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', maxWidth: '800px', margin: '0 auto' }}>
        <Card>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Manejo de Errores (Incluyendo Conflicto) */}
            {error && (
              <div style={{ 
                background: conflictError ? 'rgba(220, 38, 38, 0.1)' : 'rgba(185,74,72,0.15)', 
                border: `1px solid ${conflictError ? '#dc2626' : '#e27d7c'}`, 
                color: conflictError ? '#ef4444' : '#e27d7c', 
                padding: '1rem', 
                borderRadius: '8px', 
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontSize: '0.9rem',
                fontWeight: 500
              }}>
                <AlertCircle size={20} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
              
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <PartyPopper size={16} color="var(--accent)" /> Evento a vincular *
                </label>
                <select name="evento_id" className="form-select" value={form.evento_id} onChange={handleChange} required>
                  <option value="">-- Selecciona el Evento Confirmado --</option>
                  {eventos.map(ev => (
                    <option key={ev.id} value={ev.id}>
                      {ev.titulo} ({ev.cliente_nombre})
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem', display: 'block' }}>
                  Solo se listan eventos y cotizaciones en estado Confirmado/Aprobado.
                </span>
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '0.5rem 0' }}></div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin size={16} color="var(--primary)" /> Salón o Espacio *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                  {salones.length > 0 ? salones.map(salon => {
                    const isSelected = form.salon === salon.nombre;
                    return (
                      <label key={salon.id} style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem',
                        border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-subtle)'}`,
                        borderRadius: '8px', cursor: 'pointer',
                        background: isSelected ? 'rgba(46,139,87,0.05)' : 'transparent',
                        transition: 'all 0.2s ease'
                      }}>
                        <input type="radio" name="salon" value={salon.nombre} checked={isSelected} onChange={handleChange} required style={{ accentColor: 'var(--primary)' }} />
                        <span style={{ fontWeight: isSelected ? 600 : 500 }}>{salon.nombre}</span>
                      </label>
                    );
                  }) : (
                    <div style={{ padding: '1rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      No hay salones configurados en el catálogo de servicios.
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CalendarDays size={16} color="var(--accent)" /> Fecha del Evento *
                  </label>
                  <input type="date" name="fecha" className="form-input" value={form.fecha} onChange={handleChange} required />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Clock size={16} color="var(--accent)" /> Horario Reservado *
                  </label>
                  <select name="horario" className="form-select" value={form.horario} onChange={handleChange} required>
                    <option value="10:00 - 16:00">Mañana (10:00 - 16:00)</option>
                    <option value="15:00 - 21:00">Tarde (15:00 - 21:00)</option>
                    <option value="19:00 - 02:00">Noche (19:00 - 02:00)</option>
                    <option value="20:00 - 03:00">Noche Extendida (20:00 - 03:00)</option>
                  </select>
                </div>
              </div>

            </div>

            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: '0.85rem 2rem', fontSize: '1rem' }}
                disabled={submitting}
              >
                {submitting ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={18} />}
                <span style={{ marginLeft: '0.5rem' }}>{submitting ? 'Verificando Disponibilidad...' : 'Guardar y Agendar Reserva'}</span>
              </button>
            </div>

          </form>
        </Card>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
