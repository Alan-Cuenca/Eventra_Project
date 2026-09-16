import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { eventraService } from '../../services/eventraService';
import { MOCK_SERVICIOS, MOCK_PAQUETES } from '../../services/mockData';
import { Layers, Plus, Sparkles, Check, DollarSign, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const ServicesPage = () => {
  const { isAdmin, isGerente } = useAuth();
  const [activeTab, setActiveTab] = useState('servicios');
  const [servicios, setServicios] = useState(MOCK_SERVICIOS);
  const [paquetes, setPaquetes] = useState(MOCK_PAQUETES);
  const [loading, setLoading] = useState(false);

  // Modal para Añadir Servicio
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newService, setNewService] = useState({
    nombre: '',
    categoria: 'Espacio y Salón',
    descripcion: '',
    precio_base: '',
    unidad: 'evento',
  });

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const s = await eventraService.getServicios();
      const p = await eventraService.getPaquetes();
      if (s && s.length > 0) setServicios(s);
      if (p && p.length > 0) setPaquetes(p);
    } catch (e) {
      console.warn('Error loading catalog', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const handleCreateService = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        nombre: newService.nombre,
        descripcion: newService.descripcion,
        precio_base: parseFloat(newService.precio_base) || 0,
      };
      await eventraService.createServicio(payload);
      
      // Añadir de inmediato a la lista local
      setServicios((prev) => [
        {
          id: Date.now(),
          ...newService,
          precio_base: parseFloat(newService.precio_base) || 0,
        },
        ...prev,
      ]);
      setShowModal(false);
      setNewService({
        nombre: '',
        categoria: 'Espacio y Salón',
        descripcion: '',
        precio_base: '',
        unidad: 'evento',
      });
    } catch (err) {
      alert('Error al guardar servicio: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Catálogo de Servicios y Paquetes</h1>
          <p>Gestión de opciones configurables para cotizaciones y reservas según el Project Charter.</p>
        </div>
        {(isAdmin || isGerente) && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} />
            <span>Añadir Servicio</span>
          </button>
        )}
      </div>

      {/* Selector de Pestañas */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button
          className={`btn ${activeTab === 'servicios' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('servicios')}
        >
          Servicios Individuales ({servicios.length})
        </button>
        <button
          className={`btn ${activeTab === 'paquetes' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('paquetes')}
        >
          Paquetes Prediseñados ({paquetes.length})
        </button>
      </div>

      {/* Vista de Servicios Individuales */}
      {activeTab === 'servicios' && (
        <div className="grid-cols-2">
          {servicios.map((serv) => (
            <Card key={serv.id} interactive>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600 }}>
                  {serv.categoria || 'Servicio de Evento'}
                </span>
                {serv.popular && <Badge variant="warning">Popular</Badge>}
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.4rem' }}>{serv.nombre}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                {serv.descripcion || 'Sin descripción detallada.'}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Unidad: {serv.unidad || 'evento'}
                </span>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent)' }}>
                  ${parseFloat(serv.precio_base).toFixed(2)}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Vista de Paquetes Prediseñados */}
      {activeTab === 'paquetes' && (
        <div className="grid-cols-2">
          {paquetes.map((pack) => (
            <Card key={pack.id} interactive style={{ border: pack.recomendado ? '1px solid var(--accent)' : '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '1.25rem' }}>{pack.nombre}</h3>
                {pack.recomendado && <Badge variant="accent">Recomendado</Badge>}
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                  SERVICIOS INCLUIDOS:
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem' }}>
                  {(pack.servicios_incluidos || []).map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Check size={14} color="var(--success)" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: 600 }}>{pack.descuento || 'Paquete Especial'}</span>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent)' }}>
                  ${parseFloat(pack.precio_total).toLocaleString()}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* MODAL: AÑADIR SERVICIO */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '1rem',
          }}
        >
          <div className="glass-card" style={{ maxWidth: '480px', width: '100%', border: '1px solid var(--accent)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--text-primary)' }}>
                Añadir Nuevo Servicio
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateService}>
              <div className="form-group">
                <label className="form-label">Nombre del Servicio *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="ej. Luces Neón y Efectos Especiales"
                  value={newService.nombre}
                  onChange={(e) => setNewService({ ...newService, nombre: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Categoría</label>
                  <select
                    className="form-select"
                    value={newService.categoria}
                    onChange={(e) => setNewService({ ...newService, categoria: e.target.value })}
                  >
                    <option value="Espacio y Salón">Espacio y Salón</option>
                    <option value="Gastronomía y Catering">Gastronomía y Catering</option>
                    <option value="Audio y Visual">Audio y Visual</option>
                    <option value="Fotografía y Recuerdos">Fotografía y Recuerdos</option>
                    <option value="Ambientación y Flores">Ambientación y Flores</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Precio Base (USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="250.00"
                    value={newService.precio_base}
                    onChange={(e) => setNewService({ ...newService, precio_base: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Detalles sobre lo que incluye el servicio..."
                  value={newService.descripcion}
                  onChange={(e) => setNewService({ ...newService, descripcion: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Guardando en BD...' : 'Guardar Servicio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
