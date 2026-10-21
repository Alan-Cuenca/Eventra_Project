import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Lock, User, Calendar, CheckCircle2, AlertCircle, Loader2, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react';
import logoImg from '../../assets/logo.png';

export const CompletarRegistro = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nombre_completo: '',
    cedula: '',
    fecha_nacimiento: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Enlace inválido. No se detectó un token de invitación válido.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/completar-registro', {
        token,
        nombre_completo: formData.nombre_completo.trim(),
        cedula: formData.cedula.trim(),
        fecha_nacimiento: formData.fecha_nacimiento || null,
        password: formData.password,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000);
    } catch (err) {
      console.error('[CompletarRegistro] Error:', err);
      setError(
        err.message ||
        'El enlace de invitación es inválido, ha expirado o ya fue utilizado. Solicite una nueva invitación.'
      );
    } finally {
      setLoading(false);
    }
  };

  /* ── Pantalla de token faltante ───────────────────────────────────────── */
  if (!token) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F3F0E4',
          padding: '24px',
        }}
      >
        <div
          style={{
            maxWidth: '440px',
            width: '100%',
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '40px 32px',
            boxShadow: '0 4px 20px rgba(35, 61, 73, 0.08)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#FBE8E8',
              color: '#C95C5C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <AlertCircle size={32} />
          </div>
          <h2 style={{ color: '#233D49', fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>
            Enlace de Invitación Requerido
          </h2>
          <p style={{ color: '#4D7182', fontSize: '14px', lineHeight: '1.5', marginBottom: '24px' }}>
            Para activar tu cuenta de colaborador en EVENTRA, debes acceder mediante el enlace enviado a tu correo electrónico por el Administrador.
          </p>
          <Link
            to="/login"
            style={{
              display: 'inline-block',
              backgroundColor: '#4D7182',
              color: '#FFFFFF',
              padding: '12px 24px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '14px',
            }}
          >
            Ir a Iniciar Sesión
          </Link>
        </div>
      </div>
    );
  }

  /* ── Pantalla de éxito ─────────────────────────────────────────────────── */
  if (success) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F3F0E4',
          padding: '24px',
        }}
      >
        <div
          style={{
            maxWidth: '440px',
            width: '100%',
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '40px 32px',
            boxShadow: '0 4px 20px rgba(35, 61, 73, 0.08)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#E8F5EE',
              color: '#4D9A72',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <CheckCircle2 size={32} />
          </div>
          <h2 style={{ color: '#233D49', fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>
            ¡Cuenta Activada con Éxito!
          </h2>
          <p style={{ color: '#4D7182', fontSize: '14px', lineHeight: '1.5', marginBottom: '24px' }}>
            Tu contraseña ha sido configurada correctamente. Te estamos redirigiendo a la pantalla de inicio de sesión...
          </p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            style={{
              backgroundColor: '#4D7182',
              color: '#FFFFFF',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            Iniciar Sesión Ahora <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  /* ── Formulario de activación ─────────────────────────────────────────── */
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F3F0E4',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: '480px',
          width: '100%',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '36px 32px',
          boxShadow: '0 4px 24px rgba(35, 61, 73, 0.08)',
        }}
      >
        {/* Cabecera */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <img src={logoImg} alt="EVENTRA" style={{ height: '36px', margin: '0 auto 12px' }} />
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '20px',
              backgroundColor: '#ECE7D5',
              color: '#4D7182',
              fontSize: '12px',
              fontWeight: '600',
              marginBottom: '12px',
            }}
          >
            <ShieldCheck size={14} /> Activación de Colaborador
          </div>
          <h1 style={{ color: '#233D49', fontSize: '22px', fontWeight: '700', margin: '0 0 6px' }}>
            Completa tu Registro
          </h1>
          <p style={{ color: '#4D7182', fontSize: '14px', margin: 0 }}>
            Configura tus datos personales y contraseña para acceder al sistema.
          </p>
        </div>

        {/* Alerta de error */}
        {error && (
          <div
            style={{
              backgroundColor: '#FDF2F2',
              border: '1px solid #F8D7D7',
              borderRadius: '8px',
              padding: '12px 16px',
              color: '#C95C5C',
              fontSize: '13px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Nombre Completo */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#233D49', marginBottom: '6px' }}>
              Nombre Completo *
            </label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#7E919C' }} />
              <input
                type="text"
                name="nombre_completo"
                required
                value={formData.nombre_completo}
                onChange={handleChange}
                placeholder="Ej. Juan Carlos Pérez"
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 40px',
                  borderRadius: '8px',
                  border: '1px solid #CEC8B8',
                  fontSize: '14px',
                  color: '#233D49',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Cédula de Identidad */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#233D49', marginBottom: '6px' }}>
              Cédula de Identidad
            </label>
            <input
              type="text"
              name="cedula"
              value={formData.cedula}
              onChange={handleChange}
              placeholder="Ej. 1723456789"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #CEC8B8',
                fontSize: '14px',
                color: '#233D49',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Fecha de Nacimiento */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#233D49', marginBottom: '6px' }}>
              Fecha de Nacimiento
            </label>
            <div style={{ position: 'relative' }}>
              <Calendar size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#7E919C' }} />
              <input
                type="date"
                name="fecha_nacimiento"
                value={formData.fecha_nacimiento}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 40px',
                  borderRadius: '8px',
                  border: '1px solid #CEC8B8',
                  fontSize: '14px',
                  color: '#233D49',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Contraseña */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#233D49', marginBottom: '6px' }}>
              Crear Contraseña * (mínimo 6 caracteres)
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#7E919C' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                minLength={6}
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '10px 40px 10px 40px',
                  borderRadius: '8px',
                  border: '1px solid #CEC8B8',
                  fontSize: '14px',
                  color: '#233D49',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '10px',
                  background: 'none',
                  border: 'none',
                  color: '#7E919C',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirmar Contraseña */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#233D49', marginBottom: '6px' }}>
              Confirmar Contraseña *
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#7E919C' }} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                required
                minLength={6}
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '10px 40px 10px 40px',
                  borderRadius: '8px',
                  border: '1px solid #CEC8B8',
                  fontSize: '14px',
                  color: '#233D49',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '10px',
                  background: 'none',
                  border: 'none',
                  color: '#7E919C',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Botón de Enviar */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '12px',
              width: '100%',
              backgroundColor: '#4D7182',
              color: '#FFFFFF',
              border: 'none',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'background-color 0.2s',
            }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Activando Cuenta...
              </>
            ) : (
              'Completar Registro y Activar Cuenta'
            )}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px', color: '#4D7182' }}>
          ¿Ya tienes tu cuenta activa?{' '}
          <Link to="/login" style={{ color: '#233D49', fontWeight: '700', textDecoration: 'none' }}>
            Inicia sesión aquí
          </Link>
        </div>
      </div>
    </div>
  );
};
