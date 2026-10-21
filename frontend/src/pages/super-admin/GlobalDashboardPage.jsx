import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { superAdminService } from '../../services/superAdminService';
import { GlobalStatCard } from '../../components/super-admin/GlobalStatCard';
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  Users,
  CalendarDays,
  DollarSign,
  RefreshCw,
  Search,
  ShieldAlert,
  WifiOff,
  Inbox,
  Filter,
} from 'lucide-react';

/**
 * =============================================================================
 * GlobalDashboardPage
 * =============================================================================
 * Pantalla de control principal para el Super Administrador de EVENTRA SaaS.
 * Muestra indicadores agregados a partir del endpoint real GET /api/empresas
 * y el directorio consolidado de inquilinos (Tenants).
 * =============================================================================
 */
export const GlobalDashboardPage = () => {
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorInfo, setErrorInfo] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'SUSPENDED'

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setErrorInfo(null);
    try {
      const response = await superAdminService.obtenerEmpresas();
      // El backend retorna { success: true, total: N, data: [...] }
      const lista = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
        ? response
        : [];

      setEmpresas(lista);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('[GlobalDashboardPage] Error al cargar empresas:', err);

      let tipoError = 'SERVER';
      let mensaje = 'Ocurrió un error inesperado al cargar la información.';

      if (err?.status === 403) {
        tipoError = 'FORBIDDEN';
        mensaje = 'Acceso denegado. Tu cuenta no cuenta con privilegios de Super Administrador (rol_id = 5).';
      } else if (err?.status === 401) {
        tipoError = 'UNAUTHORIZED';
        mensaje = 'Tu sesión ha expirado o no es válida. Por favor, vuelve a iniciar sesión.';
      } else if (!err?.status || err?.message?.includes('Network Error') || err?.message?.includes('conectar')) {
        tipoError = 'NETWORK';
        mensaje = 'No fue posible establecer conexión con el servidor backend de EVENTRA. Comprueba que el servicio de la API esté activo.';
      } else if (err?.data?.message) {
        mensaje = err.data.message;
      }

      setErrorInfo({ tipo: tipoError, mensaje });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Cálculos agregados a partir de los datos reales del backend
  const metricas = useMemo(() => {
    if (!empresas.length) {
      return {
        totalEmpresas: 0,
        activas: 0,
        suspendidas: 0,
        totalUsuarios: 0,
        totalEventos: 0,
        totalIngresos: 0,
      };
    }

    let activas = 0;
    let suspendidas = 0;
    let usuarios = 0;
    let eventos = 0;
    let ingresos = 0;

    for (const emp of empresas) {
      if (emp.estado_activo) {
        activas += 1;
      } else {
        suspendidas += 1;
      }

      // El backend devuelve los agregados COUNT como strings numéricos
      usuarios += Number(emp.total_usuarios || 0);
      eventos  += Number(emp.total_eventos  || 0);
      ingresos += Number(emp.total_ingresos || 0);
    }

    return {
      totalEmpresas: empresas.length,
      activas,
      suspendidas,
      totalUsuarios: usuarios,
      totalEventos: eventos,
      totalIngresos: ingresos,
    };
  }, [empresas]);

  // Filtrado de la tabla de inquilinos
  const empresasFiltradas = useMemo(() => {
    return empresas.filter((emp) => {
      const coincideTexto =
        (emp.nombre_comercial || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.ruc || '').includes(searchTerm);

      if (!coincideTexto) return false;

      if (statusFilter === 'ACTIVE') return emp.estado_activo === true;
      if (statusFilter === 'SUSPENDED') return emp.estado_activo === false;
      return true;
    });
  }, [empresas, searchTerm, statusFilter]);

  const formatearMoneda = (monto) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(monto);
  };

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return 'No disponible';
    try {
      const f = new Date(fechaStr);
      return f.toLocaleDateString('es-EC', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return fechaStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Encabezado de la Página (Estándar SaaS) ───────────────────────── */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <h1>Supervisión Global SaaS</h1>
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
              Consulta bajo demanda
            </span>
          </div>
          <p>Métricas de inquilinos, usuarios globales y eventos consolidados de EVENTRA.</p>
          {lastUpdated && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.35rem 0 0' }}>
              Última sincronización: {lastUpdated.toLocaleTimeString('es-EC')}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={cargarDatos}
            disabled={loading}
            className="btn btn-primary"
            title="Refrescar datos desde la API"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Sincronizando...' : 'Actualizar'}</span>
          </button>
        </div>
      </div>

      {/* ── Manejo de Errores ──────────────────────────────────────────────── */}
      {errorInfo && !loading && (
        <div
          role="alert"
          className="card animate-fade-in"
          style={{
            borderColor: 'var(--danger)',
            borderWidth: '1.5px',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(201, 92, 92, 0.15)',
                color: 'var(--danger)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {errorInfo.tipo === 'NETWORK' ? <WifiOff size={20} /> : <ShieldAlert size={20} />}
            </div>
            <div>
              <h3 style={{ color: 'var(--danger)', fontSize: '0.95rem', fontWeight: 'bold', margin: 0 }}>
                {errorInfo.tipo === 'NETWORK'
                  ? 'Error de Conexión con el Backend'
                  : errorInfo.tipo === 'FORBIDDEN'
                  ? 'Permisos Insuficientes'
                  : 'No se pudieron obtener los datos'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', margin: '0.25rem 0 0', maxWidth: '650px' }}>
                {errorInfo.mensaje}
              </p>
            </div>
          </div>
          <button onClick={cargarDatos} className="btn btn-danger btn-sm">
            Reintentar
          </button>
        </div>
      )}

      {/* ── Grid de Tarjetas de Métricas ───────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <GlobalStatCard
          title="Total Inquilinos"
          value={loading ? null : metricas.totalEmpresas}
          subtitle="Empresas registradas"
          icon={<Building2 size={20} />}
          accentColor="#4D7182"
          loading={loading}
        />

        <GlobalStatCard
          title="Empresas Activas"
          value={loading ? null : metricas.activas}
          subtitle="Operando con normalidad"
          icon={<CheckCircle2 size={20} />}
          accentColor="#4D9A72"
          badgeText="Operativas"
          badgeColor="#4D9A72"
          loading={loading}
        />

        <GlobalStatCard
          title="Suspendidas"
          value={loading ? null : metricas.suspendidas}
          subtitle="Acceso inhabilitado"
          icon={<AlertTriangle size={20} />}
          accentColor="#C95C5C"
          badgeText={metricas.suspendidas > 0 ? 'Atención' : null}
          badgeColor="#C95C5C"
          loading={loading}
        />

        <GlobalStatCard
          title="Usuarios SaaS"
          value={loading ? null : metricas.totalUsuarios}
          subtitle="Suma en todos los tenants"
          icon={<Users size={20} />}
          accentColor="#4D7182"
          loading={loading}
        />

        <GlobalStatCard
          title="Eventos Globales"
          value={loading ? null : metricas.totalEventos}
          subtitle="Gestionados en plataforma"
          icon={<CalendarDays size={20} />}
          accentColor="#C49A3A"
          loading={loading}
        />

        <GlobalStatCard
          title="Ingresos por eventos"
          value={loading ? null : formatearMoneda(metricas.totalIngresos)}
          subtitle="Pagos completados en eventos"
          icon={<DollarSign size={20} />}
          accentColor="#4D9A72"
          loading={loading}
        />
      </div>

      {/* ── Directorio de Inquilinos (Tenants) ──────────────────────────────── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Cabecera de la tabla y controles */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-primary)',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Directorio de Inquilinos SaaS
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
              Listado oficial obtenido desde el endpoint protegido <code style={{ padding: '0.15rem 0.4rem', borderRadius: '4px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--primary)', fontFamily: 'monospace', fontSize: '11px' }}>GET /api/empresas</code>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Buscador */}
            <div style={{ position: 'relative', minWidth: '220px' }}>
              <Search
                size={15}
                style={{
                  position: 'absolute',
                  left: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                placeholder="Buscar por nombre o RUC..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '2.4rem', paddingRight: '0.75rem', paddingTop: '0.45rem', paddingBottom: '0.45rem', fontSize: '0.8rem' }}
              />
            </div>

            {/* Filtro por estado con pills */}
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
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                style={{
                  padding: '0.25rem 0.6rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  background: statusFilter === 'ALL' ? 'var(--primary)' : 'transparent',
                  color: statusFilter === 'ALL' ? '#FFFFFF' : 'var(--text-muted)',
                  transition: 'all 0.15s ease',
                }}
              >
                Todas ({empresas.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('ACTIVE')}
                style={{
                  padding: '0.25rem 0.6rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  background: statusFilter === 'ACTIVE' ? 'var(--success)' : 'transparent',
                  color: statusFilter === 'ACTIVE' ? '#FFFFFF' : 'var(--text-muted)',
                  transition: 'all 0.15s ease',
                }}
              >
                Activas
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('SUSPENDED')}
                style={{
                  padding: '0.25rem 0.6rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  background: statusFilter === 'SUSPENDED' ? 'var(--danger)' : 'transparent',
                  color: statusFilter === 'SUSPENDED' ? '#FFFFFF' : 'var(--text-muted)',
                  transition: 'all 0.15s ease',
                }}
              >
                Suspendidas
              </button>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Empresa (Inquilino)</th>
                <th>RUC</th>
                <th>Plan</th>
                <th>Estado</th>
                <th style={{ textAlign: 'center' }}>Usuarios</th>
                <th style={{ textAlign: 'center' }}>Eventos</th>
                <th style={{ textAlign: 'right' }}>Facturación</th>
                <th>Registro</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                // Skeletons de carga
                [...Array(4)].map((_, i) => (
                  <tr key={i}>
                    <td><div className="skeleton" style={{ height: '1rem', width: '130px' }}></div></td>
                    <td><div className="skeleton" style={{ height: '1rem', width: '90px' }}></div></td>
                    <td><div className="skeleton" style={{ height: '1rem', width: '60px' }}></div></td>
                    <td><div className="skeleton" style={{ height: '1rem', width: '55px' }}></div></td>
                    <td style={{ textAlign: 'center' }}><div className="skeleton" style={{ height: '1rem', width: '30px', margin: '0 auto' }}></div></td>
                    <td style={{ textAlign: 'center' }}><div className="skeleton" style={{ height: '1rem', width: '30px', margin: '0 auto' }}></div></td>
                    <td style={{ textAlign: 'right' }}><div className="skeleton" style={{ height: '1rem', width: '70px', marginLeft: 'auto' }}></div></td>
                    <td><div className="skeleton" style={{ height: '1rem', width: '80px' }}></div></td>
                  </tr>
                ))
              ) : empresasFiltradas.length === 0 ? (
                // Estado vacío o sin resultados
                <tr>
                  <td colSpan={8} style={{ padding: '3.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
                      <Inbox size={34} style={{ color: 'var(--border-subtle)' }} />
                      <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', margin: 0 }}>
                        {searchTerm || statusFilter !== 'ALL'
                          ? 'No se encontraron empresas con los filtros aplicados.'
                          : 'Aún no existen empresas registradas en EVENTRA SaaS.'}
                      </p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                        {searchTerm || statusFilter !== 'ALL'
                          ? 'Prueba modificando el término de búsqueda o el selector de estado.'
                          : 'Cuando se den de alta inquilinos, aparecerán listados aquí.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                // Filas de datos
                empresasFiltradas.map((emp) => (
                  <tr key={emp.id}>
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
                            flexShrink: 0,
                          }}
                        >
                          {emp.nombre_comercial ? emp.nombre_comercial[0].toUpperCase() : 'E'}
                        </div>
                        <span style={{ fontWeight: 600, maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={emp.nombre_comercial}>
                          {emp.nombre_comercial}
                        </span>
                      </div>
                    </td>

                    <td style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                      {emp.ruc || 'No especificado'}
                    </td>

                    <td>
                      <span
                        style={{
                          padding: '0.2rem 0.55rem',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: 'rgba(77, 113, 130, 0.12)',
                          color: 'var(--primary)',
                          border: '1px solid rgba(77, 113, 130, 0.25)',
                        }}
                      >
                        {emp.plan_suscripcion || 'Básico'}
                      </span>
                    </td>

                    <td>
                      {emp.estado_activo ? (
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
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)' }}></span>
                          Activa
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
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--danger)' }}></span>
                          Suspendida
                        </span>
                      )}
                    </td>

                    <td style={{ textAlign: 'center', fontWeight: 600 }}>
                      {emp.total_usuarios !== undefined ? emp.total_usuarios : '0'}
                    </td>

                    <td style={{ textAlign: 'center', fontWeight: 600 }}>
                      {emp.total_eventos !== undefined ? emp.total_eventos : '0'}
                    </td>

                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {formatearMoneda(Number(emp.total_ingresos || 0))}
                    </td>

                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {formatearFecha(emp.fecha_registro)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer informativo */}
        <div
          style={{
            padding: '0.85rem 1.25rem',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-primary)',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <span>
            Mostrando <strong>{empresasFiltradas.length}</strong> de <strong>{empresas.length}</strong> inquilinos registrados
          </span>
          <span style={{ fontStyle: 'italic' }}>
            Fase 1: Módulo en modo supervisión (operaciones de alta y modificación preparadas para Fase 2).
          </span>
        </div>
      </div>
    </div>
  );
};

export default GlobalDashboardPage;
