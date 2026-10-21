import React, { useState, useEffect } from 'react';
import { superAdminService } from '../../services/superAdminService';
import {
  X,
  Layers,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  HelpCircle,
} from 'lucide-react';

const PLANES_DISPONIBLES = [
  { id: 'Basico', nombre: 'Básico', color: '#4D7182' },
  { id: 'Premium', nombre: 'Premium', color: '#C49A3A' },
  { id: 'Enterprise', nombre: 'Enterprise', color: '#7059a6' },
  { id: 'Profesional', nombre: 'Profesional', color: '#2b78a0' },
];

/**
 * =============================================================================
 * CambiarPlanModal
 * =============================================================================
 * Modal para modificar el plan de suscripción de un inquilino SaaS mediante
 * PUT /api/empresas/:id/plan, con confirmación explícita de transición.
 * =============================================================================
 */
export const CambiarPlanModal = ({ isOpen, onClose, empresa, onPlanActualizado }) => {
  const [nuevoPlan, setNuevoPlan] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (empresa) {
      setNuevoPlan(empresa.plan_suscripcion || 'Basico');
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [empresa]);

  if (!isOpen || !empresa) return null;

  const planActual = empresa.plan_suscripcion || 'Basico';
  const hayCambio = nuevoPlan.toLowerCase() !== planActual.toLowerCase();

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!hayCambio) {
      setErrorMsg('Debes seleccionar un plan diferente al actual.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await superAdminService.actualizarPlan(empresa.id, nuevoPlan);
      setSuccessMsg(res?.message || `Plan actualizado exitosamente a ${nuevoPlan}.`);

      setTimeout(() => {
        onPlanActualizado();
        onClose();
      }, 1000);
    } catch (err) {
      console.error('[CambiarPlanModal] Error al actualizar plan:', err);
      if (err?.status === 400) {
        setErrorMsg(err?.data?.message || 'Plan inválido.');
      } else if (err?.status === 404) {
        setErrorMsg('La empresa solicitada no existe.');
      } else if (err?.status === 403) {
        setErrorMsg('Acceso denegado: Se requieren permisos de Super Administrador.');
      } else {
        setErrorMsg(err?.data?.message || err?.message || 'Error al conectar con el servidor.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
    >
      <div
        className="modal-box animate-slide-up"
        style={{ maxWidth: '520px', padding: 0, overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(77, 113, 130, 0.12)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Layers size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Cambio de Plan de Suscripción
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.15rem 0 0', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Inquilino: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{empresa.nombre_comercial}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.35rem 0.5rem' }}
            aria-label="Cerrar modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Mensajes */}
        <div style={{ padding: '1.25rem 1.5rem 0' }}>
          {errorMsg && (
            <div
              role="alert"
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(201, 92, 92, 0.15)',
                border: '1px solid rgba(201, 92, 92, 0.3)',
                color: 'var(--danger)',
                fontSize: '0.75rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
              className="animate-fade-in"
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div
              role="status"
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(77, 154, 114, 0.15)',
                border: '1px solid rgba(77, 154, 114, 0.3)',
                color: 'var(--success)',
                fontSize: '0.75rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
              className="animate-fade-in"
            >
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Cuerpo */}
        <form onSubmit={handleGuardar} style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Selector de nuevo plan */}
          <div>
            <label className="form-label" style={{ marginBottom: '0.5rem' }}>
              Selecciona el Nuevo Plan de Suscripción:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
              {PLANES_DISPONIBLES.map((plan) => {
                const seleccionado = nuevoPlan.toLowerCase() === plan.id.toLowerCase();
                const esActual = planActual.toLowerCase() === plan.id.toLowerCase();

                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => {
                      setNuevoPlan(plan.id);
                      setErrorMsg('');
                    }}
                    style={{
                      padding: '0.85rem',
                      borderRadius: 'var(--radius-md)',
                      border: seleccionado ? '2px solid var(--primary)' : '1px solid var(--border-subtle)',
                      background: seleccionado ? 'rgba(77, 113, 130, 0.12)' : 'var(--bg-primary)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                        {plan.nombre}
                      </span>
                      {esActual && (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '0.15rem 0.45rem',
                            borderRadius: 'var(--radius-full)',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-primary)',
                          }}
                        >
                          Actual
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                      Tier SaaS oficial
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cuadro de Confirmación de Transición */}
          <div
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-primary)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.6rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>
              <HelpCircle size={14} />
              <span>Confirmación de Transición</span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.8rem',
              }}
            >
              <div style={{ textAlign: 'center', flex: 1 }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                  Plan Anterior
                </span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{planActual}</span>
              </div>
              <ArrowRight size={16} style={{ color: 'var(--primary)', margin: '0 0.5rem' }} />
              <div style={{ textAlign: 'center', flex: 1 }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                  Nuevo Plan
                </span>
                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{nuevoPlan}</span>
              </div>
            </div>

            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
              Se actualizará el esquema de suscripción para <strong style={{ color: 'var(--text-primary)' }}>{empresa.nombre_comercial}</strong>.
            </p>
          </div>

          {/* Botones */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !hayCambio}
              className="btn btn-primary"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Actualizando...</span>
                </>
              ) : (
                <span>Confirmar Cambio de Plan</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CambiarPlanModal;
