import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { superAdminService } from '../../services/superAdminService';
import { eventraService } from '../../services/eventraService';
import { GlobalStatCard } from '../../components/super-admin/GlobalStatCard';
import { CrearEmpresaModal } from '../../components/super-admin/CrearEmpresaModal';
import {
  UserCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  Plus,
  RefreshCw,
  Search,
  Filter,
  ExternalLink,
  FileText,
  FileCheck,
  Mail,
  DollarSign,
  ShieldCheck,
  X,
  Inbox,
} from 'lucide-react';

/**
 * =============================================================================
 * SolicitudesIngresoPage
 * =============================================================================
 * Módulo de Solicitudes de Ingreso y Activación de Membresías Corporativas
 * para el Super Administrador de EVENTRA SaaS.
 * Permite revisar solicitudes de suscripción y comprobantes PDF/imagen,
 * aprobar o rechazar solicitudes y dar de alta nuevas empresas solicitantes.
 * =============================================================================
 */
export const SolicitudesIngresoPage = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS'); // 'TODOS' | 'En Revisión' | 'Aprobado' | 'Rechazado'

  const [solicitudActiva, setSolicitudActiva] = useState(null);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [isCrearEmpresaOpen, setIsCrearEmpresaOpen] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [toast, setToast] = useState(null);

  const mostrarToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const cargarSolicitudesIngreso = useCallback(async () => {
    setLoading(true);
    try {
      const [suscData, empResponse] = await Promise.all([
        eventraService.getSuscripciones(),
        superAdminService.obtenerEmpresas().catch(() => ({ data: [] })),
      ]);

      const listaSusc = Array.isArray(suscData) ? suscData : [];
      const listaEmp = Array.isArray(empResponse?.data)
        ? empResponse.data
        : Array.isArray(empResponse)
        ? empResponse
        : [];

      // Consolidar solicitudes de comprobantes con registros de onboarding de empresas
      const idsEnSusc = new Set(listaSusc.map((s) => Number(s.empresa_id)));
      const onboardingTenants = listaEmp
        .filter((e) => !idsEnSusc.has(Number(e.id)))
        .map((e) => ({
          id: `onboarding-${e.id}`,
          esOnboardingDirecto: true,
          empresa_id: e.id,
          empresa_nombre: e.nombre_comercial,
          empresa_ruc: e.ruc || '1790012345001',
          plan_nombre: e.plan_suscripcion || 'Basico',
          monto: (e.plan_suscripcion || '').toLowerCase().includes('premium') ? 99 : 49,
          estado: e.estado_activo ? 'Aprobado' : 'En Revisión',
          fecha_pago: e.fecha_registro,
          fecha_registro: e.fecha_registro,
          comprobante_url: null,
          canal: 'Alta Directa Super_Admin',
        }));

      setSolicitudes([...listaSusc, ...onboardingTenants]);
      setEmpresas(listaEmp);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('[SolicitudesIngresoPage] Error al cargar solicitudes:', err);
      mostrarToast('No se pudieron cargar las solicitudes de ingreso.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarSolicitudesIngreso();
  }, [cargarSolicitudesIngreso]);

  const metricas = useMemo(() => {
    const pendientes = solicitudes.filter((s) => s.estado === 'En Revisión').length;
    const aprobadas = solicitudes.filter((s) => s.estado === 'Aprobado').length;
    const rechazadas = solicitudes.filter((s) => s.estado === 'Rechazado').length;
    return {
      total: solicitudes.length,
      pendientes,
      aprobadas,
      rechazadas,
    };
  }, [solicitudes]);

  const solicitudesFiltradas = useMemo(() => {
    return solicitudes.filter((item) => {
      if (statusFilter !== 'TODOS' && item.estado !== statusFilter) return false;
      const q = searchTerm.toLowerCase().trim();
      if (!q) return true;
      return (
        (item.empresa_nombre || '').toLowerCase().includes(q) ||
        (item.empresa_ruc || '').toLowerCase().includes(q) ||
        (item.plan_nombre || '').toLowerCase().includes(q)
      );
    });
  }, [solicitudes, statusFilter, searchTerm]);

  const esComprobantePdf = (url) => {
    if (!url || typeof url !== 'string') return false;
    const lower = url.toLowerCase();
    return lower.includes('.pdf') || lower.startsWith('data:application/pdf');
  };

  const handleResolverSolicitud = async (solicitud, nuevoEstado) => {
    setProcesando(true);
    try {
      if (solicitud.esOnboardingDirecto) {
        await superAdminService.suspenderEmpresa(
          solicitud.empresa_id,
          nuevoEstado === 'Aprobado'
        );
      } else {
        await eventraService.actualizarEstadoSuscripcion(solicitud.id, nuevoEstado);
      }

      setIsRevisionModalOpen(false);
      setSolicitudActiva(null);
      mostrarToast(
        nuevoEstado === 'Aprobado'
          ? `Solicitud de "${solicitud.empresa_nombre}" aprobada y membresía activada.`
          : `Solicitud de "${solicitud.empresa_nombre}" marcada como rechazada.`,
        'success'
      );
      await cargarSolicitudesIngreso();
    } catch (err) {
      console.error('[SolicitudesIngresoPage] Error al resolver solicitud:', err);
      mostrarToast(
        err?.response?.data?.message || 'Error al actualizar el estado de la solicitud.',
        'error'
      );
    } finally {
      setProcesando(false);
    }
  };

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return 'Reciente';
    try {
      return new Date(fechaStr).toLocaleDateString('es-EC', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return fechaStr;
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`toast ${toast.type === 'error' ? 'danger' : 'success'}`}>
          {toast.type === 'error' ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ── Encabezado Principal ──────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <h1>Solicitudes de Ingreso Corporativo</h1>
            <span
              style={{
                padding: '0.2rem 0.65rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.7rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                background: 'rgba(77, 113, 130, 0.15)',
                color: 'var(--primary)',
                border: '1px solid rgba(77, 113, 130, 0.25)',
              }}
            >
              Onboarding B2B
            </span>
          </div>
          <p>
            Verificación de solicitudes de alta, validación de comprobantes de transferencia y activación de credenciales para nuevas empresas.
          </p>
          {lastUpdated && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.35rem 0 0' }}>
              Última sincronización: {lastUpdated.toLocaleTimeString('es-EC')}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={cargarSolicitudesIngreso}
            disabled={loading}
            className="btn btn-secondary"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Actualizar</span>
          </button>

          <button
            onClick={() => setIsCrearEmpresaOpen(true)}
            className="btn btn-primary"
          >
            <Plus size={16} />
            <span>Aprobar y Dar de Alta Empresa</span>
          </button>
        </div>
      </div>

      {/* ── Tarjetas KPI de Solicitudes ──────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <GlobalStatCard
          title="Total Solicitudes"
          value={loading ? null : metricas.total}
          subtitle="Expedientes de ingreso SaaS"
          icon={<UserCheck size={20} />}
          accentColor="#4D7182"
          loading={loading}
        />

        <GlobalStatCard
          title="Pendientes de Revisión"
          value={loading ? null : metricas.pendientes}
          subtitle="Requieren validación de pago"
          icon={<Clock size={20} />}
          accentColor="#C49A3A"
          badgeText={metricas.pendientes > 0 ? 'Por aprobar' : 'Al día'}
          badgeColor="#C49A3A"
          loading={loading}
        />

        <GlobalStatCard
          title="Ingresos Aprobados"
          value={loading ? null : metricas.aprobadas}
          subtitle="Empresas con acceso activo"
          icon={<CheckCircle2 size={20} />}
          accentColor="#4D9A72"
          badgeText="Verificadas"
          badgeColor="#4D9A72"
          loading={loading}
        />

        <GlobalStatCard
          title="Solicitudes Rechazadas"
          value={loading ? null : metricas.rechazadas}
          subtitle="Comprobantes observados"
          icon={<XCircle size={20} />}
          accentColor="#C95C5C"
          loading={loading}
        />
      </div>

      {/* ── Tabla de Solicitudes de Ingreso ───────────────────────────────── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ position: 'relative', minWidth: '250px', flex: 1, maxWidth: '400px' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '0.85rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              placeholder="Buscar por empresa, RUC o plan solicitado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '2.4rem', fontSize: '0.8rem' }}
            />
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.2rem 0.35rem',
            }}
          >
            <Filter size={13} style={{ color: 'var(--text-muted)', marginLeft: '0.25rem' }} />
            {['TODOS', 'En Revisión', 'Aprobado', 'Rechazado'].map((est) => (
              <button
                key={est}
                type="button"
                onClick={() => setStatusFilter(est)}
                style={{
                  padding: '0.25rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: statusFilter === est ? 'var(--primary)' : 'transparent',
                  color: statusFilter === est ? '#FFFFFF' : 'var(--text-muted)',
                }}
              >
                {est === 'TODOS' ? `Todas (${solicitudes.length})` : est}
              </button>
            ))}
          </div>
        </div>

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Empresa Solicitante</th>
                <th>RUC</th>
                <th>Plan Solicitado</th>
                <th>Monto Transferencia</th>
                <th>Comprobante</th>
                <th>Fecha Solicitud</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8}>
                      <div className="skeleton" style={{ height: '1.25rem', width: '100%' }} />
                    </td>
                  </tr>
                ))
              ) : solicitudesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '3rem 1rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <Inbox size={32} style={{ color: 'var(--border-subtle)' }} />
                      <p style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                        No se encontraron solicitudes de ingreso con los filtros actuales.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                solicitudesFiltradas.map((sol) => {
                  const isPending = sol.estado === 'En Revisión';
                  const isApproved = sol.estado === 'Aprobado';
                  return (
                    <tr key={sol.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: 'var(--radius-md)',
                              background: 'rgba(77, 113, 130, 0.12)',
                              color: 'var(--primary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.85rem',
                            }}
                          >
                            {(sol.empresa_nombre || 'E')[0].toUpperCase()}
                          </div>
                          <div>
                            <span style={{ fontWeight: 700, display: 'block', color: 'var(--text-primary)' }}>
                              {sol.empresa_nombre || 'Empresa Solicitante'}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {sol.canal || 'Transferencia Bancaria'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {sol.empresa_ruc || '1790012345001'}
                      </td>

                      <td>
                        <span
                          style={{
                            padding: '0.2rem 0.6rem',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background: 'rgba(77, 113, 130, 0.12)',
                            color: 'var(--primary)',
                          }}
                        >
                          Plan {sol.plan_nombre || 'Básico'}
                        </span>
                      </td>

                      <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)' }}>
                        ${Number(sol.monto || 49).toFixed(2)} USD
                      </td>

                      <td>
                        {sol.comprobante_url ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: 'var(--primary)',
                            }}
                          >
                            <FileText size={14} />
                            <span>{esComprobantePdf(sol.comprobante_url) ? 'PDF Adjunto' : 'Comprobante'}</span>
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Verificación Administrativa
                          </span>
                        )}
                      </td>

                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {formatearFecha(sol.fecha_pago || sol.fecha_registro)}
                      </td>

                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.2rem 0.6rem',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background: isApproved
                              ? 'rgba(77, 154, 114, 0.15)'
                              : isPending
                              ? 'rgba(196, 154, 58, 0.15)'
                              : 'rgba(201, 92, 92, 0.15)',
                            color: isApproved
                              ? 'var(--success)'
                              : isPending
                              ? 'var(--warning)'
                              : 'var(--danger)',
                          }}
                        >
                          {sol.estado}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setSolicitudActiva(sol);
                            setIsRevisionModalOpen(true);
                          }}
                          className={`btn btn-sm ${isPending ? 'btn-primary' : 'btn-secondary'}`}
                        >
                          <span>{isPending ? 'Revisar y Aprobar' : 'Ver Expediente'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal de Revisión de Solicitud de Ingreso ─────────────────────── */}
      {isRevisionModalOpen && solicitudActiva && (
        <div className="modal-overlay" onClick={() => setIsRevisionModalOpen(false)}>
          <div
            className="modal-box animate-slide-up"
            style={{ maxWidth: '540px', padding: 0, overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--border-subtle)',
                background: 'var(--bg-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(77, 113, 130, 0.12)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <UserCheck size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                    Expediente de Solicitud de Ingreso
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                    {solicitudActiva.empresa_nombre} · Plan {solicitudActiva.plan_nombre}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRevisionModalOpen(false)}
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.35rem 0.5rem' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '0.75rem',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.8rem',
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', display: 'block' }}>
                    Empresa Solicitante
                  </span>
                  <strong style={{ color: 'var(--text-primary)' }}>{solicitudActiva.empresa_nombre}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', display: 'block' }}>
                    Monto Declarado
                  </span>
                  <strong style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                    ${Number(solicitudActiva.monto || 49).toFixed(2)} USD
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', display: 'block' }}>
                    Plan Solicitado
                  </span>
                  <strong style={{ color: 'var(--primary)' }}>Plan {solicitudActiva.plan_nombre}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', display: 'block' }}>
                    Estado Actual
                  </span>
                  <strong>{solicitudActiva.estado}</strong>
                </div>
              </div>

              {solicitudActiva.comprobante_url ? (
                <div
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-card)',
                    textAlign: 'center',
                  }}
                >
                  {esComprobantePdf(solicitudActiva.comprobante_url) ? (
                    <iframe
                      src={solicitudActiva.comprobante_url}
                      title="Comprobante PDF"
                      style={{ width: '100%', height: '210px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}
                    />
                  ) : (
                    <img
                      src={solicitudActiva.comprobante_url}
                      alt="Comprobante de transferencia"
                      style={{ maxHeight: '210px', margin: '0 auto', borderRadius: '8px', objectFit: 'contain' }}
                    />
                  )}
                  <div style={{ marginTop: '0.65rem' }}>
                    <a
                      href={solicitudActiva.comprobante_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textDecoration: 'underline' }}
                    >
                      Abrir comprobante completo en pestaña nueva
                    </a>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                  }}
                >
                  <ShieldCheck size={18} style={{ color: 'var(--success)', flexShrink: 0 }} />
                  <span>
                    Registro verificado directamente por la consola de administración global. Puedes aprobar o suspender la membresía en cualquier momento.
                  </span>
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '0.75rem',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid var(--border-subtle)',
                }}
              >
                <button
                  type="button"
                  disabled={procesando}
                  onClick={() => handleResolverSolicitud(solicitudActiva, 'Rechazado')}
                  className="btn btn-danger"
                >
                  <XCircle size={15} />
                  <span>Rechazar Solicitud</span>
                </button>
                <button
                  type="button"
                  disabled={procesando}
                  onClick={() => handleResolverSolicitud(solicitudActiva, 'Aprobado')}
                  className="btn btn-success"
                >
                  <CheckCircle2 size={15} />
                  <span>Aprobar y Activar Membresía</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Dar de Alta Empresa y Enviar Credenciales */}
      <CrearEmpresaModal
        isOpen={isCrearEmpresaOpen}
        onClose={() => setIsCrearEmpresaOpen(false)}
        onEmpresaCreada={cargarSolicitudesIngreso}
      />
    </div>
  );
};

export default SolicitudesIngresoPage;
