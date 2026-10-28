import React, { useState, useEffect } from 'react';
import { eventraService } from '../../services/eventraService';
import {
  DollarSign,
  Building2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Search,
  RefreshCw,
  X,
  CreditCard,
  FileCheck,
  TrendingUp,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';

export const FacturacionSuperAdmin = () => {
  const [suscripciones, setSuscripciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [busqueda, setBusqueda] = useState('');
  const [pagoSeleccionado, setPagoSeleccionado] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    cargarSuscripciones();
  }, []);

  const cargarSuscripciones = async () => {
    setLoading(true);
    try {
      const data = await eventraService.getSuscripciones();
      setSuscripciones(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error cargando suscripciones globales:', error);
      showToast('Error al cargar la facturación de empresas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAbrirModal = (susc) => {
    setPagoSeleccionado(susc);
    setIsModalOpen(true);
  };

  const handleResolverSuscripcion = async (id, nuevoEstado) => {
    setProcesando(true);
    try {
      await eventraService.actualizarEstadoSuscripcion(id, nuevoEstado);
      setIsModalOpen(false);
      setPagoSeleccionado(null);
      showToast(
        nuevoEstado === 'Aprobado'
          ? 'Suscripción aprobada y plan de la empresa renovado exitosamente.'
          : 'Suscripción rechazada.',
        'success'
      );
      await cargarSuscripciones();
    } catch (error) {
      console.error('Error actualizando suscripción:', error);
      showToast(error.response?.data?.message || 'Error al actualizar suscripción.', 'error');
    } finally {
      setProcesando(false);
    }
  };

  // KPIs Globales
  const mrrAprobado = suscripciones
    .filter((s) => s.estado === 'Aprobado')
    .reduce((acc, curr) => acc + (Number(curr.monto) || 0), 0);

  // Empresas activas únicas
  const empresasUnicas = new Set(
    suscripciones.filter((s) => s.estado === 'Aprobado').map((s) => s.empresa_id)
  );
  const empresasActivasCount = empresasUnicas.size || suscripciones.length;

  const pagosPorAprobar = suscripciones.filter((s) => s.estado === 'En Revisión');

  // Filtrado de la tabla
  const suscripcionesFiltradas = suscripciones.filter((susc) => {
    const coincideEstado = filtroEstado === 'TODOS' || susc.estado === filtroEstado;
    const termino = busqueda.toLowerCase().trim();
    if (!termino) return coincideEstado;

    const empresa = (susc.empresa_nombre || '').toLowerCase();
    const plan = (susc.plan_nombre || '').toLowerCase();
    const ruc = (susc.empresa_ruc || '').toLowerCase();

    return coincideEstado && (empresa.includes(termino) || plan.includes(termino) || ruc.includes(termino));
  });

  return (
    <div className="space-y-6 animate-fade-in text-[#233D49]">
      
      {/* Toast Flotante */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold animate-fade-in ${
          toast.type === 'error'
            ? 'bg-[#C95C5C] text-white border-[#C95C5C]'
            : 'bg-[#4D9A72] text-white border-[#4D9A72]'
        }`}>
          {toast.type === 'error' ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#CBC6B6]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#233D49] tracking-tight">
            Facturación SaaS y Gobernanza Global
          </h1>
          <p className="text-sm text-[#526F7D] mt-1">
            Supervisión centralizada de membresías, conciliación de MRR y aprobación de planes para empresas inquilinas.
          </p>
        </div>

        <button
          onClick={cargarSuscripciones}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-[#FAF8F5] border border-[#CBC6B6] text-xs font-bold text-[#526F7D] shadow-sm transition-all self-start sm:self-auto"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Tarjetas KPI Globales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* KPI 1: Ingresos Recurrentes Mensuales (MRR) */}
        <div className="bg-white shadow-sm rounded-2xl border border-[#CBC6B6] p-5 relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#526F7D]">
              Ingresos Recurrentes Mensuales (MRR)
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#4D9A72]/15 text-[#4D9A72] flex items-center justify-center">
              <DollarSign size={20} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#233D49] mt-3 tabular-nums font-mono">
            ${mrrAprobado.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-[#7D8F97] mt-1.5 flex items-center gap-1.5">
            <TrendingUp size={13} className="text-[#4D9A72]" />
            <span>Membresías aprobadas y liquidadas</span>
          </p>
        </div>

        {/* KPI 2: Empresas Activas */}
        <div className="bg-white shadow-sm rounded-2xl border border-[#CBC6B6] p-5 relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#526F7D]">
              Empresas Activas
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#526F7D]/10 text-[#526F7D] flex items-center justify-center">
              <Building2 size={20} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#233D49] mt-3 tabular-nums">
            {empresasActivasCount}
          </p>
          <p className="text-xs text-[#7D8F97] mt-1.5 flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-[#4D9A72]" />
            <span>Tenants con servicio operativo activo</span>
          </p>
        </div>

        {/* KPI 3: Pagos por Aprobar */}
        <div className="bg-white shadow-sm rounded-2xl border border-[#CBC6B6] p-5 relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#526F7D]">
              Pagos por Aprobar
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#C49A3A]/15 text-[#C49A3A] flex items-center justify-center">
              <Clock size={20} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#233D49] mt-3 tabular-nums">
            {pagosPorAprobar.length}
          </p>
          <p className="text-xs text-[#7D8F97] mt-1.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#C49A3A]"></span>
            <span>Comprobantes de empresas en revisión</span>
          </p>
        </div>

      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white rounded-2xl border border-[#CBC6B6] p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Input de Búsqueda */}
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7D8F97]" />
          <input
            type="text"
            placeholder="Buscar por empresa, RUC o plan..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#CBC6B6] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:border-[#526F7D] text-[#233D49]"
          />
        </div>

        {/* Filtros de Estado */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['TODOS', 'En Revisión', 'Aprobado', 'Rechazado'].map((estado) => {
            const activo = filtroEstado === estado;
            return (
              <button
                key={estado}
                onClick={() => setFiltroEstado(estado)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activo
                    ? 'bg-[#526F7D] text-white shadow-sm'
                    : 'bg-[#F3F0E4]/70 hover:bg-[#F3F0E4] text-[#526F7D] border border-[#CBC6B6]/60'
                }`}
              >
                {estado}
              </button>
            );
          })}
        </div>

      </div>

      {/* Tabla Global de Suscripciones */}
      <div className="bg-white rounded-2xl border border-[#CBC6B6] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-[#CBC6B6] text-[11px] font-bold uppercase tracking-wider text-[#526F7D]">
                <th className="py-3.5 px-5">Empresa</th>
                <th className="py-3.5 px-5">Plan</th>
                <th className="py-3.5 px-5">Monto</th>
                <th className="py-3.5 px-5">Fecha</th>
                <th className="py-3.5 px-5">Estado</th>
                <th className="py-3.5 px-5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#CBC6B6]/40 text-[#233D49]">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-[#7D8F97]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw size={24} className="animate-spin text-[#526F7D]" />
                      <span className="font-semibold">Cargando pagos de suscripción global...</span>
                    </div>
                  </td>
                </tr>
              ) : suscripcionesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-[#7D8F97]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileCheck size={32} className="text-[#526F7D]/50" />
                      <p className="font-semibold text-[#233D49]">No se encontraron pagos de suscripción</p>
                      <p className="text-xs text-[#7D8F97]">No hay registros con los filtros seleccionados.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                suscripcionesFiltradas.map((susc) => {
                  const isApproved = susc.estado === 'Aprobado';
                  const isPending = susc.estado === 'En Revisión';
                  const isRejected = susc.estado === 'Rechazado';

                  return (
                    <tr
                      key={susc.id}
                      className={`hover:bg-[#FAF8F2] transition-colors ${
                        isPending ? 'bg-[#C49A3A]/5 font-medium' : ''
                      }`}
                    >
                      {/* Empresa */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-[#526F7D]/10 text-[#526F7D] flex items-center justify-center font-bold text-xs shrink-0">
                            {(susc.empresa_nombre || 'E').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-[#233D49] block">
                              {susc.empresa_nombre || 'Empresa Tenant'}
                            </span>
                            {susc.empresa_ruc && (
                              <span className="text-[11px] text-[#7D8F97] block font-mono tabular-nums">
                                RUC: {susc.empresa_ruc}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="py-3.5 px-5">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#526F7D]/10 text-[#526F7D]">
                          Plan {susc.plan_nombre}
                        </span>
                      </td>

                      {/* Monto */}
                      <td className="py-3.5 px-5 font-bold font-mono text-sm tabular-nums text-[#233D49]">
                        ${Number(susc.monto).toFixed(2)}
                      </td>

                      {/* Fecha */}
                      <td className="py-3.5 px-5 text-[#7D8F97] tabular-nums font-medium">
                        {new Date(susc.fecha_pago || susc.fecha_registro).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                          isApproved
                            ? 'bg-[#4D9A72]/15 text-[#4D9A72] border-[#4D9A72]/30'
                            : isPending
                            ? 'bg-[#C49A3A]/15 text-[#C49A3A] border-[#C49A3A]/30'
                            : 'bg-[#C95C5C]/15 text-[#C95C5C] border-[#C95C5C]/30'
                        }`}>
                          {isApproved && <CheckCircle2 size={12} />}
                          {isPending && <Clock size={12} />}
                          {isRejected && <XCircle size={12} />}
                          <span>{susc.estado}</span>
                        </span>
                      </td>

                      {/* Acción */}
                      <td className="py-3.5 px-5 text-right">
                        {isPending ? (
                          <button
                            onClick={() => handleAbrirModal(susc)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#526F7D] hover:bg-[#3E5763] text-white font-bold text-xs shadow-sm transition-all"
                          >
                            <span>Revisar</span>
                            <ArrowRight size={13} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAbrirModal(susc)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[#526F7D] hover:bg-[#F3F0E4] font-semibold text-xs transition-colors"
                          >
                            <span>Detalle</span>
                            <ArrowRight size={12} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Revisión y Aprobación de Suscripción */}
      {isModalOpen && pagoSeleccionado && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 bg-black/40 backdrop-blur-sm flex items-center justify-center animate-fade-in">
          <div className="bg-white shadow-xl rounded-2xl sm:rounded-3xl border border-[#CBC6B6] p-5 sm:p-7 max-w-lg w-full space-y-4 my-auto max-h-[calc(100vh-3.5rem)] overflow-y-auto animate-scale-up">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#CBC6B6]/60 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#526F7D]/10 text-[#526F7D] flex items-center justify-center">
                  <CreditCard size={18} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#233D49]">
                    Auditoría de Suscripción SaaS
                  </h3>
                  <p className="text-xs text-[#7D8F97]">
                    Verifica el pago recibido antes de activar la membresía del tenant.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-[#7D8F97] hover:bg-[#F3F0E4] hover:text-[#233D49] transition-colors"
                title="Cerrar modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Ficha Técnica */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-[#FAF8F5] border border-[#CBC6B6]/60 text-xs overflow-hidden">
              <div className="min-w-0">
                <span className="text-[#526F7D] font-semibold text-[11px] block">Empresa Solicitante:</span>
                <p className="text-sm font-bold text-[#233D49] truncate">
                  {pagoSeleccionado.empresa_nombre || 'Empresa Tenant'}
                </p>
              </div>
              <div className="min-w-0 text-right">
                <span className="text-[#526F7D] font-semibold text-[11px] block">Monto Depositado:</span>
                <p className="text-sm sm:text-base font-extrabold text-[#233D49] tabular-nums font-mono truncate">
                  ${Number(pagoSeleccionado.monto).toFixed(2)}
                </p>
              </div>
              <div className="min-w-0">
                <span className="text-[#526F7D] font-semibold text-[11px] block">Plan a Renovar:</span>
                <p className="font-bold text-[#233D49] truncate">
                  Plan {pagoSeleccionado.plan_nombre}
                </p>
              </div>
              <div className="min-w-0 text-right">
                <span className="text-[#526F7D] font-semibold text-[11px] block">Estado Actual:</span>
                <p className="font-bold text-[#233D49] truncate">
                  {pagoSeleccionado.estado}
                </p>
              </div>
            </div>

            {/* Visualizador del Comprobante (URL de Supabase) */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#526F7D]">
                Comprobante Digital de Supabase
              </span>
              {pagoSeleccionado.comprobante_url ? (
                <div className="rounded-xl border border-[#CBC6B6] overflow-hidden bg-[#FAF8F5] p-3 text-center">
                  <img
                    src={pagoSeleccionado.comprobante_url}
                    alt="Comprobante de Suscripción"
                    className="max-h-48 sm:max-h-56 mx-auto rounded-lg object-contain border border-[#CBC6B6]/40 shadow-sm"
                  />
                  <div className="pt-2">
                    <a
                      href={pagoSeleccionado.comprobante_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#526F7D] hover:text-[#233D49] underline"
                    >
                      <ExternalLink size={13} />
                      <span>Abrir comprobante en resolución completa</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-xl bg-[#FAF8F5] border border-[#CBC6B6] text-center text-xs text-[#7D8F97]">
                  <FileCheck size={26} className="mx-auto mb-1 text-[#526F7D]/50" />
                  <p className="font-semibold text-[#233D49]">Sin comprobante digital adjunto</p>
                  <p className="mt-0.5">El pago fue ingresado manualmente por el administrador.</p>
                </div>
              )}
            </div>

            {/* Botones de Acción: Aprobar Suscripción (Verde #4D9A72) y Rechazar (Rojo #C95C5C) */}
            <div className="pt-3 border-t border-[#CBC6B6]/60 flex items-center gap-3">
              <button
                disabled={procesando}
                onClick={() => handleResolverSuscripcion(pagoSeleccionado.id, 'Aprobado')}
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[#4D9A72] hover:bg-[#3D825E] text-white text-xs font-bold shadow-sm transition-colors disabled:opacity-50"
              >
                <CheckCircle2 size={16} />
                <span>Aprobar Suscripción</span>
              </button>

              <button
                disabled={procesando}
                onClick={() => handleResolverSuscripcion(pagoSeleccionado.id, 'Rechazado')}
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[#C95C5C] hover:bg-[#AF4E4E] text-white text-xs font-bold shadow-sm transition-colors disabled:opacity-50"
              >
                <XCircle size={16} />
                <span>Rechazar</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default FacturacionSuperAdmin;
