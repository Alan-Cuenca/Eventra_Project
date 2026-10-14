import React, { useState, useEffect } from 'react';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { eventraService } from '../../services/eventraService';
import { Calendar, Search, Filter, Plus, User, Phone, Eye, ArrowUpRight, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const EventsPage = () => {
  const navigate = useNavigate();
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
      <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 1rem', color: 'var(--primary)' }} />
        <p style={{ fontWeight: 600 }}>Cargando catálogo de eventos...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Gestión de Eventos y Recepciones</h1>
          <p>Supervisión del progreso, reservas, pagos y coordinación operativa.</p>
        </div>
        <Link to="/cotizador" className="btn btn-primary">
          <Plus size={16} />
          <span>Nuevo Evento</span>
        </Link>
      </div>

      {error && (
        <div
          style={{
            padding: '1rem',
            background: 'var(--danger-light)',
            color: 'var(--danger)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: '1px solid rgba(201,92,92,0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <button className="btn btn-outline btn-sm" onClick={fetchEventos}>
            Reintentar
          </button>
        </div>
      )}

      {/* Barra de Filtros y Búsqueda */}
      <Card style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.4rem' }}
              placeholder="Buscar por cliente, título o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search
              size={18}
              style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Filter size={16} color="var(--text-secondary)" />
            <select
              className="form-select"
              style={{ width: 'auto' }}
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
      </Card>

      {/* Grid de Eventos */}
      {filteredEvents.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <Sparkles size={36} color="var(--primary)" style={{ margin: '0 auto 1rem', opacity: 0.6 }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
            No se encontraron eventos
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
            {searchTerm || filterStatus !== 'all'
              ? 'Prueba ajustando los términos de búsqueda o filtros para encontrar eventos existentes.'
              : 'Aún no hay eventos registrados en la empresa. Comienza creando uno nuevo con el cotizador.'}
          </p>
          <Link to="/cotizador" className="btn btn-primary">
            <Plus size={16} /> Crear Primer Evento
          </Link>
        </Card>
      ) : (
        <div className="grid-cols-2">
          {filteredEvents.map((evt) => {
            const rawMonto = parseFloat(evt.monto_total ?? evt.total ?? 0);
            const totalFmt = isNaN(rawMonto) ? '0.00' : rawMonto.toFixed(2);

            const rawSaldo = parseFloat(evt.saldo_pendiente ?? evt.saldo ?? 0);
            const saldoFmt = isNaN(rawSaldo) ? '0.00' : rawSaldo.toFixed(2);

            const rawProgreso = Number(evt.progreso_porcentaje ?? evt.progreso ?? 0);
            const progreso = isNaN(rawProgreso) ? 0 : Math.min(100, Math.max(0, Math.round(rawProgreso)));

            const fechaFmt = evt.fecha || (evt.fecha_evento ? new Date(evt.fecha_evento).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Por definir');
            const clienteFmt = evt.cliente_nombre || (evt.cliente ? `${evt.cliente.nombres || ''} ${evt.cliente.apellidos || ''}`.trim() : 'Cliente Registrado');
            const telefonoFmt = evt.cliente_telefono || evt.cliente?.telefono || 'No registrado';
            const tipoFmt = evt.tipo || evt.salon_o_lugar || 'Evento Social';
            const estadoFmt = evt.estado || evt.estado_progreso || evt.reserva_estado || 'Confirmado';

            const badgeVariant =
              estadoFmt.toLowerCase().includes('confirmado') || estadoFmt.toLowerCase().includes('finalizado')
                ? 'success'
                : estadoFmt.toLowerCase().includes('progreso') || estadoFmt.toLowerCase().includes('preparación')
                ? 'primary'
                : 'warning';

            return (
              <div
                key={evt.id}
                className="card interactive"
                onClick={() => navigate(`/eventos/${evt.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '0.5rem' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      #{evt.id} • {tipoFmt}
                    </span>
                    <h3 style={{ fontSize: '1.2rem', marginTop: '0.2rem', color: 'var(--text-primary)' }}>
                      {evt.titulo || 'Evento sin título'}
                    </h3>
                  </div>
                  <Badge variant={badgeVariant}>
                    {estadoFmt}
                  </Badge>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={15} color="var(--primary)" style={{ flexShrink: 0 }} />
                    <span>
                      Fecha: <strong style={{ color: 'var(--text-primary)' }}>{fechaFmt}</strong> ({evt.invitados || 100} invitados)
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <User size={15} color="var(--primary)" style={{ flexShrink: 0 }} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Cliente: {clienteFmt}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Phone size={15} color="var(--primary)" style={{ flexShrink: 0 }} />
                    <span>Contacto: {telefonoFmt}</span>
                  </div>
                </div>

                {/* Barra de progreso */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '0.35rem', fontWeight: 600 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Progreso organizativo</span>
                    <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{progreso}%</span>
                  </div>
                  <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{ width: `${progreso}%` }} />
                  </div>
                </div>

                {/* Resumen Financiero + acción */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.875rem', borderTop: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.8rem' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total</span>
                    <div style={{ fontWeight: 800, color: 'var(--primary-dark)', fontFamily: 'Outfit, sans-serif' }}>
                      ${totalFmt}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Saldo</span>
                    <div style={{ fontWeight: 800, color: parseFloat(saldoFmt) > 0 ? 'var(--warning)' : 'var(--success)', fontFamily: 'Outfit, sans-serif' }}>
                      ${saldoFmt}
                    </div>
                  </div>
                  <Link
                    to={`/eventos/${evt.id}`}
                    className="btn btn-primary btn-sm"
                    onClick={(e) => e.stopPropagation()}
                    id={`ver-evento-${evt.id}`}
                  >
                    <Eye size={14} /> Ver detalle
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
