import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { eventraService } from '../../services/eventraService';
import { Save, X, Loader2, ArrowLeft, Calendar, Users, Package } from 'lucide-react';

export const EventoForm = () => {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    titulo: '',
    cliente_id: '',
    fecha: '',
    invitados: '',
    paquete_id: '',
    estado: 'Registrado',
  });

  const [clientes, setClientes] = useState([]);
  const [paquetes, setPaquetes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientesData, paquetesData] = await Promise.all([
          eventraService.getClientes(),
          eventraService.getPaquetes(),
        ]);
        setClientes(clientesData || []);
        setPaquetes(paquetesData || []);

        if (isEditing) {
          const evento = await eventraService.getEvento(id);
          setForm({
            titulo: evento.titulo || evento.nombre || '',
            cliente_id: evento.cliente_id || '',
            fecha: evento.fecha ? evento.fecha.split('T')[0] : '', // simple date input formatting
            invitados: evento.invitados || '',
            paquete_id: evento.paquete_id || '',
            estado: evento.estado || 'Registrado',
          });
        }
      } catch (err) {
        setError('Error al cargar datos: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, isEditing]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (isEditing) {
        await eventraService.updateEvento(id, form);
      } else {
        await eventraService.createEvento(form);
      }
      navigate('/eventos');
    } catch (err) {
      setError(err.message || 'Error al guardar el evento.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}><Loader2 className="animate-spin" /> Cargando formulario...</div>;

  return (
    <div className="animate-fade-in" style={{ padding: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/eventos" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.875rem' }}>
          <ArrowLeft size={16} /> Volver a eventos
        </Link>
        <h1 style={{ fontSize: '1.8rem', color: 'var(--primary-dark)' }}>
          {isEditing ? 'Editar Evento' : 'Nuevo Evento'}
        </h1>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label">Nombre / Código del Evento *</label>
            <input type="text" className="form-input" name="titulo" value={form.titulo} onChange={handleChange} required placeholder="Ej. Boda Civil García" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Cliente Asociado *</label>
              <select className="form-input" name="cliente_id" value={form.cliente_id} onChange={handleChange} required>
                <option value="">-- Seleccionar Cliente --</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>{`${c.nombres || ''} ${c.apellidos || ''}`}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label"><Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} /> Fecha del Evento *</label>
              <input type="date" className="form-input" name="fecha" value={form.fecha} onChange={handleChange} required />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label"><Users size={14} style={{ display: 'inline', marginRight: '4px' }} /> Cantidad de Invitados *</label>
              <input type="number" className="form-input" name="invitados" value={form.invitados} onChange={handleChange} required min="1" />
            </div>

            <div className="form-group">
              <label className="form-label"><Package size={14} style={{ display: 'inline', marginRight: '4px' }} /> Paquete / Cotización *</label>
              <select className="form-input" name="paquete_id" value={form.paquete_id} onChange={handleChange} required>
                <option value="">-- Seleccionar Paquete --</option>
                {paquetes.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          {isEditing && (
            <div className="form-group">
              <label className="form-label">Estado Organizativo</label>
              <select className="form-input" name="estado" value={form.estado} onChange={handleChange}>
                <option value="Registrado">Registrado</option>
                <option value="En preparación">En preparación</option>
                <option value="Confirmado">Confirmado</option>
                <option value="Finalizado">Finalizado</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
            <Link to="/eventos" className="btn btn-outline">
              <X size={16} /> Cancelar
            </Link>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Guardar Evento
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};
