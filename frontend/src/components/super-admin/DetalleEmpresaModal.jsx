import React from 'react';
import {
  X,
  Building2,
  Calendar,
  Users,
  CalendarDays,
  DollarSign,
  ShieldCheck,
  ShieldAlert,
  Layers,
  FileText,
} from 'lucide-react';

/**
 * =============================================================================
 * DetalleEmpresaModal
 * =============================================================================
 * Presenta el desglose informativo completo de un inquilino a partir de los
 * datos reales devueltos por el backend (GET /api/empresas).
 * =============================================================================
 */
export const DetalleEmpresaModal = ({
  isOpen,
  onClose,
  empresa,
  onAbrirCambiarPlan,
  onAbrirSuspender,
}) => {
  if (!isOpen || !empresa) return null;

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return 'No disponible';
    try {
      const f = new Date(fechaStr);
      return f.toLocaleDateString('es-EC', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return fechaStr;
    }
  };

  const formatearMoneda = (monto) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Number(monto || 0));
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
    >
      <div
        className="modal-box animate-slide-up"
        style={{ maxWidth: '580px', padding: 0, overflow: 'hidden' }}
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
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--primary)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1.1rem',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {empresa.nombre_comercial ? empresa.nombre_comercial[0].toUpperCase() : 'E'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  {empresa.nombre_comercial}
                </h3>
                {empresa.estado_activo ? (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.15rem 0.55rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      background: 'rgba(77, 154, 114, 0.15)',
                      color: 'var(--success)',
                    }}
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)' }}></span>
                    Activa
                  </span>
                ) : (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.15rem 0.55rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      background: 'rgba(201, 92, 92, 0.15)',
                      color: 'var(--danger)',
                    }}
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--danger)' }}></span>
                    Suspendida
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace', margin: '0.2rem 0 0' }}>
                RUC: {empresa.ruc || 'No registrado'} · ID Tenant: #{empresa.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.35rem 0.5rem' }}
            aria-label="Cerrar modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Contenido */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Métricas clave del Inquilino */}
          <div>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)', margin: '0 0 0.75rem' }}>
              Métricas Consolidadas del Inquilino
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
              <div
                style={{
                  padding: '0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-primary)',
                  textAlign: 'center',
                }}
              >
                <div style={{ width: '30px', height: '30px', margin: '0 auto 0.4rem', borderRadius: 'var(--radius-sm)', background: 'rgba(77, 113, 130, 0.12)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={16} />
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {empresa.total_usuarios || 0}
                </div>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  Usuarios Totales
                </div>
              </div>

              <div
                style={{
                  padding: '0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-primary)',
                  textAlign: 'center',
                }}
              >
                <div style={{ width: '30px', height: '30px', margin: '0 auto 0.4rem', borderRadius: 'var(--radius-sm)', background: 'rgba(196, 154, 58, 0.12)', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CalendarDays size={16} />
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {empresa.total_eventos || 0}
                </div>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  Eventos Totales
                </div>
              </div>

              <div
                style={{
                  padding: '0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-primary)',
                  textAlign: 'center',
                }}
              >
                <div style={{ width: '30px', height: '30px', margin: '0 auto 0.4rem', borderRadius: 'var(--radius-sm)', background: 'rgba(77, 154, 114, 0.12)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <DollarSign size={16} />
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {formatearMoneda(empresa.total_ingresos)}
                </div>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: '0.15rem' }} title="Pagos completados registrados en eventos de esta empresa">
                  Ingresos por eventos
                </div>
              </div>
            </div>
          </div>

          {/* Ficha técnica del inquilino */}
          <div style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', overflow: 'hidden', fontSize: '0.78rem' }}>
            <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-subtle)', fontWeight: 700, color: 'var(--text-primary)' }}>
              Ficha Técnica de la Cuenta
            </div>
            <div style={{ background: 'var(--bg-card)' }}>
              <div style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FileText size={14} /> Identificador de Empresa:
                </span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)' }}>
                  TENANT-{empresa.id}
                </span>
              </div>

              <div style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Layers size={14} /> Plan de Suscripción:
                </span>
                <span style={{ padding: '0.15rem 0.55rem', borderRadius: 'var(--radius-full)', fontWeight: 700, fontSize: '0.72rem', background: 'rgba(77, 113, 130, 0.12)', color: 'var(--primary)', border: '1px solid rgba(77, 113, 130, 0.25)' }}>
                  Plan {empresa.plan_suscripcion || 'Básico'}
                </span>
              </div>

              <div style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Calendar size={14} /> Fecha de Registro:
                </span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {formatearFecha(empresa.fecha_registro)}
                </span>
              </div>

              <div style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {empresa.estado_activo ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                  Estado Operativo:
                </span>
                <span style={{ fontWeight: 700, color: empresa.estado_activo ? 'var(--success)' : 'var(--danger)' }}>
                  {empresa.estado_activo ? 'Habilitada (Sin restricciones)' : 'Suspendida temporalmente'}
                </span>
              </div>
            </div>
          </div>

          {/* Nota semántica de aclaración */}
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic', background: 'var(--bg-primary)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', margin: 0 }}>
            * La métrica de ingresos corresponde a los pagos registrados y completados por concepto de eventos dentro del inquilino, no a cuotas de suscripción SaaS.
          </p>

          {/* Acciones directas */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onAbrirCambiarPlan(empresa);
                }}
                className="btn btn-secondary btn-sm"
                style={{ color: 'var(--primary)', fontWeight: 700 }}
              >
                Cambiar Plan
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onAbrirSuspender(empresa);
                }}
                className={`btn btn-sm ${empresa.estado_activo ? 'btn-danger' : 'btn-primary'}`}
              >
                {empresa.estado_activo ? 'Suspender Acceso' : 'Reactivar Acceso'}
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetalleEmpresaModal;
