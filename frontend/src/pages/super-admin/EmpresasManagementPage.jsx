import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { superAdminService } from '../../services/superAdminService';
import { GlobalStatCard } from '../../components/super-admin/GlobalStatCard';
import { CrearEmpresaModal } from '../../components/super-admin/CrearEmpresaModal';
import { CambiarPlanModal } from '../../components/super-admin/CambiarPlanModal';
import { SuspenderEmpresaModal } from '../../components/super-admin/SuspenderEmpresaModal';
import { DetalleEmpresaModal } from '../../components/super-admin/DetalleEmpresaModal';
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  Users,
  CalendarDays,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Sliders,
  Power,
  RotateCcw,
  ShieldAlert,
  WifiOff,
  Inbox,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

/**
 * =============================================================================
 * EmpresasManagementPage
 * =============================================================================
 * Módulo de Gestión de Inquilinos (Tenants) para el Super Administrador de EVENTRA.
 * Permite buscar, filtrar, visualizar métricas, dar de alta inquilinos, cambiar planes
 * y suspender o reactivar empresas.
 * =============================================================================
 */
export const EmpresasManagementPage = () => {
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorInfo, setErrorInfo] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'SUSPENDED'
  const [planFilter, setPlanFilter] = useState('ALL'); // 'ALL' | 'Basico' | 'Premium' | 'Enterprise' | 'Profesional'

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modales
  const [isCrearModalOpen, setIsCrearModalOpen] = useState(false);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [isDetalleModalOpen, setIsDetalleModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isSuspenderModalOpen, setIsSuspenderModalOpen] = useState(false);

  // Carga de datos
  const cargarEmpresas = useCallback(async () => {
    setLoading(true);
    setErrorInfo(null);
    try {
      const response = await superAdminService.obtenerEmpresas();
      const lista = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
        ? response
        : [];

      setEmpresas(lista);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('[EmpresasManagementPage] Error al cargar empresas:', err);

      let tipoError = 'SERVER';
      let mensaje = 'Error al consultar las empresas del SaaS.';

      if (err?.status === 403) {
        tipoError = 'FORBIDDEN';
        mensaje = 'Acceso denegado: Se requieren privilegios de Super Administrador (rol_id = 5).';
      } else if (err?.status === 401) {
        tipoError = 'UNAUTHORIZED';
        mensaje = 'Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.';
      } else if (!err?.status || err?.message?.includes('Network Error')) {
        tipoError = 'NETWORK';
        mensaje = 'No fue posible conectar con el servidor backend de EVENTRA. Comprueba el estado del servicio.';
      } else if (err?.data?.message) {
        mensaje = err.data.message;
      }

      setErrorInfo({ tipo: tipoError, mensaje });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarEmpresas();
  }, [cargarEmpresas]);

  // Métricas agregadas
  const metricas = useMemo(() => {
    let activas = 0;
    let suspendidas = 0;
    let usuarios = 0;
    let eventos = 0;

    for (const emp of empresas) {
      if (emp.estado_activo) activas += 1;
      else suspendidas += 1;
      usuarios += Number(emp.total_usuarios || 0);
      eventos += Number(emp.total_eventos || 0);
    }

    return {
      total: empresas.length,
      activas,
      suspendidas,
      usuarios,
      eventos,
    };
  }, [empresas]);

  // Filtrado
  const empresasFiltradas = useMemo(() => {
    return empresas.filter((emp) => {
      // Coincidencia de texto (nombre comercial o RUC)
      const coincideTexto =
        (emp.nombre_comercial || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.ruc || '').includes(searchTerm);

      if (!coincideTexto) return false;

      // Filtro de estado
      if (statusFilter === 'ACTIVE' && !emp.estado_activo) return false;
      if (statusFilter === 'SUSPENDED' && emp.estado_activo) return false;

      // Filtro de plan
      if (planFilter !== 'ALL') {
        const planEmp = (emp.plan_suscripcion || '').toLowerCase();
        if (planEmp !== planFilter.toLowerCase()) return false;
      }

      return true;
    });
  }, [empresas, searchTerm, statusFilter, planFilter]);

  // Paginación
  const totalPages = Math.ceil(empresasFiltradas.length / itemsPerPage) || 1;
  const paginatedEmpresas = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return empresasFiltradas.slice(startIndex, startIndex + itemsPerPage);
  }, [empresasFiltradas, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, planFilter, itemsPerPage]);

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

  const getBadgeColorPorPlan = (plan) => {
    const p = (plan || '').toLowerCase();
    if (p.includes('premium')) return 'bg-[#C49A3A]/15 text-[#C49A3A] border-[#C49A3A]/30';
    if (p.includes('enterprise')) return 'bg-[#7059a6]/15 text-[#7059a6] border-[#7059a6]/30';
    if (p.includes('profesional')) return 'bg-[#2b78a0]/15 text-[#2b78a0] border-[#2b78a0]/30';
    return 'bg-[#4D7182]/15 text-[#4D7182] border-[#4D7182]/30';
  };

  return (
    <div className="space-y-6">
      {/* ── Encabezado Principal (Estándar SaaS) ────────────────────────────── */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <h1>Gestión de Empresas (Tenants)</h1>
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
              Multi-Tenant SaaS
            </span>
          </div>
          <p>
            Administración centralizada de inquilinos, asignación de planes y control de acceso global.
          </p>
          {lastUpdated && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.35rem 0 0' }}>
              Última sincronización: {lastUpdated.toLocaleTimeString('es-EC')}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={cargarEmpresas}
            disabled={loading}
            className="btn btn-secondary"
            title="Refrescar listado"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Actualizar</span>
          </button>

          <button
            onClick={() => setIsCrearModalOpen(true)}
            className="btn btn-primary"
          >
            <Plus size={16} />
            <span>Nueva Empresa</span>
          </button>
        </div>
      </div>

      {/* ── Banner de Error ────────────────────────────────────────────────── */}
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
                  : 'Error al consultar empresas'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', margin: '0.25rem 0 0', maxWidth: '650px' }}>
                {errorInfo.mensaje}
              </p>
            </div>
          </div>
          <button onClick={cargarEmpresas} className="btn btn-danger btn-sm">
            Reintentar
          </button>
        </div>
      )}

      {/* ── Tarjetas de Resumen ────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem' }}>
        <GlobalStatCard
          title="Total Empresas"
          value={loading ? null : metricas.total}
          subtitle="Inquilinos SaaS registrados"
          icon={<Building2 size={20} />}
          accentColor="#4D7182"
          loading={loading}
        />

        <GlobalStatCard
          title="Empresas Activas"
          value={loading ? null : metricas.activas}
          subtitle="Con acceso habilitado"
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
          badgeText={metricas.suspendidas > 0 ? 'Revisión' : null}
          badgeColor="#C95C5C"
          loading={loading}
        />

        <GlobalStatCard
          title="Total Usuarios"
          value={loading ? null : metricas.usuarios}
          subtitle="Suma en todos los inquilinos"
          icon={<Users size={20} />}
          accentColor="#4D7182"
          loading={loading}
        />

        <GlobalStatCard
          title="Eventos Registrados"
          value={loading ? null : metricas.eventos}
          subtitle="Gestionados por las empresas"
          icon={<CalendarDays size={20} />}
          accentColor="#C49A3A"
          loading={loading}
        />
      </div>

      {/* ── Contenedor de Tabla y Filtros ─────────────────────────────────── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Barra de Filtros */}
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
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
            {/* Buscador */}
            <div style={{ position: 'relative', flex: 1, minWidth: '220px', maxWidth: '420px' }}>
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
                placeholder="Buscar empresa por nombre comercial o RUC..."
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

            {/* Filtro por plan */}
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="form-select"
              style={{ width: 'auto', paddingTop: '0.45rem', paddingBottom: '0.45rem', fontSize: '0.8rem', fontWeight: 600 }}
            >
              <option value="ALL">Todos los Planes</option>
              <option value="Basico">Plan Básico</option>
              <option value="Premium">Plan Premium</option>
              <option value="Enterprise">Plan Enterprise</option>
              <option value="Profesional">Plan Profesional</option>
            </select>
          </div>

          {/* Selector de items por página */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span>Mostrar:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="form-select"
              style={{ width: 'auto', padding: '0.25rem 0.6rem', fontSize: '0.75rem', fontWeight: 700 }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>
        </div>

        {/* Tabla */}
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Empresa (Inquilino)</th>
                <th>RUC</th>
                <th>Plan Actual</th>
                <th>Estado</th>
                <th style={{ textAlign: 'center' }}>Usuarios</th>
                <th style={{ textAlign: 'center' }}>Eventos</th>
                <th>Fecha Alta</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                // Skeletons de carga
                [...Array(itemsPerPage > 5 ? 5 : itemsPerPage)].map((_, i) => (
                  <tr key={i}>
                    <td><div className="skeleton" style={{ height: '1rem', width: '140px' }}></div></td>
                    <td><div className="skeleton" style={{ height: '1rem', width: '90px' }}></div></td>
                    <td><div className="skeleton" style={{ height: '1rem', width: '70px' }}></div></td>
                    <td><div className="skeleton" style={{ height: '1rem', width: '60px' }}></div></td>
                    <td style={{ textAlign: 'center' }}><div className="skeleton" style={{ height: '1rem', width: '30px', margin: '0 auto' }}></div></td>
                    <td style={{ textAlign: 'center' }}><div className="skeleton" style={{ height: '1rem', width: '30px', margin: '0 auto' }}></div></td>
                    <td><div className="skeleton" style={{ height: '1rem', width: '80px' }}></div></td>
                    <td style={{ textAlign: 'right' }}><div className="skeleton" style={{ height: '1rem', width: '80px', marginLeft: 'auto' }}></div></td>
                  </tr>
                ))
              ) : paginatedEmpresas.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '3.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
                      <Inbox size={34} style={{ color: 'var(--border-subtle)' }} />
                      <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', margin: 0 }}>
                        {searchTerm || statusFilter !== 'ALL' || planFilter !== 'ALL'
                          ? 'No hay empresas que coincidan con los filtros seleccionados.'
                          : 'Aún no se han dado de alta empresas en la plataforma.'}
                      </p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                        {searchTerm || statusFilter !== 'ALL' || planFilter !== 'ALL'
                          ? 'Intenta restableciendo la búsqueda o cambiando los filtros.'
                          : 'Utiliza el botón "Nueva Empresa" para registrar el primer inquilino.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedEmpresas.map((emp) => (
                  <tr key={emp.id}>
                    {/* Nombre comercial */}
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
                        <div style={{ minWidth: 0 }}>
                          <span style={{ fontWeight: 700, display: 'block', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={emp.nombre_comercial}>
                            {emp.nombre_comercial}
                          </span>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>ID: #{emp.id}</span>
                        </div>
                      </div>
                    </td>

                    {/* RUC */}
                    <td style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                      {emp.ruc || 'No registrado'}
                    </td>

                    {/* Plan */}
                    <td>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getBadgeColorPorPlan(
                          emp.plan_suscripcion
                        )}`}
                      >
                        Plan {emp.plan_suscripcion || 'Básico'}
                      </span>
                    </td>

                    {/* Estado */}
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

                    {/* Usuarios */}
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>
                      {emp.total_usuarios !== undefined ? emp.total_usuarios : '0'}
                    </td>

                    {/* Eventos */}
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>
                      {emp.total_eventos !== undefined ? emp.total_eventos : '0'}
                    </td>

                    {/* Fecha de alta */}
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {formatearFecha(emp.fecha_registro)}
                    </td>

                    {/* Acciones */}
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
                        {/* Ver Detalle */}
                        <button
                          type="button"
                          onClick={() => {
                            setEmpresaSeleccionada(emp);
                            setIsDetalleModalOpen(true);
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.35rem 0.5rem' }}
                          title="Ver detalle del inquilino"
                          aria-label="Ver detalle"
                        >
                          <Eye size={14} />
                        </button>

                        {/* Cambiar Plan */}
                        <button
                          type="button"
                          onClick={() => {
                            setEmpresaSeleccionada(emp);
                            setIsPlanModalOpen(true);
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.35rem 0.5rem', color: 'var(--warning)' }}
                          title="Modificar plan de suscripción"
                          aria-label="Cambiar plan"
                        >
                          <Sliders size={14} />
                        </button>

                        {/* Suspender o Reactivar */}
                        <button
                          type="button"
                          onClick={() => {
                            setEmpresaSeleccionada(emp);
                            setIsSuspenderModalOpen(true);
                          }}
                          className={`btn btn-sm ${emp.estado_activo ? 'btn-danger' : 'btn-primary'}`}
                          style={{ padding: '0.35rem 0.5rem' }}
                          title={emp.estado_activo ? 'Suspender empresa' : 'Reactivar empresa'}
                          aria-label={emp.estado_activo ? 'Suspender empresa' : 'Reactivar empresa'}
                        >
                          {emp.estado_activo ? <Power size={14} /> : <RotateCcw size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer y Paginación */}
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
          <div>
            Mostrando <strong>{paginatedEmpresas.length}</strong> de <strong>{empresasFiltradas.length}</strong> inquilinos filtrados (Total general: {empresas.length})
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.3rem 0.5rem' }}
                aria-label="Página anterior"
              >
                <ChevronLeft size={14} />
              </button>

              <span style={{ fontWeight: 600, color: 'var(--text-primary)', padding: '0 0.25rem' }}>
                Página {currentPage} de {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.3rem 0.5rem' }}
                aria-label="Página siguiente"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Modales de Acción ──────────────────────────────────────────────── */}
      <CrearEmpresaModal
        isOpen={isCrearModalOpen}
        onClose={() => setIsCrearModalOpen(false)}
        onEmpresaCreada={cargarEmpresas}
      />

      <CambiarPlanModal
        isOpen={isPlanModalOpen}
        onClose={() => {
          setIsPlanModalOpen(false);
          setEmpresaSeleccionada(null);
        }}
        empresa={empresaSeleccionada}
        onPlanActualizado={cargarEmpresas}
      />

      <SuspenderEmpresaModal
        isOpen={isSuspenderModalOpen}
        onClose={() => {
          setIsSuspenderModalOpen(false);
          setEmpresaSeleccionada(null);
        }}
        empresa={empresaSeleccionada}
        onEstadoModificado={cargarEmpresas}
      />

      <DetalleEmpresaModal
        isOpen={isDetalleModalOpen}
        onClose={() => {
          setIsDetalleModalOpen(false);
          setEmpresaSeleccionada(null);
        }}
        empresa={empresaSeleccionada}
        onAbrirCambiarPlan={(emp) => {
          setEmpresaSeleccionada(emp);
          setIsPlanModalOpen(true);
        }}
        onAbrirSuspender={(emp) => {
          setEmpresaSeleccionada(emp);
          setIsSuspenderModalOpen(true);
        }}
      />
    </div>
  );
};

export default EmpresasManagementPage;
