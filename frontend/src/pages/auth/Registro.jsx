/**
 * EVENTRA — Pantalla de Registro
 * POST /auth/register → muestra éxito → redirige a /login.
 * Captura y muestra errores del servidor (ej. email duplicado → 409).
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Lock, Mail, User, Building2, ArrowRight, CheckCircle2, Loader2, Eye, EyeOff } from 'lucide-react';
import logoImg from '../../assets/logo.png';

const ROLES_OPCIONES = [
  { value: 4, label: '🎉 Cliente', desc: 'Consulta y contrata servicios de eventos' },
  { value: 3, label: '🛠️ Trabajador', desc: 'Personal operativo de la empresa' },
  { value: 2, label: '💼 Gerente', desc: 'Gestiona eventos y personal' },
  { value: 1, label: '👑 Administrador', desc: 'Acceso total al sistema' },
];

export const Registro = () => {
  const [formData, setFormData] = useState({
    nombre_completo: '',
    email: '',
    password: '',
    empresa_id: 1,
    rol_id: 4,          // Cliente por defecto
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

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
      // POST https://eventra-project-l3hl.onrender.com/api/auth/register
      await api.post('/auth/register', {
        nombre_completo: formData.nombre_completo.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        empresa_id: formData.empresa_id,
        rol_id: formData.rol_id,
      });

      // Respuesta 201 → mostrar éxito y redirigir al login
      setSuccess(true);
      setTimeout(() => navigate('/login', { replace: true }), 2500);
    } catch (err) {
      let msg = 'Error inesperado. Intenta de nuevo.';

      if (err.status === 409) {
        msg = '⚠️ Este correo ya está registrado. Intenta con otro o inicia sesión.';
      } else if (err.status === 400) {
        msg = err.message || 'Completa todos los campos correctamente.';
      } else if (!err.status) {
        msg = 'No se pudo conectar al servidor. Verifica tu conexión.';
      } else {
        msg = err.message || msg;
      }

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ── Pantalla de éxito ─────────────────────────────────────────────────── */
  if (success) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'radial-gradient(ellipse 120% 80% at 50% 0%, rgba(69,102,119,0.22) 0%, transparent 60%), var(--bg-main)',
        }}
      >
        <div
          className="glass-card animate-fade-in"
          style={{ maxWidth: '400px', width: '100%', textAlign: 'center', padding: '3rem 2rem' }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'rgba(46,139,87,0.15)',
              border: '2px solid rgba(46,139,87,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
            }}
          >
            <CheckCircle2 size={36} color="#5bc286" />
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
            ¡Cuenta creada!
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.65 }}>
            Tu usuario <strong style={{ color: 'var(--accent)' }}>{formData.email}</strong> ha sido
            registrado exitosamente. Redirigiendo al login...
          </p>
          <div
            style={{
              marginTop: '1.5rem',
              height: '3px',
              borderRadius: '2px',
              background: 'var(--border-subtle)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                background: 'var(--primary)',
                animation: 'progress 2.5s linear forwards',
              }}
            />
          </div>
        </div>
        <style>{`@keyframes progress { from { width: 0% } to { width: 100% } }`}</style>
      </div>
    );
  }

  /* ── Formulario de Registro ────────────────────────────────────────────── */
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        background:
          'radial-gradient(ellipse 120% 80% at 50% 0%, rgba(69,102,119,0.22) 0%, transparent 60%), radial-gradient(ellipse at 80% 100%, rgba(196,181,159,0.07) 0%, transparent 50%), var(--bg-main)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decoración ambiental */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '-100px',
          right: '-150px',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(196,181,159,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ width: '100%', maxWidth: '500px' }} className="animate-fade-in">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
            <img
              src={logoImg}
              alt="EVENTRA"
              style={{
                width: '44px',
                height: '44px',
                objectFit: 'contain',
                borderRadius: '12px',
                background: 'var(--ivory-pure)',
                padding: '4px',
                boxShadow: '0 4px 14px var(--primary-glow)',
              }}
            />
            <span style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '0.06em' }}>EVENTRA</span>
          </div>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: '0.35rem' }}>
            Crear cuenta
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Únete a la plataforma de gestión de eventos
          </p>
        </div>

        {/* Card */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          {/* Error */}
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
                lineHeight: 1.5,
              }}
            >
              {error}
            </div>
          )}

          <form id="registro-form" onSubmit={handleSubmit} noValidate>
            {/* Nombre Completo */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-nombre">
                Nombre completo
              </label>
              <div style={{ position: 'relative' }}>
                <User
                  size={16}
                  style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}
                />
                <input
                  id="reg-nombre"
                  name="nombre_completo"
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '2.75rem' }}
                  placeholder="Juan Pérez García"
                  value={formData.nombre_completo}
                  onChange={handleChange}
                  autoComplete="name"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">
                Correo electrónico
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}
                />
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: '2.75rem' }}
                  placeholder="juan@empresa.com"
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
              <label className="form-label" htmlFor="reg-password">
                Contraseña <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(mín. 6 caracteres)</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}
                />
                <input
                  id="reg-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  style={{ paddingLeft: '2.75rem', paddingRight: '3rem' }}
                  placeholder="Mínimo 6 caracteres"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  minLength={6}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  id="reg-toggle-password"
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

            {/* Rol y Empresa — grid 2 columnas */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-rol">
                  Rol en el sistema
                </label>
                <select
                  id="reg-rol"
                  name="rol_id"
                  className="form-select"
                  value={formData.rol_id}
                  onChange={handleChange}
                  disabled={loading}
                >
                  {ROLES_OPCIONES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-empresa">
                  <Building2 size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                  ID de empresa
                </label>
                <input
                  id="reg-empresa"
                  name="empresa_id"
                  type="number"
                  className="form-input"
                  placeholder="1"
                  value={formData.empresa_id}
                  onChange={handleChange}
                  min={1}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Descripción del rol seleccionado */}
            <div
              style={{
                background: 'rgba(69,102,119,0.1)',
                border: '1px solid rgba(69,102,119,0.2)',
                borderRadius: 'var(--radius-md)',
                padding: '0.6rem 0.85rem',
                marginBottom: '1.25rem',
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
              }}
            >
              {ROLES_OPCIONES.find((r) => r.value === formData.rol_id)?.desc}
            </div>

            {/* Submit */}
            <button
              id="registro-submit-btn"
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.9rem', fontSize: '0.95rem' }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  Creando cuenta...
                </>
              ) : (
                <>
                  Completar registro
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            ¿Ya tienes cuenta?{' '}
            <Link
              to="/login"
              id="link-to-login"
              style={{ color: 'var(--accent)', fontWeight: 600 }}
            >
              Inicia sesión aquí
            </Link>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Registro;
