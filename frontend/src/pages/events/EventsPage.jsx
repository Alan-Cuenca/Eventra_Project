import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { MOCK_EVENTOS } from '../../services/mockData';
import { Calendar, Search, Filter, Plus, Clock, User, Phone, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';

export const EventsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredEvents = MOCK_EVENTOS.filter((evt) => {
    const matchesSearch =
      evt.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || evt.estado === filterStatus;

    return matchesSearch && matchesStatus;
  });

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
          <Card key={evt.id} interactive>
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

            {/* Barra de progreso de actividades */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.3rem' }}>
                <span>Progreso Organizativo</span>
                <span>{evt.progreso_porcentaje}%</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'var(--bg-input)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${evt.progreso_porcentaje}%`, height: '100%', background: 'var(--primary)' }} />
              </div>
            </div>

            {/* Resumen Financiero */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--border-subtle)',
                fontSize: '0.85rem',
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Monto Total:</span>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>${evt.monto_total.toFixed(2)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Saldo Pendiente:</span>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: evt.saldo_pendiente > 0 ? 'var(--accent)' : 'var(--success)' }}>
                  ${evt.saldo_pendiente.toFixed(2)}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
