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
      {/* ── Encabezado de la Sección ───────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-2xl p-6 border border-[#CEC8B8] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-[#233D49] tracking-tight font-['Outfit']">
              Supervisión Global SaaS
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-[#4D7182]/15 text-[#4D7182] text-xs font-bold uppercase tracking-wider">
              Consulta bajo demanda
            </span>
          </div>
          <p className="text-sm text-[#7d8f97] mt-1">
            Métricas de inquilinos, usuarios globales y eventos consolidados de EVENTRA.
          </p>
          {lastUpdated && (
            <p className="text-xs text-[#4D7182] mt-1">
              Última sincronización: {lastUpdated.toLocaleTimeString('es-EC')}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={cargarDatos}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#4D7182] hover:bg-[#3d5f6e] text-white font-semibold text-sm shadow-sm transition-all disabled:opacity-50"
            title="Refrescar datos desde la API"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Sincronizando...' : 'Actualizar'}</span>
          </button>
        </div>
      </div>

      {/* ── Manejo de Errores ──────────────────────────────────────────────── */}
      {errorInfo && !loading && (
        <div
          role="alert"
          className="bg-white rounded-2xl p-6 border-2 border-[#C95C5C] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C95C5C]/15 text-[#C95C5C] flex items-center justify-center flex-shrink-0 mt-0.5">
              {errorInfo.tipo === 'NETWORK' ? (
                <WifiOff size={20} />
              ) : (
                <ShieldAlert size={20} />
              )}
            </div>
            <div>
              <h3 className="font-bold text-[#C95C5C] text-sm">
                {errorInfo.tipo === 'NETWORK'
                  ? 'Error de Conexión con el Backend'
                  : errorInfo.tipo === 'FORBIDDEN'
                  ? 'Permisos Insuficientes'
                  : 'No se pudieron obtener los datos'}
              </h3>
              <p className="text-xs text-[#233D49] mt-1 max-w-2xl">
                {errorInfo.mensaje}
              </p>
            </div>
          </div>
          <button
            onClick={cargarDatos}
            className="px-4 py-2 rounded-xl bg-[#C95C5C] text-white text-xs font-bold hover:bg-[#b54b4b] transition-colors self-end sm:self-center"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* ── Grid de Tarjetas de Métricas ───────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
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
      <div className="bg-white rounded-2xl border border-[#CEC8B8] shadow-sm overflow-hidden">
        {/* Cabecera de la tabla y controles */}
        <div className="p-5 border-b border-[#CEC8B8] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#F3F0E4]/30">
          <div>
            <h3 className="font-bold text-[#233D49] text-base font-['Outfit']">
              Directorio de Inquilinos SaaS
            </h3>
            <p className="text-xs text-[#7d8f97] mt-0.5">
              Listado oficial obtenido desde el endpoint protegido <code className="px-1.5 py-0.5 rounded bg-white border border-[#CEC8B8] text-[#4D7182] font-mono text-[11px]">GET /api/empresas</code>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Buscador */}
            <div className="relative min-w-[200px]">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7d8f97] pointer-events-none"
              />
              <input
                type="text"
                placeholder="Buscar por nombre o RUC..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#CEC8B8] bg-white text-xs text-[#233D49] focus:outline-none focus:border-[#4D7182] transition-colors"
              />
            </div>

            {/* Filtro por estado */}
            <div className="flex items-center gap-1 bg-white border border-[#CEC8B8] rounded-xl p-1 text-xs">
              <Filter size={13} className="text-[#7d8f97] ml-1.5" />
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-2 py-1 rounded-lg font-semibold transition-colors ${
                  statusFilter === 'ALL'
                    ? 'bg-[#4D7182] text-white'
                    : 'text-[#7d8f97] hover:text-[#233D49]'
                }`}
              >
                Todas ({empresas.length})
              </button>
              <button
                onClick={() => setStatusFilter('ACTIVE')}
                className={`px-2 py-1 rounded-lg font-semibold transition-colors ${
                  statusFilter === 'ACTIVE'
                    ? 'bg-[#4D9A72] text-white'
                    : 'text-[#7d8f97] hover:text-[#233D49]'
                }`}
              >
                Activas
              </button>
              <button
                onClick={() => setStatusFilter('SUSPENDED')}
                className={`px-2 py-1 rounded-lg font-semibold transition-colors ${
                  statusFilter === 'SUSPENDED'
                    ? 'bg-[#C95C5C] text-white'
                    : 'text-[#7d8f97] hover:text-[#233D49]'
                }`}
              >
                Suspendidas
              </button>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#CEC8B8] bg-[#FAFAF7] text-[#4D7182] font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Empresa (Inquilino)</th>
                <th className="py-3 px-4">RUC</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-center">Usuarios</th>
                <th className="py-3 px-4 text-center">Eventos</th>
                <th className="py-3 px-4 text-right">Facturación</th>
                <th className="py-3 px-4">Registro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#CEC8B8]/60 text-[#233D49]">
              {loading ? (
                // Skeletons de carga
                [...Array(4)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 px-4">
                      <div className="h-4 bg-[#CEC8B8]/30 rounded w-32"></div>
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
                    <td className="py-3.5 px-4 text-right">
                      <div className="h-4 bg-[#CEC8B8]/30 rounded w-16 ml-auto"></div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-4 bg-[#CEC8B8]/30 rounded w-20"></div>
                    </td>
                  </tr>
                ))
              ) : empresasFiltradas.length === 0 ? (
                // Estado vacío o sin resultados
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#7d8f97]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Inbox size={32} className="text-[#CEC8B8]" />
                      <p className="font-semibold text-sm text-[#233D49]">
                        {searchTerm || statusFilter !== 'ALL'
                          ? 'No se encontraron empresas con los filtros aplicados.'
                          : 'Aún no existen empresas registradas en EVENTRA SaaS.'}
                      </p>
                      <p className="text-xs text-[#7d8f97]">
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
                  <tr
                    key={emp.id}
                    className="hover:bg-[#F3F0E4]/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-semibold text-[#233D49]">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#4D7182]/10 text-[#4D7182] flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {emp.nombre_comercial ? emp.nombre_comercial[0].toUpperCase() : 'E'}
                        </div>
                        <span className="truncate max-w-[200px]" title={emp.nombre_comercial}>
                          {emp.nombre_comercial}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-[#7d8f97] font-mono">
                      {emp.ruc || 'No especificado'}
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#4D7182]/10 text-[#4D7182] border border-[#4D7182]/20">
                        {emp.plan_suscripcion || 'Básico'}
                      </span>
                    </td>

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

                    <td className="py-3 px-4 text-center font-medium">
                      {emp.total_usuarios !== undefined ? emp.total_usuarios : '0'}
                    </td>

                    <td className="py-3 px-4 text-center font-medium">
                      {emp.total_eventos !== undefined ? emp.total_eventos : '0'}
                    </td>

                    <td className="py-3 px-4 text-right font-semibold text-[#233D49]">
                      {formatearMoneda(Number(emp.total_ingresos || 0))}
                    </td>

                    <td className="py-3 px-4 text-[#7d8f97]">
                      {formatearFecha(emp.fecha_registro)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer informativo */}
        <div className="p-3 border-t border-[#CEC8B8] bg-[#FAFAF7] text-[11px] text-[#7d8f97] flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Mostrando <strong>{empresasFiltradas.length}</strong> de <strong>{empresas.length}</strong> inquilinos registrados
          </span>
          <span className="italic">
            Fase 1: Módulo en modo supervisión (operaciones de alta y modificación preparadas para Fase 2).
          </span>
        </div>
      </div>
    </div>
  );
};

export default GlobalDashboardPage;
