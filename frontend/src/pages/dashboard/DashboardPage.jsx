/**
 * EVENTRA — Dashboard Dinámico por Rol
 * Admin: KPIs SaaS + tabla de eventos
 * Gerente: KPIs + Aprobaciones interactivas (Aprobar/Rechazar)
 * Trabajador: Eventos asignados + Checklist operativo interactivo
 * Cliente: Vista de su evento principal + KPIs financieros
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBranding } from '../../context/ThemeBrandingContext';
import { api } from '../../services/api';
import { eventraService } from '../../services/eventraService';
import { Badge } from '../../components/common/Badge';
import {
  MOCK_EVENTOS,
  MOCK_METRICAS_SAAS,
  MOCK_SOLICITUDES_CAMBIO,
} from '../../services/mockData';
import {
  CalendarDays, DollarSign, Users, CheckCircle2, Clock,
  AlertCircle, Sparkles, ArrowUpRight, TrendingUp, Activity,
  RefreshCw, WifiOff, Check, X, ChevronRight,
  CalendarCheck, Layers, Building2, MessageSquare, BarChart2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

// ── Componente Toast ─────────────────────────────────────────────────────────
const Toast = ({ message, type = 'success', onDone }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className={`toast ${type}`}>
      {type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
      {message}
    </div>
  );
};

// ── KPI Card ─────────────────────────────────────────────────────────────────
const KpiCard = ({ label, value, icon: Icon, iconColor, subtext, accentLine, loading }) => (
  <div className="kpi-card" style={{ '--accent-line': accentLine || 'var(--primary)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
      <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>
        {label}
      </span>
      <div
        style={{
          width: '36px', height: '36px', borderRadius: 'var(--radius-md)',
          background: `${iconColor || 'var(--primary)'}14`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={18} color={iconColor || 'var(--primary)'} />
      </div>
    </div>
    {loading ? (
      <div className="skeleton" style={{ height: '2rem', marginBottom: '0.5rem' }} />
    ) : (
      <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--primary-dark)', lineHeight: 1, marginBottom: '0.4rem', fontFamily: 'Outfit, sans-serif' }}>
        {value ?? '—'}
      </div>
    )}
    {subtext && (
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
        {subtext}
      </div>
    )}
  </div>
);

// ── OfflineBanner ─────────────────────────────────────────────────────────────
const OfflineBanner = ({ onRetry }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: '1rem', padding: '0.875rem 1.25rem',
    background: 'var(--warning-light)', border: '1px solid rgba(196,154,58,0.3)',
    borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', flexWrap: 'wrap',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: '#7a5e18' }}>
      <WifiOff size={16} />
      <span>
        <strong>API no disponible</strong> — Mostrando datos de demostración. El backend puede estar en cold-start (~30 s).
      </span>
    </div>
    <button onClick={onRetry} className="btn btn-secondary btn-sm">
      <RefreshCw size={14} /> Reintentar
    </button>
  </div>
);

// ── SaaS Metric Bar ───────────────────────────────────────────────────────────
const SaasBar = ({ label, current, limit }) => {
  const safeLimit = limit > 0 ? limit : 1;
  const pct = Math.min(100, Math.round((current / safeLimit) * 100));
  const color = pct >= 90 ? 'var(--danger)' : pct >= 70 ? 'var(--warning)' : 'var(--success)';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</span>
        <span style={{ fontWeight: 700, color }}>
          {current} / {limit} <span style={{ fontWeight: 500, color: 'var(--text-muted)' }}>({pct}%)</span>
        </span>
      </div>
      <div className="progress-bar-container" style={{ height: '7px' }}>
        <div className="progress-bar-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}99)` }} />
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
export const DashboardPage = () => {
  const { user, isAdmin, isGerente, isTrabajador, isCliente } = useAuth();
  const { branding } = useBranding();

  const [kpis, setKpis] = useState(null);
  const [kpiLoading, setKpiLoading] = useState(true);
  const [apiOnline, setApiOnline] = useState(true);
  const [toast, setToast] = useState(null);

  // Estado mutable de eventos, solicitudes y consumo SaaS
  const [eventos, setEventos] = useState([]);
  const [solicitudes, setSolicitudes] = useState(() =>
    MOCK_SOLICITUDES_CAMBIO.map(s => ({ ...s }))
  );
  const [consumoSaas, setConsumoSaas] = useState(null);

  // Checklist interactivo para trabajador (sincronizado con actividades reales si existen)
  const [checklist, setChecklist] = useState([
    { id: 1, done: true,  text: 'Verificación de climatización e iluminación — Salón Imperial' },
    { id: 2, done: true,  text: 'Confirmación con chef: menú gourmet (120 raciones)' },
    { id: 3, done: false, text: 'Prueba de sonido y cabina de DJ profesional (16:00 hs)' },
    { id: 4, done: false, text: 'Montaje de backing floral y letras gigantes iluminadas' },
    { id: 5, done: false, text: 'Revisión de lista de invitados y protocolo de bienvenida' },
  ]);

  useEffect(() => {
    eventraService.getEventos()
      .then(data => { if (data && data.length > 0) setEventos(data); })
      .catch(() => {});
    eventraService.getSolicitudes()
      .then(data => { if (data && data.length > 0) setSolicitudes(data); })
      .catch(() => {});
    if (isAdmin) {
      eventraService.getConsumoSuscripcion()
        .then(data => { if (data && data.limites && data.uso) setConsumoSaas(data); })
        .catch(() => {});
    }
    if (isTrabajador) {
      eventraService.getActividades()
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setChecklist(
              data.slice(0, 8).map(act => ({
                id: act.id,
                done: act.estado === 'Completada' || act.completada === true,
                text: act.titulo || act.descripcion || 'Actividad operativa asignada',
                isReal: true,
              }))
            );
          }
        })
        .catch(() => {});
    }
  }, [isAdmin, isTrabajador]);

  const eventosList = eventos.length > 0 ? eventos : MOCK_EVENTOS;

  const fetchKpis = useCallback(async () => {
    setKpiLoading(true);
    try {
      const response = await api.get('/dashboard/admin');
      if (response?.kpis) { setKpis(response.kpis); setApiOnline(true); }
    } catch {
      setApiOnline(false);
    } finally {
      setKpiLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin || isGerente || isTrabajador) { fetchKpis(); }
    else { setKpiLoading(false); }
  }, [isAdmin, isGerente, isTrabajador, fetchKpis]);

  const metricasSaas = {
    empresa: branding?.nombre_comercial || user?.empresa_nombre || MOCK_METRICAS_SAAS.empresa,
    plan: consumoSaas?.plan || user?.plan_suscripcion || 'Premium',
    clientes_activos: consumoSaas?.uso?.clientes ?? kpis?.total_clientes ?? MOCK_METRICAS_SAAS.clientes_activos,
    limite_clientes: consumoSaas?.limites?.clientes ?? MOCK_METRICAS_SAAS.limite_clientes,
    servicios_activos: consumoSaas?.uso?.servicios ?? MOCK_METRICAS_SAAS.servicios_activos,
    limite_servicios: consumoSaas?.limites?.servicios ?? MOCK_METRICAS_SAAS.limite_servicios,
    usuarios_internos: consumoSaas?.uso?.usuarios ?? MOCK_METRICAS_SAAS.usuarios_internos,
    limite_usuarios: consumoSaas?.limites?.usuarios ?? MOCK_METRICAS_SAAS.limite_usuarios,
    mensajes_chatbot_mes: consumoSaas?.uso?.chatbot ?? MOCK_METRICAS_SAAS.mensajes_chatbot_mes,
    limite_chatbot: consumoSaas?.limites?.chatbot ?? MOCK_METRICAS_SAAS.limite_chatbot,
  };

  const kd = {
    total_eventos_activos: kpis?.total_eventos_activos ?? eventosList.length,
    total_clientes:        kpis?.total_clientes        ?? metricasSaas.clientes_activos,
    ingresos_totales:      kpis?.ingresos_totales      ?? MOCK_METRICAS_SAAS.ingresos_mes,
    tareas_pendientes:     kpis?.tareas_pendientes     ?? 4,
  };

  const fmt = (n) =>
    new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(Number(n) || 0);

  // ── Handlers de aprobación sincronizados con eventraService.actualizarEstadoSolicitud ──
  const handleAprobar = async (id) => {
    try {
      await eventraService.actualizarEstadoSolicitud(id, 'Aprobado');
    } catch (_) {}
    setSolicitudes(prev =>
      prev.map(s => s.id === id ? { ...s, estado: 'Aprobado' } : s)
    );
    setToast({ msg: '✓ Solicitud aprobada exitosamente.', type: 'success' });
  };

  const handleRechazar = async (id) => {
    try {
      await eventraService.actualizarEstadoSolicitud(id, 'Rechazado');
    } catch (_) {}
    setSolicitudes(prev =>
      prev.map(s => s.id === id ? { ...s, estado: 'Rechazado' } : s)
    );
    setToast({ msg: '✗ Solicitud rechazada.', type: 'danger' });
  };

  // ── Toggle checklist sincronizado con el backend cuando la actividad es real ──
  const toggleCheck = async (id) => {
    const target = checklist.find(item => item.id === id);
    const nextDone = target ? !target.done : true;
    setChecklist(prev =>
      prev.map(item => item.id === id ? { ...item, done: nextDone } : item)
    );
    if (target?.isReal) {
      try {
        await eventraService.updateEstadoActividad(id, nextDone ? 'Completada' : 'Pendiente');
      } catch (_) {}
    }
  };

  const completedCount = checklist.filter(c => c.done).length;

  const estadoBadge = (estado) => {
    if (estado === 'Confirmado') return 'success';
    if (estado === 'En preparación') return 'primary';
    return 'warning';
  };

  return (
    <div className="animate-fade-in">
      {/* Toast global */}
      {toast && (
        <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />
      )}

      {/* ── Header de página ──────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1>
            {isCliente
              ? `¡Hola, ${user?.nombre_completo?.split(' ')[0] || 'Cliente'}! 👋`
              : `Bienvenido, ${user?.nombre_completo?.split(' ')[0] || 'Usuario'}`}
          </h1>
          <p>
            {isAdmin     && 'Supervisión global de la plataforma SaaS · Métricas de suscripción y límites activos.'}
            {isGerente   && 'Control de operaciones, finanzas y aprobaciones comerciales de eventos.'}
            {isTrabajador && 'Gestión de actividades operativas y checklist de eventos asignados.'}
            {isCliente   && 'Seguimiento en tiempo real del progreso y presupuesto de tu recepción.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Badge API */}
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.35rem 0.875rem', borderRadius: 'var(--radius-full)',
              fontSize: '0.72rem', fontWeight: 700,
              background: apiOnline ? 'var(--success-light)' : 'var(--warning-light)',
              border: `1px solid ${apiOnline ? 'rgba(77,154,114,0.3)' : 'rgba(196,154,58,0.3)'}`,
              color: apiOnline ? '#2a7050' : '#7a5e18',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: apiOnline ? 'var(--success)' : 'var(--warning)', display: 'inline-block' }} />
            {apiOnline ? 'API en línea' : 'Modo demo'}
          </div>

          {(isAdmin || isGerente) && (
            <Link to="/reportes" className="btn btn-secondary btn-sm">
              <BarChart2 size={15} /> Reportes PDF
            </Link>
          )}
          {(isAdmin || isGerente || isCliente) && (
            <Link to="/cotizador" className="btn btn-primary btn-sm">
              <Sparkles size={15} /> Nueva Cotización
            </Link>
          )}
          {!isCliente && (
            <Link to="/eventos" className="btn btn-secondary btn-sm">
              <CalendarDays size={15} /> Ver Eventos
            </Link>
          )}
        </div>
      </div>

      {/* Banner offline */}
      {!apiOnline && (isAdmin || isGerente || isTrabajador) && (
        <OfflineBanner onRetry={fetchKpis} />
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          VISTA 1: ADMINISTRADOR
         ══════════════════════════════════════════════════════════════════════ */}
      {isAdmin && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* KPIs */}
          <div className="grid-cols-4">
            <KpiCard label="Eventos Activos" value={kd.total_eventos_activos}
              icon={CalendarDays} iconColor="var(--primary)"
              subtext={<><TrendingUp size={12} /> En planificación o en progreso</>}
              loading={kpiLoading} />
            <KpiCard label="Clientes Activos" value={`${kd.total_clientes} / ${metricasSaas.limite_clientes}`}
              icon={Users} iconColor="var(--warning)"
              subtext="Uso del plan actual" loading={kpiLoading} />
            <KpiCard label="Servicios" value={`${metricasSaas.servicios_activos} / ${metricasSaas.limite_servicios}`}
              icon={Layers} iconColor="var(--success)"
              subtext="Catálogo activo" loading={kpiLoading} />
            <KpiCard label="Ingresos del Mes" value={kpiLoading ? null : fmt(kd.ingresos_totales)}
              icon={DollarSign} iconColor="var(--success)"
              subtext={<><TrendingUp size={12} /> Pagos completados</>}
              loading={kpiLoading} />
          </div>

          {/* Card de suscripción SaaS */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Building2 size={18} color="var(--primary)" />
                Estado de Suscripción SaaS — {metricasSaas.empresa}
              </div>
              <Badge variant="primary">Plan {metricasSaas.plan}</Badge>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <SaasBar label="Clientes activos" current={metricasSaas.clientes_activos} limit={metricasSaas.limite_clientes} />
              <SaasBar label="Servicios en catálogo" current={metricasSaas.servicios_activos} limit={metricasSaas.limite_servicios} />
              <SaasBar label="Usuarios internos" current={metricasSaas.usuarios_internos} limit={metricasSaas.limite_usuarios} />
              <SaasBar label="Mensajes chatbot / mes" current={metricasSaas.mensajes_chatbot_mes} limit={metricasSaas.limite_chatbot} />
            </div>
          </div>

          {/* Tabla de eventos */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <CalendarDays size={18} color="var(--primary)" />
                Eventos Registrados Recientemente
              </div>
              <Link to="/eventos" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.825rem', color: 'var(--primary)', fontWeight: 600 }}>
                Ver todos <ArrowUpRight size={15} />
              </Link>
            </div>
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Evento</th>
                    <th>Cliente</th>
                    <th>Fecha</th>
                    <th>Paquete</th>
                    <th>Total</th>
                    <th>Saldo</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {eventosList.map((evt) => (
                    <tr key={evt.id}>
                      <td>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{evt.titulo || evt.nombre_evento}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{String(evt.id).substring(0, 8).toUpperCase()}</div>
                      </td>
                      <td style={{ fontSize: '0.875rem' }}>{evt.cliente_nombre || 'Cliente'}</td>
                      <td style={{ fontSize: '0.875rem', whiteSpace: 'nowrap' }}>{evt.fecha || evt.fecha_evento}</td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{evt.paquete || evt.salon_o_lugar || 'Estándar'}</td>
                      <td style={{ fontWeight: 700 }}>{fmt(evt.monto_total ?? evt.total_calculado ?? evt.presupuesto_estimado)}</td>
                      <td style={{ color: (evt.saldo_pendiente ?? 0) > 0 ? 'var(--warning)' : 'var(--success)', fontWeight: 600 }}>
                        {fmt(evt.saldo_pendiente ?? 0)}
                      </td>
                      <td><Badge variant={estadoBadge(evt.estado)}>{evt.estado}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          VISTA 2: GERENTE
         ══════════════════════════════════════════════════════════════════════ */}
      {isGerente && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="grid-cols-4">
            <KpiCard label="Eventos Activos" value={kd.total_eventos_activos}
              icon={Activity} iconColor="var(--primary)"
              subtext="En planificación o en progreso" loading={kpiLoading} />
            <KpiCard label="Ingresos Completados" value={kpiLoading ? null : fmt(kd.ingresos_totales)}
              icon={DollarSign} iconColor="var(--success)"
              subtext={<><TrendingUp size={12} /> Pagos completados</>} loading={kpiLoading} />
            <KpiCard label="Clientes Activos" value={kd.total_clientes}
              icon={Users} iconColor="var(--warning)"
              subtext="Empresa actual" loading={kpiLoading} />
            <KpiCard label="Tareas Pendientes" value={kd.tareas_pendientes}
              icon={Clock} iconColor={kd.tareas_pendientes > 0 ? 'var(--danger)' : 'var(--success)'}
              subtext="Sin completar" loading={kpiLoading} />
          </div>

          {/* Solicitudes de Modificación — interactivas */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <AlertCircle size={18} color="var(--warning)" />
                Solicitudes de Modificación — Sujetas a Aprobación
              </div>
              <Badge variant="warning">{solicitudes.filter(s => String(s.estado || '').includes('Pendiente')).length} pendientes</Badge>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {solicitudes.map((sol) => {
                const estadoSol = String(sol.estado || 'Pendiente');
                const isPendiente = estadoSol.includes('Pendiente');
                const isAprobada = estadoSol.includes('Aprobad');
                return (
                  <div
                    key={sol.id}
                    style={{
                      padding: '1.125rem',
                      background: isPendiente ? 'rgba(196,154,58,0.04)' : isAprobada ? 'rgba(77,154,114,0.04)' : 'rgba(201,92,92,0.04)',
                      border: `1px solid ${isPendiente ? 'rgba(196,154,58,0.2)' : isAprobada ? 'rgba(77,154,114,0.2)' : 'rgba(201,92,92,0.2)'}`,
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.875rem',
                      transition: 'all 0.25s ease',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: '250px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '0.9rem', color: 'var(--primary-dark)' }}>
                          {sol.evento_titulo || sol.nombre_evento || 'Solicitud de Evento'}
                        </strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          ({sol.cliente || sol.cliente_nombre || 'Cliente'})
                        </span>
                        <Badge variant={isPendiente ? 'warning' : isAprobada ? 'success' : 'danger'}>
                          {estadoSol}
                        </Badge>
                      </div>
                      <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0 }}>
                        {sol.descripcion || sol.detalle_solicitud}
                      </p>
                      <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                        Solicitud #{String(sol.id).substring(0, 8)} · {sol.fecha_solicitud || 'Reciente'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                      {sol.impacto_costo && (
                        <div style={{
                          fontWeight: 800, fontSize: '1.05rem',
                          color: 'var(--warning)',
                          background: 'var(--warning-light)',
                          padding: '0.3rem 0.75rem',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid rgba(196,154,58,0.2)',
                        }}>
                          {sol.impacto_costo}
                        </div>
                      )}

                      {isPendiente && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            id={`aprobar-sol-${sol.id}`}
                            className="btn btn-success btn-sm"
                            onClick={() => handleAprobar(sol.id)}
                          >
                            <Check size={14} /> Aprobar
                          </button>
                          <button
                            id={`rechazar-sol-${sol.id}`}
                            className="btn btn-danger btn-sm"
                            onClick={() => handleRechazar(sol.id)}
                          >
                            <X size={14} /> Rechazar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tabla eventos */}
          <div className="card">
            <div className="card-header">
              <div className="card-title"><CalendarDays size={18} color="var(--primary)" />Eventos en Gestión</div>
              <Link to="/eventos" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.825rem', color: 'var(--primary)', fontWeight: 600 }}>
                Ver todos <ArrowUpRight size={15} />
              </Link>
            </div>
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr><th>Evento</th><th>Cliente</th><th>Fecha</th><th>Total</th><th>Saldo</th><th>Estado</th></tr>
                </thead>
                <tbody>
                  {eventosList.map((evt) => (
                    <tr key={evt.id}>
                      <td>
                        <div style={{ fontWeight: 700 }}>{evt.titulo || evt.nombre_evento}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{evt.paquete || evt.salon_o_lugar}</div>
                      </td>
                      <td>{evt.cliente_nombre || 'Cliente'}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{evt.fecha || evt.fecha_evento}</td>
                      <td style={{ fontWeight: 700 }}>{fmt(evt.monto_total ?? evt.total_calculado ?? evt.presupuesto_estimado)}</td>
                      <td style={{ color: (evt.saldo_pendiente ?? 0) > 0 ? 'var(--warning)' : 'var(--success)', fontWeight: 600 }}>
                        {fmt(evt.saldo_pendiente ?? 0)}
                      </td>
                      <td><Badge variant={estadoBadge(evt.estado)}>{evt.estado}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          VISTA 3: TRABAJADOR
         ══════════════════════════════════════════════════════════════════════ */}
      {isTrabajador && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="grid-cols-4">
            <KpiCard label="Eventos Asignados" value={kd.total_eventos_activos}
              icon={CalendarDays} iconColor="var(--primary)"
              subtext="En progreso o planificación" loading={kpiLoading} />
            <KpiCard
              label="Tareas Completadas"
              value={`${completedCount} / ${checklist.length}`}
              icon={CheckCircle2} iconColor="var(--success)"
              subtext={`${checklist.length ? Math.round((completedCount / checklist.length) * 100) : 0}% del checklist`}
              loading={false}
            />
          </div>

          <div className="grid-cols-2">
            {/* Eventos asignados */}
            <div className="card">
              <div className="card-header">
                <div className="card-title"><CalendarDays size={18} color="var(--primary)" />Eventos a mi Cargo</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {eventosList.slice(0, 2).map((evt) => (
                  <div
                    key={evt.id}
                    style={{
                      padding: '1rem', background: 'var(--cream)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      transition: 'border-color 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary-dark)' }}>
                          {evt.titulo || evt.nombre_evento}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {evt.paquete || evt.salon_o_lugar}
                        </div>
                      </div>
                      <Badge variant={estadoBadge(evt.estado)}>{evt.estado}</Badge>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><CalendarDays size={14} /> {evt.fecha || evt.fecha_evento}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Users size={14} /> {evt.invitados || evt.num_invitados || 100} invitados</span>
                    </div>
                    <div style={{ marginTop: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                        <span>Progreso</span>
                        <span style={{ fontWeight: 700 }}>{evt.progreso_porcentaje ?? 60}%</span>
                      </div>
                      <div className="progress-bar-container">
                        <div className="progress-bar-fill" style={{ width: `${evt.progreso_porcentaje ?? 60}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Checklist operativo interactivo */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <CheckCircle2 size={18} color="var(--success)" />
                  Checklist Operativo del Día
                </div>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  {completedCount}/{checklist.length}
                </span>
              </div>

              {/* Barra de progreso del checklist */}
              <div style={{ marginBottom: '1rem' }}>
                <div className="progress-bar-container">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${checklist.length ? Math.round((completedCount / checklist.length) * 100) : 0}%`,
                      background: 'linear-gradient(90deg, var(--success), #6dbb96)',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {checklist.map((item) => (
                  <div
                    key={item.id}
                    className={`checklist-item ${item.done ? 'done' : ''}`}
                    onClick={() => toggleCheck(item.id)}
                    id={`checklist-item-${item.id}`}
                  >
                    <div className={`checklist-checkbox ${item.done ? 'done' : ''}`}>
                      {item.done && <Check size={11} color="white" strokeWidth={3} />}
                    </div>
                    <span
                      style={{
                        fontSize: '0.8375rem',
                        color: item.done ? 'var(--text-muted)' : 'var(--text-primary)',
                        textDecoration: item.done ? 'line-through' : 'none',
                        transition: 'all 0.2s',
                        flex: 1,
                      }}
                    >
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          VISTA 4: CLIENTE — Portal de seguimiento
         ══════════════════════════════════════════════════════════════════════ */}
      {isCliente && (() => {
        const evt = eventosList.find(e => e.cliente_email === user?.email || e.cliente_nombre?.toLowerCase().includes('pablo')) || eventosList[0] || MOCK_EVENTOS[1];
        const totalEvt = Number(evt.monto_total ?? evt.total_calculado ?? evt.presupuesto_estimado ?? 8500);
        const anticipoEvt = Number(evt.anticipo_pagado ?? 4250);
        const saldoEvt = Number(evt.saldo_pendiente ?? Math.max(0, totalEvt - anticipoEvt));
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Card principal del evento */}
            <div
              className="card"
              style={{
                border: '1px solid rgba(77,113,130,0.25)',
                background: 'linear-gradient(145deg, rgba(77,113,130,0.05) 0%, var(--white) 100%)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <Badge variant="primary">Evento en Progreso</Badge>
                  </div>
                  <h2 style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>
                    {evt.titulo || evt.nombre_evento}
                  </h2>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><CalendarDays size={15} /> {evt.fecha || evt.fecha_evento}</span>
                    <span style={{ color: 'var(--border-subtle)' }}>|</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Building2 size={15} /> {evt.salon_o_lugar || evt.salon_nombre || 'Salón Imperial Platinum'}</span>
                    <span style={{ color: 'var(--border-subtle)' }}>|</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Users size={15} /> {evt.invitados || evt.num_invitados || 150} invitados</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Progreso de Organización
                  </div>
                  <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--primary)', fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>
                    {evt.progreso_porcentaje ?? 75}%
                  </div>
                </div>
              </div>

              {/* Barra de progreso */}
              <div className="progress-bar-container" style={{ height: '12px', marginBottom: '1.5rem' }}>
                <div className="progress-bar-fill" style={{ width: `${evt.progreso_porcentaje ?? 75}%` }} />
              </div>

              {/* KPIs financieros */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                {[
                  { label: 'COSTO TOTAL', value: fmt(totalEvt), color: 'var(--primary-dark)', bg: 'var(--cream)', icon: <DollarSign size={16} /> },
                  { label: 'ANTICIPO PAGADO', value: fmt(anticipoEvt), color: 'var(--success)', bg: 'var(--success-light)', icon: <CheckCircle2 size={16} /> },
                  { label: 'SALDO PENDIENTE', value: fmt(saldoEvt), color: 'var(--warning)', bg: 'var(--warning-light)', icon: <Clock size={16} /> },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      padding: '1.125rem',
                      background: item.bg,
                      borderRadius: 'var(--radius-md)',
                      border: `1px solid ${item.color}25`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: item.color, marginBottom: '0.4rem' }}>
                      <span>{item.icon}</span>
                      {item.label}
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: item.color, fontFamily: 'Outfit, sans-serif' }}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Links de acceso rápido */}
            <div className="grid-cols-3">
              {[
                { icon: <CalendarCheck size={22} />, label: 'Ver detalle completo', sub: 'Actividades, pagos y archivos', to: '/eventos', color: 'var(--primary)' },
                { icon: <MessageSquare size={22} />, label: 'Solicitar modificación', sub: 'Cambia detalles de tu evento', to: '/portal-cliente/solicitudes', color: 'var(--warning)' },
                { icon: <CalendarDays size={22} />, label: 'Mis reservas', sub: 'Salones y servicios reservados', to: '/reservas', color: 'var(--success)' },
              ].map((card) => (
                <Link
                  key={card.label}
                  to={card.to}
                  className="card interactive"
                  style={{ display: 'flex', gap: '1rem', alignItems: 'center', textDecoration: 'none' }}
                >
                  <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: `${card.color}14`, color: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {card.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary-dark)' }}>{card.label}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{card.sub}</div>
                  </div>
                  <ChevronRight size={16} color="var(--text-muted)" style={{ marginLeft: 'auto', flexShrink: 0 }} />
                </Link>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
};
