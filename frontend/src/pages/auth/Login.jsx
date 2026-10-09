/**
 * EVENTRA — Login Dual Panel
 * Izquierda: Branding crema cálido + eslogan + imagen elegante
 * Derecha: Formulario estándar + Acceso rápido (Demo Roles)
 */
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Lock, Mail, ArrowRight, Eye, EyeOff, Loader2,
  CalendarDays, Shield, Sparkles, AlertCircle,
} from 'lucide-react';
import logoImg from '../../assets/logo.png';

const FEATURES = [
  {
    icon: <CalendarDays size={18} />,
    title: 'Dashboard en tiempo real',
    desc: 'KPIs e indicadores de todos tus eventos activos',
  },
  {
    icon: <Sparkles size={18} />,
    title: 'Cotizador IA inteligente',
    desc: 'Arma cotizaciones profesionales en segundos',
  },
  {
    icon: <Shield size={18} />,
    title: 'Control RBAC por roles',
    desc: 'Admin, Gerente, Trabajador y Cliente',
  },
];

export const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  // ── Login estándar ──────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(formData.email, formData.password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(
        err?.status === 401
          ? 'Credenciales incorrectas. Verifica tu email y contraseña.'
          : err?.status === 400
          ? 'Completa todos los campos correctamente.'
          : err?.message || 'Error al conectar con el servidor.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      {/* ── Panel Izquierdo — Branding Crema ─────────────────────────────── */}
      <div className="login-left">
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '2.5rem' }}>
          <img
            src={logoImg}
            alt="EVENTRA"
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              objectFit: 'contain',
              background: 'var(--white)',
              padding: '6px',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-sm)',
            }}
          />
          <div>
            <div
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '1.5rem',
                fontWeight: 900,
                letterSpacing: '0.05em',
                color: 'var(--primary-dark)',
                lineHeight: 1,
              }}
            >
              EVENTRA
            </div>
            <div
              style={{
                fontSize: '0.62rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--primary)',
                marginTop: '0.2rem',
              }}
            >
              Gestión Inteligente de Eventos
            </div>
          </div>
        </div>

        {/* Eslogan */}
        <h1
          style={{
            fontSize: '2.5rem',
            fontWeight: 900,
            color: 'var(--primary-dark)',
            lineHeight: 1.2,
            marginBottom: '1rem',
            maxWidth: '440px',
          }}
        >
          Haz de cada evento{' '}
          <span style={{ color: 'var(--primary)' }}>una experiencia única</span>
        </h1>

        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '1.05rem',
            lineHeight: 1.7,
            marginBottom: '2.5rem',
            maxWidth: '420px',
          }}
        >
          La plataforma SaaS para planificar, coordinar y ejecutar recepciones y
          eventos con precisión profesional.
        </p>


      </div>

      {/* ── Panel Derecho — Formulario (Card Blanca) ──────────────────────── */}
      <div className="login-right">
        <div className="login-card animate-fade-in">
          {/* Header del formulario */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h2
              style={{
                fontSize: '1.6rem',
                fontWeight: 800,
                color: 'var(--primary-dark)',
                marginBottom: '0.3rem',
              }}
            >
              Iniciar sesión
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Accede a tu panel de gestión de eventos
            </p>
          </div>

          {/* Error */}
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
          <form id="login-form" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">
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
                  id="login-email"
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

            <div className="form-group">
              <label className="form-label" htmlFor="login-password">
                Contraseña
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
                  id="login-password"
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
                  id="toggle-password-visibility"
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

            <button
              id="login-submit-btn"
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

          {/* Footer */}
          <div
            style={{
              marginTop: '1.5rem',
              textAlign: 'center',
              fontSize: '0.8125rem',
              color: 'var(--text-muted)',
            }}
          >
            ¿No tienes cuenta?{' '}
            <Link
              to="/registro"
              id="link-to-registro"
              style={{ color: 'var(--primary)', fontWeight: 700 }}
            >
              Regístrate aquí
            </Link>
          </div>


        </div>
      </div>
    </div>
  );
};

export default Login;
