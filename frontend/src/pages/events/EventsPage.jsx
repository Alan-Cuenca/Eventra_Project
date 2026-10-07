import React, { useState, useEffect } from 'react';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { eventraService } from '../../services/eventraService';
import { Calendar, Search, Filter, Plus, User, Phone, Eye, ArrowUpRight, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const EventsPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEventos = async () => {
      try {
        const data = await eventraService.getEventos();
        setEventos(data);
      } catch (err) {
        setError(err.message || 'Error al cargar eventos.');
      } finally {
        setLoading(false);
      }
    };
    fetchEventos();
  }, []);

  const filteredEvents = eventos.filter((evt) => {
    const titulo = evt.titulo || evt.nombre || '';
    const cliNombre = evt.cliente?.nombres || evt.cliente_nombre || '';
    const eid = String(evt.id);

    const matchesSearch =
      titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eid.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || evt.estado === filterStatus || evt.estado_progreso === filterStatus;

    return matchesSearch && matchesStatus;
  });

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}><Loader2 className="animate-spin" /> Cargando eventos...</div>;
  if (error) return <div style={{ padding: '2rem', color: 'red', textAlign: 'center' }}>{error}</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Gestión de Eventos y Recepciones</h1>
          <p>Supervisión del progreso, reservas, pagos y coordinación de actividades.</p>
        </div>
        <Link to="/cotizador" className="btn btn-primary">
          <Plus size={16} />
          <span>Nuevo Evento</span>
        </Link>
      </div>

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
              <option value="Confirmado">Confirmados</option>
              <option value="En preparación">En preparación</option>
              <option value="Cotización">Cotización</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Grid de Eventos */}
      <div className="grid-cols-2">
        {filteredEvents.map((evt) => (
          <div key={evt.id} className="card interactive" onClick={() => navigate(`/eventos/${evt.id}`)} style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{evt.id} • {evt.tipo}</span>
                <h3 style={{ fontSize: '1.25rem', marginTop: '0.2rem' }}>{evt.titulo}</h3>
              </div>
              <Badge
                variant={
                  evt.estado === 'Confirmado'
                    ? 'success'
                    : evt.estado === 'En preparación'
                    ? 'primary'
                    : 'warning'
                }
              >
                {evt.estado}
              </Badge>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={15} color="var(--primary)" />
                <span>Fecha: <strong style={{ color: 'var(--text-primary)' }}>{evt.fecha}</strong> ({evt.invitados} invitados)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={15} color="var(--primary)" />
                <span>Cliente: {evt.cliente_nombre}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Phone size={15} color="var(--primary)" />
                <span>Contacto: {evt.cliente_telefono}</span>
              </div>
            </div>

            {/* Barra de progreso */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '0.35rem', fontWeight: 600 }}>
                <span style={{ color: 'var(--text-muted)' }}>Progreso organizativo</span>
                <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{evt.progreso_porcentaje || 0}%</span>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar-fill" style={{ width: `${evt.progreso_porcentaje || 0}%` }} />
              </div>
            </div>

            {/* Resumen Financiero + acción */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.875rem', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.8rem' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total</span>
                <div style={{ fontWeight: 800, color: 'var(--primary-dark)', fontFamily: 'Outfit, sans-serif' }}>${(evt.monto_total || 0).toFixed(2)}</div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Saldo</span>
                <div style={{ fontWeight: 800, color: (evt.saldo_pendiente || 0) > 0 ? 'var(--warning)' : 'var(--success)', fontFamily: 'Outfit, sans-serif' }}>
                  ${(evt.saldo_pendiente || 0).toFixed(2)}
                </div>
              </div>
              <Link
                to={`/eventos/${evt.id}`}
                className="btn btn-primary btn-sm"
                onClick={e => e.stopPropagation()}
                id={`ver-evento-${evt.id}`}
              >
                <Eye size={14} /> Ver detalle
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
