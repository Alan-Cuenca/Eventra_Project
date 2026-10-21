import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
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
  ExternalLink
} from 'lucide-react';

export const PagosList = () => {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagoSeleccionado, setPagoSeleccionado] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
      console.error('Error cargando pagos', error);
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
    try {
      await eventraService.actualizarEstadoPago(id, nuevoEstado);
      setIsModalOpen(false);
      setPagoSeleccionado(null);
      showToast(`Pago marcado como "${nuevoEstado}" correctamente`);
      cargarPagos();
    } catch (error) {
      showToast('No se pudo actualizar el estado del pago', 'error');
    }
  };

  const pagosPendientes = pagos.filter(p => p.estado === 'En Revisión' || p.estado === 'Pendiente');
  const pagosHistorial = pagos.filter(p => p.estado !== 'En Revisión' && p.estado !== 'Pendiente');

  const totalAprobado = pagos
    .filter(p => p.estado === 'Aprobado')
    .reduce((acc, curr) => acc + (Number(curr.monto) || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in text-[#233D49]">
      
      {/* Toast Notification */}
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#CEC8B8]/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#233D49] tracking-tight">
            Gestión Financiera & Pagos
          </h1>
          <p className="text-sm text-[#4D7182] mt-1">
            Validación de comprobantes, abonos bancarios y conciliación de eventos.
          </p>
        </div>

        {/* Resumen Superior */}
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-white border border-[#CEC8B8] shadow-sm">
          <DollarSign size={20} className="text-[#4D9A72]" />
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#4D7182]">Total Verificado</span>
            <p className="text-base font-extrabold text-[#233D49] leading-tight">
              ${totalAprobado.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-[#4D7182] bg-white rounded-2xl border border-[#CEC8B8]">
          <p className="font-semibold text-sm">Cargando registros de pagos...</p>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* SECCIÓN PRIORITARIA: Pagos por Verificar */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#233D49] flex items-center gap-2">
                <AlertTriangle size={18} className="text-[#C49A3A]" />
                <span>Pagos por Verificar</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#C49A3A]/15 text-[#C49A3A]">
                  {pagosPendientes.length}
                </span>
              </h2>
            </div>
            
            {pagosPendientes.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white border border-[#CEC8B8]/60 text-center text-sm text-[#7D8F97]">
                <FileCheck size={32} className="mx-auto mb-2 text-[#4D9A72]/60" />
                <p className="font-semibold text-[#233D49]">Todos los pagos están al día</p>
                <p className="text-xs text-[#7D8F97] mt-0.5">No hay comprobantes pendientes de validación.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pagosPendientes.map(pago => (
                  <div
                    key={pago.id}
                    className="bg-white rounded-2xl p-5 border-2 border-[#C49A3A]/40 shadow-sm hover:shadow-md transition-shadow space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-xs font-bold text-[#4D7182] uppercase tracking-wider">
                          Abono Pendiente
                        </span>
                        <h3 className="text-lg font-extrabold text-[#233D49] mt-0.5">
                          ${Number(pago.monto).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </h3>
                        <p className="text-xs font-medium text-[#233D49]/80 mt-1">
                          Concepto: <strong>{pago.concepto || 'Abono a evento'}</strong>
                        </p>
                        <p className="text-xs text-[#4D7182] mt-0.5">
                          Método: {pago.metodo_pago || 'Transferencia'} · Evento #{pago.evento_id}
                        </p>
                      </div>

                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#C49A3A]/15 text-[#C49A3A] border border-[#C49A3A]/30">
                        {pago.estado}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-[#CEC8B8]/40 flex items-center justify-between">
                      <span className="text-xs text-[#7D8F97]">
                        {new Date(pago.fecha_pago || pago.fecha_registro || Date.now()).toLocaleDateString('es-ES')}
                      </span>
                      <button
                        onClick={() => handleVerDetalle(pago)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#4D7182] hover:bg-[#3E5763] text-white text-xs font-bold shadow-sm transition-all"
                      >
                        <Eye size={14} />
                        <span>Ver Comprobante</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* SECCIÓN: Historial de Pagos Verificados */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-[#233D49]">
              Historial de Pagos Registrados
            </h2>

            <div className="bg-white rounded-2xl border border-[#CEC8B8] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#FAF8F5] border-b-2 border-[#CEC8B8] text-[11px] font-bold uppercase tracking-wider text-[#4D7182]">
                      <th className="py-3.5 px-5">Fecha</th>
                      <th className="py-3.5 px-5">Monto</th>
                      <th className="py-3.5 px-5">Concepto</th>
                      <th className="py-3.5 px-5">Método</th>
                      <th className="py-3.5 px-5">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#CEC8B8]/40 text-xs text-[#233D49]">
                    {pagosHistorial.map(pago => {
                      const isApproved = pago.estado === 'Aprobado';
                      return (
                        <tr key={pago.id} className="hover:bg-[#FAF8F2] transition-colors">
                          <td className="py-3.5 px-5 font-medium">
                            {new Date(pago.fecha_pago || pago.fecha_registro || Date.now()).toLocaleDateString('es-ES')}
                          </td>
                          <td className="py-3.5 px-5 font-bold text-sm">
                            ${Number(pago.monto).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3.5 px-5 font-medium">
                            {pago.concepto || 'Abono general'}
                          </td>
                          <td className="py-3.5 px-5 text-[#4D7182]">
                            {pago.metodo_pago || 'Transferencia'}
                          </td>
                          <td className="py-3.5 px-5">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              isApproved 
                                ? 'bg-[#4D9A72]/15 text-[#4D9A72] border border-[#4D9A72]/30' 
                                : 'bg-[#C95C5C]/15 text-[#C95C5C] border border-[#C95C5C]/30'
                            }`}>
                              {isApproved ? <CheckCircle size={12} /> : <XCircle size={12} />}
                              <span>{pago.estado}</span>
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {pagosHistorial.length === 0 && (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-[#7D8F97]">
                          No hay historial de pagos conciliados todavía.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

        </div>
      )}

      {/* Modal de Detalle y Verificación */}
      {isModalOpen && pagoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-[#CEC8B8] shadow-2xl space-y-5 animate-scale-up">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#CEC8B8]/60">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#4D7182]/10 text-[#4D7182] flex items-center justify-center">
                  <CreditCard size={18} />
                </div>
                <h3 className="text-lg font-bold text-[#233D49]">
                  Verificación de Comprobante
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-[#7D8F97] hover:bg-[#F3F0E4] hover:text-[#233D49] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Ficha técnica del pago */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-[#F3F0E4]/60 border border-[#CEC8B8] text-xs">
              <div>
                <span className="text-[#4D7182] font-semibold">Monto Depositado:</span>
                <p className="text-base font-extrabold text-[#233D49]">
                  ${Number(pagoSeleccionado.monto).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <span className="text-[#4D7182] font-semibold">Método:</span>
                <p className="text-sm font-bold text-[#233D49]">
                  {pagoSeleccionado.metodo_pago}
                </p>
              </div>
              <div className="col-span-2 pt-2 border-t border-[#CEC8B8]/40">
                <span className="text-[#4D7182] font-semibold">Concepto:</span>
                <p className="font-medium text-[#233D49]">
                  {pagoSeleccionado.concepto || 'Sin concepto especificado'}
                </p>
              </div>
            </div>

            {/* Visualizador del Comprobante */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#4D7182]">
                Comprobante de Pago
              </span>
              {pagoSeleccionado.comprobante_url ? (
                <div className="rounded-2xl border border-[#CEC8B8] overflow-hidden bg-[#F3F0E4]/40 p-2 text-center">
                  <img
                    src={pagoSeleccionado.comprobante_url}
                    alt="Comprobante de Pago"
                    className="max-h-60 mx-auto rounded-xl object-contain shadow-sm"
                  />
                  <div className="pt-2">
                    <a
                      href={pagoSeleccionado.comprobante_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#4D7182] hover:text-[#233D49]"
                    >
                      <ExternalLink size={12} />
                      <span>Abrir comprobante en tamaño completo</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-[#FAF8F2] border border-[#CEC8B8] text-center text-xs text-[#7D8F97]">
                  <p className="font-semibold text-[#233D49]">Sin comprobante digital adjunto</p>
                  <p className="mt-1">Si el pago fue en efectivo o posnet físico, valida el recibo de caja antes de aprobar.</p>
                </div>
              )}
            </div>

            {/* Acciones de Validación */}
            <div className="pt-3 border-t border-[#CEC8B8]/60 flex items-center gap-3">
              <button
                onClick={() => handleCambiarEstado(pagoSeleccionado.id, 'Aprobado')}
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[#4D9A72] hover:bg-[#3D825E] text-white text-xs font-bold shadow-sm transition-colors"
              >
                <CheckCircle size={16} />
                <span>Aprobar Abono</span>
              </button>

              <button
                onClick={() => handleCambiarEstado(pagoSeleccionado.id, 'Rechazado')}
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[#C95C5C] hover:bg-[#AF4E4E] text-white text-xs font-bold shadow-sm transition-colors"
              >
                <XCircle size={16} />
                <span>Rechazar Abono</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default PagosList;
