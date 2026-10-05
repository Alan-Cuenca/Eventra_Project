/**
 * EVENTRA — Detalle de Evento con Tabs navegables
 * Tabs: Resumen | Actividades | Pagos | Archivos | Historial
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge } from '../../components/common/Badge';
import { eventraService } from '../../services/eventraService';
import {
  CalendarDays, Users, DollarSign, Check, X, Upload, Download,
  Clock, AlertCircle, CheckCircle2, FileText, History, ChevronLeft,
  Plus, Trash2, Eye, User, Loader2
} from 'lucide-react';

// ── Tabs config ────────────────────────────────────────────────────────────
const TABS = [
  { id: 'resumen',     label: 'Resumen',     icon: <CalendarDays size={15} /> },
  { id: 'actividades', label: 'Actividades', icon: <CheckCircle2 size={15} /> },
  { id: 'pagos',       label: 'Pagos',       icon: <DollarSign size={15} /> },
  { id: 'archivos',    label: 'Archivos',    icon: <FileText size={15} /> },
  { id: 'historial',   label: 'Historial',   icon: <History size={15} /> },
];

// ── Mock actividades ──────────────────────────────────────────────────────
const MOCK_ACTIVIDADES = [
  { id: 1, nombre: 'Reserva de salón confirmada', responsable: 'Alan Puruncajas', estado: 'Completado', fecha: '2026-09-01' },
  { id: 2, nombre: 'Degustación de menú con el chef', responsable: 'Jorge Sailema', estado: 'Completado', fecha: '2026-09-15' },
  { id: 3, nombre: 'Coordinación con DJ y equipo de luces', responsable: 'Jorge Sailema', estado: 'En progreso', fecha: '2026-10-01' },
  { id: 4, nombre: 'Prueba de decoración floral', responsable: 'Jorge Sailema', estado: 'Pendiente', fecha: '2026-10-10' },
  { id: 5, nombre: 'Revisión final y ensayo de protocolo', responsable: 'Alan Puruncajas', estado: 'Pendiente', fecha: '2026-11-01' },
];

// ── Mock pagos ─────────────────────────────────────────────────────────────
const MOCK_PAGOS = [
  { id: 'PAG-001', concepto: 'Anticipo del 50% — Reserva inicial', monto: 1950, fecha: '2026-09-05', metodo: 'Transferencia bancaria', estado: 'Completado' },
  { id: 'PAG-002', concepto: 'Saldo final — Pre-evento', monto: 1950, fecha: '2026-11-10', metodo: 'Pendiente', estado: 'Pendiente' },
];

// ── Mock archivos ──────────────────────────────────────────────────────────
const MOCK_ARCHIVOS = [
  { id: 1, nombre: 'Contrato_Evento_EVT-2026-002.pdf', tipo: 'PDF', tamanio: '248 KB', fecha: '2026-09-05', subido_por: 'Alan Puruncajas' },
  { id: 2, nombre: 'Cotizacion_QuinceGlamour.pdf', tipo: 'PDF', tamanio: '182 KB', fecha: '2026-09-01', subido_por: 'Sistema' },
  { id: 3, nombre: 'Inspiracion_decoracion.jpg', tipo: 'IMG', tamanio: '1.4 MB', fecha: '2026-09-18', subido_por: 'Pablo Vayas' },
];

// ── Mock historial ─────────────────────────────────────────────────────────
const MOCK_HISTORIAL = [
  { id: 1, accion: 'Cotización generada y enviada al cliente', usuario: 'Alan Puruncajas', fecha: '2026-09-01 09:15', tipo: 'info' },
  { id: 2, accion: 'Anticipo de $1,950.00 registrado en el sistema', usuario: 'Alan Puruncajas', fecha: '2026-09-05 11:30', tipo: 'success' },
  { id: 3, accion: 'Solicitud de modificación recibida (+15 comensales)', usuario: 'Pablo Vayas', fecha: '2026-09-12 14:22', tipo: 'warning' },
  { id: 4, accion: 'Solicitud de modificación pendiente de aprobación por Gerente', usuario: 'Sistema', fecha: '2026-09-12 14:25', tipo: 'warning' },
  { id: 5, accion: 'Estado actualizado a "En preparación"', usuario: 'Alan Puruncajas', fecha: '2026-09-20 10:00', tipo: 'info' },
];

// ══════════════════════════════════════════════════════════════════════════════
export const EventDetailPage = ({ eventoId: propId }) => {
  const navigate = useNavigate();
  const { id: paramId } = useParams();
  const eventoId = propId || paramId;
  const [activeTab, setActiveTab] = useState('resumen');
  const [actividades, setActividades] = useState(MOCK_ACTIVIDADES);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);

  const [evento, setEvento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!eventoId) return;
    eventraService.getEvento(eventoId)
      .then(data => setEvento(data))
      .catch(err => setError(err.message || 'Error al cargar el evento'))
      .finally(() => setLoading(false));
  }, [eventoId]);

  const fmt = (n) =>
    new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);

  const toggleActividad = (id) => {
    setActividades(prev =>
      prev.map(a =>
        a.id === id
          ? { ...a, estado: a.estado === 'Completado' ? 'Pendiente' : 'Completado' }
          : a
      )
    );
  };

  const actEstadoBadge = (e) => {
    if (e === 'Completado') return 'success';
    if (e === 'En progreso') return 'primary';
    return 'neutral';
  };

  const histTipo = (t) => {
    if (t === 'success') return { color: 'var(--success)', bg: 'var(--success-light)', icon: <CheckCircle2 size={13} /> };
    if (t === 'warning') return { color: 'var(--warning)', bg: 'var(--warning-light)', icon: <AlertCircle size={13} /> };
    return { color: 'var(--primary)', bg: 'var(--primary-light)', icon: <Clock size={13} /> };
  };

  return (
    <div className="animate-fade-in">
      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type}`} onAnimationEnd={() => setToast(null)}>
          <CheckCircle2 size={15} /> {toast.msg}
        </div>
      )}

      {/* Modal de confirmación genérico */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', color: 'var(--primary-dark)' }}>Confirmar acción</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>
                <X size={16} />
              </button>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              ¿Estás seguro de que deseas continuar con esta acción? Esta operación no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setShowModal(false);
                  setToast({ msg: 'Acción ejecutada exitosamente.', type: 'success' });
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <button className="btn btn-ghost btn-sm" style={{ marginBottom: '0.5rem', paddingLeft: 0 }} onClick={() => navigate('/eventos')}>
            <ChevronLeft size={16} /> Volver a eventos
          </button>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{evento.titulo || evento.nombre || `Evento #${evento.id}`}</h1>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <Badge variant={evento.estado === 'Confirmado' || evento.estado_progreso === 'Confirmado' ? 'success' : evento.estado === 'En preparación' || evento.estado_progreso === 'En preparación' ? 'primary' : 'warning'}>
              {evento.estado || evento.estado_progreso || 'Registrado'}
            </Badge>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>·</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <CalendarDays size={14} /> {evento.fecha}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(true)}>
            <AlertCircle size={15} /> Solicitar cambio
          </button>
          <button className="btn btn-primary btn-sm">
            <FileText size={15} /> Ver contrato
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-nav" id="event-detail-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB: RESUMEN ─────────────────────────────────────────────────────── */}
      {activeTab === 'resumen' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* KPIs rápidos */}
          <div className="grid-cols-4">
            {[
              { label: 'Costo Total', value: fmt(evento.monto_total || 0), icon: DollarSign, color: 'var(--primary)' },
              { label: 'Anticipo Pagado', value: fmt(evento.anticipo_pagado || 0), icon: CheckCircle2, color: 'var(--success)' },
              { label: 'Saldo Pendiente', value: fmt(evento.saldo_pendiente || 0), icon: Clock, color: 'var(--warning)' },
              { label: 'Invitados', value: evento.invitados || 0, icon: Users, color: 'var(--info)' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="kpi-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>{label}</span>
                  <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: `${color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={16} color={color} />
                  </div>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-dark)', fontFamily: 'Outfit, sans-serif', lineHeight: 1.1 }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Progreso + Detalles */}
          <div className="grid-cols-2">
            <div className="card">
              <div className="card-header">
                <div className="card-title"><CalendarDays size={17} color="var(--primary)" />Información General</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                {[
                  ['Cliente', evento.cliente?.nombres ? `${evento.cliente.nombres} ${evento.cliente.apellidos}` : evento.cliente_nombre || 'No asignado'],
                  ['Email', evento.cliente?.email || evento.cliente_email || 'N/A'],
                  ['Teléfono', evento.cliente?.telefono || evento.cliente_telefono || 'N/A'],
                  ['Tipo de evento', evento.tipo || 'General'],
                  ['Paquete', evento.paquete?.nombre || evento.paquete || 'Personalizado'],
                  ['Responsable', evento.responsable || 'Sin asignar'],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(206,200,184,0.4)' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
                    <span style={{ color: 'var(--primary-dark)', fontWeight: 600, textAlign: 'right', maxWidth: '60%' }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title">Progreso de Organización</div>
                <span style={{ fontWeight: 800, color: 'var(--primary)', fontFamily: 'Outfit, sans-serif' }}>{evento.progreso_porcentaje || 0}%</span>
              </div>
              <div className="progress-bar-container" style={{ height: '12px', marginBottom: '1.5rem' }}>
                <div className="progress-bar-fill" style={{ width: `${evento.progreso_porcentaje || 0}%` }} />
              </div>
              {/* Etapas */}
              {[
                { label: 'Cotización aprobada', done: true },
                { label: 'Anticipo pagado', done: true },
                { label: 'Coordinación operativa', done: evento.progreso_porcentaje >= 60 },
                { label: 'Ensayo y prueba final', done: evento.progreso_porcentaje >= 80 },
                { label: 'Evento ejecutado', done: evento.progreso_porcentaje >= 100 },
              ].map((etapa, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid rgba(206,200,184,0.3)' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: etapa.done ? 'var(--success)' : 'var(--cream)', border: `2px solid ${etapa.done ? 'var(--success)' : 'var(--border-subtle)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {etapa.done && <Check size={11} color="white" strokeWidth={3} />}
                  </div>
                  <span style={{ fontSize: '0.8375rem', color: etapa.done ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: etapa.done ? 600 : 500 }}>
                    {etapa.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: ACTIVIDADES ─────────────────────────────────────────────────── */}
      {activeTab === 'actividades' && (
        <div className="card animate-fade-in">
          <div className="card-header">
            <div className="card-title">
              <CheckCircle2 size={17} color="var(--primary)" />
              Actividades del Evento
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setToast({ msg: 'Nueva actividad añadida (demo).', type: 'success' })}>
              <Plus size={15} /> Añadir actividad
            </button>
          </div>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Actividad</th>
                  <th>Responsable</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {actividades.map((act) => (
                  <tr key={act.id}>
                    <td style={{ fontWeight: 600, fontSize: '0.875rem' }}>{act.nombre}</td>
                    <td style={{ fontSize: '0.875rem' }}>{act.responsable}</td>
                    <td style={{ fontSize: '0.875rem', whiteSpace: 'nowrap' }}>{act.fecha}</td>
                    <td><Badge variant={actEstadoBadge(act.estado)}>{act.estado}</Badge></td>
                    <td>
                      <button
                        className={`btn btn-sm ${act.estado === 'Completado' ? 'btn-secondary' : 'btn-success'}`}
                        onClick={() => { toggleActividad(act.id); setToast({ msg: act.estado === 'Completado' ? 'Actividad reabierta.' : 'Actividad completada ✓', type: 'success' }); }}
                        id={`toggle-actividad-${act.id}`}
                      >
                        {act.estado === 'Completado' ? <><X size={13} /> Reabrir</> : <><Check size={13} /> Completar</>}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB: PAGOS ───────────────────────────────────────────────────────── */}
      {activeTab === 'pagos' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title"><DollarSign size={17} color="var(--primary)" />Registro de Pagos</div>
              <button className="btn btn-primary btn-sm" onClick={() => setToast({ msg: 'Pago registrado (demo).', type: 'success' })}>
                <Plus size={15} /> Registrar pago
              </button>
            </div>
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr><th>ID</th><th>Concepto</th><th>Monto</th><th>Fecha</th><th>Método</th><th>Estado</th></tr>
                </thead>
                <tbody>
                  {MOCK_PAGOS.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{p.id}</td>
                      <td style={{ fontSize: '0.875rem', fontWeight: 600 }}>{p.concepto}</td>
                      <td style={{ fontWeight: 800, color: 'var(--primary-dark)', fontFamily: 'Outfit, sans-serif' }}>{fmt(p.monto)}</td>
                      <td style={{ fontSize: '0.875rem', whiteSpace: 'nowrap' }}>{p.fecha}</td>
                      <td style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{p.metodo}</td>
                      <td><Badge variant={p.estado === 'Completado' ? 'success' : 'warning'}>{p.estado}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Resumen de pagos */}
          <div className="card" style={{ border: '1px solid rgba(77,113,130,0.2)', background: 'linear-gradient(145deg, var(--primary-light), var(--white))' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Resumen Financiero</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
              {[
                { label: 'Monto Total', value: fmt(evento.monto_total), color: 'var(--primary)' },
                { label: 'Pagado', value: fmt(evento.anticipo_pagado), color: 'var(--success)' },
                { label: 'Pendiente', value: fmt(evento.saldo_pendiente), color: 'var(--warning)' },
              ].map(item => (
                <div key={item.label} style={{ textAlign: 'center', padding: '1rem', background: 'var(--white)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>{item.label}</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: item.color, fontFamily: 'Outfit, sans-serif' }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: ARCHIVOS ────────────────────────────────────────────────────── */}
      {activeTab === 'archivos' && (
        <div className="card animate-fade-in">
          <div className="card-header">
            <div className="card-title"><FileText size={17} color="var(--primary)" />Archivos del Evento</div>
            <button className="btn btn-primary btn-sm" onClick={() => setToast({ msg: 'Archivo subido exitosamente (demo).', type: 'success' })}>
              <Upload size={15} /> Subir archivo
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {MOCK_ARCHIVOS.map((f) => (
              <div
                key={f.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.875rem',
                  padding: '0.875rem 1rem',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--white)',
                  transition: 'background 0.15s',
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--border-subtle)' }}>
                  <FileText size={18} color="var(--primary)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--primary-dark)', marginBottom: '0.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {f.nombre}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {f.tipo} · {f.tamanio} · Subido por {f.subido_por} · {f.fecha}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button className="btn btn-secondary btn-sm btn-icon" title="Ver" onClick={() => setToast({ msg: `Abriendo ${f.nombre}...`, type: 'info' })}>
                    <Eye size={14} />
                  </button>
                  <button className="btn btn-secondary btn-sm btn-icon" title="Descargar">
                    <Download size={14} />
                  </button>
                  <button className="btn btn-secondary btn-sm btn-icon" title="Eliminar" style={{ color: 'var(--danger)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB: HISTORIAL ───────────────────────────────────────────────────── */}
      {activeTab === 'historial' && (
        <div className="card animate-fade-in">
          <div className="card-header">
            <div className="card-title"><History size={17} color="var(--primary)" />Historial de Cambios</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {MOCK_HISTORIAL.map((h, i) => {
              const { color, bg, icon } = histTipo(h.tipo);
              return (
                <div
                  key={h.id}
                  style={{
                    display: 'flex', gap: '1rem', alignItems: 'flex-start',
                    padding: '0.875rem 0',
                    borderBottom: i < MOCK_HISTORIAL.length - 1 ? '1px solid rgba(206,200,184,0.4)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${color}30` }}>
                      {icon}
                    </div>
                    {i < MOCK_HISTORIAL.length - 1 && (
                      <div style={{ width: 1, height: '100%', minHeight: '20px', background: 'var(--border-subtle)' }} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--primary-dark)', marginBottom: '0.15rem' }}>
                      {h.accion}
                    </div>
                    <div style={{ fontSize: '0.77rem', color: 'var(--text-muted)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><User size={13} /> {h.usuario}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={13} /> {h.fecha}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetailPage;
