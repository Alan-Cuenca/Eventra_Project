import React, { useState } from 'react';
import { useOutletContext, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { TenantAuthLayout } from './TenantAuthLayout';
import {
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
} from 'lucide-react';

/**
 * =============================================================================
 * LoginTenant
 * =============================================================================
 * Formulario de autenticación para el Portal de Inquilino con los mismos estilos,
 * fuentes (Outfit / Plus Jakarta Sans), clases y micro-interacciones de Login.jsx.
 * =============================================================================
 */
export const LoginTenant = () => {
  const context = useOutletContext() || {};
  const tenantData = context.tenantData || context.empresa || {};
  const slug = context.slug || tenantData.slug || '';

  // Preservar el slug de la empresa activa para que el logout siempre retorne a este portal
  React.useEffect(() => {
    if (slug) {
      localStorage.setItem('last_tenant_slug', slug);
    }
  }, [slug]);

  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email.trim() || !formData.password) {
      setError('Por favor completa todos los campos.');
      return;
    }

    setLoading(true);

    try {
      const result = await login(formData.email.trim(), formData.password);
      const user = result?.user;
      const rolId = Number(user?.rol_id);

      if (user?.debe_cambiar_password || user?.primer_acceso) {
        navigate('/primer-acceso/cambiar-password', { replace: true });
        return;
      }

      if (rolId === 5) {
        navigate('/super-admin/dashboard', { replace: true });
      } else if (rolId === 4) {
        navigate('/portal-cliente', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('[LoginTenant] Error de autenticación:', err);
      let msg = 'Credenciales incorrectas. Verifica tu email y contraseña.';
      if (err?.status === 403 || err?.response?.status === 403) {
        msg =
          err?.data?.message ||
          err?.response?.data?.message ||
          'Cuenta o empresa temporalmente inactiva.';
      } else if (err?.message && !err.message.includes('401')) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TenantAuthLayout
      title="Iniciar sesión"
      subtitle="Accede a tu panel de gestión de eventos"
    >
      {/* Mensaje de Error (Idéntico a Login.jsx) */}
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

      {/* Formulario Estándar de EVENTRA */}
      <form id="tenant-login-form" onSubmit={handleSubmit} noValidate>
        {/* Correo Electrónico */}
        <div className="form-group">
          <label className="form-label" htmlFor="tenant-email">
            Correo electrónico
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
              id="tenant-email"
              name="email"
              type="email"
              className="form-input"
              style={{ paddingLeft: '2.65rem' }}
              placeholder="usuario@empresa.com"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              required
              disabled={loading}
            />
          </div>
        </div>

        {/* Contraseña */}
        <div className="form-group">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.375rem',
            }}
          >
            <label className="form-label" htmlFor="tenant-password" style={{ margin: 0 }}>
              Contraseña
            </label>
            <Link
              to={`/portal/${slug}/recuperar-password`}
              id="tenant-forgot-password-link"
              style={{
                fontSize: '0.75rem',
                color: 'var(--primary)',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

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
              id="tenant-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              className="form-input"
              style={{ paddingLeft: '2.65rem', paddingRight: '3rem' }}
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
              disabled={loading}
            />
            <button
              type="button"
              id="tenant-toggle-password"
              onClick={() => setShowPassword((s) => !s)}
              style={{
                position: 'absolute',
                right: '0.875rem',
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
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {/* Botón CTA (Clase Oficial .btn .btn-primary .btn-lg) */}
        <button
          id="tenant-submit-btn"
          type="submit"
          className="btn btn-primary btn-lg"
          style={{ width: '100%', marginTop: '0.5rem' }}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 size={17} className="animate-spin" />
              Verificando credenciales...
            </>
          ) : (
            <>
              Ingresar al sistema
              <ArrowRight size={17} />
            </>
          )}
        </button>
      </form>

      {/* Footer del Formulario */}
      <div
        style={{
          marginTop: '1.5rem',
          textAlign: 'center',
          fontSize: '0.8125rem',
          color: 'var(--text-muted)',
          lineHeight: '1.45',
        }}
      >
        ¿Aún no tienes cuenta en este portal?{' '}
        <Link
          to={`/portal/${slug}/registro`}
          style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}
        >
          Regístrate aquí
        </Link>
      </div>
    </TenantAuthLayout>
  );
};

export default LoginTenant;
