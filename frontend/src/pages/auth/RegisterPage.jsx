import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MOCK_EMPRESAS, ROLES } from '../../services/mockData';
import { Lock, Mail, User, Building, ArrowRight } from 'lucide-react';
import logoImg from '../../assets/logo.png';

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    nombre_completo: '',
    email: '',
    password: '',
    rol_id: ROLES.CLIENTE,
    empresa_id: 1,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'rol_id' || name === 'empresa_id' ? parseInt(value, 10) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(formData);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Error al registrar usuario');
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
      <div style={{ width: '100%', maxWidth: '480px' }} className="animate-fade-in">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <img
            src={logoImg}
            alt="EVENTRA"
            style={{
              width: '70px',
              height: '70px',
              objectFit: 'contain',
              borderRadius: '50%',
              boxShadow: '0 8px 24px var(--primary-glow)',
              background: '#FAF8F5',
              padding: '4px',
              marginBottom: '0.75rem',
            }}
          />
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
            Registro en EVENTRA
          </h1>
          <p style={{ color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Gestión Inteligente de Eventos
          </p>
        </div>

        <div className="glass-card">
          {error && (
            <div
              style={{
                background: 'var(--danger-light)',
                border: '1px solid rgba(185, 74, 72, 0.4)',
                color: '#e27d7c',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                marginBottom: '1rem',
              }}
            >
              {error}
            </div>
          )}

          {success && (
            <div
              style={{
                background: 'var(--success-light)',
                border: '1px solid rgba(46, 139, 87, 0.4)',
                color: '#5bc286',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                marginBottom: '1rem',
              }}
            >
              ¡Usuario registrado exitosamente en PostgreSQL! Redirigiendo al login...
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Nombre Completo</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  name="nombre_completo"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="Juan Pérez"
                  value={formData.nombre_completo}
                  onChange={handleChange}
                  required
                />
                <User
                  size={18}
                  style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Correo Electrónico</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="juan@email.com"
                  value={formData.email}
                  onChange={handleChange}
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
                  name="password"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="Mínimo 6 caracteres"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <Lock
                  size={18}
                  style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Rol Deseado</label>
                <select
                  name="rol_id"
                  className="form-select"
                  value={formData.rol_id}
                  onChange={handleChange}
                >
                  <option value={ROLES.CLIENTE}>Cliente</option>
                  <option value={ROLES.TRABAJADOR}>Trabajador</option>
                  <option value={ROLES.GERENTE}>Gerente</option>
                  <option value={ROLES.ADMIN}>Administrador</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Empresa Asignada</label>
                <select
                  name="empresa_id"
                  className="form-select"
                  value={formData.empresa_id}
                  onChange={handleChange}
                >
                  {MOCK_EMPRESAS.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nombre_comercial}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.75rem', padding: '0.85rem' }}
              disabled={loading || success}
            >
              {loading ? 'Creando cuenta en PostgreSQL...' : 'Completar Registro'}
              <ArrowRight size={18} />
            </button>
          </form>

          <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            ¿Ya tienes cuenta registrada?{' '}
            <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>
              Inicia sesión aquí
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
