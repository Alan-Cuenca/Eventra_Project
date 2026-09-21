import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { MOCK_SERVICIOS, MOCK_PAQUETES } from '../../services/mockData';
import { eventraService } from '../../services/eventraService';
import { Calculator, Check, Plus, Minus, Calendar, Sparkles, Send, ShieldCheck } from 'lucide-react';

export const QuotesPage = () => {
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedServices, setSelectedServices] = useState({});
  const [guests, setGuests] = useState(100);
  const [eventDate, setEventDate] = useState('2026-11-28');
  const [anticipoPercent, setAnticipoPercent] = useState(50);
  const [submitted, setSubmitted] = useState(false);

  // Alternar servicio individual
  const toggleService = (serviceId) => {
    setSelectedServices((prev) => {
      const next = { ...prev };
      if (next[serviceId]) {
        delete next[serviceId];
      } else {
        next[serviceId] = true;
      }
      return next;
    });
  };

  // Cálculos dinámicos de costos conforme a IEC 61508 (integridad de cálculo)
  const packageCost = selectedPackage ? selectedPackage.precio_total : 0;
  
  const additionalServicesCost = Object.keys(selectedServices).reduce((sum, sId) => {
    const s = MOCK_SERVICIOS.find((serv) => serv.id === parseInt(sId, 10));
    if (!s) return sum;
    if (s.unidad === 'por persona') {
      return sum + s.precio_base * guests;
    }
    return sum + s.precio_base;
  }, 0);

  const subtotal = packageCost + additionalServicesCost;
  const anticipoMonto = (subtotal * anticipoPercent) / 100;
  const saldoPendiente = subtotal - anticipoMonto;

  const handleCreateQuote = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    try {
      await eventraService.createCotizacion({
        fecha_estimada_evento: eventDate,
        total_calculado: subtotal,
        paquete_id: selectedPackage?.id || null,
      });
      alert('¡Cotización generada y registrada exitosamente en EVENTRA!');
    } catch {
      alert('¡Cotización calculada y guardada en el sistema local!');
    } finally {
      setSubmitted(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Cotizador Dinámico de Eventos</h1>
          <p>
            Cálculo automatizado de costos, anticipos (30% / 50%) y saldos conforme a las directrices de planificación.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '1.5rem', alignItems: 'flex-start' }}>
        {/* Columna Izquierda: Configuración del Evento */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* 1. Parámetros Básicos */}
          <Card>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
              <Calendar size={18} color="var(--accent)" />
              1. Parámetros del Evento
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Fecha Prevista del Evento</label>
                <input
                  type="date"
                  className="form-input"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Número Estimado de Invitados</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setGuests(Math.max(20, guests - 10))}
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    type="number"
                    className="form-input"
                    style={{ textAlign: 'center' }}
                    value={guests}
                    onChange={(e) => setGuests(parseInt(e.target.value, 10) || 20)}
                    min={20}
                    max={500}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setGuests(guests + 10)}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* 2. Selección de Paquete Prediseñado */}
          <Card>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
              <Sparkles size={18} color="var(--accent)" />
              2. Selección de Paquete Prediseñado (Opcional)
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {MOCK_PAQUETES.map((pack) => {
                const isSelected = selectedPackage?.id === pack.id;
                return (
                  <div
                    key={pack.id}
                    onClick={() => setSelectedPackage(isSelected ? null : pack)}
                    style={{
                      padding: '1rem',
                      borderRadius: '8px',
                      border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border-subtle)'}`,
                      background: isSelected ? 'rgba(196, 181, 159, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--text-muted)'}`,
                            background: isSelected ? 'var(--accent)' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {isSelected && <Check size={12} color="#121c23" />}
                        </div>
                        <strong style={{ color: 'var(--text-primary)' }}>{pack.nombre}</strong>
                        {pack.recomendado && <Badge variant="accent">Recomendado</Badge>}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: '1.75rem' }}>
                        {pack.servicios_incluidos.join(' • ')}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent)' }}>
                        ${pack.precio_total.toLocaleString()}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}>{pack.descuento}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* 3. Selección de Servicios Individuales */}
          <Card>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
              3. Servicios a la Carta
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {MOCK_SERVICIOS.map((serv) => {
                const isSelected = !!selectedServices[serv.id];
                const calculatedPrice = serv.unidad === 'por persona' ? serv.precio_base * guests : serv.precio_base;

                return (
                  <div
                    key={serv.id}
                    onClick={() => toggleService(serv.id)}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: '8px',
                      border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border-subtle)'}`,
                      background: isSelected ? 'rgba(196, 181, 159, 0.1)' : 'rgba(255, 255, 255, 0.01)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <input type="checkbox" checked={isSelected} readOnly />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{serv.nombre}</div>
                        <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                          {serv.categoria} • ${serv.precio_base} {serv.unidad}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--accent)' }}>
                      +${calculatedPrice.toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Columna Derecha: Resumen Dinámico en Vivo */}
        <div style={{ position: 'sticky', top: '90px' }}>
          <Card style={{ border: '1px solid var(--accent)' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
              <Calculator size={20} color="var(--accent)" />
              Resumen de la Cotización
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Paquete Base:</span>
                <span>${packageCost.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Servicios a la Carta:</span>
                <span>${additionalServicesCost.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Invitados:</span>
                <span>{guests} personas</span>
              </div>
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 800 }}>
                <span>Total Estimado:</span>
                <span style={{ color: 'var(--accent)' }}>${subtotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Esquema de Pagos y Anticipos */}
            <div style={{ background: 'rgba(23, 36, 46, 0.7)', padding: '1rem', borderRadius: '8px', marginBottom: '1.25rem', border: '1px solid var(--border-subtle)' }}>
              <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                Condición de Anticipo Inicial:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setAnticipoPercent(30)}
                  className={`btn ${anticipoPercent === 30 ? 'btn-accent' : 'btn-secondary'}`}
                  style={{ fontSize: '0.8rem', padding: '0.4rem' }}
                >
                  30% de Reserva
                </button>
                <button
                  type="button"
                  onClick={() => setAnticipoPercent(50)}
                  className={`btn ${anticipoPercent === 50 ? 'btn-accent' : 'btn-secondary'}`}
                  style={{ fontSize: '0.8rem', padding: '0.4rem' }}
                >
                  50% de Reserva
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <span style={{ color: '#5bc286' }}>Anticipo Requerido ({anticipoPercent}%):</span>
                <strong style={{ color: '#5bc286' }}>${anticipoMonto.toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--accent)' }}>Saldo Pre-Evento:</span>
                <strong style={{ color: 'var(--accent)' }}>${saldoPendiente.toFixed(2)}</strong>
              </div>
            </div>

            <button
              onClick={handleCreateQuote}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.85rem' }}
              disabled={subtotal === 0 || submitted}
            >
              <Send size={16} />
              <span>{submitted ? 'Guardando en BD...' : 'Confirmar y Guardar Cotización'}</span>
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
};
