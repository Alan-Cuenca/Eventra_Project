/**
 * EVENTRA — Formulario de Servicio (Crear/Editar)
 * Modo CREATE: sin ID param → POST /api/servicios
 * Modo EDIT:   con ID param → PUT /api/servicios/:id
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Card } from '../../components/common/Card';
import { ArrowLeft, Save, Loader2, Edit2, PlusCircle, CheckCircle2, AlertTriangle } from 'lucide-react';

export const ServicioForm = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState({ nombre: '', descripcion: '', precio_base: '', estado_activo: true });
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isEditMode) return;
    api.get('/servicios').then(res => {
      const data = res?.data || res;
      const s = data.find(item => String(item.id) === String(id));
      if (s) {
        setForm({ ...s, precio_base: s.precio_base ?? '' });
      } else {
        setError('Servicio no encontrado.');
      }
    }).catch(err => {
      setError('Error al cargar datos del servicio.');
    }).finally(() => setLoading(false));
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (isEditMode) await api.put(`/servicios/${id}`, { ...form, precio_base: parseFloat(form.precio_base) });
      else await api.post('/servicios', { ...form, precio_base: parseFloat(form.precio_base) });
      setSuccess(true);
      setTimeout(() => navigate('/servicios', { replace: true }), 1500);
    } catch (err) {
      setError(err.message || 'Error al guardar el servicio.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <CheckCircle2 size={48} color="var(--success)" style={{ margin: '0 auto 1rem' }} />
        <h2>¡Servicio Guardado!</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Redirigiendo al catálogo...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {isEditMode ? <Edit2 size={24} color="var(--accent)" /> : <PlusCircle size={24} color="var(--accent)" />}
            <h1 style={{ margin: 0 }}>{isEditMode ? 'Editar Servicio' : 'Nuevo Servicio'}</h1>
          </div>
        </div>
        <Link to="/servicios" className="btn btn-secondary">
          <ArrowLeft size={16} /> Volver
        </Link>
      </div>

      <Card style={{ maxWidth: '600px' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto', color: 'var(--primary)' }} />
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <div style={{ background: 'rgba(185,74,72,0.15)', border: '1px solid #e27d7c', color: '#e27d7c', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>{error}</div>}

            <div className="form-group">
              <label className="form-label">Nombre del Servicio *</label>
              <input type="text" name="nombre" className="form-input" value={form.nombre} onChange={handleChange} required disabled={submitting} />
            </div>

            <div className="form-group">
              <label className="form-label">Descripción</label>
              <textarea name="descripcion" className="form-textarea" rows={3} value={form.descripcion} onChange={handleChange} disabled={submitting} />
            </div>

            <div className="form-group">
              <label className="form-label">Precio Base (USD) *</label>
              <input type="number" step="0.01" min="0" name="precio_base" className="form-input" value={form.precio_base} onChange={handleChange} required disabled={submitting} />
            </div>

            {isEditMode && (
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" name="estado_activo" checked={form.estado_activo} onChange={handleChange} disabled={submitting} />
                  <span>Servicio Activo</span>
                </label>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
              <Link to="/servicios" className="btn btn-secondary">Cancelar</Link>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Guardando...' : <><Save size={16} /> Guardar Servicio</>}
              </button>
            </div>
          </form>
        )}
      </Card>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
