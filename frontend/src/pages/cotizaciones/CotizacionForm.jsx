/**
 * EVENTRA — Formulario de Cotización Dinámica
 * Permite armar una cotización sumando un paquete base y servicios a la carta.
 * POST /api/cotizaciones
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { eventraService } from '../../services/eventraService';
import { Calculator, ArrowLeft, Send, Sparkles, User, CalendarDays, Loader2, CheckCircle2 } from 'lucide-react';

export const CotizacionForm = () => {
  const navigate = useNavigate();

  const [clientes, setClientes] = useState([]);
  const [paquetes, setPaquetes] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [loadingInit, setLoadingInit] = useState(true);
  
  const [form, setForm] = useState({
    cliente_id: '',
    paquete_id: '',
    fecha_estimada_evento: '',
  });
  
  // Servicios a la carta seleccionados adicionales
  const [serviciosAdicionalesIds, setServiciosAdicionalesIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [cls, pqs, srvs] = await Promise.all([
          eventraService.getClientes(),
          eventraService.getPaquetes(),
          eventraService.getServicios()
        ]);
        // Solo mostrar activos
        setClientes((cls || []).filter(c => c.estado_activo !== false));
        setPaquetes((pqs || []).filter(p => p.estado_activo !== false));
        setServicios((srvs || []).filter(s => s.estado_activo !== false));
      } catch (err) {
        setError('Error al cargar datos del sistema. Intenta recargar la página.');
      } finally {
        setLoadingInit(false);
      }
    };
    fetchAllData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
  };

  const toggleServicioAdicional = (id) => {
    setServiciosAdicionalesIds(prev => 
      prev.includes(id) ? prev.filter(srvId => srvId !== id) : [...prev, id]
    );
  };

  // ── Cálculos Dinámicos ─────────────────────────────────────────────────────
  const paqueteSeleccionado = paquetes.find(p => String(p.id) === String(form.paquete_id));
  const costoPaquete = paqueteSeleccionado ? Number(paqueteSeleccionado.precio_total) : 0;
  
  const costoServiciosAdicionales = servicios
    .filter(s => serviciosAdicionalesIds.includes(s.id))
    .reduce((sum, s) => sum + Number(s.precio_base || 0), 0);

  const totalCalculado = costoPaquete + costoServiciosAdicionales;

  // ── Envío del Formulario ───────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.cliente_id || !form.fecha_estimada_evento) {
      setError('Por favor, selecciona un cliente y la fecha del evento.');
      return;
    }
    if (totalCalculado === 0) {
      setError('La cotización no puede estar en $0.00. Selecciona un paquete o servicios.');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      await eventraService.createCotizacion({
        cliente_id: form.cliente_id,
        paquete_id: form.paquete_id || null, // opcional
        fecha_estimada_evento: form.fecha_estimada_evento,
        total_calculado: totalCalculado
      });
      
      setSuccess(true);
      setTimeout(() => navigate('/cotizaciones', { replace: true }), 1800);
    } catch (err) {
      setError(err.message || 'Error al generar la cotización.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0' }}>
        <CheckCircle2 size={48} color="var(--success)" style={{ margin: '0 auto 1rem' }} />
        <h2>¡Cotización Generada!</h2>
        <p style={{ color: 'var(--text-secondary)' }}>La cotización se guardó exitosamente.</p>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '1rem' }}>Redirigiendo a la lista...</p>
      </div>
    );
  }

  if (loadingInit) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-secondary)' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem', color: 'var(--primary)' }} />
        Preparando entorno dinámico...
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <Calculator size={24} color="var(--accent)" />
            <h1 style={{ margin: 0 }}>Generar Nueva Cotización</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Constructor dinámico. Selecciona un cliente, arma el evento y el costo se calculará automáticamente.
          </p>
        </div>
        <Link to="/cotizaciones" className="btn btn-secondary">
          <ArrowLeft size={16} /> Volver
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1.5rem', alignItems: 'flex-start' }}>
        
        {/* Columna Izquierda: Configuración */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* 1. Cliente y Fecha */}
          <Card>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={18} color="var(--accent)" /> Datos Base
            </h3>
            {error && <div style={{ background: 'rgba(185,74,72,0.15)', border: '1px solid #e27d7c', color: '#e27d7c', padding: '0.85rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Cliente Asociado *</label>
                <select name="cliente_id" className="form-select" value={form.cliente_id} onChange={handleChange} required>
                  <option value="">-- Seleccionar Cliente --</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.nombres} {c.apellidos}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Fecha Estimada *</label>
                <div style={{ position: 'relative' }}>
                  <input type="date" name="fecha_estimada_evento" className="form-input" style={{ paddingLeft: '2.2rem' }} value={form.fecha_estimada_evento} onChange={handleChange} required />
                  <CalendarDays size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                </div>
              </div>
            </div>
          </Card>

          {/* 2. Paquete Base */}
          <Card>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={18} color="var(--accent)" /> Selección de Paquete (Opcional)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', border: `1px solid ${form.paquete_id === '' ? 'var(--accent)' : 'var(--border-subtle)'}`, borderRadius: '8px', cursor: 'pointer', background: form.paquete_id === '' ? 'rgba(194,136,52,0.08)' : 'rgba(255,255,255,0.02)' }}>
                <input type="radio" name="paquete_id" value="" checked={form.paquete_id === ''} onChange={handleChange} style={{ accentColor: 'var(--accent)' }} />
                <span style={{ fontWeight: 600 }}>Sin paquete (Evento a la carta)</span>
              </label>

              {paquetes.map(pack => {
                const isSelected = String(form.paquete_id) === String(pack.id);
                return (
                  <label key={pack.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '1rem', border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border-subtle)'}`, borderRadius: '8px', cursor: 'pointer', background: isSelected ? 'rgba(194,136,52,0.08)' : 'rgba(255,255,255,0.02)' }}>
                    <input type="radio" name="paquete_id" value={pack.id} checked={isSelected} onChange={handleChange} style={{ marginTop: '0.2rem', accentColor: 'var(--accent)' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 600 }}>{pack.nombre}</span>
                        <span style={{ fontWeight: 700, color: 'var(--accent)' }}>${parseFloat(pack.precio_total).toFixed(2)}</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{pack.descripcion || 'Paquete especial'}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </Card>

          {/* 3. Servicios a la Carta */}
          <Card>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>Servicios Adicionales (A la Carta)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '350px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {servicios.map(srv => {
                const isSelected = serviciosAdicionalesIds.includes(srv.id);
                return (
                  <label key={srv.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-subtle)'}`, borderRadius: '6px', background: isSelected ? 'rgba(46,139,87,0.05)' : 'transparent', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggleServicioAdicional(srv.id)} style={{ accentColor: 'var(--primary)' }} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{srv.nombre}</div>
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.95rem' }}>
                      +${parseFloat(srv.precio_base).toFixed(2)}
                    </div>
                  </label>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Columna Derecha: Resumen Dinámico en Vivo */}
        <div style={{ position: 'sticky', top: '2rem' }}>
          <Card style={{ border: '1px solid var(--accent)', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              Resumen en Vivo
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Paquete Base ({paqueteSeleccionado?.nombre || 'Ninguno'}):</span>
                <span>${costoPaquete.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Adicionales ({serviciosAdicionalesIds.length}):</span>
                <span>${costoServiciosAdicionales.toFixed(2)}</span>
              </div>
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '1.4rem', fontWeight: 800 }}>
                <span>Total Estimado:</span>
                <span style={{ color: 'var(--accent)' }}>${totalCalculado.toFixed(2)}</span>
              </div>
            </div>

            {/* Simulación de Anticipo (Lógica de Negocio 50%) */}
            <div style={{ background: 'rgba(23, 36, 46, 0.7)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                <span style={{ color: '#5bc286' }}>Anticipo Requerido (50%):</span>
                <strong style={{ color: '#5bc286' }}>${(totalCalculado * 0.5).toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Saldo Pre-Evento:</span>
                <strong style={{ color: 'var(--text-primary)' }}>${(totalCalculado * 0.5).toFixed(2)}</strong>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.85rem', fontSize: '1rem' }}
              disabled={submitting || totalCalculado === 0}
            >
              {submitting ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={18} />}
              <span>{submitting ? 'Procesando...' : 'Guardar Cotización'}</span>
            </button>
          </Card>
        </div>

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
