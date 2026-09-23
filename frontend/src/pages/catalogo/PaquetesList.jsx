/**
 * EVENTRA — Catálogo: Lista de Paquetes
 * Muestra los paquetes (GET /paquetes) con opciones de CRUD.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { eventraService } from '../../services/eventraService';
import { useAuth } from '../../context/AuthContext';
import { Plus, Search, Loader2, Edit2, Trash2, AlertTriangle, Package, CheckCircle2 } from 'lucide-react';

export const PaquetesList = () => {
  const { isAdmin, isGerente } = useAuth();
  const canEdit = isAdmin || isGerente;

  const [paquetes, setPaquetes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadPaquetes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await eventraService.getPaquetes();
      setPaquetes(data || []);
    } catch (err) {
      showToast('Error al cargar paquetes', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPaquetes(); }, [loadPaquetes]);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await eventraService.deletePaquete(deleteTarget.id);
      setPaquetes(prev => prev.map(p => p.id === deleteTarget.id ? { ...p, estado_activo: false } : p));
      showToast('Paquete desactivado correctamente.');
    } catch (err) {
      showToast(err.message || 'Error al eliminar paquete', 'error');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const filteredPaquetes = paquetes.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Paquetes Prediseñados</h1>
          <p>Gestión de paquetes comerciales (agrupación de servicios).</p>
        </div>
        {canEdit && (
          <Link to="/paquetes/nuevo" className="btn btn-primary">
            <Plus size={16} /> Añadir Paquete
          </Link>
        )}
      </div>

      <Card style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ position: 'relative' }}>
          <input type="text" className="form-input" style={{ paddingLeft: '2.4rem' }} placeholder="Buscar paquete por nombre..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <Search size={17} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        </div>
      </Card>

      <Card>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem', color: 'var(--primary)' }} />
            Cargando paquetes...
          </div>
        ) : filteredPaquetes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <Package size={36} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
            <div style={{ color: 'var(--text-secondary)' }}>No se encontraron paquetes.</div>
          </div>
        ) : (
          <div className="grid-cols-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
            {filteredPaquetes.map(p => (
              <div key={p.id} style={{ border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '1.25rem', background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.15rem' }}>{p.nombre}</h3>
                  <Badge variant={p.estado_activo !== false ? 'success' : 'danger'}>
                    {p.estado_activo !== false ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem', flex: 1 }}>
                  {p.descripcion || 'Sin descripción.'}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Precio Total</span>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent)' }}>
                      ${parseFloat(p.precio_total).toFixed(2)}
                    </div>
                  </div>
                  {canEdit && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Link to={`/paquetes/editar/${p.id}`} className="btn btn-secondary" style={{ padding: '0.4rem' }}>
                        <Edit2 size={15} />
                      </Link>
                      {p.estado_activo !== false && (
                        <button className="btn btn-outline" style={{ padding: '0.4rem' }} onClick={() => setDeleteTarget(p)}>
                          <Trash2 size={15} color="#e27d7c" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Modal Confirmación Delete */}
      {deleteTarget && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-card animate-fade-in" style={{ maxWidth: '400px', textAlign: 'center', border: '1px solid rgba(185,74,72,0.4)' }}>
            <AlertTriangle size={32} color="#e27d7c" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ marginBottom: '0.5rem' }}>¿Desactivar paquete?</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
              El paquete <strong>{deleteTarget.nombre}</strong> pasará a estado inactivo.
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
