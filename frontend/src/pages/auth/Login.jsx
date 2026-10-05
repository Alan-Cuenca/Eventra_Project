/**
 * EVENTRA — Login Dual Panel
 * Izquierda: Branding crema cálido + eslogan + imagen elegante
 * Derecha: Formulario estándar + Acceso rápido (Demo Roles)
 */
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { DEMO_USERS, ROLES } from '../../services/mockData';
import {
  Lock, Mail, ArrowRight, Eye, EyeOff, Loader2,
  CalendarDays, Star, Shield, Briefcase, Users, Sparkles,
} from 'lucide-react';
import logoImg from '../../assets/logo.png';

// Configuración visual de cada rol demo
const DEMO_ROLES = [
  {
    rol_id: ROLES.ADMIN,
    nombre: 'Martín Falcon',
    cargo: 'Administrador SaaS',
    initials: 'MF',
    color: '#C95C5C',
    bg: '#fff0f0',
    icon: <Shield size={13} />,
    dest: '/dashboard',
  },
  {
    rol_id: ROLES.GERENTE,
    nombre: 'Alan Puruncajas',
    cargo: 'Gerente de Operaciones',
    initials: 'AP',
    color: '#4D7182',
    bg: '#eef4f7',
    icon: <Briefcase size={13} />,
    dest: '/dashboard',
  },
  {
    rol_id: ROLES.TRABAJADOR,
    nombre: 'Jorge Sailema',
    cargo: 'Coordinador de Eventos',
    initials: 'JS',
    color: '#C49A3A',
    bg: '#fdf6e3',
    icon: <Users size={13} />,
    dest: '/dashboard',
  },
  {
    rol_id: ROLES.CLIENTE,
    nombre: 'Pablo Vayas',
    cargo: 'Cliente — Quinceañera',
    initials: 'PV',
    color: '#4D9A72',
    bg: '#edf7f2',
    icon: <Star size={13} />,
    dest: '/portal-cliente',
  },
];

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
  const [demoLoading, setDemoLoading] = useState(null); // rol_id loading

  const navigate = useNavigate();
  const { login, switchDemoRole } = useAuth();

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  // ── Login estándar ──────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(formData.email, formData.password);
      const rolId = result?.user?.rol_id ?? null;
      navigate(rolId === 4 ? '/portal-cliente' : '/dashboard', { replace: true });
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

  // ── Acceso rápido Demo Roles ────────────────────────────────────────────────
  const handleDemoLogin = async (role) => {
    setDemoLoading(role.rol_id);
    try {
      await switchDemoRole(role.rol_id);
      setTimeout(() => {
        navigate(role.dest, { replace: true });
        setDemoLoading(null);
      }, 350);
    } catch {
      setDemoLoading(null);
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

        {/* Imagen decorativa elegante */}
        <div
          style={{
            width: '100%',
            maxWidth: '440px',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '2.5rem',
            background: 'var(--white)',
          }}
        >
          {/* Mockup de tarjetas de evento */}
          <div style={{ padding: '1.25rem', background: 'var(--white)' }}>
            <div
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '0.7rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--text-muted)',
                marginBottom: '0.875rem',
              }}
            >
              ✦ Próximos Eventos
            </div>
            {[
              { titulo: 'Boda Alejandra & Carlos', fecha: '24 Oct 2026', prog: 65, color: '#4D7182' },
              { titulo: 'Mis XV Años — Valentina', fecha: '14 Nov 2026', prog: 40, color: '#4D9A72' },
            ].map((evt) => (
              <div
                key={evt.titulo}
                style={{
                  padding: '0.875rem',
                  borderRadius: '12px',
                  border: '1px solid var(--border-subtle)',
                  marginBottom: '0.6rem',
                  background: 'var(--cream)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.5rem',
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--primary-dark)' }}>
                    {evt.titulo}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {evt.fecha}
                  </span>
                </div>
                <div className="progress-bar-container">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${evt.prog}%`,
                      background: `linear-gradient(90deg, ${evt.color}, ${evt.color}99)`,
                    }}
                  />
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                  {evt.prog}% organizado
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', maxWidth: '420px' }}>
          {FEATURES.map((f) => (
            <div
              key={f.title}
              style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start' }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(77,113,130,0.1)',
                  border: '1px solid rgba(77,113,130,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)',
                  flexShrink: 0,
                }}
              >
                {f.icon}
              </div>
              <div>
                <div
                  style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--primary-dark)' }}
                >
                  {f.title}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                  {f.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
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
              <span style={{ flexShrink: 0 }}>⚠️</span>
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

          {/* Divisor */}
          <div className="divider-text" style={{ margin: '1.5rem 0' }}>
            Acceso rápido (Demo Roles)
          </div>

          {/* ── Sección crítica: 4 botones de roles demo ─────────────────── */}
          <div
            id="demo-roles-section"
            style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
          >
            {DEMO_ROLES.map((role) => (
              <button
                key={role.rol_id}
                id={`demo-btn-${role.rol_id}`}
                className="demo-role-btn"
                onClick={() => handleDemoLogin(role)}
                disabled={demoLoading !== null}
                aria-label={`Ingresar como ${role.nombre}`}
              >
                {/* Avatar coloreado */}
                <div
                  className="demo-role-avatar"
                  style={{ background: role.bg, color: role.color, border: `1px solid ${role.color}30` }}
                >
                  {demoLoading === role.rol_id ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    role.initials
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--primary-dark)' }}>
                    {role.nombre}
                  </div>
                  <div style={{ fontSize: '0.71rem', color: 'var(--text-muted)', marginTop: '0.05rem' }}>
                    {role.cargo}
                  </div>
                </div>

                {/* Badge de rol */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.2rem 0.55rem',
                    borderRadius: 'var(--radius-full)',
                    background: role.bg,
                    color: role.color,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    border: `1px solid ${role.color}30`,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {role.icon}
                  {role.cargo.split('—')[0].trim().split(' ')[0]}
                </div>
              </button>
            ))}
          </div>

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

          {/* Badge de seguridad */}
          <div
            style={{
              marginTop: '1.25rem',
              padding: '0.55rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--cream)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              textAlign: 'center',
            }}
          >
            🔐 Conexión segura · API: eventra-project-l3hl.onrender.com
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
