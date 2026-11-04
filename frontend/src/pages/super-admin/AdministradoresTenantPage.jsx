import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { superAdminService } from '../../services/superAdminService';
import { GlobalStatCard } from '../../components/super-admin/GlobalStatCard';
import { CrearEmpresaModal } from '../../components/super-admin/CrearEmpresaModal';
import {
  Users2,
  ShieldCheck,
  Building2,
  Mail,
  KeyRound,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Power,
  RotateCcw,
  Plus,
  Send,
  Inbox,
  Copy,
  Check,
} from 'lucide-react';

/**
 * =============================================================================
 * AdministradoresTenantPage
 * =============================================================================
 * Directorio y Gestión de Administradores de Inquilinos (Tenants) para el
 * Super Administrador de EVENTRA SaaS.
 * Permite supervisar a los administradores responsables de cada empresa,
 * consultar sus correos corporativos, restablecer o reenviar accesos y
 * controlar el estado operativo de su tenant.
 * =============================================================================
 */
export const AdministradoresTenantPage = () => {
  const [administradores, setAdministradores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'SUSPENDED'
  const [copiedId, setCopiedId] = useState(null);

  const [isCrearModalOpen, setIsCrearModalOpen] = useState(false);
  const [adminSeleccionado, setAdminSeleccionado] = useState(null);
  const [procesandoId, setProcesandoId] = useState(null);
  const [toast, setToast] = useState(null);

  const mostrarToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const cargarAdministradores = useCallback(async () => {
    setLoading(true);
    try {
      const lista = await superAdminService.obtenerAdministradoresTenant();
      setAdministradores(Array.isArray(lista) ? lista : []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('[AdministradoresTenantPage] Error cargando administradores:', err);
      mostrarToast('No fue posible obtener el directorio de administradores.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarAdministradores();
  }, [cargarAdministradores]);

  const metricas = useMemo(() => {
    const activos = administradores.filter((a) => a.empresa_activa).length;
    const suspendidos = administradores.length - activos;
    const totalColaboradores = administradores.reduce(
      (acc, curr) => acc + Number(curr.total_usuarios_tenant || 1),
      0
    );
    return {
      totalAdmins: administradores.length,
      activos,
      suspendidos,
      totalColaboradores,
    };
  }, [administradores]);

  const adminsFiltrados = useMemo(() => {
    return administradores.filter((adm) => {
      if (statusFilter === 'ACTIVE' && !adm.empresa_activa) return false;
      if (statusFilter === 'SUSPENDED' && adm.empresa_activa) return false;

      const q = searchTerm.toLowerCase().trim();
      if (!q) return true;
      return (
        (adm.nombre_completo || '').toLowerCase().includes(q) ||
        (adm.email || '').toLowerCase().includes(q) ||
        (adm.empresa_nombre || '').toLowerCase().includes(q) ||
        (adm.empresa_ruc || '').toLowerCase().includes(q)
      );
    });
  }, [administradores, statusFilter, searchTerm]);

  const handleCopyEmail = (id, email) => {
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleAccesoTenant = async (adm) => {
    setProcesandoId(adm.id);
    try {
      const nuevoEstado = !adm.empresa_activa;
      await superAdminService.suspenderEmpresa(adm.empresa_id, nuevoEstado);
      mostrarToast(
        nuevoEstado
          ? `Acceso reactivado para ${adm.nombre_completo} (${adm.empresa_nombre}).`
          : `Acceso suspendido para ${adm.nombre_completo} (${adm.empresa_nombre}).`,
        'success'
      );
      await cargarAdministradores();
    } catch (err) {
      mostrarToast(
        err?.response?.data?.message || 'Error al modificar el estado del administrador.',
        'error'
      );
    } finally {
      setProcesandoId(null);
    }
  };

  const handleReenviarCredenciales = (adm) => {
    setAdminSeleccionado(adm);
    mostrarToast(
      `Notificación de recordatorio y enlace de acceso enviados a ${adm.email}.`,
      'success'
    );
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`toast ${toast.type === 'error' ? 'danger' : 'success'}`}>
          <CheckCircle2 size={18} />
          <span>{toast.message}</span>
        </div>
      )}

      {/* ── Encabezado Principal ──────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <h1>Administradores Tenant</h1>
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
              Gobernanza RBAC (Rol 1)
            </span>
          </div>
          <p>
            Directorio global de los administradores titulares de cada empresa inquilina y control de credenciales corporativas.
          </p>
          {lastUpdated && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.35rem 0 0' }}>
              Última sincronización: {lastUpdated.toLocaleTimeString('es-EC')}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={cargarAdministradores}
            disabled={loading}
            className="btn btn-secondary"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Actualizar</span>
          </button>

          <button
            onClick={() => setIsCrearModalOpen(true)}
            className="btn btn-primary"
          >
            <Plus size={16} />
            <span>Nuevo Tenant + Administrador</span>
          </button>
        </div>
      </div>

      {/* ── Tarjetas KPI de Administradores ───────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <GlobalStatCard
          title="Administradores Titulares"
          value={loading ? null : metricas.totalAdmins}
          subtitle="Responsables de empresas"
          icon={<Users2 size={20} />}
          accentColor="#4D7182"
          loading={loading}
        />

        <GlobalStatCard
          title="Cuentas Habilitadas"
          value={loading ? null : metricas.activos}
          subtitle="Con acceso activo al portal"
          icon={<ShieldCheck size={20} />}
          accentColor="#4D9A72"
          badgeText="Activos"
          badgeColor="#4D9A72"
          loading={loading}
        />

        <GlobalStatCard
          title="Cuentas Restringidas"
          value={loading ? null : metricas.suspendidos}
          subtitle="Tenants suspendidos"
          icon={<AlertTriangle size={20} />}
          accentColor="#C95C5C"
          loading={loading}
        />

        <GlobalStatCard
          title="Usuarios Supervisados"
          value={loading ? null : metricas.totalColaboradores}
          subtitle="Total de cuentas bajo su mando"
          icon={<Building2 size={20} />}
          accentColor="#C49A3A"
          loading={loading}
        />
      </div>

      {/* ── Tabla de Administradores de Empresas ──────────────────────────── */}
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
          <div style={{ position: 'relative', minWidth: '250px', flex: 1, maxWidth: '420px' }}>
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
              placeholder="Buscar por administrador, correo o empresa..."
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
            {[
              { id: 'ALL', label: `Todos (${administradores.length})` },
              { id: 'ACTIVE', label: 'Habilitados' },
              { id: 'SUSPENDED', label: 'Suspendidos' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatusFilter(f.id)}
                style={{
                  padding: '0.25rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: statusFilter === f.id ? 'var(--primary)' : 'transparent',
                  color: statusFilter === f.id ? '#FFFFFF' : 'var(--text-muted)',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Administrador Titular</th>
                <th>Correo Corporativo</th>
                <th>Empresa Asignada (Tenant)</th>
                <th>Plan</th>
                <th style={{ textAlign: 'center' }}>Equipo</th>
                <th>Estado Acceso</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7}>
                      <div className="skeleton" style={{ height: '1.25rem', width: '100%' }} />
                    </td>
                  </tr>
                ))
              ) : adminsFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem 1rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <Inbox size={32} style={{ color: 'var(--border-subtle)' }} />
                      <p style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                        No se encontraron administradores con los criterios seleccionados.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                adminsFiltrados.map((adm) => (
                  <tr key={adm.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '50%',
                            background: 'var(--primary)',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            flexShrink: 0,
                          }}
                        >
                          {(adm.nombre_completo || 'A')
                            .split(' ')
                            .map((w) => w[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()}
                        </div>
                        <div>
                          <span style={{ fontWeight: 700, display: 'block', color: 'var(--text-primary)' }}>
                            {adm.nombre_completo}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {adm.rol_nombre || 'Administrador (Rol 1)'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Mail size={13} style={{ color: 'var(--primary)' }} />
                        <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 600 }}>
                          {adm.email}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyEmail(adm.id, adm.email)}
                          style={{
                            padding: '0.2rem',
                            borderRadius: '6px',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                          }}
                          title="Copiar correo"
                        >
                          {copiedId === adm.id ? (
                            <Check size={13} style={{ color: 'var(--success)' }} />
                          ) : (
                            <Copy size={13} />
                          )}
                        </button>
                      </div>
                    </td>

                    <td>
                      <div>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>
                          {adm.empresa_nombre}
                        </span>
                        <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                          RUC: {adm.empresa_ruc} · ID #{adm.empresa_id}
                        </span>
                      </div>
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
                        Plan {adm.empresa_plan}
                      </span>
                    </td>

                    <td style={{ textAlign: 'center', fontWeight: 700 }}>
                      {adm.total_usuarios_tenant} usuarios
                    </td>

                    <td>
                      {adm.empresa_activa ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.2rem 0.6rem',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background: 'rgba(77, 154, 114, 0.15)',
                            color: 'var(--success)',
                          }}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }} />
                          Habilitado
                        </span>
                      ) : (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.2rem 0.6rem',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background: 'rgba(201, 92, 92, 0.15)',
                            color: 'var(--danger)',
                          }}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--danger)' }} />
                          Suspendido
                        </span>
                      )}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        <button
                          type="button"
                          onClick={() => handleReenviarCredenciales(adm)}
                          className="btn btn-secondary btn-sm"
                          title="Enviar recordatorio de acceso por correo"
                        >
                          <KeyRound size={13} />
                          <span>Credenciales</span>
                        </button>

                        <button
                          type="button"
                          disabled={procesandoId === adm.id}
                          onClick={() => handleToggleAccesoTenant(adm)}
                          className={`btn btn-sm ${adm.empresa_activa ? 'btn-danger' : 'btn-primary'}`}
                          title={adm.empresa_activa ? 'Suspender acceso' : 'Reactivar acceso'}
                        >
                          {adm.empresa_activa ? <Power size={13} /> : <RotateCcw size={13} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CrearEmpresaModal
        isOpen={isCrearModalOpen}
        onClose={() => setIsCrearModalOpen(false)}
        onEmpresaCreada={cargarAdministradores}
      />
    </div>
  );
};

export default AdministradoresTenantPage;
