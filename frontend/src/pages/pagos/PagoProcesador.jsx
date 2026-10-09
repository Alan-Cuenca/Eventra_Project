import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { useAuth } from '../../context/AuthContext';
import { eventraService } from '../../services/eventraService';
import { CreditCard, Banknote, Building, UploadCloud, CheckCircle } from 'lucide-react';

const PagoProcesador = () => {
  const { user } = useAuth();
  const [metodo, setMetodo] = useState('Deuna');
  const [monto, setMonto] = useState('');
  const [concepto, setConcepto] = useState('Anticipo');
  const [eventoId, setEventoId] = useState(''); // Idealmente esto vendría de un select o prop
  const [archivo, setArchivo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ text: '', type: '' });

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setArchivo(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!eventoId || !monto) {
      setMensaje({ text: 'Por favor completa el monto y el ID del evento.', type: 'error' });
      return;
    }
    
    if (metodo !== 'Efectivo' && !archivo) {
      setMensaje({ text: 'El comprobante es obligatorio para este método de pago.', type: 'error' });
      return;
    }

    setLoading(true);
    setMensaje({ text: '', type: '' });

    try {
      const formData = new FormData();
      formData.append('evento_id', eventoId);
      formData.append('monto', monto);
      formData.append('concepto', concepto);
      formData.append('metodo_pago', metodo);
      
      if (archivo && metodo !== 'Efectivo') {
        formData.append('comprobante', archivo);
      }

      await eventraService.uploadPago(formData);
      
      setMensaje({ 
        text: metodo === 'Efectivo' 
          ? 'Pago registrado. Por favor acércate al local para cancelarlo.' 
          : 'Pago enviado exitosamente. Está en revisión.', 
        type: 'success' 
      });
      
      // Reset form
      setMonto('');
      setArchivo(null);
      e.target.reset();
    } catch (error) {
      setMensaje({ text: 'Ocurrió un error al procesar el pago. Intenta de nuevo.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
        Portal de Pagos
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        Registra tus anticipos, abonos o liquidaciones de manera segura.
      </p>

      {mensaje.text && (
        <div style={{
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          backgroundColor: mensaje.type === 'error' ? '#fef2f2' : '#ecfdf5',
          color: mensaje.type === 'error' ? '#991b1b' : '#065f46',
          border: `1px solid ${mensaje.type === 'error' ? '#f87171' : '#34d399'}`,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {mensaje.type === 'success' && <CheckCircle size={20} />}
          {mensaje.text}
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        {['Deuna', 'Transferencia', 'Efectivo'].map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMetodo(m);
              setArchivo(null);
            }}
            style={{
              flex: 1,
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
              borderRadius: '12px',
              border: `2px solid ${metodo === m ? 'var(--primary)' : 'var(--border-subtle)'}`,
              backgroundColor: metodo === m ? 'rgba(69, 102, 119, 0.05)' : 'white',
              color: metodo === m ? 'var(--primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {m === 'Deuna' && <CreditCard size={24} />}
            {m === 'Transferencia' && <Building size={24} />}
            {m === 'Efectivo' && <Banknote size={24} />}
            <span style={{ fontWeight: 600 }}>{m}</span>
          </button>
        ))}
      </div>

      <Card>
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label className="form-label">ID del Evento / Reserva</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej. e4b3..."
                value={eventoId}
                onChange={(e) => setEventoId(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="form-label">Concepto</label>
              <select 
                className="form-select"
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
              >
                <option value="Anticipo">Anticipo</option>
                <option value="Abono">Abono</option>
                <option value="Liquidación">Liquidación</option>
              </select>
            </div>
          </div>

          <div>
            <label className="form-label">Monto ($)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              className="form-input"
              placeholder="0.00"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              required
            />
          </div>

          {metodo === 'Deuna' && (
            <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '8px', textAlign: 'center' }}>
              <p style={{ fontWeight: 600, marginBottom: '1rem', color: '#0f172a' }}>Escanea para pagar con Deuna!</p>
              <div style={{ 
                width: '150px', height: '150px', margin: '0 auto 1rem', 
                backgroundColor: 'white', border: '1px dashed #cbd5e1', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#94a3b8'
              }}>
                [Código QR Placeholder]
              </div>
            </div>
          )}

          {metodo === 'Transferencia' && (
            <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '8px' }}>
              <h4 style={{ fontWeight: 600, marginBottom: '0.75rem', color: '#0f172a' }}>Datos Bancarios</h4>
              <p style={{ margin: '0.25rem 0', color: '#475569' }}><strong>Banco:</strong> Pichincha</p>
              <p style={{ margin: '0.25rem 0', color: '#475569' }}><strong>Cuenta:</strong> Ahorros 2200334455</p>
              <p style={{ margin: '0.25rem 0', color: '#475569' }}><strong>Titular:</strong> Eventra S.A.</p>
              <p style={{ margin: '0.25rem 0', color: '#475569' }}><strong>RUC:</strong> 1791234567001</p>
            </div>
          )}

          {metodo === 'Efectivo' && (
            <div style={{ backgroundColor: '#fefce8', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid #facc15' }}>
              <h4 style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#854d0e' }}>Instrucciones para pago en Efectivo</h4>
              <p style={{ color: '#a16207' }}>
                Acércate a nuestras oficinas en horario laborable para realizar el pago en efectivo. 
                Recuerda indicar tu ID de evento o presentar tu cotización. El pago se registrará como "Pendiente" hasta que se verifique físicamente.
              </p>
            </div>
          )}

          {metodo !== 'Efectivo' && (
            <div>
              <label className="form-label">Subir Comprobante</label>
              <div style={{ 
                border: '2px dashed var(--border-subtle)', 
                borderRadius: '8px', 
                padding: '2rem',
                textAlign: 'center',
                backgroundColor: '#f8fafc',
                cursor: 'pointer'
              }}>
                <input 
                  type="file" 
                  id="comprobante" 
                  accept="image/*,.pdf" 
                  style={{ display: 'none' }} 
                  onChange={handleFileChange}
                />
                <label htmlFor="comprobante" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <UploadCloud size={32} color="var(--primary)" style={{ marginBottom: '0.5rem' }} />
                  <span style={{ fontWeight: 500, color: 'var(--primary)' }}>Haz clic para subir un archivo</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {archivo ? archivo.name : 'PNG, JPG o PDF (Max. 5MB)'}
                  </span>
                </label>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%', padding: '0.75rem', marginTop: '1rem', display: 'flex', justifyContent: 'center' }}
            disabled={loading}
          >
            {loading ? 'Procesando...' : `Registrar Pago de $${monto || '0.00'}`}
          </button>
        </form>
      </Card>
    </div>
  );
};

export default PagoProcesador;
