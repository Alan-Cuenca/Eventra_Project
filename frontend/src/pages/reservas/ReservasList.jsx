/**
 * EVENTRA — Módulo de Reservas: Lista
 * Muestra el registro de reservas confirmadas y agendadas.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { eventraService } from '../../services/eventraService';
import { useAuth } from '../../context/AuthContext';
import { Plus, Search, Loader2, CalendarDays, MapPin, Clock, CalendarCheck } from 'lucide-react';

export const ReservasList = () => {
  const { isAdmin, isGerente, isCliente, isTrabajador } = useAuth();
  const canCreate = isAdmin || isGerente || isTrabajador || isCliente;

  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadReservas = useCallback(async () => {
    setLoading(true);
    try {
      const data = await eventraService.getReservas();
      setReservas(data || []);
    } catch (err) {
      console.error('Error cargando reservas', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadReservas(); }, [loadReservas]);

  const filteredReservas = reservas.filter(r => {
    const term = searchTerm.toLowerCase();
    const titulo = r.evento_titulo ? r.evento_titulo.toLowerCase() : '';
    const cliente = r.cliente_nombre ? r.cliente_nombre.toLowerCase() : '';
    const salon = r.salon ? r.salon.toLowerCase() : '';
    return titulo.includes(term) || cliente.includes(term) || salon.includes(term);
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <CalendarCheck size={24} color="var(--accent)" />
            <h1 style={{ margin: 0 }}>Reservas de Espacios</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Gestiona la disponibilidad de salones y la agenda de eventos confirmados.
          </p>
        </div>
        {canCreate && (
          <Link to="/reservas/nueva" className="btn btn-primary">
            <Plus size={16} /> Nueva Reserva
          </Link>
        )}
      </div>

      <Card style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ position: 'relative' }}>
          <input 
            type="text" 
            className="form-input" 
            style={{ paddingLeft: '2.4rem' }} 
            placeholder="Buscar por evento, cliente o salón..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
          <Search size={17} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        </div>
      </Card>

      <Card>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem', color: 'var(--primary)' }} />
            Cargando agenda de reservas...
          </div>
        ) : filteredReservas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <CalendarCheck size={36} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
            <div style={{ color: 'var(--text-secondary)' }}>No hay reservas agendadas que coincidan con la búsqueda.</div>
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Evento / Cliente</th>
                  <th>Fecha</th>
                  <th>Horario</th>
                  <th>Salón</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {filteredReservas.map(reserva => (
                  <tr key={reserva.id}>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {String(reserva.id).substring(0, 8).toUpperCase()}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{reserva.evento_titulo}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{reserva.cliente_nombre}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                        <CalendarDays size={14} color="var(--accent)" />
                        {new Date(reserva.fecha).toLocaleDateString('es-EC')}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                        <Clock size={14} color="var(--text-secondary)" />
                        {reserva.horario}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 500 }}>
                        <MapPin size={14} color="var(--primary)" />
                        {reserva.salon}
                      </div>
                    </td>
                    <td>
                      <Badge variant={
                        reserva.estado === 'Pendiente' ? 'warning' :
                        reserva.estado === 'Confirmada' ? 'success' : 'primary'
                      }>
                        {reserva.estado || 'Confirmada'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
