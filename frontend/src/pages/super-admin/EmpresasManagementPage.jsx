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
      {/* ── Encabezado Principal ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-2xl p-6 border border-[#CEC8B8] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-[#233D49] tracking-tight font-['Outfit']">
              Gestión de Empresas (Tenants)
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-[#4D7182]/15 text-[#4D7182] text-xs font-bold uppercase tracking-wider">
              Multi-Tenant SaaS
            </span>
          </div>
          <p className="text-sm text-[#7d8f97] mt-1">
            Administración centralizada de inquilinos, asignación de planes y control de acceso global.
          </p>
          {lastUpdated && (
            <p className="text-xs text-[#4D7182] mt-1">
              Última sincronización: {lastUpdated.toLocaleTimeString('es-EC')}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={cargarEmpresas}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-[#CEC8B8] bg-white hover:bg-[#F3F0E4] text-[#233D49] font-semibold text-xs transition-colors disabled:opacity-50"
            title="Refrescar listado"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>

          <button
            onClick={() => setIsCrearModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#4D7182] hover:bg-[#3d5f6e] text-white font-bold text-xs shadow-sm transition-all"
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
          className="bg-white rounded-2xl p-6 border-2 border-[#C95C5C] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C95C5C]/15 text-[#C95C5C] flex items-center justify-center flex-shrink-0 mt-0.5">
              {errorInfo.tipo === 'NETWORK' ? <WifiOff size={20} /> : <ShieldAlert size={20} />}
            </div>
            <div>
              <h3 className="font-bold text-[#C95C5C] text-sm">
                {errorInfo.tipo === 'NETWORK'
                  ? 'Error de Conexión con el Backend'
                  : 'Error al consultar empresas'}
              </h3>
              <p className="text-xs text-[#233D49] mt-1 max-w-2xl">{errorInfo.mensaje}</p>
            </div>
          </div>
          <button
            onClick={cargarEmpresas}
            className="px-4 py-2 rounded-xl bg-[#C95C5C] text-white text-xs font-bold hover:bg-[#b54b4b] transition-colors self-end sm:self-center"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* ── Tarjetas de Resumen ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
      <div className="bg-white rounded-2xl border border-[#CEC8B8] shadow-sm overflow-hidden">
        {/* Barra de Filtros */}
        <div className="p-5 border-b border-[#CEC8B8] flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#F3F0E4]/30">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Buscador */}
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7d8f97] pointer-events-none"
              />
              <input
                type="text"
                placeholder="Buscar empresa por nombre comercial o RUC..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-[#CEC8B8] bg-white text-xs text-[#233D49] focus:outline-none focus:border-[#4D7182] transition-colors"
              />
            </div>

            {/* Filtro por estado */}
            <div className="flex items-center gap-1 bg-white border border-[#CEC8B8] rounded-xl p-1 text-xs">
              <Filter size={13} className="text-[#7d8f97] ml-1.5" />
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  statusFilter === 'ALL'
                    ? 'bg-[#4D7182] text-white'
                    : 'text-[#7d8f97] hover:text-[#233D49]'
                }`}
              >
                Todas ({empresas.length})
              </button>
              <button
                onClick={() => setStatusFilter('ACTIVE')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  statusFilter === 'ACTIVE'
                    ? 'bg-[#4D9A72] text-white'
                    : 'text-[#7d8f97] hover:text-[#233D49]'
                }`}
              >
                Activas
              </button>
              <button
                onClick={() => setStatusFilter('SUSPENDED')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  statusFilter === 'SUSPENDED'
                    ? 'bg-[#C95C5C] text-white'
                    : 'text-[#7d8f97] hover:text-[#233D49]'
                }`}
              >
                Suspendidas
              </button>
            </div>

            {/* Filtro por plan */}
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-[#CEC8B8] bg-white text-xs font-semibold text-[#233D49] focus:outline-none focus:border-[#4D7182]"
            >
              <option value="ALL">Todos los Planes</option>
              <option value="Basico">Plan Básico</option>
              <option value="Premium">Plan Premium</option>
              <option value="Enterprise">Plan Enterprise</option>
              <option value="Profesional">Plan Profesional</option>
            </select>
          </div>

          {/* Selector de items por página */}
          <div className="flex items-center gap-2 text-xs text-[#7d8f97]">
            <span>Mostrar:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="px-2 py-1 rounded-lg border border-[#CEC8B8] bg-white text-xs font-bold text-[#233D49]"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#CEC8B8] bg-[#FAFAF7] text-[#4D7182] font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Empresa (Inquilino)</th>
                <th className="py-3 px-4">RUC</th>
                <th className="py-3 px-4">Plan Actual</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-center">Usuarios</th>
                <th className="py-3 px-4 text-center">Eventos</th>
                <th className="py-3 px-4">Fecha Alta</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#CEC8B8]/60 text-[#233D49]">
              {loading ? (
                // Skeletons de carga
                [...Array(itemsPerPage > 5 ? 5 : itemsPerPage)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 px-4">
                      <div className="h-4 bg-[#CEC8B8]/30 rounded w-36"></div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-4 bg-[#CEC8B8]/30 rounded w-24"></div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-4 bg-[#CEC8B8]/30 rounded w-16"></div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-4 bg-[#CEC8B8]/30 rounded w-14"></div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="h-4 bg-[#CEC8B8]/30 rounded w-8 mx-auto"></div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="h-4 bg-[#CEC8B8]/30 rounded w-8 mx-auto"></div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-4 bg-[#CEC8B8]/30 rounded w-20"></div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="h-4 bg-[#CEC8B8]/30 rounded w-24 ml-auto"></div>
                    </td>
                  </tr>
                ))
              ) : paginatedEmpresas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#7d8f97]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Inbox size={32} className="text-[#CEC8B8]" />
                      <p className="font-semibold text-sm text-[#233D49]">
                        {searchTerm || statusFilter !== 'ALL' || planFilter !== 'ALL'
                          ? 'No hay empresas que coincidan con los filtros seleccionados.'
                          : 'Aún no se han dado de alta empresas en la plataforma.'}
                      </p>
                      <p className="text-xs text-[#7d8f97]">
                        {searchTerm || statusFilter !== 'ALL' || planFilter !== 'ALL'
                          ? 'Intenta restableciendo la búsqueda o cambiando los filtros.'
                          : 'Utiliza el botón "Nueva Empresa" para registrar el primer inquilino.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedEmpresas.map((emp) => (
                  <tr key={emp.id} className="hover:bg-[#F3F0E4]/40 transition-colors">
                    {/* Nombre comercial */}
                    <td className="py-3 px-4 font-semibold text-[#233D49]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#4D7182]/10 text-[#4D7182] flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {emp.nombre_comercial ? emp.nombre_comercial[0].toUpperCase() : 'E'}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-xs block truncate max-w-[200px]" title={emp.nombre_comercial}>
                            {emp.nombre_comercial}
                          </span>
                          <span className="text-[10px] text-[#7d8f97]">ID: #{emp.id}</span>
                        </div>
                      </div>
                    </td>

                    {/* RUC */}
                    <td className="py-3 px-4 text-[#7d8f97] font-mono">
                      {emp.ruc || 'No registrado'}
                    </td>

                    {/* Plan */}
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getBadgeColorPorPlan(
                          emp.plan_suscripcion
                        )}`}
                      >
                        Plan {emp.plan_suscripcion || 'Básico'}
                      </span>
                    </td>

                    {/* Estado */}
                    <td className="py-3 px-4">
                      {emp.estado_activo ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#4D9A72]/15 text-[#4D9A72]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#4D9A72]"></span>
                          Activa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C95C5C]/15 text-[#C95C5C]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#C95C5C]"></span>
                          Suspendida
                        </span>
                      )}
                    </td>

                    {/* Usuarios */}
                    <td className="py-3 px-4 text-center font-medium">
                      {emp.total_usuarios !== undefined ? emp.total_usuarios : '0'}
                    </td>

                    {/* Eventos */}
                    <td className="py-3 px-4 text-center font-medium">
                      {emp.total_eventos !== undefined ? emp.total_eventos : '0'}
                    </td>

                    {/* Fecha de alta */}
                    <td className="py-3 px-4 text-[#7d8f97]">
                      {formatearFecha(emp.fecha_registro)}
                    </td>

                    {/* Acciones */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Ver Detalle */}
                        <button
                          onClick={() => {
                            setEmpresaSeleccionada(emp);
                            setIsDetalleModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-[#4D7182] hover:bg-[#4D7182]/10 transition-colors"
                          title="Ver detalle del inquilino"
                          aria-label="Ver detalle"
                        >
                          <Eye size={15} />
                        </button>

                        {/* Cambiar Plan */}
                        <button
                          onClick={() => {
                            setEmpresaSeleccionada(emp);
                            setIsPlanModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-[#C49A3A] hover:bg-[#C49A3A]/10 transition-colors"
                          title="Modificar plan de suscripción"
                          aria-label="Cambiar plan"
                        >
                          <Sliders size={15} />
                        </button>

                        {/* Suspender o Reactivar */}
                        <button
                          onClick={() => {
                            setEmpresaSeleccionada(emp);
                            setIsSuspenderModalOpen(true);
                          }}
                          className={`p-1.5 rounded-lg transition-colors ${
                            emp.estado_activo
                              ? 'text-[#C95C5C] hover:bg-[#C95C5C]/10'
                              : 'text-[#4D9A72] hover:bg-[#4D9A72]/10'
                          }`}
                          title={emp.estado_activo ? 'Suspender empresa' : 'Reactivar empresa'}
                          aria-label={emp.estado_activo ? 'Suspender empresa' : 'Reactivar empresa'}
                        >
                          {emp.estado_activo ? <Power size={15} /> : <RotateCcw size={15} />}
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
        <div className="p-4 border-t border-[#CEC8B8] bg-[#FAFAF7] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#7d8f97]">
          <div>
            Mostrando <strong>{paginatedEmpresas.length}</strong> de <strong>{empresasFiltradas.length}</strong> inquilinos filtrados (Total general: {empresas.length})
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-[#CEC8B8] bg-white text-[#233D49] hover:bg-[#F3F0E4] disabled:opacity-40 transition-colors"
                aria-label="Página anterior"
              >
                <ChevronLeft size={15} />
              </button>

              <span className="px-2 font-semibold text-[#233D49]">
                Página {currentPage} de {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-[#CEC8B8] bg-white text-[#233D49] hover:bg-[#F3F0E4] disabled:opacity-40 transition-colors"
                aria-label="Página siguiente"
              >
                <ChevronRight size={15} />
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
