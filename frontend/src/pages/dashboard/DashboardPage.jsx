/**
 * EVENTRA — Dashboard Principal
 * Consume GET /dashboard para obtener KPIs reales del backend (Render).
 * Muestra vistas diferenciadas por rol: Admin, Gerente, Trabajador.
 * Si la API falla (red o 5xx), hace fallback a mock data con banner de aviso.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import {
  MOCK_EVENTOS,
  MOCK_METRICAS_SAAS,
  MOCK_SOLICITUDES_CAMBIO,
} from '../../services/mockData';
import {
  CalendarDays,
  DollarSign,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Briefcase,
  MessageSquare,
  RefreshCw,
  WifiOff,
  Activity,
  ListTodo,
} from 'lucide-react';
import { Link } from 'react-router-dom';

// ── Componente KPI Card ──────────────────────────────────────────────────────
const KpiCard = ({ label, value, icon: Icon, iconColor, subtext, subtextColor, loading }) => (
  <Card>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </span>
      <Icon size={18} color={iconColor ?? 'var(--primary)'} />
    </div>
    {loading ? (
      <div style={{ height: '2.2rem', background: 'var(--border-subtle)', borderRadius: '6px', animation: 'pulse 1.5s ease-in-out infinite' }} />
    ) : (
      <div style={{ fontSize: '1.9rem', fontWeight: 800, color: subtextColor && value !== '—' ? subtextColor : 'var(--text-primary)', lineHeight: 1 }}>
        {value ?? '—'}
      </div>
    )}
    {subtext && (
      <div style={{ fontSize: '0.75rem', color: subtextColor ?? 'var(--text-muted)', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        {subtext}
      </div>
    )}
  </Card>
);

// ── Componente Banner de Error de Red ────────────────────────────────────────
const OfflineBanner = ({ onRetry }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    padding: '0.85rem 1.25rem',
    background: 'rgba(194,136,52,0.1)',
    border: '1px solid rgba(194,136,52,0.3)',
    borderRadius: 'var(--radius-md)',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.85rem', color: '#e5b067' }}>
      <WifiOff size={16} />
      <span>
        <strong>API no disponible</strong> — Mostrando datos de demostración. El backend en Render puede estar en cold-start (espera ~30 s).
      </span>
    </div>
    <button
      onClick={onRetry}
      className="btn btn-secondary"
      style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem', gap: '0.4rem' }}
    >
      <RefreshCw size={14} /> Reintentar
    </button>
  </div>
);

// ── Dashboard Principal ──────────────────────────────────────────────────────
export const DashboardPage = () => {
  const { user, isAdmin, isGerente, isTrabajador, isCliente } = useAuth();

  // ── Estado de KPIs reales ────────────────────────────────────────────────
  const [kpis, setKpis]         = useState(null);   // datos reales del backend
  const [kpiLoading, setKpiLoading] = useState(true);
  const [apiOnline, setApiOnline]   = useState(true); // false = modo offline/demo

  const fetchKpis = useCallback(async () => {
    setKpiLoading(true);
    try {
      // GET https://eventra-project-l3hl.onrender.com/api/dashboard
      // Requiere JWT en header — inyectado automáticamente por el interceptor
      const response = await api.get('/dashboard');
      if (response?.kpis) {
        setKpis(response.kpis);
        setApiOnline(true);
      }
    } catch (err) {
      // 401 es manejado por el interceptor de Axios (logout automático)
      // Para 5xx o error de red → modo offline con mock data
      console.warn('[Dashboard] API no disponible, usando mock data:', err.message);
      setApiOnline(false);
    } finally {
      setKpiLoading(false);
    }
  }, []);

  useEffect(() => {
    // Solo los roles internos consumen el endpoint de KPIs
    if (isAdmin || isGerente || isTrabajador) {
      fetchKpis();
    } else {
      setKpiLoading(false);
    }
  }, [isAdmin, isGerente, isTrabajador, fetchKpis]);

  // Valores de KPIs: reales si la API responde, mock si no
  const kpiData = {
    total_eventos_activos: kpis?.total_eventos_activos ?? MOCK_METRICAS_SAAS.eventos_mes,
    total_clientes:        kpis?.total_clientes        ?? MOCK_METRICAS_SAAS.clientes_activos,
    ingresos_totales:      kpis?.ingresos_totales      ?? MOCK_METRICAS_SAAS.ingresos_mes,
    tareas_pendientes:     kpis?.tareas_pendientes     ?? 4,
  };

  const formatCurrency = (n) =>
    new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1>Bienvenido, {user?.nombre_completo?.split(' ')[0] || 'Usuario'}</h1>
          <p>
            {isAdmin     && 'Supervisión global de la plataforma SaaS y métricas de suscripción.'}
            {isGerente   && 'Control de operaciones de eventos, finanzas y aprobaciones comerciales.'}
            {isTrabajador && 'Gestión y checklist de actividades operativas en eventos asignados.'}
            {isCliente   && 'Seguimiento en tiempo real del progreso y presupuesto de tu recepción.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {/* Badge de estado de la API */}
          <div style={{
            padding: '0.35rem 0.75rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.72rem',
            fontWeight: 700,
            background: apiOnline ? 'rgba(46,139,87,0.15)' : 'rgba(194,136,52,0.15)',
            border: `1px solid ${apiOnline ? 'rgba(46,139,87,0.35)' : 'rgba(194,136,52,0.35)'}`,
            color: apiOnline ? '#5bc286' : '#e5b067',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}>
            <span style={{ fontSize: '0.6rem' }}>●</span>
            {apiOnline ? 'API en línea' : 'Modo demo'}
          </div>

          {(isAdmin || isGerente || isCliente) && (
            <Link to="/cotizador" className="btn btn-primary">
              <Sparkles size={16} />
              <span>Nueva Cotización</span>
            </Link>
          )}
          <Link to="/eventos" className="btn btn-secondary">
            <CalendarDays size={16} />
            <span>Ver Calendario</span>
          </Link>
        </div>
      </div>

      {/* Banner offline (solo si hay error de red y rol interno) */}
      {!apiOnline && (isAdmin || isGerente || isTrabajador) && (
        <OfflineBanner onRetry={fetchKpis} />
      )}

      {/* ==========================================================================
          VISTA 1: ADMINISTRADOR — KPIs reales + Métricas SaaS
         ========================================================================== */}
      {isAdmin && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* KPIs del backend real */}
          <div className="grid-cols-4">
            <KpiCard
              label="Eventos Activos"
              value={kpiData.total_eventos_activos}
              icon={CalendarDays}
              iconColor="var(--primary)"
              subtext={<><TrendingUp size={13} /> En planificación o en progreso</>}
              loading={kpiLoading}
            />
            <KpiCard
              label="Clientes Registrados"
              value={kpiData.total_clientes}
              icon={Users}
              iconColor="var(--accent)"
              subtext="Clientes activos de la empresa"
              loading={kpiLoading}
            />
            <KpiCard
              label="Ingresos Totales"
              value={kpiLoading ? null : formatCurrency(kpiData.ingresos_totales)}
              icon={DollarSign}
              iconColor="var(--success)"
              subtextColor="var(--success)"
              subtext="Pagos con estado Completado"
              loading={kpiLoading}
            />
            <KpiCard
              label="Tareas Pendientes"
              value={kpiData.tareas_pendientes}
              icon={ListTodo}
              iconColor={kpiData.tareas_pendientes > 0 ? 'var(--warning)' : 'var(--success)'}
              subtext="Actividades en estado Pendiente"
              loading={kpiLoading}
            />
          </div>

          {/* Estado suscripción SaaS */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem' }}>
                  Empresa: {MOCK_METRICAS_SAAS.empresa}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Plan activo: <strong>{MOCK_METRICAS_SAAS.plan}</strong> — Soporte prioritario y cotizaciones dinámicas ilimitadas
                </p>
              </div>
              <Badge variant="primary">SaaS Premium Activo</Badge>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                <span>Usuarios internos ({MOCK_METRICAS_SAAS.usuarios_internos} / {MOCK_METRICAS_SAAS.limite_usuarios})</span>
                <span style={{ fontWeight: 700 }}>40%</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '40%', height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--accent))' }} />
              </div>
            </div>
          </Card>

          {/* Tabla de eventos recientes */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.1rem' }}>Eventos Recientes</h3>
              <Link to="/eventos" style={{ fontSize: '0.85rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                Ver todos <ArrowUpRight size={16} />
              </Link>
            </div>
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Evento</th>
                    <th>Cliente</th>
                    <th>Fecha</th>
                    <th>Total</th>
                    <th>Saldo</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_EVENTOS.map((evt) => (
                    <tr key={evt.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{evt.titulo}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{evt.id} · {evt.paquete}</div>
                      </td>
                      <td>{evt.cliente_nombre}</td>
                      <td>{evt.fecha}</td>
                      <td style={{ fontWeight: 600 }}>${evt.monto_total.toFixed(2)}</td>
                      <td style={{ color: evt.saldo_pendiente > 0 ? 'var(--accent)' : 'var(--success)' }}>
                        ${evt.saldo_pendiente.toFixed(2)}
                      </td>
                      <td>
                        <Badge variant={evt.estado === 'Confirmado' ? 'success' : evt.estado === 'En preparación' ? 'primary' : 'warning'}>
                          {evt.estado}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ==========================================================================
          VISTA 2: GERENTE — KPIs reales + Aprobaciones pendientes
         ========================================================================== */}
      {isGerente && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="grid-cols-4">
            <KpiCard
              label="Eventos Activos"
              value={kpiData.total_eventos_activos}
              icon={Activity}
              iconColor="var(--primary)"
              subtext="En planificación o en progreso"
              loading={kpiLoading}
            />
            <KpiCard
              label="Ingresos Completados"
              value={kpiLoading ? null : formatCurrency(kpiData.ingresos_totales)}
              icon={DollarSign}
              iconColor="var(--success)"
              subtextColor="var(--success)"
              subtext="Pagos en estado Completado"
              loading={kpiLoading}
            />
            <KpiCard
              label="Clientes Activos"
              value={kpiData.total_clientes}
              icon={Users}
              iconColor="var(--accent)"
              subtext="En la empresa"
              loading={kpiLoading}
            />
            <KpiCard
              label="Tareas Pendientes"
              value={kpiData.tareas_pendientes}
              icon={Clock}
              iconColor="var(--warning)"
              subtext="Actividades sin completar"
              loading={kpiLoading}
            />
          </div>

          {/* Solicitudes de modificación */}
          <Card>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={20} color="var(--accent)" />
              Solicitudes de Modificación — Pendientes de Aprobación
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {MOCK_SOLICITUDES_CAMBIO.map((sol) => (
                <div
                  key={sol.id}
                  style={{
                    padding: '1rem',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <strong>{sol.evento_titulo}</strong>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>({sol.cliente})</span>
                      <Badge variant={sol.estado.includes('Pendiente') ? 'warning' : 'success'}>{sol.estado}</Badge>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>{sol.descripcion}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ fontWeight: 700, color: 'var(--accent)' }}>{sol.impacto_costo}</div>
                    {sol.estado.includes('Pendiente') && (
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>Aprobar</button>
                        <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>Rechazar</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Tabla eventos */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.1rem' }}>Eventos Recientes</h3>
              <Link to="/eventos" style={{ fontSize: '0.85rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                Ver todos <ArrowUpRight size={16} />
              </Link>
            </div>
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Evento</th><th>Cliente</th><th>Fecha</th><th>Total</th><th>Saldo</th><th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_EVENTOS.map((evt) => (
                    <tr key={evt.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{evt.titulo}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{evt.paquete}</div>
                      </td>
                      <td>{evt.cliente_nombre}</td>
                      <td>{evt.fecha}</td>
                      <td style={{ fontWeight: 600 }}>${evt.monto_total.toFixed(2)}</td>
                      <td style={{ color: evt.saldo_pendiente > 0 ? 'var(--accent)' : 'var(--success)' }}>
                        ${evt.saldo_pendiente.toFixed(2)}
                      </td>
                      <td>
                        <Badge variant={evt.estado === 'Confirmado' ? 'success' : evt.estado === 'En preparación' ? 'primary' : 'warning'}>
                          {evt.estado}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ==========================================================================
          VISTA 3: TRABAJADOR — KPIs reales + Eventos asignados + Checklist
         ========================================================================== */}
      {isTrabajador && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Resumen operativo */}
          <div className="grid-cols-4">
            <KpiCard
              label="Eventos Asignados"
              value={kpiData.total_eventos_activos}
              icon={CalendarDays}
              iconColor="var(--primary)"
              subtext="En progreso o planificación"
              loading={kpiLoading}
            />
            <KpiCard
              label="Mis Tareas Pendientes"
              value={kpiData.tareas_pendientes}
              icon={ListTodo}
              iconColor={kpiData.tareas_pendientes > 0 ? 'var(--warning)' : 'var(--success)'}
              subtext="Actividades sin completar"
              loading={kpiLoading}
            />
          </div>

          <div className="grid-cols-2">
            <Card>
              <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CalendarDays size={18} color="var(--primary)" /> Eventos Asignados a mi Cargo
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {MOCK_EVENTOS.slice(0, 2).map((evt) => (
                  <div
                    key={evt.id}
                    style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <strong>{evt.titulo}</strong>
                      <Badge variant="primary">{evt.fecha}</Badge>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {evt.paquete} · {evt.invitados} invitados
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={18} color="var(--success)" /> Checklist Operativo del Día
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem' }}>
                {[
                  { done: true,  text: 'Verificación de climatización e iluminación — Salón Imperial' },
                  { done: true,  text: 'Confirmación con chef: menú gourmet (120 raciones)' },
                  { done: false, text: 'Prueba de sonido y cabina de DJ profesional (16:00 hs)' },
                  { done: false, text: 'Montaje de backing floral y letras gigantes iluminadas' },
                ].map((item, i) => (
                  <label key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" defaultChecked={item.done} style={{ marginTop: '2px', accentColor: 'var(--primary)' }} />
                    <span style={{ color: item.done ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: item.done ? 'line-through' : 'none' }}>
                      {item.text}
                    </span>
                  </label>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ==========================================================================
          VISTA 4: CLIENTE — Portal de seguimiento de su evento
         ========================================================================== */}
      {isCliente && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Card style={{ border: '1px solid rgba(69,102,119,0.3)', background: 'linear-gradient(135deg, rgba(69,102,119,0.12), rgba(17,24,39,0.8))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <Badge variant="primary" style={{ marginBottom: '0.5rem' }}>Evento en Progreso</Badge>
                <h2 style={{ fontSize: '1.5rem' }}>Mis XV Años — Valentina</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Fecha: <strong>14 de Noviembre, 2026</strong> · Salón Imperial Platinum
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Progreso de Organización</span>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>40%</div>
              </div>
            </div>

            <div style={{ width: '100%', height: '10px', background: 'var(--bg-input)', borderRadius: '6px', overflow: 'hidden', marginBottom: '1.5rem' }}>
              <div style={{ width: '40%', height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--accent))' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              {[
                { label: 'COSTO TOTAL', value: '$3,900.00', color: 'var(--text-primary)', bg: 'rgba(255,255,255,0.03)' },
                { label: 'ANTICIPO PAGADO', value: '$1,950.00 (50%)', color: '#34d399', bg: 'rgba(16,185,129,0.08)' },
                { label: 'SALDO PENDIENTE', value: '$1,950.00', color: '#fbbf24', bg: 'rgba(245,158,11,0.08)' },
              ].map((item) => (
                <div key={item.label} style={{ padding: '0.85rem', background: item.bg, borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.72rem', color: item.color, fontWeight: 700 }}>{item.label}</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: item.color, marginTop: '0.2rem' }}>{item.value}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};
