/**
 * EVENTRA — Módulo de Cotizaciones: Lista
 * Muestra el registro histórico de cotizaciones (GET /cotizaciones).
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { eventraService } from '../../services/eventraService';
import { useAuth } from '../../context/AuthContext';
import { Plus, Search, Loader2, Calculator, CalendarDays } from 'lucide-react';
import { formatMoney } from '../../utils/format';

export const CotizacionesList = () => {
  const { isAdmin, isGerente, isCliente, isTrabajador } = useAuth();
  // Según el RBAC en routes, admin, gerente y trabajador pueden crear, 
  // pero el requerimiento menciona "si tu lógica de negocio lo dicta, para Clientes"
  // Asumiremos que el botón de nueva cotización lo ven los roles internos y clientes
  const canCreate = !isCliente;

  const [cotizaciones, setCotizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const puedeGestionar = isAdmin || isGerente;

  const cambiarEstado = async (cot, nuevoEstado) => {
    setUpdatingId(cot.id);
    setError('');
    try {
      await eventraService.updateEstadoCotizacion(cot.id, nuevoEstado);
      setCotizaciones((prev) => prev.map((c) => (c.id === cot.id ? { ...c, estado: nuevoEstado } : c)));
    } catch (err) {
      setError(err.message || 'No se pudo actualizar la cotización.');
    } finally {
      setUpdatingId(null);
    }
  };

  const loadCotizaciones = useCallback(async () => {
    setLoading(true);
    try {
      const data = await eventraService.getCotizaciones();
      setCotizaciones(data || []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las cotizaciones.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCotizaciones(); }, [loadCotizaciones]);

  const filteredCotizaciones = cotizaciones.filter(c => {
    const term = searchTerm.toLowerCase();
    const nombreCompleto = `${c.cliente_nombres || ''} ${c.cliente_apellidos || ''}`.toLowerCase();
    return nombreCompleto.includes(term) || (c.paquete_nombre && c.paquete_nombre.toLowerCase().includes(term));
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Cotizaciones</h1>
          <p>Registro y seguimiento de estimaciones comerciales.</p>
        </div>
        {canCreate && (
          <Link to="/cotizaciones/nueva" className="btn btn-primary">
            <Plus size={16} /> Nueva Cotización
          </Link>
        )}
      </div>

      {error && (
        <div style={{ padding: '0.85rem 1rem', background: 'var(--danger-light)', color: 'var(--danger-text)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      <Card style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ position: 'relative' }}>
          <input type="text" className="form-input" style={{ paddingLeft: '2.4rem' }} placeholder="Buscar por nombre de cliente o paquete..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <Search size={17} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        </div>
      </Card>

      <Card>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem', color: 'var(--primary)' }} />
            Cargando cotizaciones...
          </div>
        ) : filteredCotizaciones.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <Calculator size={36} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
            <div style={{ color: 'var(--text-secondary)' }}>No hay cotizaciones registradas aún.</div>
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Paquete Base</th>
                  <th>Fecha Evento</th>
                  <th>Monto Total</th>
                  <th>Estado</th>
                  {puedeGestionar && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {filteredCotizaciones.map(cot => (
                  <tr key={cot.id}>
                    <td style={{ fontWeight: 600 }}>
                      {cot.cliente_nombres} {cot.cliente_apellidos}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {cot.paquete_nombre || <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>Personalizado</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                        <CalendarDays size={14} color="var(--accent)" />
                        {new Date(cot.fecha_estimada_evento).toLocaleDateString('es-EC')}
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--warning-text)' }}>
                      {formatMoney(cot.total_calculado)}
                    </td>
                    <td>
                      <Badge variant={
                        cot.estado === 'Pendiente' ? 'warning' :
                        cot.estado === 'Aprobada'  ? 'success' : 'primary'
                      }>
                        {cot.estado || 'Pendiente'}
                      </Badge>
                    </td>
                    {puedeGestionar && (
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {(cot.estado || 'Pendiente') === 'Pendiente' && (
                            <button className="btn btn-sm btn-success" disabled={updatingId === cot.id} onClick={() => cambiarEstado(cot, 'Aprobada')}>
                              Aprobar
                            </button>
                          )}
                          {cot.estado === 'Aprobada' && (
                            <button className="btn btn-sm btn-primary" disabled={updatingId === cot.id} onClick={() => cambiarEstado(cot, 'Completada')}>
                              Completar
                            </button>
                          )}
                          {['Pendiente', 'Aprobada', undefined, null].includes(cot.estado) && (
                            <button className="btn btn-sm btn-secondary" disabled={updatingId === cot.id} onClick={() => cambiarEstado(cot, 'Rechazada')}>
                              Rechazar
                            </button>
                          )}
                        </div>
                      </td>
                    )}
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
