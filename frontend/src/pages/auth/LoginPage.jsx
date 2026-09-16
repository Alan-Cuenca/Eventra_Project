import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { DEMO_USERS, ROLES } from '../../services/mockData';
import { Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';
import logoImg from '../../assets/logo.png';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoUser) => {
    setEmail(demoUser.email);
    setPassword(demoUser.password);
    setError('');
    setLoading(true);
    try {
      await login(demoUser.email, demoUser.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        background: 'radial-gradient(ellipse at top, #1c2b35 0%, #0c1419 75%)',
      }}
    >
      <div style={{ width: '100%', maxWidth: '440px' }} className="animate-fade-in">
        {/* Header Branding con Logo Oficial */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <img
            src={logoImg}
            alt="EVENTRA"
            style={{
              width: '80px',
              height: '80px',
              objectFit: 'contain',
              borderRadius: '50%',
              boxShadow: '0 8px 24px var(--primary-glow)',
              background: '#FAF8F5',
              padding: '4px',
              marginBottom: '0.85rem',
            }}
          />
          <h1
            style={{
              fontSize: '2.1rem',
              letterSpacing: '0.04em',
              fontWeight: 800,
              color: 'var(--text-primary)',
              marginBottom: '0.2rem',
            }}
          >
            EVENTRA
          </h1>
          <p
            style={{
              color: 'var(--accent)',
              fontSize: '0.825rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Gestión Inteligente de Eventos
          </p>
        </div>

        {/* Card de Inicio de Sesión */}
        <div className="glass-card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Iniciar Sesión
          </h2>

          {error && (
            <div
              style={{
                background: 'var(--danger-light)',
                border: '1px solid rgba(185, 74, 72, 0.4)',
                color: '#e27d7c',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                marginBottom: '1.25rem',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Correo Electrónico</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="ejemplo@eventra.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Mail
                  size={18}
                  style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Lock
                  size={18}
                  style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.85rem' }}
              disabled={loading}
            >
              {loading ? 'Validando credenciales...' : 'Ingresar al Sistema'}
              <ArrowRight size={18} />
            </button>
          </form>

          {/* Acceso Rápido de Prueba (Demo Roles) */}
          <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.725rem', color: 'var(--accent)', marginBottom: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Acceso Rápido de Prueba (Demo Roles):
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {DEMO_USERS.map((demo) => (
                <button
                  key={demo.id}
                  type="button"
                  onClick={() => handleQuickLogin(demo)}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.45rem', justifyContent: 'flex-start' }}
                >
                  <span style={{ fontSize: '1rem' }}>
                    {demo.rol_id === ROLES.ADMIN ? '👑' : demo.rol_id === ROLES.GERENTE ? '💼' : demo.rol_id === ROLES.TRABAJADOR ? '🛠️' : '🎉'}
                  </span>
                  <span>{demo.nombre_completo.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            ¿No tienes cuenta?{' '}
            <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600 }}>
              Regístrate aquí
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
