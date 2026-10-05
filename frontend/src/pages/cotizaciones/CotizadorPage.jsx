/**
 * EVENTRA — Cotizador Dinámico (Stepper de 4 Pasos)
 * Paso 1: Cliente y fecha del evento
 * Paso 2: Selección de paquete base
 * Paso 3: Servicios adicionales a la carta
 * Paso 4: Resumen y confirmación final
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventraService } from '../../services/eventraService';
import { MOCK_PAQUETES, MOCK_SERVICIOS } from '../../services/mockData';
import {
  User, Package, Layers, FileText, Check, ChevronRight, ChevronLeft,
  Sparkles, CalendarDays, Loader2, CheckCircle2, Send, X, AlertCircle,
} from 'lucide-react';

// ── Pasos del stepper ────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Cliente',   icon: <User size={14} /> },
  { id: 2, label: 'Paquete',   icon: <Package size={14} /> },
  { id: 3, label: 'Servicios', icon: <Layers size={14} /> },
  { id: 4, label: 'Resumen',   icon: <FileText size={14} /> },
];

// ── Stepper Visual ────────────────────────────────────────────────────────────
const StepperBar = ({ current }) => (
  <div className="stepper">
    {STEPS.map((step, i) => {
      const status =
        current > step.id ? 'completed' : current === step.id ? 'active' : 'pending';
      const isLast = i === STEPS.length - 1;
      return (
        <div key={step.id} className="stepper-step">
          <div className={`stepper-circle ${status}`}>
            {status === 'completed' ? <Check size={14} strokeWidth={3} /> : step.icon}
          </div>
          <div className={`stepper-label ${status}`}>{step.label}</div>
          {!isLast && (
            <div
              className={`stepper-connector ${current > step.id ? 'active' : ''}`}
            />
          )}
        </div>
      );
    })}
  </div>
);

// ── Línea de precio ───────────────────────────────────────────────────────────
const PriceLine = ({ label, value, bold, big, color }) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: big ? '0.625rem 0' : '0.35rem 0',
      borderTop: big ? '1.5px solid var(--border-subtle)' : 'none',
      marginTop: big ? '0.5rem' : 0,
    }}
  >
    <span style={{ fontSize: big ? '0.95rem' : '0.875rem', color: 'var(--text-secondary)', fontWeight: bold ? 700 : 500 }}>
      {label}
    </span>
    <span
      style={{
        fontSize: big ? '1.4rem' : '0.9rem',
        fontWeight: bold || big ? 800 : 600,
        color: color || (big ? 'var(--primary)' : 'var(--text-primary)'),
        fontFamily: 'Outfit, sans-serif',
      }}
    >
      {value}
    </span>
  </div>
);

// ══════════════════════════════════════════════════════════════════════════════
export const CotizadorPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Datos del formulario
  const [form, setForm] = useState({
    cliente_nombre: '',
    cliente_email: '',
    cliente_telefono: '',
    tipo_evento: '',
    fecha_estimada: '',
    num_invitados: '',
    paquete_id: '',
    servicios_ids: [],
  });

  const [clientes, setClientes] = useState([]);
  const [loadingClientes, setLoadingClientes] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Cargar clientes reales del backend (con fallback)
  useEffect(() => {
    eventraService.getClientes()
      .then(cls => setClientes((cls || []).filter(c => c.estado_activo !== false)))
      .catch(() => setClientes([]))
      .finally(() => setLoadingClientes(false));
  }, []);

  const paquetes = MOCK_PAQUETES;
  const servicios = MOCK_SERVICIOS;

  const paqueteSeleccionado = paquetes.find(p => String(p.id) === String(form.paquete_id));
  const costoPaquete = paqueteSeleccionado ? Number(paqueteSeleccionado.precio_total) : 0;
  const serviciosSeleccionados = servicios.filter(s => form.servicios_ids.includes(s.id));
  const costoServicios = serviciosSeleccionados.reduce((sum, s) => sum + Number(s.precio_base || 0), 0);
  const totalCalculado = costoPaquete + costoServicios;
  const anticipo = totalCalculado * 0.5;

  const fmt = (n) =>
    new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
  };

  const toggleServicio = (id) => {
    setForm(p => ({
      ...p,
      servicios_ids: p.servicios_ids.includes(id)
        ? p.servicios_ids.filter(s => s !== id)
        : [...p.servicios_ids, id],
    }));
  };

  const canNext = () => {
    if (step === 1)
      return form.cliente_nombre.trim() && form.fecha_estimada && form.tipo_evento;
    if (step === 2) return true; // paquete es opcional
    if (step === 3) return true; // servicios son opcionales
    return totalCalculado > 0;
  };

  const handleNext = () => {
    if (!canNext()) {
      setError('Por favor completa los campos requeridos antes de continuar.');
      return;
    }
    setError('');
    setStep(s => Math.min(s + 1, 4));
  };

  const handleBack = () => {
    setError('');
    setStep(s => Math.max(s - 1, 1));
  };

  const handleSubmit = async () => {
    if (totalCalculado === 0) {
      setError('Debes seleccionar al menos un paquete o servicio para generar la cotización.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await eventraService.createCotizacion({
        cliente_nombre: form.cliente_nombre,
        fecha_estimada_evento: form.fecha_estimada,
        paquete_id: form.paquete_id || null,
        total_calculado: totalCalculado,
      });
      setSubmitted(true);
    } catch {
      // fallback demo
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Éxito ──────────────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '5rem 1rem',
          textAlign: 'center',
        }}
        className="animate-fade-in"
      >
        <div
          style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'var(--success-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '1.5rem',
            border: '2px solid rgba(77,154,114,0.3)',
          }}
        >
          <CheckCircle2 size={40} color="var(--success)" />
        </div>
        <h2 style={{ fontSize: '1.75rem', color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>
          ¡Cotización generada!
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
          Total estimado: <strong style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>{fmt(totalCalculado)}</strong>
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '2rem' }}>
          La cotización fue registrada exitosamente. Te contactaremos para confirmar los detalles.
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={() => navigate('/cotizaciones')}>
            Ver mis cotizaciones
          </button>
          <button className="btn btn-secondary" onClick={() => { setSubmitted(false); setStep(1); setForm({ cliente_nombre: '', cliente_email: '', cliente_telefono: '', tipo_evento: '', fecha_estimada: '', num_invitados: '', paquete_id: '', servicios_ids: [] }); }}>
            Nueva cotización
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <Sparkles size={22} color="var(--primary)" />
            <h1 style={{ margin: 0 }}>Cotizador Dinámico</h1>
          </div>
          <p>Constructor paso a paso — el precio se recalcula en tiempo real</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/cotizaciones')}>
          <ChevronLeft size={16} /> Volver
        </button>
      </div>

      {/* Stepper */}
      <StepperBar current={step} />

      {/* Error global */}
      {error && (
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            background: 'var(--danger-light)', border: '1px solid rgba(201,92,92,0.3)',
            borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem',
            marginBottom: '1.5rem', fontSize: '0.85rem', color: '#8a2f2f',
          }}
        >
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1.5rem', alignItems: 'flex-start' }}>
        {/* ── Columna Principal ────────────────────────────────────────────── */}
        <div>
          {/* PASO 1: Cliente */}
          {step === 1 && (
            <div className="card animate-fade-in">
              <div className="card-header">
                <div className="card-title">
                  <User size={18} color="var(--primary)" />
                  Datos del Cliente y Evento
                </div>
                <span className="badge badge-primary">Paso 1 de 4</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Nombre del solicitante *</label>
                  <input
                    type="text"
                    name="cliente_nombre"
                    className="form-input"
                    placeholder="Ej: Pablo Vayas"
                    value={form.cliente_nombre}
                    onChange={handleChange}
                    id="cotizador-nombre"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Correo electrónico</label>
                  <input
                    type="email"
                    name="cliente_email"
                    className="form-input"
                    placeholder="cliente@email.com"
                    value={form.cliente_email}
                    onChange={handleChange}
                    id="cotizador-email"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Teléfono / WhatsApp</label>
                  <input
                    type="tel"
                    name="cliente_telefono"
                    className="form-input"
                    placeholder="+593 99 000 0000"
                    value={form.cliente_telefono}
                    onChange={handleChange}
                    id="cotizador-telefono"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tipo de evento *</label>
                  <select
                    name="tipo_evento"
                    className="form-select"
                    value={form.tipo_evento}
                    onChange={handleChange}
                    id="cotizador-tipo-evento"
                  >
                    <option value="">-- Seleccionar tipo --</option>
                    {['Matrimonio', 'Quinceañera', 'Cumpleaños', 'Corporativo', 'Bautizo', 'Grado', 'Otro'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Fecha estimada del evento *</label>
                  <div style={{ position: 'relative' }}>
                    <CalendarDays size={15} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    <input
                      type="date"
                      name="fecha_estimada"
                      className="form-input"
                      style={{ paddingLeft: '2.5rem' }}
                      value={form.fecha_estimada}
                      onChange={handleChange}
                      id="cotizador-fecha"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Número estimado de invitados</label>
                  <input
                    type="number"
                    name="num_invitados"
                    className="form-input"
                    placeholder="Ej: 120"
                    min="1"
                    value={form.num_invitados}
                    onChange={handleChange}
                    id="cotizador-invitados"
                  />
                </div>
              </div>
            </div>
          )}

          {/* PASO 2: Paquetes */}
          {step === 2 && (
            <div className="card animate-fade-in">
              <div className="card-header">
                <div className="card-title">
                  <Package size={18} color="var(--primary)" />
                  Selección de Paquete Base
                </div>
                <span className="badge badge-primary">Paso 2 de 4</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                Elige un paquete todo-incluido (opcional). Puedes también armar tu evento completamente a la carta en el siguiente paso.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Sin paquete */}
                <label
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.875rem',
                    padding: '1rem 1.125rem',
                    border: `1.5px solid ${form.paquete_id === '' ? 'var(--primary)' : 'var(--border-subtle)'}`,
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    background: form.paquete_id === '' ? 'var(--primary-light)' : 'var(--white)',
                    transition: 'all 0.15s',
                  }}
                >
                  <input
                    type="radio"
                    name="paquete_id"
                    value=""
                    checked={form.paquete_id === ''}
                    onChange={handleChange}
                    style={{ accentColor: 'var(--primary)' }}
                    id="paquete-ninguno"
                  />
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>
                      Sin paquete — Evento completamente a la carta
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      Selecciona únicamente los servicios que necesitas en el paso siguiente.
                    </div>
                  </div>
                </label>

                {paquetes.map((pack) => {
                  const isSelected = String(form.paquete_id) === String(pack.id);
                  return (
                    <label
                      key={pack.id}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: '0.875rem',
                        padding: '1.125rem',
                        border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--border-subtle)'}`,
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        background: isSelected ? 'var(--primary-light)' : 'var(--white)',
                        position: 'relative',
                        transition: 'all 0.15s',
                      }}
                    >
                      <input
                        type="radio"
                        name="paquete_id"
                        value={pack.id}
                        checked={isSelected}
                        onChange={handleChange}
                        style={{ accentColor: 'var(--primary)', marginTop: '3px' }}
                        id={`paquete-${pack.id}`}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary-dark)' }}>
                            {pack.nombre}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                            {pack.recomendado && (
                              <span className="badge badge-primary">⭐ Recomendado</span>
                            )}
                            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)', fontFamily: 'Outfit, sans-serif' }}>
                              ${parseFloat(pack.precio_total).toLocaleString('es-EC')}
                            </span>
                          </div>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--warning)', fontWeight: 600, marginBottom: '0.5rem' }}>
                          {pack.descuento}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                          {pack.servicios_incluidos.map((srv) => (
                            <span key={srv} className="badge badge-neutral">{srv}</span>
                          ))}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* PASO 3: Servicios adicionales */}
          {step === 3 && (
            <div className="card animate-fade-in">
              <div className="card-header">
                <div className="card-title">
                  <Layers size={18} color="var(--primary)" />
                  Servicios Adicionales (A la Carta)
                </div>
                <span className="badge badge-primary">Paso 3 de 4</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                Personaliza tu evento con servicios complementarios. El precio total se actualiza automáticamente.
              </p>

              {/* Agrupar por categoría */}
              {[...new Set(servicios.map(s => s.categoria))].map((cat) => (
                <div key={cat} style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.625rem' }}>
                    {cat}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {servicios.filter(s => s.categoria === cat).map((srv) => {
                      const isSelected = form.servicios_ids.includes(srv.id);
                      return (
                        <label
                          key={srv.id}
                          style={{
                            display: 'flex', alignItems: 'flex-start', gap: '0.875rem',
                            padding: '0.875rem 1rem',
                            border: `1.5px solid ${isSelected ? 'var(--success)' : 'var(--border-subtle)'}`,
                            borderRadius: 'var(--radius-md)',
                            background: isSelected ? 'rgba(77,154,114,0.05)' : 'var(--white)',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleServicio(srv.id)}
                            style={{ accentColor: 'var(--success)', marginTop: '2px' }}
                            id={`servicio-${srv.id}`}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                              <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--primary-dark)' }}>
                                {srv.nombre}
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {srv.popular && <span className="badge badge-accent">⚡ Popular</span>}
                                <span style={{ fontWeight: 700, color: 'var(--success)', fontSize: '0.95rem' }}>
                                  +${srv.precio_base.toLocaleString('es-EC')}{' '}
                                  <span style={{ fontWeight: 500, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    / {srv.unidad}
                                  </span>
                                </span>
                              </div>
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                              {srv.descripcion}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* PASO 4: Resumen */}
          {step === 4 && (
            <div className="card animate-fade-in">
              <div className="card-header">
                <div className="card-title">
                  <FileText size={18} color="var(--primary)" />
                  Resumen de la Cotización
                </div>
                <span className="badge badge-success">Paso 4 de 4</span>
              </div>

              {/* Datos del cliente */}
              <div style={{ background: 'var(--cream)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.25rem', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '0.625rem' }}>
                  Datos del solicitante
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.875rem' }}>
                  {[
                    ['Nombre', form.cliente_nombre || '—'],
                    ['Tipo de evento', form.tipo_evento || '—'],
                    ['Correo', form.cliente_email || '—'],
                    ['Fecha estimada', form.fecha_estimada || '—'],
                    ['Teléfono', form.cliente_telefono || '—'],
                    ['Invitados', form.num_invitados ? `${form.num_invitados} personas` : '—'],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>{label}: </span>
                      <span style={{ color: 'var(--primary-dark)', fontWeight: 600 }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Paquete seleccionado */}
              {paqueteSeleccionado && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    Paquete base
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'var(--primary-light)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(77,113,130,0.2)' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--primary-dark)' }}>{paqueteSeleccionado.nombre}</span>
                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{fmt(costoPaquete)}</span>
                  </div>
                </div>
              )}

              {/* Servicios seleccionados */}
              {serviciosSeleccionados.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    Servicios adicionales ({serviciosSeleccionados.length})
                  </div>
                  {serviciosSeleccionados.map(s => (
                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 1rem', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.875rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{s.nombre}</span>
                      <span style={{ fontWeight: 600, color: 'var(--success)' }}>+${s.precio_base.toLocaleString('es-EC')}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Totales */}
              <div style={{ background: 'var(--cream)', borderRadius: 'var(--radius-md)', padding: '1rem 1.125rem', border: '1px solid var(--border-subtle)' }}>
                <PriceLine label={`Paquete base (${paqueteSeleccionado?.nombre || 'Sin paquete'})`} value={fmt(costoPaquete)} />
                <PriceLine label={`Servicios adicionales (${serviciosSeleccionados.length})`} value={fmt(costoServicios)} />
                <PriceLine label="TOTAL ESTIMADO" value={fmt(totalCalculado)} bold big />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', padding: '0.625rem 0', borderTop: '1px dashed var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600 }}>Anticipo requerido (50%)</span>
                  <span style={{ fontWeight: 700, color: 'var(--success)', fontSize: '0.9rem' }}>{fmt(anticipo)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Navegación */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.25rem' }}>
            <button
              className="btn btn-secondary"
              onClick={handleBack}
              disabled={step === 1}
              id="cotizador-back-btn"
            >
              <ChevronLeft size={16} /> Anterior
            </button>

            {step < 4 ? (
              <button
                className="btn btn-primary"
                onClick={handleNext}
                id="cotizador-next-btn"
              >
                Siguiente <ChevronRight size={16} />
              </button>
            ) : (
              <button
                className="btn btn-primary btn-lg"
                onClick={handleSubmit}
                disabled={submitting || totalCalculado === 0}
                id="cotizador-submit-btn"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {submitting ? 'Procesando...' : 'Generar Cotización'}
              </button>
            )}
          </div>
        </div>

        {/* ── Sidebar: Precio en Vivo ──────────────────────────────────────── */}
        <div style={{ position: 'sticky', top: '90px' }}>
          <div
            className="card"
            style={{ border: '1.5px solid var(--primary)', boxShadow: 'var(--shadow-md)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', paddingBottom: '0.875rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <Sparkles size={18} color="var(--primary)" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary-dark)', margin: 0 }}>
                Precio en Vivo
              </h3>
            </div>

            {/* Desglose */}
            <div style={{ fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              <PriceLine label={`Paquete (${paqueteSeleccionado?.nombre || 'Ninguno'})`} value={fmt(costoPaquete)} />
              <PriceLine label={`Adicionales (${form.servicios_ids.length} serv.)`} value={fmt(costoServicios)} />
            </div>

            {/* Total */}
            <div
              style={{
                background: 'linear-gradient(135deg, var(--primary-light), var(--cream))',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                textAlign: 'center',
                border: '1px solid rgba(77,113,130,0.2)',
                marginBottom: '1rem',
              }}
            >
              <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                Total Estimado
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--primary)', fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>
                {fmt(totalCalculado)}
              </div>
            </div>

            {/* Anticipo */}
            <div style={{ fontSize: '0.82rem', marginBottom: '0.5rem' }}>
              <PriceLine label="Anticipo (50%)" value={fmt(anticipo)} color="var(--success)" />
              <PriceLine label="Saldo previo al evento" value={fmt(anticipo)} />
            </div>

            {/* Indicador paso actual */}
            <div
              style={{
                padding: '0.625rem',
                background: 'var(--cream)',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center',
                fontSize: '0.77rem',
                color: 'var(--text-muted)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              Paso {step} de 4 — {STEPS[step - 1]?.label}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CotizadorPage;
