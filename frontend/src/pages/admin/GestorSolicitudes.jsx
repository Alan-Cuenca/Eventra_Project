import React, { useState, useEffect } from 'react';
import { eventraService } from '../../services/eventraService';
import {
  FileEdit,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Calendar,
  User,
  Inbox,
  ArrowUpRight,
  Loader2,
  X,
  Mail,
  ChevronRight,
} from 'lucide-react';

export const GestorSolicitudes = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todas');
  const [mensaje, setMensaje] = useState(null);

  // Modal para detalle completo
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);

  const cargarSolicitudes = async () => {
    try {
      setLoading(true);
      const data = await eventraService.getSolicitudes();
      const list = Array.isArray(data)
        ? data
        : (data?.data && Array.isArray(data.data) ? data.data : []);
      setSolicitudes(list);
    } catch (err) {
      console.error('Error al cargar solicitudes:', err);
      setMensaje({ tipo: 'error', texto: 'Error al sincronizar solicitudes con el servidor.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const handleCambiarEstado = async (id, nuevoEstado) => {
    try {
      setUpdatingId(id);
      setMensaje(null);

      await eventraService.actualizarEstadoSolicitud(id, nuevoEstado);

      setMensaje({
        tipo: 'exito',
        texto: `Solicitud ${nuevoEstado === 'Aprobada' ? 'aprobada' : 'rechazada'} exitosamente. Se ha enviado una notificación automática por correo al cliente.`,
      });

      // Actualizar estado local inmediatamente
      setSolicitudes((prev) =>
        prev.map((s) => (s.id === id ? { ...s, estado: nuevoEstado } : s))
      );

      if (solicitudSeleccionada?.id === id) {
        setSolicitudSeleccionada((prev) => (prev ? { ...prev, estado: nuevoEstado } : null));
      }
    } catch (err) {
      console.error('Error al actualizar estado:', err);
      const msg = err.response?.data?.message || err.message || 'Error al actualizar estado.';
      setMensaje({ tipo: 'error', texto: msg });
    } finally {
      setUpdatingId(null);
    }
  };

  // KPIs
  const pendientes = solicitudes.filter((s) => (s.estado || 'Pendiente') === 'Pendiente').length;
  const aprobadas = solicitudes.filter((s) => s.estado === 'Aprobada').length;
  const rechazadas = solicitudes.filter((s) => s.estado === 'Rechazada').length;
  const total = solicitudes.length;

  // Filtrado
  const solicitudesFiltradas = solicitudes.filter((sol) => {
    const estado = sol.estado || 'Pendiente';
    const cumpleFiltro = filtroEstado === 'Todas' || estado === filtroEstado;
    if (!cumpleFiltro) return false;

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const cliente = (sol.cliente || sol.cliente_email || '').toLowerCase();
    const evento = (sol.evento_titulo || '').toLowerCase();
    const desc = (sol.descripcion_cambio || sol.descripcion || '').toLowerCase();

    return cliente.includes(term) || evento.includes(term) || desc.includes(term);
  });

  const getBadgeStyle = (estado) => {
    switch (estado) {
      case 'Aprobada':
        return 'bg-[#4D9A72]/15 text-[#4D9A72] border-[#4D9A72]/30';
      case 'Rechazada':
        return 'bg-[#C95C5C]/15 text-[#C95C5C] border-[#C95C5C]/30';
      default:
        return 'bg-[#C49A3A]/15 text-[#9A7422] border-[#C49A3A]/30';
    }
  };

  return (
    <div className="space-y-8 font-sans text-[#233D49]">
      {/* ── Cabecera Principal ───────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#ECE7D5]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#233D49]">
              Gestor de Solicitudes de Modificación
            </h1>
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#4D7182]/15 text-[#4D7182]">
              Auditoría
            </span>
          </div>
          <p className="text-sm text-[#4D7182] mt-1">
            Supervisa, audita y valida las peticiones de cambios formuladas por los clientes sobre sus recepciones.
          </p>
        </div>

        <button
          type="button"
          onClick={cargarSolicitudes}
          disabled={loading}
          className="self-start sm:self-center inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#CEC8B8] hover:bg-[#F3F0E4] text-[#233D49] text-xs font-semibold shadow-sm transition-all cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-[#4D7182]' : ''} />
          <span>Sincronizar</span>
        </button>
      </div>

      {/* ── Alertas / Toasts ─────────────────────────────────── */}
      {mensaje && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 text-sm animate-fadeIn ${
            mensaje.tipo === 'exito'
              ? 'bg-[#4D9A72]/15 border-[#4D9A72]/30 text-[#233D49]'
              : 'bg-[#C95C5C]/15 border-[#C95C5C]/30 text-[#233D49]'
          }`}
        >
          {mensaje.tipo === 'exito' ? (
            <CheckCircle2 size={18} className="text-[#4D9A72] shrink-0 mt-0.5" />
          ) : (
            <AlertCircle size={18} className="text-[#C95C5C] shrink-0 mt-0.5" />
          )}
          <span className="flex-1 font-medium">{mensaje.texto}</span>
          <button
            type="button"
            onClick={() => setMensaje(null)}
            className="text-[#4D7182] hover:text-[#233D49] text-xs font-semibold"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* ── KPI Cards (Estilo Toss) ─────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card: Pendientes (Destacada) */}
        <div className="p-6 rounded-2xl bg-white border border-[#C49A3A]/40 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#9A7422]">
              Pendientes
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#C49A3A]/15 text-[#9A7422] flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-extrabold tracking-tight text-[#233D49]">{pendientes}</div>
            <p className="text-xs text-[#8A98A0]">Peticiones que requieren tu resolución</p>
          </div>
          {pendientes > 0 && (
            <div className="mt-3 pt-3 border-t border-[#ECE7D5] flex items-center gap-1.5 text-xs font-semibold text-[#9A7422]">
              <span className="w-2 h-2 rounded-full bg-[#C49A3A] animate-pulse"></span>
              Atención requerida
            </div>
          )}
        </div>

        {/* Card: Aprobadas */}
        <div className="p-6 rounded-2xl bg-white border border-[#ECE7D5] shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#4D7182]">
              Aprobadas
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#4D9A72]/15 text-[#4D9A72] flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-extrabold tracking-tight text-[#233D49]">{aprobadas}</div>
            <p className="text-xs text-[#8A98A0]">Cambios aceptados y vigentes</p>
          </div>
        </div>

        {/* Card: Rechazadas */}
        <div className="p-6 rounded-2xl bg-white border border-[#ECE7D5] shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#4D7182]">
              Rechazadas
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#C95C5C]/15 text-[#C95C5C] flex items-center justify-center">
              <XCircle size={16} />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-extrabold tracking-tight text-[#233D49]">{rechazadas}</div>
            <p className="text-xs text-[#8A98A0]">Peticiones no factibles denegadas</p>
          </div>
        </div>

        {/* Card: Total */}
        <div className="p-6 rounded-2xl bg-white border border-[#ECE7D5] shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#4D7182]">
              Total Solicitudes
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#4D7182]/15 text-[#4D7182] flex items-center justify-center">
              <FileEdit size={16} />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-extrabold tracking-tight text-[#233D49]">{total}</div>
            <p className="text-xs text-[#8A98A0]">Historial acumulado de la empresa</p>
          </div>
        </div>
      </div>

      {/* ── Barra de Búsqueda y Filtros ──────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#ECE7D5] p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A98A0]" />
          <input
            type="text"
            placeholder="Buscar por cliente, evento o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#F9F8F5] border border-[#CEC8B8] text-sm text-[#233D49] placeholder-[#8A98A0] focus:outline-none focus:ring-2 focus:ring-[#4D7182]"
          />
        </div>

        {/* Filtros por Estado */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['Todas', 'Pendiente', 'Aprobada', 'Rechazada'].map((estado) => (
            <button
              key={estado}
              type="button"
              onClick={() => setFiltroEstado(estado)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                filtroEstado === estado
                  ? 'bg-[#4D7182] text-white shadow-sm'
                  : 'bg-[#F9F8F5] text-[#4D7182] hover:bg-[#ECE7D5]'
              }`}
            >
              {estado === 'Todas' ? 'Todas' : estado}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tabla Densa Empresarial ─────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#ECE7D5] shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-sm text-[#8A98A0]">
            <Loader2 size={24} className="animate-spin text-[#4D7182]" />
            <span>Sincronizando solicitudes...</span>
          </div>
        ) : solicitudesFiltradas.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#F9F8F5] border border-[#CEC8B8] flex items-center justify-center text-[#8A98A0]">
              <Inbox size={26} />
            </div>
            <h3 className="text-base font-bold text-[#233D49]">No se encontraron solicitudes</h3>
            <p className="text-xs text-[#8A98A0] max-w-sm mx-auto">
              No hay solicitudes de modificación que coincidan con los criterios de búsqueda o filtro aplicados.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#ECE7D5] bg-[#F9F8F5] text-[#4D7182] text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Fecha</th>
                  <th className="py-3.5 px-4 sm:px-6">Cliente</th>
                  <th className="py-3.5 px-4 sm:px-6">Evento Vinculado</th>
                  <th className="py-3.5 px-4 sm:px-6">Modificación Solicitada</th>
                  <th className="py-3.5 px-4 sm:px-6 text-center">Estado</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Acciones Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F0E4]">
                {solicitudesFiltradas.map((sol) => {
                  const estado = sol.estado || 'Pendiente';
                  const esPendiente = estado === 'Pendiente';
                  const isUpdating = updatingId === sol.id;

                  return (
                    <tr
                      key={sol.id}
                      className="hover:bg-[#F9F8F5]/80 transition-colors group text-[#233D49]"
                    >
                      {/* Fecha */}
                      <td className="py-4 px-4 sm:px-6 whitespace-nowrap text-xs text-[#4D7182]">
                        <div className="font-semibold text-[#233D49]">
                          {sol.fecha_solicitud
                            ? new Date(sol.fecha_solicitud).toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'N/A'}
                        </div>
                        <div className="text-[11px] text-[#8A98A0]">
                          {sol.fecha_solicitud
                            ? new Date(sol.fecha_solicitud).toLocaleTimeString('es-ES', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : ''}
                        </div>
                      </td>

                      {/* Cliente */}
                      <td className="py-4 px-4 sm:px-6 text-xs">
                        <div className="font-bold text-[#233D49]">{sol.cliente || 'Cliente'}</div>
                        <div className="text-[#8A98A0] text-[11px] truncate max-w-[160px]">
                          {sol.cliente_email || 'Sin correo registrado'}
                        </div>
                      </td>

                      {/* Evento */}
                      <td className="py-4 px-4 sm:px-6 text-xs">
                        <div className="font-semibold text-[#233D49]">
                          {sol.evento_titulo || 'Evento'}
                        </div>
                        {sol.fecha_evento && (
                          <div className="text-[#8A98A0] text-[11px] flex items-center gap-1">
                            <Calendar size={11} />
                            {new Date(sol.fecha_evento).toLocaleDateString()}
                          </div>
                        )}
                      </td>

                      {/* Descripción */}
                      <td className="py-4 px-4 sm:px-6 text-xs max-w-xs">
                        <p className="line-clamp-2 text-[#233D49] leading-relaxed">
                          "{sol.descripcion_cambio || sol.descripcion}"
                        </p>
                        <button
                          type="button"
                          onClick={() => setSolicitudSeleccionada(sol)}
                          className="text-[11px] text-[#4D7182] hover:text-[#233D49] font-semibold mt-1 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye size={12} /> Ver completo
                        </button>
                      </td>

                      {/* Badge Estado */}
                      <td className="py-4 px-4 sm:px-6 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getBadgeStyle(
                            estado
                          )}`}
                        >
                          {estado === 'Aprobada' ? (
                            <CheckCircle2 size={12} />
                          ) : estado === 'Rechazada' ? (
                            <XCircle size={12} />
                          ) : (
                            <Clock size={12} />
                          )}
                          {estado}
                        </span>
                      </td>

                      {/* Botones de Acción */}
                      <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                        {esPendiente ? (
                          <div className="inline-flex items-center gap-2">
                            {/* Botón Aprobar (Verde #4D9A72) */}
                            <button
                              type="button"
                              onClick={() => handleCambiarEstado(sol.id, 'Aprobada')}
                              disabled={isUpdating}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#4D9A72] hover:bg-[#3D7E5C] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                              title="Aprobar modificación y notificar por correo"
                            >
                              {isUpdating ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <CheckCircle2 size={13} />
                              )}
                              <span>Aprobar</span>
                            </button>

                            {/* Botón Rechazar (Rojo #C95C5C) */}
                            <button
                              type="button"
                              onClick={() => handleCambiarEstado(sol.id, 'Rechazada')}
                              disabled={isUpdating}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C95C5C] hover:bg-[#A84747] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                              title="Rechazar modificación y notificar por correo"
                            >
                              <XCircle size={13} />
                              <span>Rechazar</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-[#8A98A0] italic">
                            Resuelta ({estado})
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal de Detalle Completo ────────────────────────── */}
      {solicitudSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl border border-[#ECE7D5] max-w-lg w-full p-6 shadow-2xl space-y-6 animate-scaleIn">
            <div className="flex items-center justify-between pb-3 border-b border-[#ECE7D5]">
              <div className="flex items-center gap-2">
                <FileEdit size={20} className="text-[#4D7182]" />
                <h3 className="font-bold text-base text-[#233D49]">Detalle de la Solicitud</h3>
              </div>
              <button
                type="button"
                onClick={() => setSolicitudSeleccionada(null)}
                className="p-1 rounded-lg text-[#8A98A0] hover:text-[#233D49] hover:bg-[#F3F0E4] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Evento */}
              <div className="p-3.5 rounded-xl bg-[#F9F8F5] border border-[#ECE7D5] space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#4D7182]">
                  Evento Planificado
                </span>
                <p className="font-bold text-sm text-[#233D49]">
                  {solicitudSeleccionada.evento_titulo || 'Evento Registrado'}
                </p>
                {solicitudSeleccionada.fecha_evento && (
                  <p className="text-[#8A98A0]">
                    Fecha de la recepción:{' '}
                    {new Date(solicitudSeleccionada.fecha_evento).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* Cliente */}
              <div className="p-3.5 rounded-xl bg-[#F9F8F5] border border-[#ECE7D5] space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#4D7182]">
                  Solicitado Por
                </span>
                <p className="font-semibold text-sm text-[#233D49]">
                  {solicitudSeleccionada.cliente || 'Cliente'}
                </p>
                <p className="text-[#8A98A0] flex items-center gap-1.5">
                  <Mail size={12} /> {solicitudSeleccionada.cliente_email || 'Sin correo asociado'}
                </p>
              </div>

              {/* Contenido Completo del Cambio */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#4D7182]">
                  Descripción Completa del Cambio
                </span>
                <div className="p-4 rounded-xl bg-white border border-[#CEC8B8] text-sm text-[#233D49] leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {solicitudSeleccionada.descripcion_cambio || solicitudSeleccionada.descripcion}
                </div>
              </div>

              {/* Estado actual */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-[#8A98A0]">Estado Actual:</span>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getBadgeStyle(
                    solicitudSeleccionada.estado
                  )}`}
                >
                  {solicitudSeleccionada.estado || 'Pendiente'}
                </span>
              </div>
            </div>

            {/* Acciones dentro del modal si está pendiente */}
            {(solicitudSeleccionada.estado || 'Pendiente') === 'Pendiente' ? (
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#ECE7D5]">
                <button
                  type="button"
                  onClick={() => handleCambiarEstado(solicitudSeleccionada.id, 'Rechazada')}
                  disabled={updatingId === solicitudSeleccionada.id}
                  className="px-4 py-2 rounded-xl bg-[#C95C5C] hover:bg-[#A84747] text-white text-xs font-semibold transition-all cursor-pointer"
                >
                  Rechazar Solicitud
                </button>
                <button
                  type="button"
                  onClick={() => handleCambiarEstado(solicitudSeleccionada.id, 'Aprobada')}
                  disabled={updatingId === solicitudSeleccionada.id}
                  className="px-4 py-2 rounded-xl bg-[#4D9A72] hover:bg-[#3D7E5C] text-white text-xs font-semibold transition-all cursor-pointer shadow-sm"
                >
                  Aprobar Solicitud
                </button>
              </div>
            ) : (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setSolicitudSeleccionada(null)}
                  className="px-5 py-2 rounded-xl bg-[#F3F0E4] hover:bg-[#ECE7D5] text-[#233D49] text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GestorSolicitudes;
