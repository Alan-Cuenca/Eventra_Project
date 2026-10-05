import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { eventraService } from '../../services/eventraService';
import { Building2, Plus, Edit2, Trash2, Mail, Phone, Loader2, MapPin } from 'lucide-react';

export const ProveedoresList = () => {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const fetchProveedores = async () => {
    try {
      const data = await eventraService.getProveedores();
      setProveedores(data);
    } catch (err) {
      setError(err.message || 'Error al cargar proveedores.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProveedores();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este proveedor?')) return;
    setDeletingId(id);
    try {
      await eventraService.deleteProveedor(id);
      setProveedores((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert('Error al eliminar proveedor: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}><Loader2 className="animate-spin" /> Cargando proveedores...</div>;
  if (error) return <div style={{ padding: '2rem', color: 'red' }}>{error}</div>;

  return (
    <div className="animate-fade-in" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--primary-dark)', marginBottom: '0.25rem' }}>Proveedores</h1>
          <p style={{ color: 'var(--text-muted)' }}>Gestiona los contratistas externos y especialistas.</p>
        </div>
        <Link to="/proveedores/nuevo" className="btn btn-primary">
          <Plus size={16} /> Añadir Proveedor
        </Link>
      </div>

      {proveedores.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '3rem' }}>
          <Building2 size={40} style={{ color: 'var(--border-subtle)', margin: '0 auto 1rem' }} />
          <h3>No hay proveedores registrados</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Comienza añadiendo tu primer proveedor al directorio.</p>
        </Card>
      ) : (
        <Card noPadding style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Empresa / Nombre</th>
                <th>Especialidad</th>
                <th>Contacto</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {proveedores.map((prov) => (
                <tr key={prov.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>{prov.empresa || prov.nombre}</div>
                    {prov.empresa && prov.nombre && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Rep: {prov.nombre}</div>}
                  </td>
                  <td>{prov.especialidad}</td>
                  <td>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem' }}>
                        <Phone size={13} /> {prov.telefono}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Mail size={13} /> {prov.email}
                      </div>
                    </div>
                  </td>
                  <td>
                    <Badge variant={prov.estado_activo ? 'success' : 'neutral'}>
                      {prov.estado_activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <Link to={`/proveedores/editar/${prov.id}`} className="btn btn-outline btn-sm" aria-label="Editar">
                        <Edit2 size={14} />
                      </Link>
                      <button
                        className="btn btn-outline btn-sm"
                        style={{ color: 'var(--danger)', borderColor: 'var(--danger-light)' }}
                        onClick={() => handleDelete(prov.id)}
                        disabled={deletingId === prov.id}
                        aria-label="Eliminar"
                      >
                        {deletingId === prov.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
};
