import React, { useState, useEffect } from 'react';
import { eventraService } from '../../services/eventraService';
import { Calendar, Search, Filter, Plus, User, Phone, Eye, Loader2, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const EventsPage = () => {
  const navigate = useNavigate();
  const { isAdmin, isGerente } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchEventos = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await eventraService.getEventos();
      const list = Array.isArray(data) ? data : (data?.data && Array.isArray(data.data) ? data.data : []);
      setEventos(list);
    } catch (err) {
      setError(err.message || 'Error al cargar eventos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventos();
  }, []);

  const safeEvents = Array.isArray(eventos) ? eventos : [];

  const filteredEvents = safeEvents.filter((evt) => {
    const titulo = evt.titulo || evt.nombre || '';
    const cliNombre = evt.cliente_nombre || (evt.cliente ? `${evt.cliente.nombres || ''} ${evt.cliente.apellidos || ''}` : '') || '';
    const eid = String(evt.id || '');

    const matchesSearch =
      titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eid.toLowerCase().includes(searchTerm.toLowerCase());

    const estado = (evt.estado || evt.estado_progreso || evt.reserva_estado || '').toLowerCase();
    const matchesStatus =
      filterStatus === 'all' ||
      estado.includes(filterStatus.toLowerCase());

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="py-24 text-center text-[var(--ev-text-muted)] space-y-3">
        <Loader2 className="animate-spin mx-auto text-[var(--ev-primary)]" size={32} />
        <p className="font-semibold text-xs text-[var(--ev-text-main)]">Cargando catálogo de eventos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-[var(--ev-text-main)]">
      {/* ── Cabecera de Página (Apple HIG) ───────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--ev-border)]/50">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--ev-text-main)] tracking-tight">
            Gestión de Eventos y Recepciones
          </h1>
          <p className="text-xs sm:text-sm text-[var(--ev-text-muted)] mt-1">
            Supervisión del progreso, reservas, pagos y coordinación operativa.
          </p>
        </div>
        {(isAdmin || isGerente) && (
          <Link
            to="/cotizador"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[var(--ev-primary)] hover:bg-[var(--ev-primary-hover)] text-white text-xs font-semibold shadow-xs hover:shadow-sm active:scale-[0.98] transition-transform duration-150 shrink-0 border-0 focus:outline-none"
          >
            <Plus size={15} />
            <span>Nuevo Evento</span>
          </Link>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-[var(--danger)]/10 text-[var(--danger)] border border-[var(--danger)]/30 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchEventos}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--ev-surface)] text-[var(--ev-text-main)] text-xs font-semibold hover:bg-[var(--ev-surface-elevated)] shadow-2xs active:scale-[0.98] transition-transform duration-150 border-0 focus:outline-none"
          >
            <RefreshCw size={13} />
            <span>Reintentar</span>
          </button>
        </div>
      )}

      {/* ── Barra de Búsqueda y Filtros ──────────────────────────── */}
      <div className="bg-[var(--ev-surface)] rounded-2xl border border-[var(--ev-border)]/60 p-3.5 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ev-text-muted)]" />
          <input
            type="text"
            className="w-full pl-9 pr-4 py-2 text-xs rounded-full border border-[var(--ev-border)]/60 bg-[var(--ev-bg-base)]/30 focus:bg-[var(--ev-surface)] focus:border-[var(--ev-primary)] text-[var(--ev-text-main)] placeholder-[var(--ev-text-muted)] focus:outline-none transition-colors"
            placeholder="Buscar por cliente, título o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={14} className="text-[var(--ev-text-muted)]" />
          <select
            className="px-4 py-2 text-xs rounded-full border border-[var(--ev-border)]/60 bg-[var(--ev-surface)] text-[var(--ev-text-main)] font-medium focus:outline-none focus:border-[var(--ev-primary)] cursor-pointer"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Todos los Estados</option>
            <option value="confirmado">Confirmados</option>
            <option value="preparación">En preparación</option>
            <option value="cotización">Cotización</option>
            <option value="progreso">En Progreso</option>
          </select>
        </div>
      </div>

      {/* ── Grid de Eventos ───────────────────────────────────────── */}
      {filteredEvents.length === 0 ? (
        <div className="p-12 text-center bg-[var(--ev-surface)] rounded-3xl border border-[var(--ev-border)]/60 shadow-xs space-y-3">
          <Sparkles size={32} className="mx-auto text-[var(--ev-primary)]/70" />
          <h3 className="text-base font-bold text-[var(--ev-text-main)]">
            No se encontraron eventos
          </h3>
          <p className="text-xs text-[var(--ev-text-muted)] max-w-sm mx-auto">
            {searchTerm || filterStatus !== 'all'
              ? 'Prueba ajustando los términos de búsqueda o filtros para encontrar eventos existentes.'
              : 'Aún no hay eventos registrados en la empresa. Comienza creando uno nuevo con el cotizador.'}
          </p>
          <div className="pt-2">
            <Link
              to="/cotizador"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[var(--ev-primary)] hover:bg-[var(--ev-primary-hover)] text-white text-xs font-semibold shadow-xs active:scale-[0.98] transition-transform duration-150"
            >
              <Plus size={15} />
              <span>Crear Primer Evento</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredEvents.map((evt) => {
            const rawMonto = parseFloat(evt.monto_total ?? evt.total ?? 0);
            const totalFmt = isNaN(rawMonto) ? '0.00' : rawMonto.toFixed(2);

            const rawSaldo = parseFloat(evt.saldo_pendiente ?? evt.saldo ?? 0);
            const saldoFmt = isNaN(rawSaldo) ? '0.00' : rawSaldo.toFixed(2);

            const rawProgreso = Number(evt.progreso_porcentaje ?? evt.progreso ?? 0);
            const progreso = isNaN(rawProgreso) ? 0 : Math.min(100, Math.max(0, Math.round(rawProgreso)));

            const rawFecha = evt.fecha_evento || evt.fecha;
            let fechaFmt = 'Por definir';
            if (rawFecha) {
              const parsed = new Date(rawFecha);
              if (!isNaN(parsed.getTime())) {
                fechaFmt = parsed.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
              }
            }

            const clienteFmt = evt.cliente_nombre || (evt.cliente ? `${evt.cliente.nombres || ''} ${evt.cliente.apellidos || ''}`.trim() : 'Cliente Registrado');
            const telefonoFmt = evt.cliente_telefono || evt.cliente?.telefono || 'No registrado';
            const tipoFmt = evt.tipo || evt.salon_o_lugar || 'Evento Social';
            const estadoFmt = evt.estado || evt.estado_progreso || evt.reserva_estado || 'Confirmado';

            const isSuccess = estadoFmt.toLowerCase().includes('confirmado') || estadoFmt.toLowerCase().includes('finalizado');
            const isProgress = estadoFmt.toLowerCase().includes('progreso') || estadoFmt.toLowerCase().includes('preparación');

            const badgeStyle = isSuccess
              ? 'bg-[#4D9A72]/15 text-[#2E6F4E] border-0'
              : isProgress
              ? 'bg-[var(--ev-primary)]/15 text-[var(--ev-primary)] border-0'
              : 'bg-[#C49A3A]/15 text-[#9A7422] border-0';

            return (
              <div
                key={evt.id}
                onClick={() => navigate(`/eventos/${evt.id}`)}
                className="group bg-[var(--ev-surface)] rounded-2xl border border-[var(--ev-border)]/60 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden"
              >
                {/* Cabecera de la tarjeta */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-mono text-[var(--ev-text-muted)] block truncate mb-1">
                        #{evt.id} • {tipoFmt}
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-[var(--ev-text-main)] tracking-tight truncate group-hover:text-[var(--ev-primary)] transition-colors">
                        {evt.titulo || 'Evento sin título'}
                      </h3>
                    </div>
                    <span className={`shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badgeStyle}`}>
                      {estadoFmt}
                    </span>
                  </div>

                  {/* Metadatos */}
                  <div className="space-y-1.5 text-xs text-[var(--ev-text-muted)] mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-[var(--ev-primary)] shrink-0" />
                      <span className="truncate">
                        Fecha: <strong className="text-[var(--ev-text-main)] font-semibold">{fechaFmt}</strong> ({evt.invitados || 100} invitados)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-[var(--ev-primary)] shrink-0" />
                      <span className="truncate">Cliente: <strong className="text-[var(--ev-text-main)] font-medium">{clienteFmt}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-[var(--ev-primary)] shrink-0" />
                      <span className="truncate">Contacto: {telefonoFmt}</span>
                    </div>
                  </div>

                  {/* Barra de progreso sin degradados arcade */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-[11px] font-semibold mb-1.5">
                      <span className="text-[var(--ev-text-muted)]">Progreso organizativo</span>
                      <span className="text-[var(--ev-primary)] font-mono tabular-nums">{progreso}%</span>
                    </div>
                    <div className="w-full bg-[var(--ev-border)]/30 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--ev-primary)] transition-all duration-300"
                        style={{ width: `${progreso}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Resumen Financiero y Botón de Acción Landing Pro */}
                <div className="pt-3.5 border-t border-[var(--ev-border)]/50 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-[var(--ev-text-muted)] block">Total</span>
                      <span className="text-sm font-extrabold text-[var(--ev-text-main)] font-mono tabular-nums">
                        ${totalFmt}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-[var(--ev-text-muted)] block">Saldo</span>
                      <span className={`text-sm font-extrabold font-mono tabular-nums ${parseFloat(saldoFmt) > 0 ? 'text-[#C49A3A]' : 'text-[#4D9A72]'}`}>
                        ${saldoFmt}
                      </span>
                    </div>
                  </div>

                  <Link
                    to={`/eventos/${evt.id}`}
                    onClick={(e) => e.stopPropagation()}
                    id={`ver-evento-${evt.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--ev-primary)] hover:bg-[var(--ev-primary-hover)] text-white text-xs font-semibold shadow-xs hover:shadow-sm active:scale-[0.98] transition-transform duration-150 shrink-0 border-0 focus:outline-none"
                  >
                    <Eye size={13} />
                    <span>Ver detalle</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EventsPage;
