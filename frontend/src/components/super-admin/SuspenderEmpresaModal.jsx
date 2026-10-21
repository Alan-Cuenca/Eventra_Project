import React, { useState } from 'react';
import { superAdminService } from '../../services/superAdminService';
import {
  X,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldAlert,
  Power,
  RotateCcw,
} from 'lucide-react';

/**
 * =============================================================================
 * SuspenderEmpresaModal
 * =============================================================================
 * Modal de confirmación para suspender o reactivar el acceso de una empresa SaaS
 * mediante PUT /api/empresas/:id/suspender.
 * Presenta advertencias claras sobre el impacto en los usuarios vinculados.
 * =============================================================================
 */
export const SuspenderEmpresaModal = ({
  isOpen,
  onClose,
  empresa,
  onEstadoModificado,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen || !empresa) return null;

  const estaActiva = empresa.estado_activo;
  const nuevoEstado = !estaActiva; // Si está activa se suspenderá (false), si está suspendida se reactivará (true)

  const handleConfirmar = async () => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await superAdminService.suspenderEmpresa(empresa.id, nuevoEstado);
      const accion = nuevoEstado ? 'reactivada' : 'suspendida';
      setSuccessMsg(res?.message || `Empresa ${accion} exitosamente.`);

      setTimeout(() => {
        onEstadoModificado();
        onClose();
      }, 1000);
    } catch (err) {
      console.error('[SuspenderEmpresaModal] Error al modificar estado:', err);
      if (err?.status === 404) {
        setErrorMsg('La empresa no fue encontrada.');
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
        style={{ maxWidth: '480px', padding: 0, overflow: 'hidden' }}
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
                background: estaActiva ? 'rgba(201, 92, 92, 0.15)' : 'rgba(77, 154, 114, 0.15)',
                color: estaActiva ? 'var(--danger)' : 'var(--success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {estaActiva ? <Power size={20} /> : <RotateCcw size={20} />}
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                {estaActiva ? 'Suspender Inquilino SaaS' : 'Reactivar Inquilino SaaS'}
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.15rem 0 0', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {empresa.nombre_comercial}
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
              <AlertCircle size={16} className="flex-shrink-0" />
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
              <CheckCircle2 size={16} className="flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Contenido / Advertencia */}
        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {estaActiva ? (
            <div
              style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(201, 92, 92, 0.3)',
                background: 'rgba(201, 92, 92, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--danger)' }}>
                <AlertTriangle size={16} />
                <span>Advertencia de Impacto de Acceso</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.45 }}>
                Al suspender a <strong style={{ color: 'var(--danger)' }}>{empresa.nombre_comercial}</strong>,
                todos los administradores, gerentes y trabajadores asignados a esta empresa{' '}
                <strong>perderán el acceso inmediato al sistema</strong> hasta que sea reactivada.
              </p>
            </div>
          ) : (
            <div
              style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(77, 154, 114, 0.3)',
                background: 'rgba(77, 154, 114, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--success)' }}>
                <ShieldAlert size={16} />
                <span>Restauración de Operaciones</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.45 }}>
                Al reactivar a <strong style={{ color: 'var(--success)' }}>{empresa.nombre_comercial}</strong>,
                se rehabilitará el inicio de sesión y la operativa para todos los usuarios y clientes
                pertenecientes a este inquilino.
              </p>
            </div>
          )}

          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-primary)',
              fontSize: '0.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Estado actual:</span>
              <span style={{ fontWeight: 700, color: estaActiva ? 'var(--success)' : 'var(--danger)' }}>
                {estaActiva ? 'Activa' : 'Suspendida'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Usuarios afectados:</span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                {empresa.total_usuarios || 0} usuarios
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Plan:</span>
              <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                {empresa.plan_suscripcion || 'Básico'}
              </span>
            </div>
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
              type="button"
              onClick={handleConfirmar}
              disabled={loading}
              className={`btn ${estaActiva ? 'btn-danger' : 'btn-primary'}`}
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Procesando...</span>
                </>
              ) : estaActiva ? (
                <>
                  <Power size={14} />
                  <span>Confirmar Suspensión</span>
                </>
              ) : (
                <>
                  <RotateCcw size={14} />
                  <span>Reactivar Empresa</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuspenderEmpresaModal;
