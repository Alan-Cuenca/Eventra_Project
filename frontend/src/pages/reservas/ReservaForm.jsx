/**
 * EVENTRA — Formulario de Reserva (crear y editar)
 * Permite agendar un evento en un salón y horario específico,
 * con prevención de conflictos (Double-Booking).
 * - /reservas/nueva        → POST /reservas
 * - /reservas/editar/:id   → GET /reservas/:id para precargar y PUT /reservas/:id para guardar
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { eventraService } from '../../services/eventraService';
import { CalendarCheck, ArrowLeft, Send, Loader2, AlertCircle, CheckCircle2, Clock, MapPin, CalendarDays, PartyPopper } from 'lucide-react';

const HORARIOS_PREDEFINIDOS = ['10:00 - 16:00', '15:00 - 21:00', '19:00 - 02:00', '20:00 - 03:00'];

/** Convierte las horas guardadas ("19:00:00") en el valor del selector de horario. */
const horarioDesdeReserva = (reserva) => {
  const inicio = String(reserva.hora_inicio || '').slice(0, 5);
  const fin = String(reserva.hora_fin || '').slice(0, 5);
  const valor = `${inicio} - ${fin}`;
  return HORARIOS_PREDEFINIDOS.includes(valor)
    ? { horario: valor }
    : { horario: 'custom', hora_inicio_custom: inicio, hora_fin_custom: fin };
};

export const ReservaForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const esEdicion = Boolean(id);

  const [reservaOriginal, setReservaOriginal] = useState(null);
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
        const [cotData, srvData, resData, reserva] = await Promise.all([
          esEdicion ? Promise.resolve([]) : eventraService.getCotizaciones(),
          eventraService.getServicios(),
          eventraService.getReservas().catch(() => []),
          esEdicion ? eventraService.getReserva(id) : Promise.resolve(null),
        ]);

        if (esEdicion) {
          setReservaOriginal(reserva);
          setForm((p) => ({
            ...p,
            cotizacion_id: reserva.cotizacion_id,
            salon: reserva.salon_o_lugar || reserva.salon || '',
            fecha: reserva.fecha_iso || String(reserva.fecha_evento || '').split('T')[0],
            ...horarioDesdeReserva(reserva),
          }));
        }

        // Sugerencias de salón: lugares ya usados en reservas + servicios del catálogo que parecen espacios
        const esEspacio = (n) => /sal[oó]n|espacio|terraza|jard[ií]n|hacienda|quinta|local|casa/i.test(n || '');
        const nombres = new Set();
        (resData || []).forEach((r) => r.salon && nombres.add(String(r.salon).trim()));
        (srvData || []).filter((sv) => esEspacio(sv.nombre)).forEach((sv) => nombres.add(String(sv.nombre).trim()));

        // Solo cotizaciones aprobadas que aún no tienen una reserva activa (el backend también lo exige)
        const conReservaActiva = new Set(
          (resData || []).filter((r) => r.estado !== 'Cancelada').map((r) => String(r.cotizacion_id))
        );
        setCotizaciones((cotData || []).filter((c) => c.estado === 'Aprobada' && !conReservaActiva.has(String(c.id))));
        setSalones([...nombres].filter(Boolean).sort().map((nombre) => ({ id: nombre, nombre })));
      } catch (err) {
        setError(esEdicion && err.status === 404
          ? 'No se encontró la reserva. Puede que haya sido eliminada o no pertenezca a tu empresa.'
          : 'Error al cargar datos base. Intenta recargar la página.');
      } finally {
        setLoadingInit(false);
      }
    };
    fetchInitialData();
  }, [esEdicion, id]);

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
    if (!form.cotizacion_id || !form.salon.trim() || !form.fecha || !form.horario) {
      setError('Por favor, completa todos los campos requeridos.');
      return;
    }

    const [hora_inicio, hora_fin] = form.horario === 'custom'
      ? [form.hora_inicio_custom, form.hora_fin_custom]
      : form.horario.split(' - ').map((h) => h.trim());

    if (hora_inicio === hora_fin) {
      setError('La hora de inicio y la hora de fin no pueden ser iguales.');
      return;
    }

    setError('');
    setConflictError(false);
    setSubmitting(true);

    try {
      const datos = {
        salon_o_lugar: form.salon.trim(),
        fecha_evento: form.fecha,
        hora_inicio,
        hora_fin,
      };

      if (esEdicion) {
        await eventraService.updateReserva(id, datos);
      } else {
        await eventraService.createReserva({ cotizacion_id: form.cotizacion_id, ...datos });
      }

      setSuccess(true);
      setTimeout(() => navigate('/reservas', { replace: true }), 1800);

    } catch (err) {
      if (err.status === 409) {
        setConflictError(true);
        // El 409 puede ser por choque de salón o porque la cotización ya tiene reserva: se muestra la causa real
        const mensaje = String(err.message || '');
        setError(/cotizaci[oó]n/i.test(mensaje)
          ? mensaje
          : 'El salón seleccionado ya está reservado en esa fecha y horario. Por favor, elige otro salón u otra fecha/horario.');
      } else {
        setError(err.message || (esEdicion ? 'Error al guardar los cambios de la reserva.' : 'Error al agendar la reserva.'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0' }}>
        <CheckCircle2 size={48} color="var(--success)" style={{ margin: '0 auto 1rem' }} />
        <h2>{esEdicion ? '¡Reserva Actualizada!' : '¡Reserva Confirmada!'}</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          {esEdicion ? 'Los cambios de salón, fecha y horario se guardaron correctamente.' : 'El espacio ha sido bloqueado exitosamente para tu evento.'}
        </p>
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
            <h1 style={{ margin: 0 }}>{esEdicion ? 'Editar Reserva' : 'Agendar Nueva Reserva'}</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {esEdicion
              ? 'Cambia el salón, la fecha o el horario. Se vuelve a verificar que no choque con otra reserva.'
              : 'Asigna un salón físico y un bloque de tiempo a un evento.'}
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
                  <PartyPopper size={16} color="var(--accent)" /> {esEdicion ? 'Cotización vinculada' : 'Cotización a vincular *'}
                </label>
                {esEdicion ? (
                  <>
                    <input
                      type="text"
                      name="cotizacion_vinculada"
                      className="form-input"
                      value={`${reservaOriginal?.cliente_nombre || 'Cliente'} · $${Number(reservaOriginal?.cotizacion_total || 0).toFixed(2)}`}
                      readOnly
                      disabled
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem', display: 'block' }}>
                      La cotización no se cambia al editar. Para otra cotización, cancela esta reserva y crea una nueva.
                    </span>
                  </>
                ) : (
                  <>
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
                  </>
                )}
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
                disabled={submitting || (esEdicion && !reservaOriginal)}
              >
                {submitting ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={18} />}
                <span style={{ marginLeft: '0.5rem' }}>
                  {submitting ? 'Verificando Disponibilidad...' : (esEdicion ? 'Guardar Cambios' : 'Guardar y Agendar Reserva')}
                </span>
              </button>
            </div>

          </form>
        </Card>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
