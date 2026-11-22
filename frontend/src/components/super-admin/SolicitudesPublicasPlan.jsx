import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { Loader2, FileText } from 'lucide-react';
import { aFechaLocal } from '../../utils/format';

/**
 * Lista las solicitudes de contratación de plan enviadas desde la landing pública
 * (comprobante PDF + correo de contacto). El Super Admin crea la empresa con el
 * flujo habitual y marca la solicitud como Atendida o Rechazada.
 */
export const SolicitudesPublicasPlan = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [procesandoId, setProcesandoId] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/suscripciones/solicitudes-publicas');
      setItems(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las solicitudes de la landing.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const marcar = async (item, estado) => {
    setProcesandoId(item.id);
    setError('');
    try {
      await api.patch(`/suscripciones/solicitudes-publicas/${item.id}/estado`, { estado });
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, estado } : i)));
    } catch (err) {
      setError(err.message || 'No se pudo actualizar la solicitud.');
    } finally {
      setProcesandoId(null);
    }
  };

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>Solicitudes desde la landing pública</h3>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
        Contrataciones por transferencia. Revisa el comprobante, crea la empresa y marca la solicitud como atendida.
      </p>

      {error && (
        <div style={{ padding: '0.75rem 1rem', background: 'var(--danger-light)', color: 'var(--danger-text)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '1.5rem' }}><Loader2 className="animate-spin" /></div>
      ) : items.length === 0 ? (
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No hay solicitudes pendientes.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr><th>Empresa</th><th>Correo</th><th>Plan</th><th>Fecha</th><th>Comprobante</th><th>Estado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id}>
                  <td style={{ fontWeight: 600 }}>{i.nombre_empresa}</td>
                  <td>{i.correo_contacto}</td>
                  <td>{i.plan_nombre} · {i.ciclo}</td>
                  <td>{aFechaLocal(i.fecha_solicitud).toLocaleDateString('es-EC')}</td>
                  <td>
                    <a href={i.comprobante_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <FileText size={14} /> Ver PDF
                    </a>
                  </td>
                  <td>{i.estado}</td>
                  <td>
                    {i.estado === 'Pendiente' && (
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button className="btn btn-sm btn-success" disabled={procesandoId === i.id} onClick={() => marcar(i, 'Atendida')}>Atendida</button>
                        <button className="btn btn-sm btn-secondary" disabled={procesandoId === i.id} onClick={() => marcar(i, 'Rechazada')}>Rechazar</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SolicitudesPublicasPlan;
