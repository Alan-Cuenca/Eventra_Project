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

  const [cotizaciones, setCotizaciones] = useState([]);
  const [salones, setSalones] = useState([]);
  const [loadingInit, setLoadingInit] = useState(true);
  
  const [form, setForm] = useState({
    cotizacion_id: '',
    salon: '',
    fecha: '',
    horario: '19:00 - 02:00', // Valor por defecto
    hora_inicio_custom: '18:00',
    hora_fin_custom: '23:00',
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [conflictError, setConflictError] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [cotData, srvData, resData] = await Promise.all([
          eventraService.getCotizaciones(),
          eventraService.getServicios(),
          eventraService.getReservas().catch(() => []),
        ]);

        // Sugerencias de salón: lugares ya usados en reservas + servicios del catálogo que parecen espacios
        const esEspacio = (n) => /sal[oó]n|espacio|terraza|jard[ií]n|hacienda|quinta|local|casa/i.test(n || '');
        const nombres = new Set();
        (resData || []).forEach((r) => r.salon && nombres.add(String(r.salon).trim()));
        (srvData || []).filter((sv) => esEspacio(sv.nombre)).forEach((sv) => nombres.add(String(sv.nombre).trim()));

        // Solo se puede reservar sobre cotizaciones aprobadas
        setCotizaciones((cotData || []).filter((c) => c.estado === 'Aprobada'));
        setSalones([...nombres].filter(Boolean).sort().map((nombre) => ({ id: nombre, nombre })));
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
    if (['salon', 'fecha', 'horario', 'hora_inicio_custom', 'hora_fin_custom'].includes(name)) {
      setConflictError(false);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.cotizacion_id || !form.salon || !form.fecha || !form.horario) {
      setError('Por favor, completa todos los campos requeridos.');
      return;
    }

    setError('');
    setConflictError(false);
    setSubmitting(true);

    try {
      const [hora_inicio, hora_fin] = form.horario === 'custom'
        ? [form.hora_inicio_custom, form.hora_fin_custom]
        : form.horario.split(' - ').map((h) => h.trim());

      await eventraService.createReserva({
        cotizacion_id: form.cotizacion_id,
        salon_o_lugar: form.salon,
        fecha_evento: form.fecha,
        hora_inicio,
        hora_fin,
      });

      setSuccess(true);
      setTimeout(() => navigate('/reservas', { replace: true }), 1800);

    } catch (err) {
      if (err.status === 409) {
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
                  <PartyPopper size={16} color="var(--accent)" /> Cotización a vincular *
                </label>
                <select name="cotizacion_id" className="form-select" value={form.cotizacion_id} onChange={handleChange} required>
                  <option value="">-- Selecciona la Cotización --</option>
                  {cotizaciones.map(c => (
                    <option key={c.id} value={c.id}>
                      {`${c.cliente_nombres || ''} ${c.cliente_apellidos || ''}`.trim() || 'Cliente'} · {String(c.fecha_estimada_evento || '').split('T')[0]} · ${Number(c.total_calculado || 0).toFixed(2)}
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem', display: 'block' }}>
                  Solo aparecen cotizaciones Aprobadas que aún no tienen reserva. Apruébala primero en Cotizaciones.
                </span>
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '0.5rem 0' }}></div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin size={16} color="var(--primary)" /> Salón o Espacio *
                </label>
                <input
                  type="text"
                  name="salon"
                  className="form-input"
                  list="salones-sugeridos"
                  placeholder="Ej: Salón Imperial, Terraza Jardín..."
                  value={form.salon}
                  onChange={handleChange}
                  maxLength={150}
                  required
                />
                <datalist id="salones-sugeridos">
                  {salones.map((sl) => <option key={sl.id} value={sl.nombre} />)}
                </datalist>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem', display: 'block' }}>
                  Escribe el nombre del salón o elige uno de los ya usados en tu empresa.
                </span>
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
                    <option value="custom">Otro horario…</option>
                  </select>
                  {form.horario === 'custom' && (
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', alignItems: 'center' }}>
                      <input type="time" name="hora_inicio_custom" className="form-input" value={form.hora_inicio_custom} onChange={handleChange} aria-label="Hora de inicio" required />
                      <span style={{ color: 'var(--text-secondary)' }}>a</span>
                      <input type="time" name="hora_fin_custom" className="form-input" value={form.hora_fin_custom} onChange={handleChange} aria-label="Hora de fin" required />
                    </div>
                  )}
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
