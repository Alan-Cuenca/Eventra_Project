import React, { useState } from 'react';
import {
  X,
  Building2,
  User,
  Mail,
  AlertCircle,
  Layers,
  KeyRound,
  Loader2,
  CheckCircle2,
  Send,
  AlertTriangle,
} from 'lucide-react';
import { superAdminService } from '../../services/superAdminService';

const PLANES_DISPONIBLES = [
  { id: 'Basico', nombre: 'Básico' },
  { id: 'Premium', nombre: 'Premium' },
  { id: 'Enterprise', nombre: 'Enterprise' },
];

/**
 * Estados del flujo de registro con contraseña temporal
 */
export const ESTADOS_REGISTRO = {
  IDLE: 'IDLE',
  REGISTRANDO: 'REGISTRANDO',
  ENVIANDO: 'ENVIANDO',
  COMPLETADO: 'COMPLETADO',
  ERROR_REGISTRO: 'ERROR_REGISTRO',
  ERROR_ENVIO_CORREO: 'ERROR_ENVIO_CORREO',
};

/**
 * =============================================================================
 * CrearEmpresaModal
 * =============================================================================
 * Formulario de alta de empresa con generación de contraseña temporal en backend:
 *  - 4 campos obligatorios: nombre comercial, plan, admin_nombre, admin_email.
 *  - Sin campo de contraseña manual en el frontend.
 *  - Mensaje informativo del flujo de contraseña temporal y cambio obligatorio.
 *  - Botón: "Registrar Empresa y Enviar Credenciales".
 *  - Manejo de estados: registrando, completado, error de registro y error de correo.
 * =============================================================================
 */
export const CrearEmpresaModal = ({ isOpen, onClose, onEmpresaCreada }) => {
  const [formData, setFormData] = useState({
    nombre_comercial: '',
    plan_suscripcion: 'Basico',
    admin_nombre: '',
    admin_email: '',
  });

  const [estadoProceso, setEstadoProceso] = useState(ESTADOS_REGISTRO.IDLE);
  const [errorMsg, setErrorMsg] = useState('');
  const [errorDetalleCorreo, setErrorDetalleCorreo] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrorMsg('');
    setErrorDetalleCorreo('');
  };

  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.admin_email.trim());
  const formularioCompleto =
    formData.nombre_comercial.trim().length > 0 &&
    formData.admin_nombre.trim().length > 0 &&
    emailValido;

  const handleCrearEmpresa = async (e) => {
    if (e) e.preventDefault();
    if (!formularioCompleto || estadoProceso === ESTADOS_REGISTRO.REGISTRANDO) return;

    setErrorMsg('');
    setErrorDetalleCorreo('');
    setEstadoProceso(ESTADOS_REGISTRO.REGISTRANDO);

    try {
      const res = await superAdminService.crearEmpresa({
        nombre_comercial: formData.nombre_comercial.trim(),
        plan_suscripcion: formData.plan_suscripcion,
        admin_nombre: formData.admin_nombre.trim(),
        admin_email: formData.admin_email.trim().toLowerCase(),
      });

      if (res?.correo_enviado) {
        setEstadoProceso(ESTADOS_REGISTRO.COMPLETADO);
        if (onEmpresaCreada) onEmpresaCreada();
        setTimeout(() => {
          onClose();
          setEstadoProceso(ESTADOS_REGISTRO.IDLE);
          setFormData({
            nombre_comercial: '',
            plan_suscripcion: 'Basico',
            admin_nombre: '',
            admin_email: '',
          });
        }, 1800);
      } else {
        // La empresa se creó exitosamente pero falló el envío de correo
        setEstadoProceso(ESTADOS_REGISTRO.ERROR_ENVIO_CORREO);
        setErrorDetalleCorreo(res?.email_error || res?.message || '');
        if (onEmpresaCreada) onEmpresaCreada();
      }
    } catch (err) {
      setEstadoProceso(ESTADOS_REGISTRO.ERROR_REGISTRO);
      const isTimeout = err?.code === 'ECONNABORTED' || err?.message?.toLowerCase().includes('timeout');
      setErrorMsg(
        isTimeout
          ? 'El servidor tardó en responder (inicio en frío de Render). Por favor, intenta de nuevo en unos segundos.'
          : (err?.response?.data?.message || err?.message || 'Error al registrar la empresa en el servidor.')
      );
    }
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
        {/* Cabecera del modal */}
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
              <Building2 size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Alta de Empresa & Credenciales Temporales
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.15rem 0 0' }}>
                Ingresa los datos requeridos para registrar el inquilino SaaS.
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

        {/* Mensaje Informativo Oficial del Flujo */}
        <div style={{ padding: '1.25rem 1.5rem 0' }}>
          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(77, 113, 130, 0.1)',
              border: '1px solid rgba(77, 113, 130, 0.25)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              fontSize: '0.75rem',
              color: 'var(--text-primary)',
            }}
          >
            <KeyRound size={17} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ lineHeight: '1.45' }}>
              <span style={{ fontWeight: 700, color: 'var(--primary)', display: 'block', marginBottom: '0.2rem' }}>
                Generación Automática de Contraseña Temporal
              </span>
              <p style={{ margin: 0 }}>
                Al registrar la empresa, se generará automáticamente una contraseña temporal criptográfica válida por 48 horas y se enviará al correo del administrador inicial. Por seguridad, deberá cambiarla obligatoriamente en su primer inicio de sesión.
              </p>
            </div>
          </div>
        </div>

        {/* Estados Visuales de Retroalimentación */}
        {estadoProceso === ESTADOS_REGISTRO.REGISTRANDO && (
          <div style={{ padding: '0.75rem 1.5rem 0' }}>
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(77, 113, 130, 0.1)',
                border: '1px solid rgba(77, 113, 130, 0.25)',
                color: 'var(--primary)',
                fontSize: '0.75rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
              className="animate-pulse"
            >
              <Loader2 size={16} className="animate-spin" />
              <span>Registrando empresa y enviando credenciales por correo...</span>
            </div>
          </div>
        )}

        {estadoProceso === ESTADOS_REGISTRO.COMPLETADO && (
          <div style={{ padding: '0.75rem 1.5rem 0' }}>
            <div
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
            >
              <CheckCircle2 size={16} />
              <span>Empresa registrada exitosamente. Credenciales temporales enviadas al administrador inicial.</span>
            </div>
          </div>
        )}

        {estadoProceso === ESTADOS_REGISTRO.ERROR_ENVIO_CORREO && (
          <div style={{ padding: '0.75rem 1.5rem 0' }}>
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(196, 154, 58, 0.15)',
                border: '1px solid rgba(196, 154, 58, 0.3)',
                color: 'var(--warning)',
                fontSize: '0.75rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <AlertTriangle size={16} className="flex-shrink-0" />
              <span>
                Empresa registrada exitosamente, pero no fue posible enviar el correo de bienvenida en este momento
                {errorDetalleCorreo ? `: ${errorDetalleCorreo}` : '. Puede reenviarlo posteriormente.'}
              </span>
            </div>
          </div>
        )}

        {/* Mensaje de error general de registro */}
        {errorMsg && (
          <div style={{ padding: '0.75rem 1.5rem 0' }}>
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
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        {/* Formulario con exactamente los 4 campos obligatorios */}
        <form onSubmit={handleCrearEmpresa} style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* 1. Nombre Comercial */}
          <div>
            <label className="form-label" style={{ marginBottom: '0.35rem' }}>
              Nombre Comercial de la Empresa <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <Building2 size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                name="nombre_comercial"
                value={formData.nombre_comercial}
                onChange={handleChange}
                placeholder="Ej. Recepciones & Eventos Imperial"
                required
                disabled={estadoProceso === ESTADOS_REGISTRO.REGISTRANDO}
                className="form-input"
                style={{ paddingLeft: '2.4rem' }}
              />
            </div>
          </div>

          {/* 2. Plan de Suscripción Inicial */}
          <div>
            <label className="form-label" style={{ marginBottom: '0.35rem' }}>
              Plan de Suscripción Inicial <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <Layers size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <select
                name="plan_suscripcion"
                value={formData.plan_suscripcion}
                onChange={handleChange}
                disabled={estadoProceso === ESTADOS_REGISTRO.REGISTRANDO}
                className="form-select"
                style={{ paddingLeft: '2.4rem', fontWeight: 600 }}
              >
                {PLANES_DISPONIBLES.map((p) => (
                  <option key={p.id} value={p.id}>
                    Plan {p.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Nombre Completo del Administrador */}
          <div>
            <label className="form-label" style={{ marginBottom: '0.35rem' }}>
              Nombre Completo del Administrador Inicial <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <User size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                name="admin_nombre"
                value={formData.admin_nombre}
                onChange={handleChange}
                placeholder="Ej. Martín Falcon"
                required
                disabled={estadoProceso === ESTADOS_REGISTRO.REGISTRANDO}
                className="form-input"
                style={{ paddingLeft: '2.4rem' }}
              />
            </div>
          </div>

          {/* 4. Correo Electrónico del Administrador */}
          <div>
            <label className="form-label" style={{ marginBottom: '0.35rem' }}>
              Correo Electrónico del Administrador Inicial <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="email"
                name="admin_email"
                value={formData.admin_email}
                onChange={handleChange}
                placeholder="administrador@empresa.com"
                required
                disabled={estadoProceso === ESTADOS_REGISTRO.REGISTRANDO}
                className="form-input"
                style={{ paddingLeft: '2.4rem' }}
              />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.35rem 0 0' }}>
              Las credenciales de acceso con la contraseña temporal se enviarán a esta casilla.
            </p>
          </div>

          {/* Footer de botones con el nombre oficial solicitado */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={estadoProceso === ESTADOS_REGISTRO.REGISTRANDO}
              className="btn btn-secondary"
            >
              Cerrar
            </button>

            <button
              type="submit"
              disabled={!formularioCompleto || estadoProceso === ESTADOS_REGISTRO.REGISTRANDO || estadoProceso === ESTADOS_REGISTRO.COMPLETADO}
              className="btn btn-primary"
            >
              {estadoProceso === ESTADOS_REGISTRO.REGISTRANDO ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Registrando Empresa...</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>Registrar Empresa y Enviar Credenciales</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CrearEmpresaModal;
