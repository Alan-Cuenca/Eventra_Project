/**
 * EVENTRA — Pantalla de Login
 * POST /auth/login → guarda token con localStorage.setItem('token', token)
 * y redirige al /dashboard.
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import logoImg from '../../assets/logo.png';

export const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();   // actualiza el contexto global de sesión

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const ROLES_NOMBRES = {
    1: 'Administrador',
    2: 'Gerente',
    3: 'Trabajador',
    4: 'Cliente',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // POST https://eventra-project-l3hl.onrender.com/api/auth/login
      const response = await api.post('/auth/login', {
        email: formData.email,
        password: formData.password,
      });

      const token = response.token;
      if (!token) throw new Error('El servidor no devolvió un token válido');

      // Extraer datos del usuario autenticado
      const userData = response.data ?? {};
      const rolId    = userData.rol_id ?? null;
      const rolNombre = ROLES_NOMBRES[rolId] ?? 'Desconocido';

      // ── Persistencia en localStorage (spec RBAC) ────────────────────────
      // 1. Token JWT
      localStorage.setItem('token', token);
      // 2. Objeto completo del usuario
      localStorage.setItem('eventra_user', JSON.stringify(userData));
      // 3. Rol (crítico para la arquitectura de permisos)
      localStorage.setItem('rol_id',     String(rolId));
      localStorage.setItem('rol_nombre', rolNombre);
      // ────────────────────────────────────────────────────────────────────

      // Sincronizar AuthContext (lee token y user de localStorage)
      await login(formData.email, formData.password);

      // ── Redirección basada en rol ─────────────────────────────────────────
      // rol_id 4 = Cliente → Portal exclusivo de cliente
      // rol_id 1,2,3 = Admin/Gerente/Trabajador → Panel de gestión
      const destino = rolId === 4 ? '/portal-cliente' : '/dashboard';
      navigate(destino, { replace: true });

    } catch (err) {
      const msg =
        err.status === 401
          ? 'Credenciales incorrectas. Verifica tu email y contraseña.'
          : err.status === 400
          ? 'Completa todos los campos correctamente.'
          : err.message || 'Error al conectar con el servidor. Intenta de nuevo.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background:
          'radial-gradient(ellipse 120% 80% at 50% 0%, rgba(69,102,119,0.22) 0%, transparent 60%), radial-gradient(ellipse at 100% 100%, rgba(196,181,159,0.08) 0%, transparent 50%), var(--bg-main)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decoración ambiental */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '-200px',
          left: '-200px',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(69,102,119,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: '-150px',
          right: '-100px',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(196,181,159,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Split Layout */}
      <div style={{ display: 'flex', width: '100%' }}>
        {/* Panel izquierdo — branding (oculto en móvil) */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            padding: '4rem 3rem 4rem 4rem',
            borderRight: '1px solid var(--border-subtle)',
            background: 'rgba(18,28,35,0.4)',
          }}
          className="login-branding-panel"
        >
          <div style={{ maxWidth: '420px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3rem' }}>
              <img
                src={logoImg}
                alt="EVENTRA"
                style={{
                  width: '48px',
                  height: '48px',
                  objectFit: 'contain',
                  borderRadius: '12px',
                  background: 'var(--ivory-pure)',
                  padding: '4px',
                }}
              />
              <span style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '0.06em', color: 'var(--ivory-pure)' }}>
                EVENTRA
              </span>
            </div>

            <h1
              style={{
                fontSize: '2.8rem',
                fontWeight: 800,
                lineHeight: 1.2,
                marginBottom: '1.25rem',
                background: 'linear-gradient(135deg, var(--ivory-pure) 0%, var(--accent) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Gestión Inteligente de Eventos
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.7, marginBottom: '2.5rem' }}>
              Planifica, coordina y ejecuta eventos corporativos con precisión. La plataforma SaaS
              diseñada para empresas que exigen excelencia.
            </p>

            {/* Features */}
            {[
              { icon: '📊', title: 'Dashboard en tiempo real', desc: 'KPIs e indicadores de tus eventos activos' },
              { icon: '🤖', title: 'Asistente IA integrado', desc: 'Automatiza cotizaciones y planificación' },
              { icon: '🔒', title: 'Control de acceso por roles', desc: 'Admin, Gerente, Trabajador y Cliente' },
            ].map((f) => (
              <div
                key={f.title}
                style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', alignItems: 'flex-start' }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'rgba(69,102,119,0.2)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.1rem',
                    flexShrink: 0,
                  }}
                >
                  {f.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{f.title}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel derecho — formulario */}
        <div
          style={{
            width: '480px',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2.5rem 2rem',
          }}
        >
          <div style={{ width: '100%', maxWidth: '400px' }} className="animate-fade-in">
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                <img
                  src={logoImg}
                  alt="EVENTRA"
                  style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--ivory-pure)', padding: '3px', objectFit: 'contain', display: 'none' }}
                  className="mobile-logo"
                />
              </div>
              <h2
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  marginBottom: '0.35rem',
                }}
              >
                Iniciar sesión
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Accede a tu panel de gestión de eventos
              </p>
            </div>

            {/* Alerta de error */}
            {error && (
              <div
                role="alert"
                style={{
                  background: 'var(--danger-light)',
                  border: '1px solid rgba(185,74,72,0.35)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem 1rem',
                  marginBottom: '1.5rem',
                  fontSize: '0.85rem',
                  color: '#e27d7c',
                  display: 'flex',
                  gap: '0.5rem',
                  alignItems: 'flex-start',
                }}
              >
                <span style={{ flexShrink: 0, marginTop: '1px' }}>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Formulario */}
            <form id="login-form" onSubmit={handleSubmit} noValidate>
              {/* Email */}
              <div className="form-group">
                <label className="form-label" htmlFor="login-email">
                  Correo electrónico
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail
                    size={16}
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
                    style={{ paddingLeft: '2.75rem' }}
                    placeholder="usuario@empresa.com"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="form-group">
                <label className="form-label" htmlFor="login-password">
                  Contraseña
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={16}
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
                    style={{ paddingLeft: '2.75rem', paddingRight: '3rem' }}
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
                      right: '0.85rem',
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
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                id="login-submit-btn"
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.9rem', marginTop: '0.5rem', fontSize: '0.95rem' }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                    Verificando credenciales...
                  </>
                ) : (
                  <>
                    Ingresar al sistema
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div style={{ marginTop: '1.75rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              ¿No tienes cuenta?{' '}
              <Link
                to="/registro"
                id="link-to-registro"
                style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}
              >
                Regístrate aquí
              </Link>
            </div>

            {/* Badge de conexión */}
            <div
              style={{
                marginTop: '2rem',
                padding: '0.6rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(69,102,119,0.12)',
                border: '1px solid rgba(69,102,119,0.2)',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                textAlign: 'center',
              }}
            >
              🔐 Conexión segura · API: eventra-project-l3hl.onrender.com
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) {
          .login-branding-panel { display: none !important; }
        }
        @media (max-width: 480px) {
          .mobile-logo { display: flex !important; }
        }
      `}</style>
    </div>
  );
};

export default Login;
