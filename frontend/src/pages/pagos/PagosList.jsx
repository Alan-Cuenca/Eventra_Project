import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { eventraService } from '../../services/eventraService';
import { CheckCircle, XCircle, Eye, AlertTriangle } from 'lucide-react';

const PagosList = () => {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagoSeleccionado, setPagoSeleccionado] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    cargarPagos();
  }, []);

  const cargarPagos = async () => {
    setLoading(true);
    try {
      const data = await eventraService.getPagos();
      setPagos(data);
    } catch (error) {
      console.error('Error cargando pagos', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerDetalle = (pago) => {
    setPagoSeleccionado(pago);
    setIsModalOpen(true);
  };

  const handleCambiarEstado = async (id, nuevoEstado) => {
    try {
      await eventraService.actualizarEstadoPago(id, nuevoEstado);
      setIsModalOpen(false);
      setPagoSeleccionado(null);
      cargarPagos(); // Recargar lista
    } catch (error) {
      alert('Error al cambiar el estado del pago');
    }
  };

  const pagosPendientes = pagos.filter(p => p.estado === 'En Revisión' || p.estado === 'Pendiente');
  const pagosHistorial = pagos.filter(p => p.estado !== 'En Revisión' && p.estado !== 'Pendiente');

  return (
    <div className="fade-in" style={{ padding: '1rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
        Gestión de Pagos
      </h1>

      {loading ? (
        <p>Cargando pagos...</p>
      ) : (
        <>
          {/* SECCIÓN PRIORITARIA: Pagos por Verificar */}
          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: '#b45309', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={20} /> Pagos por Verificar ({pagosPendientes.length})
            </h2>
            
            {pagosPendientes.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No hay pagos pendientes de verificación.</p>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {pagosPendientes.map(pago => (
                  <Card key={pago.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>${pago.monto} - {pago.concepto}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          Método: {pago.metodo_pago} | Evento: {pago.evento_id}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '12px', 
                          fontSize: '0.75rem', 
                          fontWeight: 600,
                          backgroundColor: pago.estado === 'En Revisión' ? '#fef3c7' : '#f1f5f9',
                          color: pago.estado === 'En Revisión' ? '#92400e' : '#475569'
                        }}>
                          {pago.estado}
                        </span>
                        <button 
                          onClick={() => handleVerDetalle(pago)}
                          className="btn-secondary"
                          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                          <Eye size={16} /> Verificar
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* SECCIÓN: Historial de Pagos */}
          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>
              Historial de Pagos
            </h2>
            <Card>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Fecha</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Monto</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Concepto</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Método</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {pagosHistorial.map(pago => (
                    <tr key={pago.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '1rem' }}>{new Date(pago.fecha_pago || pago.fecha_registro).toLocaleDateString()}</td>
                      <td style={{ padding: '1rem', fontWeight: 600 }}>${pago.monto}</td>
                      <td style={{ padding: '1rem' }}>{pago.concepto}</td>
                      <td style={{ padding: '1rem' }}>{pago.metodo_pago}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '12px', 
                          fontSize: '0.75rem', 
                          fontWeight: 600,
                          backgroundColor: pago.estado === 'Aprobado' ? '#dcfce7' : '#fee2e2',
                          color: pago.estado === 'Aprobado' ? '#166534' : '#991b1b'
                        }}>
                          {pago.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {pagosHistorial.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No hay pagos registrados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Card>
          </section>
        </>
      )}

      {/* Modal de Detalle */}
      {isModalOpen && pagoSeleccionado && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Verificación de Pago</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
              <div><strong>Monto:</strong> ${pagoSeleccionado.monto}</div>
              <div><strong>Concepto:</strong> {pagoSeleccionado.concepto}</div>
              <div><strong>Método:</strong> {pagoSeleccionado.metodo_pago}</div>
              <div><strong>ID Evento:</strong> {pagoSeleccionado.evento_id}</div>
            </div>

            {pagoSeleccionado.comprobante_url ? (
              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Comprobante Adjunto:</p>
                <img 
                  src={pagoSeleccionado.comprobante_url} 
                  alt="Comprobante" 
                  style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}
                />
              </div>
            ) : (
              <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)' }}>No hay comprobante adjunto.</p>
                {pagoSeleccionado.metodo_pago === 'Efectivo' && (
                  <p style={{ fontSize: '0.85rem', color: '#b45309', marginTop: '0.5rem' }}>Verifica físicamente la entrega del dinero antes de aprobar.</p>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={() => handleCambiarEstado(pagoSeleccionado.id, 'Aprobado')}
                style={{ flex: 1, padding: '0.75rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <CheckCircle size={18} /> Aprobar Pago
              </button>
              <button 
                onClick={() => handleCambiarEstado(pagoSeleccionado.id, 'Rechazado')}
                style={{ flex: 1, padding: '0.75rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <XCircle size={18} /> Rechazar Pago
              </button>
            </div>
            
            <button 
              onClick={() => setIsModalOpen(false)}
              style={{ width: '100%', padding: '0.75rem', marginTop: '1rem', backgroundColor: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: '8px', cursor: 'pointer' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PagosList;
