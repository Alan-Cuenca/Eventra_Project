import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { eventraService } from '../../services/eventraService';
import { Save, X, Loader2, ArrowLeft } from 'lucide-react';

export const ProveedorForm = () => {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    empresa: '',
    nombre: '',
    especialidad: '',
    telefono: '',
    email: '',
    direccion: '',
    estado_activo: true,
  });

  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditing) {
      eventraService.getProveedor(id)
        .then((data) => {
          setForm({
            empresa: data.empresa || '',
            nombre: data.nombre || '',
            especialidad: data.especialidad || '',
            telefono: data.telefono || '',
            email: data.email || '',
            direccion: data.direccion || '',
            estado_activo: data.estado_activo !== undefined ? data.estado_activo : true,
          });
        })
        .catch((err) => setError('Error al cargar proveedor: ' + err.message))
        .finally(() => setLoading(false));
    }
  }, [id, isEditing]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (isEditing) {
        await eventraService.updateProveedor(id, form);
      } else {
        await eventraService.createProveedor(form);
      }
      navigate('/proveedores');
    } catch (err) {
      setError(err.message || 'Error al guardar proveedor.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}><Loader2 className="animate-spin" /> Cargando...</div>;

  return (
    <div className="animate-fade-in" style={{ padding: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/proveedores" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.875rem' }}>
          <ArrowLeft size={16} /> Volver a proveedores
        </Link>
        <h1 style={{ fontSize: '1.8rem', color: 'var(--primary-dark)' }}>
          {isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'}
        </h1>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Empresa</label>
              <input type="text" className="form-input" name="empresa" value={form.empresa} onChange={handleChange} placeholder="Ej. Sonidos XYZ" />
            </div>
            <div className="form-group">
              <label className="form-label">Nombre del Contacto *</label>
              <input type="text" className="form-input" name="nombre" value={form.nombre} onChange={handleChange} required placeholder="Nombre del representante" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Especialidad *</label>
              <input type="text" className="form-input" name="especialidad" value={form.especialidad} onChange={handleChange} required placeholder="Ej. Catering, Fotografía, DJ" />
            </div>
            <div className="form-group">
              <label className="form-label">Teléfono *</label>
              <input type="tel" className="form-input" name="telefono" value={form.telefono} onChange={handleChange} required />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Correo Electrónico *</label>
              <input type="email" className="form-input" name="email" value={form.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Dirección</label>
              <input type="text" className="form-input" name="direccion" value={form.direccion} onChange={handleChange} />
            </div>
          </div>

          {isEditing && (
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" id="estado_activo" name="estado_activo" checked={form.estado_activo} onChange={handleChange} />
              <label htmlFor="estado_activo" style={{ margin: 0, fontWeight: 600 }}>Proveedor Activo</label>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
            <Link to="/proveedores" className="btn btn-outline">
              <X size={16} /> Cancelar
            </Link>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Guardar Proveedor
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};
