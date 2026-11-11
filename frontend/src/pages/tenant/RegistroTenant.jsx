import React, { useState } from 'react';
import { useOutletContext, useNavigate, Link } from 'react-router-dom';
import { eventraService } from '../../services/eventraService';
import { TenantAuthLayout } from './TenantAuthLayout';
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

/**
 * =============================================================================
 * RegistroTenant
 * =============================================================================
 * Formulario de creación de cuenta de cliente bajo el estándar estético de EVENTRA.
 * Comparte las mismas clases (.form-group, .form-input, .btn-primary) y fuentes.
 * =============================================================================
 */
export const RegistroTenant = () => {
  const context = useOutletContext() || {};
  const tenantData = context.tenantData || context.empresa || {};
  const slug = context.slug || tenantData.slug || '';

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    email: '',
    telefono: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.nombres.trim() || !formData.apellidos.trim()) {
      setError('Por favor ingresa tus nombres y apellidos completos.');
      return;
    }

    if (!formData.email.trim()) {
      setError('El correo electrónico es obligatorio.');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (!tenantData?.id) {
      setError('No se pudo identificar la empresa organizadora.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        empresa_id: tenantData.id,
        empresa_slug: slug,
        nombres: formData.nombres.trim(),
        apellidos: formData.apellidos.trim(),
        nombre_completo: `${formData.nombres.trim()} ${formData.apellidos.trim()}`,
        email: formData.email.trim().toLowerCase(),
        telefono: formData.telefono.trim() || null,
        password: formData.password,
      };

      const response = await eventraService.registrarClientePublico(payload);

      if (response && response.token) {
        localStorage.setItem('token', response.token);
        if (response.data?.usuario) {
          localStorage.setItem('eventra_user', JSON.stringify(response.data.usuario));
          localStorage.setItem('rol_id', '4');
          localStorage.setItem('rol_nombre', 'Cliente');
        }
      }

      setSuccess(true);

      setTimeout(() => {
        navigate('/portal-cliente', { replace: true });
      }, 1800);
    } catch (err) {
      console.error('[RegistroTenant] Error al registrar cliente:', err);
      let msg = 'Ocurrió un error al procesar tu cuenta. Intenta nuevamente.';

      if (err?.status === 409 || err?.response?.status === 409) {
        msg = 'Ya existe una cuenta con este correo electrónico. Por favor inicia sesión.';
      } else if (err?.status === 403 || err?.response?.status === 403) {
        msg =
          err?.data?.message ||
          err?.response?.data?.message ||
          'Límite de clientes alcanzado en este momento.';
      } else if (err?.message) {
        msg = err.message;
      }

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <TenantAuthLayout
        title="¡Cuenta creada con éxito!"
        subtitle="Redirigiendo a tu portal de eventos..."
      >
        <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--success-light)',
              color: 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
            }}
          >
            <CheckCircle2 size={32} />
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Te damos la bienvenida a{' '}
            <strong>{tenantData.nombre_comercial || 'este portal'}</strong>. Tu cuenta
            se encuentra activa para revisar cotizaciones y dar seguimiento a tus eventos.
          </p>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--primary)',
            }}
          >
            <Loader2 size={16} className="animate-spin" />
            <span>Ingresando al sistema...</span>
          </div>
        </div>
      </TenantAuthLayout>
    );
  }

  return (
    <TenantAuthLayout
      title="Crear cuenta"
      subtitle="Accede a tu panel de gestión de eventos"
    >
      {/* Alerta de Error */}
      {error && (
        <div
          role="alert"
          style={{
            background: 'var(--danger-light)',
            border: '1px solid rgba(201,92,92,0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1rem',
            marginBottom: '1.25rem',
            fontSize: '0.8375rem',
            color: '#8a2f2f',
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'flex-start',
          }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>{error}</span>
        </div>
      )}

      {/* Formulario */}
      <form id="tenant-register-form" onSubmit={handleSubmit} noValidate>
        {/* Nombres y Apellidos en 2 columnas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-nombres">
              Nombres *
            </label>
            <div style={{ position: 'relative' }}>
              <User
                size={15}
                style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  pointerEvents: 'none',
                }}
              />
              <input
                id="reg-nombres"
                name="nombres"
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="Ej. Valeria"
                value={formData.nombres}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-apellidos">
              Apellidos *
            </label>
            <input
              id="reg-apellidos"
              name="apellidos"
              type="text"
              className="form-input"
              placeholder="Ej. Morales"
              value={formData.apellidos}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
        </div>

        {/* Correo Electrónico */}
        <div className="form-group">
          <label className="form-label" htmlFor="reg-email">
            Correo electrónico *
          </label>
          <div style={{ position: 'relative' }}>
            <Mail
              size={15}
              style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                pointerEvents: 'none',
              }}
            />
            <input
              id="reg-email"
              name="email"
              type="email"
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="valeria@ejemplo.com"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              required
              disabled={loading}
            />
          </div>
        </div>

        {/* Teléfono / WhatsApp */}
        <div className="form-group">
          <label className="form-label" htmlFor="reg-telefono">
            Teléfono o WhatsApp
          </label>
          <div style={{ position: 'relative' }}>
            <Phone
              size={15}
              style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                pointerEvents: 'none',
              }}
            />
            <input
              id="reg-telefono"
              name="telefono"
              type="tel"
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="+593 987 654 321"
              value={formData.telefono}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
        </div>

        {/* Contraseña y Confirmar Contraseña en 2 columnas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">
              Contraseña *
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={15}
                style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  pointerEvents: 'none',
                }}
              />
              <input
                id="reg-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                style={{ paddingLeft: '2.5rem', paddingRight: '2.25rem' }}
                placeholder="Mínimo 6 caracteres"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                style={{
                  position: 'absolute',
                  right: '0.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                aria-label={showPassword ? 'Ocultar' : 'Ver'}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-confirm-password">
              Confirmar *
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={15}
                style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  pointerEvents: 'none',
                }}
              />
              <input
                id="reg-confirm-password"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                className="form-input"
                style={{ paddingLeft: '2.5rem', paddingRight: '2.25rem' }}
                placeholder="Repite la contraseña"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((s) => !s)}
                style={{
                  position: 'absolute',
                  right: '0.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                aria-label={showConfirmPassword ? 'Ocultar' : 'Ver'}
              >
                {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        </div>

        {/* Botón CTA */}
        <button
          id="reg-submit-btn"
          type="submit"
          className="btn btn-primary btn-lg"
          style={{ width: '100%', marginTop: '0.5rem' }}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 size={17} className="animate-spin" />
              Creando cuenta oficial...
            </>
          ) : (
            <>
              Crear cuenta oficial
              <ArrowRight size={17} />
            </>
          )}
        </button>
      </form>

      {/* Footer */}
      <div
        style={{
          marginTop: '1.5rem',
          textAlign: 'center',
          fontSize: '0.8125rem',
          color: 'var(--text-muted)',
          lineHeight: '1.45',
        }}
      >
        ¿Ya tienes cuenta en este portal?{' '}
        <Link
          to={`/portal/${slug}/login`}
          style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}
        >
          Inicia sesión aquí
        </Link>
      </div>
    </TenantAuthLayout>
  );
};

export default RegistroTenant;
