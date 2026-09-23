/**
 * EVENTRA — Catálogo: Lista de Servicios Individuales
 * Muestra las prestaciones base (GET /servicios) con opciones de CRUD.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { eventraService } from '../../services/eventraService';
import { useAuth } from '../../context/AuthContext';
import { Plus, Search, Filter, Loader2, Edit2, Trash2, AlertTriangle, Layers, X, CheckCircle2 } from 'lucide-react';

export const ServiciosList = () => {
  const { isAdmin, isGerente } = useAuth();
  const canEdit = isAdmin || isGerente;

  const [servicios, setServicios] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Toast
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadServicios = useCallback(async () => {
    setLoading(true);
    try {
      const data = await eventraService.getServicios();
      setServicios(data || []);
    } catch (err) {
      showToast('Error al cargar catálogo de servicios', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadServicios(); }, [loadServicios]);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await eventraService.deleteServicio(deleteTarget.id);
      setServicios(prev => prev.map(s => s.id === deleteTarget.id ? { ...s, estado_activo: false } : s));
      showToast('Servicio desactivado correctamente.');
    } catch (err) {
      showToast(err.message || 'Error al eliminar servicio', 'error');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const filteredServicios = servicios.filter(s => {
    const matchSearch = s.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || 
                        (filterStatus === 'active' && s.estado_activo !== false) || 
                        (filterStatus === 'inactive' && s.estado_activo === false);
    return matchSearch && matchStatus;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Servicios Individuales</h1>
          <p>Catálogo base de prestaciones de la empresa.</p>
        </div>
        {canEdit && (
          <Link to="/servicios/nuevo" className="btn btn-primary">
            <Plus size={16} /> Añadir Servicio
          </Link>
        )}
      </div>

      <Card style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <input type="text" className="form-input" style={{ paddingLeft: '2.4rem' }} placeholder="Buscar servicio por nombre..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <Search size={17} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Filter size={15} color="var(--accent)" />
            <select className="form-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">Todos ({servicios.length})</option>
              <option value="active">Solo Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>
        </div>
      </Card>

      <Card>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem', color: 'var(--primary)' }} />
            Cargando servicios...
          </div>
        ) : filteredServicios.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <Layers size={36} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
            <div style={{ color: 'var(--text-secondary)' }}>No se encontraron servicios.</div>
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Nombre del Servicio</th>
                  <th>Descripción</th>
                  <th>Precio Base</th>
                  <th>Estado</th>
                  {canEdit && <th style={{ textAlign: 'center' }}>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {filteredServicios.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.nombre}</td>
                    <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {s.descripcion || '—'}
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                      ${parseFloat(s.precio_base).toFixed(2)}
                    </td>
                    <td>
                      <Badge variant={s.estado_activo !== false ? 'success' : 'danger'}>
                        {s.estado_activo !== false ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    {canEdit && (
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <Link to={`/servicios/editar/${s.id}`} className="btn btn-secondary" style={{ padding: '0.35rem 0.65rem' }}>
                            <Edit2 size={13} />
                          </Link>
                          {s.estado_activo !== false && (
                            <button className="btn btn-outline" style={{ padding: '0.35rem 0.65rem' }} onClick={() => setDeleteTarget(s)}>
                              <Trash2 size={13} color="#e27d7c" />
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

      {/* Modal Confirmación Delete */}
      {deleteTarget && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-card animate-fade-in" style={{ maxWidth: '400px', textAlign: 'center', border: '1px solid rgba(185,74,72,0.4)' }}>
            <AlertTriangle size={32} color="#e27d7c" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ marginBottom: '0.5rem' }}>¿Desactivar servicio?</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
              El servicio <strong>{deleteTarget.nombre}</strong> pasará a estado inactivo.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancelar</button>
              <button className="btn btn-primary" style={{ background: 'rgba(185,74,72,0.85)' }} onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Desactivando...' : 'Desactivar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 99999, display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1.25rem', background: toast.type === 'success' ? 'rgba(46,139,87,0.15)' : 'rgba(185,74,72,0.15)', borderRadius: '10px', color: toast.type === 'success' ? '#5bc286' : '#e27d7c', border: `1px solid ${toast.type === 'success' ? 'rgba(46,139,87,0.4)' : 'rgba(185,74,72,0.4)'}` }}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{toast.message}</span>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
