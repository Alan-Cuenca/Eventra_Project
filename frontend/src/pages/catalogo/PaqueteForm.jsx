/**
 * EVENTRA — Formulario de Paquete (Crear/Editar)
 * Incluye selección relacional múltiple de servicios.
 * POST /api/paquetes | PUT /api/paquetes/:id
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { eventraService } from '../../services/eventraService';
import { Card } from '../../components/common/Card';
import { ArrowLeft, Save, Loader2, Edit2, PlusCircle, CheckCircle2 } from 'lucide-react';

export const PaqueteForm = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState({ nombre: '', descripcion: '', precio_total: '', estado_activo: true });
  const [serviciosDisponibles, setServiciosDisponibles] = useState([]);
  const [serviciosIds, setServiciosIds] = useState([]); // IDs de servicios seleccionados
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Cargar catálogo de servicios siempre
        const srvs = await eventraService.getServicios();
        setServiciosDisponibles(srvs.filter(s => s.estado_activo !== false));

        if (isEditMode) {
          const res = await api.get('/paquetes');
          const p = (res?.data || res).find(item => String(item.id) === String(id));
          if (p) {
            setForm({ ...p, precio_total: p.precio_total ?? '' });
            // Si el backend devuelve servicios asociados en array 'servicios_ids' o similar
            if (p.servicios_ids) setServiciosIds(p.servicios_ids);
          } else {
            setError('Paquete no encontrado.');
          }
        }
      } catch (err) {
        setError('Error al cargar datos necesarios.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleToggleServicio = (servicioId) => {
    setServiciosIds(prev => 
      prev.includes(servicioId) ? prev.filter(id => id !== servicioId) : [...prev, servicioId]
    );
  };

  // Precio sugerido (suma de precios base de los servicios seleccionados)
  const precioSugerido = serviciosDisponibles
    .filter(s => serviciosIds.includes(s.id))
    .reduce((sum, s) => sum + Number(s.precio_base || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (serviciosIds.length === 0) {
      setError('Debes seleccionar al menos un servicio para armar el paquete.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        precio_total: parseFloat(form.precio_total),
        servicios_ids: serviciosIds
      };
      
      if (isEditMode) await api.put(`/paquetes/${id}`, payload);
      else await api.post('/paquetes', payload);
      
      setSuccess(true);
      setTimeout(() => navigate('/paquetes', { replace: true }), 1500);
    } catch (err) {
      setError(err.message || 'Error al guardar el paquete.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <CheckCircle2 size={48} color="var(--success)" style={{ margin: '0 auto 1rem' }} />
        <h2>¡Paquete Guardado!</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Redirigiendo al catálogo...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isEditMode ? <Edit2 size={24} color="var(--accent)" /> : <PlusCircle size={24} color="var(--accent)" />}
          <h1 style={{ margin: 0 }}>{isEditMode ? 'Editar Paquete' : 'Nuevo Paquete'}</h1>
        </div>
        <Link to="/paquetes" className="btn btn-secondary">
          <ArrowLeft size={16} /> Volver
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        <Card>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto', color: 'var(--primary)' }} />
            </div>
          ) : (
            <form onSubmit={handleSubmit} id="paquete-form">
              {error && <div style={{ background: 'rgba(185,74,72,0.15)', border: '1px solid #e27d7c', color: '#e27d7c', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>{error}</div>}

              <div className="form-group">
                <label className="form-label">Nombre del Paquete *</label>
                <input type="text" name="nombre" className="form-input" value={form.nombre} onChange={handleChange} required disabled={submitting} />
              </div>

              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea name="descripcion" className="form-textarea" rows={3} value={form.descripcion} onChange={handleChange} disabled={submitting} />
              </div>

              <div className="form-group">
                <label className="form-label">Precio Total de Venta (USD) *</label>
                <input type="number" step="0.01" min="0" name="precio_total" className="form-input" value={form.precio_total} onChange={handleChange} required disabled={submitting} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Precio sugerido según servicios seleccionados: <strong>${precioSugerido.toFixed(2)}</strong>
                </span>
              </div>

              {isEditMode && (
                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" name="estado_activo" checked={form.estado_activo} onChange={handleChange} disabled={submitting} />
                    <span>Paquete Activo</span>
                  </label>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
                <Link to="/paquetes" className="btn btn-secondary">Cancelar</Link>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Guardando...' : <><Save size={16} /> Guardar Paquete</>}
                </button>
              </div>
            </form>
          )}
        </Card>

        {/* Panel lateral: Selección múltiple de servicios */}
        <Card>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Servicios Incluidos</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Selecciona los servicios individuales que componen este paquete.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
            {serviciosDisponibles.map(srv => {
              const isSelected = serviciosIds.includes(srv.id);
              return (
                <label key={srv.id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.85rem',
                  border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border-subtle)'}`,
                  background: isSelected ? 'rgba(194,136,52,0.05)' : 'rgba(255,255,255,0.02)',
                  borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s'
                }}>
                  <input 
                    type="checkbox" 
                    checked={isSelected} 
                    onChange={() => handleToggleServicio(srv.id)} 
                    style={{ marginTop: '0.2rem', accentColor: 'var(--accent)' }} 
                    disabled={submitting}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.15rem' }}>{srv.nombre}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>${parseFloat(srv.precio_base).toFixed(2)}</div>
                  </div>
                </label>
              );
            })}
            {serviciosDisponibles.length === 0 && !loading && (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>
                No hay servicios activos disponibles.
              </div>
            )}
          </div>
        </Card>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
