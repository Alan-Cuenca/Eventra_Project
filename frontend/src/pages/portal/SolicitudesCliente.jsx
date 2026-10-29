import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventraService } from '../../services/eventraService';
import { useAuth } from '../../context/AuthContext';
import {
  FileEdit,
  Send,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  Inbox,
  Loader2,
  RefreshCw,
  Building2,
} from 'lucide-react';
import logoImg from '../../assets/logo.png';

export const SolicitudesCliente = () => {
  const { user } = useAuth();
  const [eventos, setEventos] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  // Form State
  const [eventoId, setEventoId] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [eventosRes, solicitudesRes] = await Promise.all([
        eventraService.getEventos(),
        eventraService.getSolicitudes(),
      ]);

      const listaEventos = Array.isArray(eventosRes)
        ? eventosRes
        : (eventosRes?.data && Array.isArray(eventosRes.data) ? eventosRes.data : []);
      setEventos(listaEventos);

      if (listaEventos.length > 0 && !eventoId) {
        setEventoId(listaEventos[0].id);
      }

      const listaSolicitudes = Array.isArray(solicitudesRes)
        ? solicitudesRes
        : (solicitudesRes?.data && Array.isArray(solicitudesRes.data) ? solicitudesRes.data : []);
      setSolicitudes(listaSolicitudes);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setMensaje({ tipo: 'error', texto: 'No se pudieron sincronizar los datos del servidor.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!eventoId) {
      setMensaje({ tipo: 'error', texto: 'Por favor selecciona un evento asociado.' });
      return;
    }
    if (!descripcion.trim() || descripcion.trim().length < 10) {
      setMensaje({ tipo: 'error', texto: 'La descripción del cambio debe tener al menos 10 caracteres.' });
      return;
    }

    try {
      setSubmitting(true);
      setMensaje(null);

      await eventraService.crearSolicitud({
        evento_id: eventoId,
        descripcion: descripcion.trim(),
        descripcion_cambio: descripcion.trim(),
      });

      setMensaje({
        tipo: 'exito',
        texto: '¡Tu solicitud de modificación ha sido enviada con éxito! Te notificaremos a tu correo tan pronto sea resuelta.',
      });
      setDescripcion('');
      await cargarDatos();
    } catch (err) {
      console.error('Error enviando solicitud:', err);
      const errText = err.response?.data?.message || err.message || 'Error al enviar la solicitud.';
      setMensaje({ tipo: 'error', texto: errText });
    } finally {
      setSubmitting(false);
    }
  };

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

  const getBadgeIcon = (estado) => {
    switch (estado) {
      case 'Aprobada':
        return <CheckCircle2 size={13} className="text-[#4D9A72]" />;
      case 'Rechazada':
        return <XCircle size={13} className="text-[#C95C5C]" />;
      default:
        return <Clock size={13} className="text-[#9A7422]" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F0E4] text-[#233D49] flex flex-col font-sans selection:bg-[#4D7182] selection:text-white">
      {/* ── Top Bar ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-[#F3F0E4]/95 backdrop-blur-md border-b border-[#CEC8B8] px-4 sm:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={logoImg}
            alt="EVENTRA"
            className="w-10 h-10 rounded-xl bg-white p-1 border border-[#CEC8B8] object-contain shadow-sm"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-[#233D49]">EVENTRA</span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#4D7182]/15 text-[#4D7182]">
                Portal Cliente
              </span>
            </div>
            <span className="text-xs text-[#4D7182] font-medium hidden sm:block">
              Gestión de Cambios y Solicitudes
            </span>
          </div>
        </div>

        <Link
          to="/portal-cliente"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold text-[#4D7182] hover:text-[#233D49] bg-white border border-[#CEC8B8] transition-colors shadow-sm cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Volver al Portal</span>
        </Link>
      </header>

      {/* ── Contenedor Central ─────────────────────────────────── */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Banner de Cabecera */}
        <div className="bg-white rounded-2xl border border-[#ECE7D5] p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#4D7182]/10 text-[#4D7182] text-xs font-bold uppercase tracking-wider">
              <Sparkles size={14} /> Trazabilidad y Atención Directa
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#233D49]">
              Solicitudes de Modificación
            </h1>
            <p className="text-sm text-[#4D7182] max-w-2xl leading-relaxed">
              ¿Requieres cambios de horario, ajustes de menú, mobiliario adicional o servicios extra?
              Envía tu requerimiento aquí. Nuestro equipo lo evaluará y recibirás una notificación por correo al resolverse.
            </p>
          </div>

          <button
            type="button"
            onClick={cargarDatos}
            disabled={loading}
            className="self-start sm:self-center inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-[#F3F0E4] hover:bg-[#E8E3D2] text-[#233D49] border border-[#CEC8B8] transition-all cursor-pointer"
            title="Recargar historial"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>

        {/* Notificaciones / Feedback */}
        {mensaje && (
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 text-sm transition-all animate-fadeIn ${
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
            <div className="flex-1 font-medium">{mensaje.texto}</div>
            <button
              type="button"
              onClick={() => setMensaje(null)}
              className="text-[#4D7182] hover:text-[#233D49] text-xs font-semibold"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* ── Formulario de Envío de Solicitud ─────────────────── */}
        <section className="bg-white rounded-2xl border border-[#ECE7D5] p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-[#F3F0E4]">
            <FileEdit size={20} className="text-[#4D7182]" />
            <h2 className="text-lg font-bold text-[#233D49]">Crear Nueva Solicitud de Cambio</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Selector de Evento */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4D7182]">
                  Evento Asociado *
                </label>
                {eventos.length > 0 ? (
                  <select
                    value={eventoId}
                    onChange={(e) => setEventoId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F9F8F5] border border-[#CEC8B8] text-sm text-[#233D49] font-medium focus:outline-none focus:ring-2 focus:ring-[#4D7182] transition-colors"
                    required
                  >
                    {eventos.map((evt) => (
                      <option key={evt.id} value={evt.id}>
                        {evt.titulo || 'Evento'} {evt.fecha ? `(${new Date(evt.fecha).toLocaleDateString()})` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-[#F9F8F5] border border-[#CEC8B8] rounded-xl text-xs text-[#8A98A0]">
                    No se encontraron eventos activos vinculados a tu cuenta.
                  </div>
                )}
                <span className="text-[11px] text-[#8A98A0] block">
                  Elige el evento sobre el cual necesitas solicitar la modificación.
                </span>
              </div>

              {/* Tips o Recordatorio */}
              <div className="p-4 rounded-xl bg-[#F9F8F5] border border-[#ECE7D5] space-y-1.5 flex flex-col justify-center">
                <span className="text-xs font-bold text-[#233D49] flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-[#4D9A72]" /> Tiempos de Respuesta
                </span>
                <p className="text-xs text-[#4D7182] leading-relaxed">
                  Las solicitudes se atienden habitualmente en menos de 24 horas laborables. Para cambios críticos a menos de 48 horas del evento, sugerimos contactar directamente a tu coordinador.
                </p>
              </div>
            </div>

            {/* Textarea de Descripción */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4D7182]">
                Detalle de la Modificación Solicitada *
              </label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={4}
                placeholder="Describe con precisión qué ajustes necesitas (ejemplo: 'Requerimos cambiar la hora de inicio de 18:00 a 19:30 y solicitar 15 menús vegetarianos adicionales')."
                className="w-full p-4 rounded-xl bg-[#F9F8F5] border border-[#CEC8B8] text-sm text-[#233D49] font-normal placeholder-[#8A98A0] focus:outline-none focus:ring-2 focus:ring-[#4D7182] transition-colors leading-relaxed"
                required
              />
              <div className="flex justify-between items-center text-[11px] text-[#8A98A0]">
                <span>Mínimo 10 caracteres.</span>
                <span>{descripcion.length} caracteres</span>
              </div>
            </div>

            {/* Botón de Envío */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={submitting || eventos.length === 0}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#4D7182] hover:bg-[#3D5B6A] disabled:bg-[#CEC8B8] text-white text-sm font-semibold transition-all shadow-sm cursor-pointer disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Enviando Solicitud...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Enviar Solicitud</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* ── Historial de Solicitudes ─────────────────────────── */}
        <section className="bg-white rounded-2xl border border-[#ECE7D5] p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#F3F0E4]">
            <div className="flex items-center gap-2.5">
              <Inbox size={20} className="text-[#4D7182]" />
              <h2 className="text-lg font-bold text-[#233D49]">Historial de Solicitudes</h2>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#F3F0E4] text-[#4D7182]">
              {solicitudes.length} registradas
            </span>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-sm text-[#8A98A0]">
              <Loader2 size={24} className="animate-spin text-[#4D7182]" />
              <span>Cargando tus solicitudes registradas...</span>
            </div>
          ) : solicitudes.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#F9F8F5] border border-[#CEC8B8] flex items-center justify-center text-[#8A98A0]">
                <Inbox size={28} />
              </div>
              <h3 className="text-base font-bold text-[#233D49]">No hay solicitudes registradas</h3>
              <p className="text-xs text-[#8A98A0] max-w-sm mx-auto">
                Cuando envíes una solicitud de modificación sobre tus eventos, aparecerá en esta lista con su estado en tiempo real.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {solicitudes.map((sol) => (
                <div
                  key={sol.id}
                  className="p-5 rounded-xl bg-[#F9F8F5] border border-[#ECE7D5] hover:border-[#CEC8B8] transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#233D49]">
                        {sol.evento_titulo || 'Evento Registrado'}
                      </span>
                      {sol.fecha_evento && (
                        <span className="text-xs text-[#8A98A0] hidden sm:inline">
                          • {new Date(sol.fecha_evento).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getBadgeStyle(
                          sol.estado
                        )}`}
                      >
                        {getBadgeIcon(sol.estado)}
                        {sol.estado || 'Pendiente'}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-[#233D49] leading-relaxed bg-white p-3.5 rounded-lg border border-[#ECE7D5]">
                    "{sol.descripcion_cambio || sol.descripcion}"
                  </p>

                  <div className="flex items-center justify-between text-xs text-[#8A98A0] pt-1">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      Enviada:{' '}
                      {sol.fecha_solicitud
                        ? new Date(sol.fecha_solicitud).toLocaleString('es-ES', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })
                        : 'Reciente'}
                    </span>
                    <span className="text-[11px] font-medium text-[#4D7182]">
                      ID: {String(sol.id).substring(0, 8)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default SolicitudesCliente;

