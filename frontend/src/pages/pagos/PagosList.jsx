import React, { useState, useEffect } from 'react';
import { eventraService } from '../../services/eventraService';
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  Calendar, 
  CreditCard, 
  X,
  FileCheck,
  ExternalLink,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  Clock,
  Zap,
  Building2,
  RefreshCw,
  User
} from 'lucide-react';

export const PagosList = () => {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagoSeleccionado, setPagoSeleccionado] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [busqueda, setBusqueda] = useState('');
  const [procesandoAccion, setProcesandoAccion] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    cargarPagos();
  }, []);

  const cargarPagos = async () => {
    setLoading(true);
    try {
      const data = await eventraService.getPagos();
      setPagos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error cargando pagos:', error);
      showToast('Error al cargar la lista de pagos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerDetalle = (pago) => {
    setPagoSeleccionado(pago);
    setIsModalOpen(true);
  };

  const handleCambiarEstado = async (id, nuevoEstado) => {
    setProcesandoAccion(true);
    try {
      await eventraService.actualizarEstadoPago(id, nuevoEstado);
      setIsModalOpen(false);
      setPagoSeleccionado(null);
      showToast(`Pago marcado como "${nuevoEstado}" correctamente`, 'success');
      await cargarPagos();
    } catch (error) {
      console.error('Error actualizando pago:', error);
      showToast(error.response?.data?.message || 'No se pudo actualizar el estado del pago', 'error');
    } finally {
      setProcesandoAccion(false);
    }
  };

  // Cálculos de KPIs
  const totalRecaudado = pagos
    .filter(p => p.estado === 'Aprobado')
    .reduce((acc, curr) => acc + (Number(curr.monto) || 0), 0);

  const anticiposCobrados = pagos
    .filter(p => p.estado === 'Aprobado' && (p.concepto || '').toLowerCase().includes('anticipo'))
    .reduce((acc, curr) => acc + (Number(curr.monto) || 0), 0);

  const saldosPendientes = pagos
    .filter(p => p.estado === 'En Revisión' || p.estado === 'Pendiente')
    .reduce((acc, curr) => acc + (Number(curr.monto) || 0), 0);

  // Pagos en revisión prioritarios
  const pagosEnRevision = pagos.filter(p => p.estado === 'En Revisión');

  // Filtrado de la tabla
  const pagosFiltrados = pagos.filter(pago => {
    const coincideEstado = filtroEstado === 'TODOS' || pago.estado === filtroEstado;
    const termino = busqueda.toLowerCase().trim();
    if (!termino) return coincideEstado;

    const cliente = (pago.cliente_nombre || '').toLowerCase();
    const evento = (pago.evento_titulo || '').toLowerCase();
    const metodo = (pago.metodo_pago || '').toLowerCase();
    const concepto = (pago.concepto || '').toLowerCase();

    return coincideEstado && (
      cliente.includes(termino) || 
      evento.includes(termino) || 
      metodo.includes(termino) || 
      concepto.includes(termino)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in text-[#233D49]">
      
      {/* Toast Notification Flotante */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold animate-fade-in ${
          toast.type === 'error'
            ? 'bg-[#C95C5C] text-white border-[#C95C5C]'
            : 'bg-[#4D9A72] text-white border-[#4D9A72]'
        }`}>
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Cabecera de Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#CBC6B6]/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#233D49] tracking-tight">
            Gestión Financiera & Pagos
          </h1>
          <p className="text-sm text-[#526F7D] mt-1">
            Supervisión de recaudación, validación de comprobantes y conciliación de anticipos.
          </p>
        </div>

        <button
          onClick={cargarPagos}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-[#FAF8F5] border border-[#CBC6B6] text-xs font-bold text-[#526F7D] shadow-sm transition-all"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Actualizar Datos</span>
        </button>
      </div>

      {/* KPI Cards: 3 Tarjetas Blancas con shadow-sm */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* KPI 1: Total Recaudado */}
        <div className="bg-white shadow-sm rounded-2xl border border-[#CBC6B6] p-5 relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#526F7D]">
              Total Recaudado
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#4D9A72]/15 text-[#4D9A72] flex items-center justify-center">
              <DollarSign size={20} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#233D49] mt-3">
            ${totalRecaudado.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-[#7D8F97] mt-1.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4D9A72]"></span>
            Pagos aprobados y conciliados
          </p>
        </div>

        {/* KPI 2: Anticipos Cobrados */}
        <div className="bg-white shadow-sm rounded-2xl border border-[#CBC6B6] p-5 relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#526F7D]">
              Anticipos Cobrados
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#526F7D]/15 text-[#526F7D] flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#233D49] mt-3">
            ${anticiposCobrados.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-[#7D8F97] mt-1.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#526F7D]"></span>
            Garantías y confirmaciones de eventos
          </p>
        </div>

        {/* KPI 3: Saldos Pendientes */}
        <div className="bg-white shadow-sm rounded-2xl border border-[#CBC6B6] p-5 relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#526F7D]">
              Saldos Pendientes
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#C49A3A]/15 text-[#C49A3A] flex items-center justify-center">
              <Clock size={20} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#233D49] mt-3">
            ${saldosPendientes.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-[#7D8F97] mt-1.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C49A3A]"></span>
            En revisión o pendientes de caja
          </p>
        </div>

      </div>

      {/* Tarjeta de Integración DEUNA */}
      <div className="bg-white shadow-sm rounded-2xl border border-[#CBC6B6] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#526F7D]/10 border border-[#526F7D]/20 flex items-center justify-center text-[#526F7D]">
            <Zap size={22} className="text-[#526F7D]" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#233D49]">
              Integración DEUNA activa - Pagos digitales procesados en tiempo real
            </h2>
            <p className="text-xs text-[#7D8F97] mt-0.5">
              Recepción automática de transferencias QR y validación de abonos digitales directos.
            </p>
          </div>
        </div>

        {/* Indicador de Estado Conectado */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4D9A72]/15 border border-[#4D9A72]/30 text-xs font-bold text-[#4D9A72]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4D9A72] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4D9A72]"></span>
          </span>
          <span>Conectado</span>
        </div>
      </div>

      {/* Alerta de Pagos En Revisión Prioritarios */}
      {pagosEnRevision.length > 0 && (
        <div className="p-4 rounded-2xl bg-[#C49A3A]/10 border border-[#C49A3A]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={18} className="text-[#C49A3A] shrink-0" />
            <span className="text-xs font-semibold text-[#233D49]">
              Tienes <strong>{pagosEnRevision.length}</strong> {pagosEnRevision.length === 1 ? 'comprobante' : 'comprobantes'} pendiente(s) de verificación humana.
            </span>
          </div>
          <button
            onClick={() => setFiltroEstado('En Revisión')}
            className="text-xs font-bold text-[#526F7D] hover:text-[#233D49] underline"
          >
            Filtrar comprobantes pendientes
          </button>
        </div>
      )}

      {/* Barra de Búsqueda y Filtros */}
      <div className="bg-white rounded-2xl border border-[#CBC6B6] p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Input de Búsqueda */}
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7D8F97]" />
          <input
            type="text"
            placeholder="Buscar por cliente, evento o método..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#CBC6B6] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:border-[#526F7D] text-[#233D49] placeholder-[#7D8F97]"
          />
        </div>

        {/* Filtros por Estado */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['TODOS', 'En Revisión', 'Aprobado', 'Pendiente', 'Rechazado'].map((estado) => {
            const activo = filtroEstado === estado;
            return (
              <button
                key={estado}
                onClick={() => setFiltroEstado(estado)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activo
                    ? 'bg-[#526F7D] text-white shadow-sm'
                    : 'bg-[#F3F0E4]/70 hover:bg-[#F3F0E4] text-[#526F7D] border border-[#CBC6B6]/50'
                }`}
              >
                {estado}
              </button>
            );
          })}
        </div>

      </div>

      {/* Tabla de Historial de Pagos */}
      <div className="bg-white rounded-2xl border border-[#CBC6B6] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF8F5] border-b-2 border-[#CBC6B6] text-[11px] font-bold uppercase tracking-wider text-[#526F7D]">
                <th className="py-3.5 px-5">Cliente</th>
                <th className="py-3.5 px-5">Evento</th>
                <th className="py-3.5 px-5">Monto</th>
                <th className="py-3.5 px-5">Método</th>
                <th className="py-3.5 px-5">Fecha</th>
                <th className="py-3.5 px-5">Estado</th>
                <th className="py-3.5 px-5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#CBC6B6]/40 text-xs text-[#233D49]">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-[#7D8F97]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw size={24} className="animate-spin text-[#526F7D]" />
                      <span className="font-semibold">Cargando pagos y comprobantes...</span>
                    </div>
                  </td>
                </tr>
              ) : pagosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-[#7D8F97]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileCheck size={32} className="text-[#526F7D]/50" />
                      <p className="font-semibold text-[#233D49]">No se encontraron pagos registrados</p>
                      <p className="text-xs text-[#7D8F97]">No hay transacciones que coincidan con los filtros actuales.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                pagosFiltrados.map((pago) => {
                  const isApproved = pago.estado === 'Aprobado';
                  const isPending = pago.estado === 'Pendiente' || pago.estado === 'En Revisión';
                  const isRejected = pago.estado === 'Rechazado' || pago.estado === 'Anulado';

                  return (
                    <tr 
                      key={pago.id} 
                      className={`hover:bg-[#FAF8F2] transition-colors ${
                        pago.estado === 'En Revisión' ? 'bg-[#C49A3A]/5 font-medium' : ''
                      }`}
                    >
                      {/* 1. Cliente */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#526F7D]/10 text-[#526F7D] flex items-center justify-center font-bold text-xs shrink-0">
                            {(pago.cliente_nombre || 'C').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-[#233D49] block">
                              {pago.cliente_nombre || 'Cliente General'}
                            </span>
                            {pago.cliente_email && (
                              <span className="text-[11px] text-[#7D8F97] block">
                                {pago.cliente_email}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 2. Evento */}
                      <td className="py-3.5 px-5">
                        <span className="font-semibold text-[#233D49] block">
                          {pago.evento_titulo || 'Evento Corporativo'}
                        </span>
                        <span className="text-[10px] text-[#7D8F97] uppercase tracking-wider">
                          Ref: #{String(pago.evento_id).substring(0, 8)}
                        </span>
                      </td>

                      {/* 3. Monto & Concepto */}
                      <td className="py-3.5 px-5">
                        <span className="font-extrabold text-sm text-[#233D49] block">
                          ${Number(pago.monto).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#526F7D]/10 text-[#526F7D]">
                          {pago.concepto || 'Abono'}
                        </span>
                      </td>

                      {/* 4. Método */}
                      <td className="py-3.5 px-5 text-[#526F7D] font-semibold">
                        <div className="flex items-center gap-1.5">
                          {pago.metodo_pago === 'Deuna' && <Zap size={14} className="text-[#526F7D]" />}
                          {pago.metodo_pago === 'Transferencia' && <Building2 size={14} className="text-[#526F7D]" />}
                          {pago.metodo_pago === 'Efectivo' && <DollarSign size={14} className="text-[#526F7D]" />}
                          <span>{pago.metodo_pago || 'Transferencia'}</span>
                        </div>
                      </td>

                      {/* 5. Fecha */}
                      <td className="py-3.5 px-5 text-[#7D8F97] font-medium">
                        {new Date(pago.fecha_pago || pago.fecha_registro || Date.now()).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>

                      {/* 6. Estado Semántico */}
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                          isApproved
                            ? 'bg-[#4D9A72]/15 text-[#4D9A72] border-[#4D9A72]/30'
                            : isPending
                            ? 'bg-[#C49A3A]/15 text-[#C49A3A] border-[#C49A3A]/30'
                            : 'bg-[#C95C5C]/15 text-[#C95C5C] border-[#C95C5C]/30'
                        }`}>
                          {isApproved && <CheckCircle size={12} />}
                          {isPending && <Clock size={12} />}
                          {isRejected && <XCircle size={12} />}
                          <span>{pago.estado}</span>
                        </span>
                      </td>

                      {/* 7. Acción: Ver -> */}
                      <td className="py-3.5 px-5 text-right">
                        {pago.estado === 'En Revisión' ? (
                          <button
                            onClick={() => handleVerDetalle(pago)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#526F7D] hover:bg-[#3E5763] text-white font-bold text-xs shadow-sm transition-all"
                          >
                            <span>Ver</span>
                            <ArrowRight size={13} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleVerDetalle(pago)}
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

      {/* Modal de Aprobación y Validación de Comprobante */}
      {isModalOpen && pagoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-[#CBC6B6] shadow-2xl space-y-5 animate-scale-up">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#CBC6B6]/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#526F7D]/10 text-[#526F7D] flex items-center justify-center">
                  <CreditCard size={18} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#233D49]">
                    Validación de Comprobante de Pago
                  </h3>
                  <p className="text-xs text-[#7D8F97]">
                    Revisa los datos antes de emitir tu resolución contable.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-[#7D8F97] hover:bg-[#F3F0E4] hover:text-[#233D49] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Ficha técnica del pago */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-[#F3F0E4]/60 border border-[#CBC6B6] text-xs">
              <div>
                <span className="text-[#526F7D] font-semibold">Cliente:</span>
                <p className="text-sm font-bold text-[#233D49] truncate">
                  {pagoSeleccionado.cliente_nombre || 'Cliente General'}
                </p>
              </div>
              <div>
                <span className="text-[#526F7D] font-semibold">Monto Depositado:</span>
                <p className="text-base font-extrabold text-[#233D49]">
                  ${Number(pagoSeleccionado.monto).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <span className="text-[#526F7D] font-semibold">Método de Pago:</span>
                <p className="font-bold text-[#233D49]">
                  {pagoSeleccionado.metodo_pago || 'Transferencia'}
                </p>
              </div>
              <div>
                <span className="text-[#526F7D] font-semibold">Concepto:</span>
                <p className="font-bold text-[#233D49]">
                  {pagoSeleccionado.concepto || 'Anticipo'}
                </p>
              </div>
              <div className="col-span-2 pt-2 border-t border-[#CBC6B6]/40">
                <span className="text-[#526F7D] font-semibold">Evento Asociado:</span>
                <p className="font-medium text-[#233D49]">
                  {pagoSeleccionado.evento_titulo || `Evento #${pagoSeleccionado.evento_id}`}
                </p>
              </div>
            </div>

            {/* Visualizador del Comprobante (URL de Supabase Storage) */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#526F7D]">
                Comprobante Digital
              </span>
              {pagoSeleccionado.comprobante_url ? (
                <div className="rounded-2xl border border-[#CBC6B6] overflow-hidden bg-[#FAF8F5] p-3 text-center">
                  <img
                    src={pagoSeleccionado.comprobante_url}
                    alt="Comprobante de Pago"
                    className="max-h-64 mx-auto rounded-xl object-contain shadow-sm border border-[#CBC6B6]/40"
                  />
                  <div className="pt-2.5">
                    <a
                      href={pagoSeleccionado.comprobante_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#526F7D] hover:text-[#233D49] hover:underline"
                    >
                      <ExternalLink size={13} />
                      <span>Abrir comprobante en tamaño completo</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-[#CBC6B6] text-center text-xs text-[#7D8F97]">
                  <FileCheck size={28} className="mx-auto mb-1 text-[#526F7D]/50" />
                  <p className="font-semibold text-[#233D49]">Sin comprobante digital adjunto</p>
                  <p className="mt-0.5">El pago fue registrado bajo modalidad en efectivo o caja física.</p>
                </div>
              )}
            </div>

            {/* Acciones de Validación: Aprobar Pago / Rechazar Pago */}
            <div className="pt-3 border-t border-[#CBC6B6]/60 flex items-center gap-3">
              <button
                disabled={procesandoAccion}
                onClick={() => handleCambiarEstado(pagoSeleccionado.id, 'Aprobado')}
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[#4D9A72] hover:bg-[#3D825E] text-white text-xs font-bold shadow-sm transition-colors disabled:opacity-50"
              >
                <CheckCircle size={16} />
                <span>Aprobar Pago</span>
              </button>

              <button
                disabled={procesandoAccion}
                onClick={() => handleCambiarEstado(pagoSeleccionado.id, 'Rechazado')}
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[#C95C5C] hover:bg-[#AF4E4E] text-white text-xs font-bold shadow-sm transition-colors disabled:opacity-50"
              >
                <XCircle size={16} />
                <span>Rechazar Pago</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default PagosList;
