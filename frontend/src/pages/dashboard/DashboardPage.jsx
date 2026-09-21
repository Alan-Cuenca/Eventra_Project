import React from 'react';
import { useAuth } from '../../context/AuthContext';
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
  FileText,
  MessageSquare,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage = () => {
  const { user, roleId, isAdmin, isGerente, isTrabajador, isCliente } = useAuth();

  return (
    <div>
      {/* Header del Dashboard */}
      <div className="page-header">
        <div>
          <h1>Bienvenido, {user?.nombre_completo || 'Usuario'}</h1>
          <p>
            {isAdmin && 'Supervisión global de plataforma SaaS y límites de suscripción.'}
            {isGerente && 'Control de operaciones de eventos, finanzas y aprobaciones comerciales.'}
            {isTrabajador && 'Gestión y checklist de actividades operativas en eventos asignados.'}
            {isCliente && 'Seguimiento en tiempo real del progreso y presupuesto de tu recepción.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
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

      {/* =========================================================================
          VISTA 1: ADMINISTRADOR (SaaS, Tenants, Límites de Plan)
         ========================================================================= */}
      {isAdmin && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Métricas Globales SaaS */}
          <div className="grid-cols-4">
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>CLIENTES ACTIVOS</span>
                <Users size={18} color="var(--primary)" />
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>
                {MOCK_METRICAS_SAAS.clientes_activos} / {MOCK_METRICAS_SAAS.limite_clientes}
              </div>
              <div style={{ fontSize: '0.775rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                <TrendingUp size={14} /> Capacidad al 17% del Plan Premium
              </div>
            </Card>

            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>SERVICIOS ACTIVOS</span>
                <Briefcase size={18} color="var(--accent)" />
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>
                {MOCK_METRICAS_SAAS.servicios_activos} / {MOCK_METRICAS_SAAS.limite_servicios}
              </div>
              <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                32 servicios restantes por configurar
              </div>
            </Card>

            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>CHATBOT IA (MENSAJES)</span>
                <MessageSquare size={18} color="#a855f7" />
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>
                {MOCK_METRICAS_SAAS.mensajes_chatbot_mes} / {MOCK_METRICAS_SAAS.limite_chatbot}
              </div>
              <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Consumo mensual del asistente virtual
              </div>
            </Card>

            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>INGRESOS TOTALES MES</span>
                <DollarSign size={18} color="var(--success)" />
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--success)' }}>
                ${MOCK_METRICAS_SAAS.ingresos_mes.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                {MOCK_METRICAS_SAAS.eventos_mes} eventos facturados
              </div>
            </Card>
          </div>

          {/* Estado de la suscripción SaaS */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem' }}>Empresa Activa: {MOCK_METRICAS_SAAS.empresa}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Suscripción actual: <strong>{MOCK_METRICAS_SAAS.plan}</strong> (Soporte prioritario y cotizaciones dinámicas ilimitadas)
                </p>
              </div>
              <Badge variant="primary">SaaS Premium Activo</Badge>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                <span>Uso de Usuarios Internos ({MOCK_METRICAS_SAAS.usuarios_internos} de {MOCK_METRICAS_SAAS.limite_usuarios})</span>
                <span>40%</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '40%', height: '100%', background: 'var(--primary)' }} />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* =========================================================================
          VISTA 2: GERENTE (Operaciones, Aprobaciones y Finanzas)
         ========================================================================= */}
      {isGerente && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Tarjetas rápidas de Gerencia */}
          <div className="grid-cols-4">
            <Card>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>EVENTOS EN PROCESO</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.25rem' }}>3 Activos</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--primary-light)', marginTop: '0.2rem' }}>2 con anticipo liquidado</div>
            </Card>
            <Card>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ANTICIPOS RECAUDADOS</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--success)', marginTop: '0.25rem' }}>$4,450.00</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>De $10,950 en total pactado</div>
            </Card>
            <Card>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>SALDOS PENDIENTES</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--accent)', marginTop: '0.25rem' }}>$6,500.00</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Por cobrar pre-evento</div>
            </Card>
            <Card>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>SOLICITUDES DE CAMBIO</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f87171', marginTop: '0.25rem' }}>1 Pendiente</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Requiere tu validación</div>
            </Card>
          </div>

          {/* Solicitudes de modificación de clientes que requieren aprobación */}
          <Card>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={20} color="var(--accent)" />
              Solicitudes de Modificación Sujetas a Aprobación (Project Charter 2.4)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {MOCK_SOLICITUDES_CAMBIO.map((sol) => (
                <div
                  key={sol.id}
                  style={{
                    padding: '1rem',
                    background: 'rgba(255, 255, 255, 0.02)',
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
                      <strong style={{ color: 'var(--text-primary)' }}>{sol.evento_titulo}</strong>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>({sol.cliente})</span>
                      <Badge variant={sol.estado.includes('Pendiente') ? 'warning' : 'success'}>
                        {sol.estado}
                      </Badge>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                      {sol.descripcion}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ fontWeight: 700, color: 'var(--accent)' }}>{sol.impacto_costo}</div>
                    {sol.estado.includes('Pendiente') && (
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>
                          Aprobar
                        </button>
                        <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>
                          Rechazar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* =========================================================================
          VISTA 3: TRABAJADOR (Operaciones, Tareas del Día, Montaje)
         ========================================================================= */}
      {isTrabajador && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="grid-cols-2">
            <Card>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CalendarDays size={20} color="var(--primary)" />
                Eventos Asignados a mi Cargo
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {MOCK_EVENTOS.slice(0, 2).map((evt) => (
                  <div
                    key={evt.id}
                    style={{
                      padding: '1rem',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <strong>{evt.titulo}</strong>
                      <Badge variant="primary">{evt.fecha}</Badge>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Paquete: {evt.paquete} | {evt.invitados} invitados
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={20} color="var(--success)" />
                Checklist Operativo del Evento
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" defaultChecked />
                  <span>Verificación de climatización e iluminación de Salón Imperial</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" defaultChecked />
                  <span>Confirmación con chef para menú gourmet (120 raciones)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" />
                  <span>Prueba de sonido y cabina de DJ profesional (16:00 hs)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" />
                  <span>Montaje de backing floral y letras gigantes iluminadas</span>
                </label>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* =========================================================================
          VISTA 4: CLIENTE (Portal del Cliente: Mi Evento, Pagos y Cambios)
         ========================================================================= */}
      {isCliente && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Card style={{ border: '1px solid rgba(99, 102, 241, 0.3)', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(17, 24, 39, 0.8))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <Badge variant="primary" style={{ marginBottom: '0.5rem' }}>Evento en Progreso</Badge>
                <h2 style={{ fontSize: '1.6rem' }}>Mis XV Años - Valentina</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Fecha: <strong>14 de Noviembre, 2026</strong> | Salón Imperial Platinum
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Progreso de Organización</span>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary-light)' }}>40%</div>
              </div>
            </div>

            <div style={{ width: '100%', height: '10px', background: 'var(--bg-input)', borderRadius: '6px', overflow: 'hidden', marginBottom: '1.5rem' }}>
              <div style={{ width: '40%', height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--accent))' }} />
            </div>

            {/* Resumen Financiero del Evento */}
            <div className="grid-cols-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div style={{ padding: '0.85rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>COSTO TOTAL CONTRATADO</span>
                <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>$3,900.00</div>
              </div>
              <div style={{ padding: '0.85rem', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: '#34d399' }}>ANTICIPO PAGADO</span>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#34d399' }}>$1,950.00 (50%)</div>
              </div>
              <div style={{ padding: '0.85rem', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: '#fbbf24' }}>SALDO PENDIENTE</span>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fbbf24' }}>$1,950.00</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tabla de Eventos Recientes (Común para Administrador y Gerente) */}
      {(isAdmin || isGerente) && (
        <Card style={{ marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem' }}>Eventos Registrados Recientemente</h3>
            <Link to="/eventos" style={{ fontSize: '0.85rem', color: 'var(--primary-light)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              Ver todos <ArrowUpRight size={16} />
            </Link>
          </div>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Código / Título</th>
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
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{evt.id} • {evt.paquete}</div>
                    </td>
                    <td>{evt.cliente_nombre}</td>
                    <td>{evt.fecha}</td>
                    <td style={{ fontWeight: 600 }}>${evt.monto_total.toFixed(2)}</td>
                    <td style={{ color: evt.saldo_pendiente > 0 ? 'var(--accent)' : 'var(--success)' }}>
                      ${evt.saldo_pendiente.toFixed(2)}
                    </td>
                    <td>
                      <Badge
                        variant={
                          evt.estado === 'Confirmado'
                            ? 'success'
                            : evt.estado === 'En preparación'
                            ? 'primary'
                            : 'warning'
                        }
                      >
                        {evt.estado}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
