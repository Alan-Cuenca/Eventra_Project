import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, Loader2, ShieldCheck, CheckCircle2, ArrowLeft } from 'lucide-react';
import { authService } from '../../services/authService';
import { PasswordAuthShell, AlertaEstado, usePortalTenant } from './PasswordAuthShell';

const Requisito = ({ ok, children }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.4rem',
      color: ok ? '#4D9A72' : 'var(--text-muted)',
      fontWeight: ok ? 600 : 400,
    }}
  >
    <CheckCircle2 size={13} />
    <span>{children}</span>
  </div>
);

const CampoPassword = ({ id, label, value, onChange, visible, onToggle, placeholder, disabled }) => (
  <div className="form-group">
    <label className="form-label" htmlFor={id}>
      {label}
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
        id={id}
        type={visible ? 'text' : 'password'}
        className="form-input"
        style={{ paddingLeft: '2.65rem', paddingRight: '3rem' }}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete="new-password"
        required
        disabled={disabled}
      />
      <button
        type="button"
        onClick={onToggle}
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
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      >
        {visible ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  </div>
);

/**
 * =============================================================================
 * RestablecerPassword
 * =============================================================================
 * Define una nueva contraseña a partir del enlace recibido por correo.
 * Rutas: /restablecer-password?token=...  y  /portal/:slug/restablecer-password?token=...
 * =============================================================================
 */
export const RestablecerPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const { slug, enPortal } = usePortalTenant();
  const rutaLogin = enPortal ? `/portal/${slug}/login` : '/login';
  const rutaRecuperar = enPortal ? `/portal/${slug}/recuperar-password` : '/recuperar-password';

  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [verConfirmar, setVerConfirmar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  const tieneMinimo = password.length >= 8;
  const tieneMayuscula = /[A-Z]/.test(password);
  const tieneNumero = /\d/.test(password);
  const coinciden = password.length > 0 && password === confirmar;
  const valida = tieneMinimo && tieneMayuscula && tieneNumero && coinciden;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!valida) {
      setError('La nueva contraseña debe cumplir todos los requisitos de seguridad.');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.restablecerPassword({
        token,
        password_nuevo: password,
        password_confirmar: confirmar,
      });
      setExito(response?.message || 'Tu contraseña fue restablecida exitosamente.');
      const destino = enPortal ? rutaLogin : response?.data?.redirect || rutaLogin;
      setTimeout(() => navigate(destino, { replace: true }), 1800);
    } catch (err) {
      setError(
        err?.status === 400 || err?.status === 403
          ? err.message
          : 'No fue posible restablecer la contraseña en este momento. Intenta nuevamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <PasswordAuthShell
        title="Enlace no válido"
        subtitle="El enlace de recuperación está incompleto o no es válido."
        icon={<ShieldCheck size={24} />}
      >
        <AlertaEstado tipo="error">
          Abre el enlace exactamente como llegó a tu correo o solicita uno nuevo.
        </AlertaEstado>
        <Link to={rutaRecuperar} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
          Solicitar un nuevo enlace
        </Link>
      </PasswordAuthShell>
    );
  }

  return (
    <PasswordAuthShell
      title="Crear nueva contraseña"
      subtitle="Define una contraseña personal y segura para tu cuenta."
      icon={<ShieldCheck size={24} />}
    >
      {error && (
        <AlertaEstado tipo="error">
          {error}{' '}
          {/expirado|inválido|utilizado/i.test(error) && (
            <Link to={rutaRecuperar} style={{ color: 'inherit', fontWeight: 700, textDecoration: 'underline' }}>
              Solicitar un nuevo enlace
            </Link>
          )}
        </AlertaEstado>
      )}
      {exito && <AlertaEstado tipo="exito">{exito} Redirigiendo al inicio de sesión...</AlertaEstado>}

      <form id="restablecer-password-form" onSubmit={handleSubmit} noValidate>
        <CampoPassword
          id="nueva-password"
          label="Nueva contraseña"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (error) setError('');
          }}
          visible={verPassword}
          onToggle={() => setVerPassword((v) => !v)}
          placeholder="Mínimo 8 caracteres"
          disabled={loading || Boolean(exito)}
        />
        <CampoPassword
          id="confirmar-password"
          label="Confirmar nueva contraseña"
          value={confirmar}
          onChange={(e) => {
            setConfirmar(e.target.value);
            if (error) setError('');
          }}
          visible={verConfirmar}
          onToggle={() => setVerConfirmar((v) => !v)}
          placeholder="Repite tu nueva contraseña"
          disabled={loading || Boolean(exito)}
        />

        <div
          style={{
            padding: '0.75rem',
            borderRadius: '10px',
            border: '1px solid var(--border-subtle, #CEC8B8)',
            fontSize: '0.72rem',
            display: 'grid',
            gap: '0.25rem',
            marginBottom: '1rem',
          }}
        >
          <Requisito ok={tieneMinimo}>Al menos 8 caracteres</Requisito>
          <Requisito ok={tieneMayuscula}>Al menos una letra mayúscula</Requisito>
          <Requisito ok={tieneNumero}>Al menos un número</Requisito>
          <Requisito ok={coinciden}>Las contraseñas coinciden</Requisito>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-lg"
          style={{ width: '100%' }}
          disabled={loading || !valida || Boolean(exito)}
        >
          {loading ? (
            <>
              <Loader2 size={17} className="animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <ShieldCheck size={16} />
              Guardar nueva contraseña
            </>
          )}
        </button>
      </form>

      <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.8125rem' }}>
        <Link
          to={rutaLogin}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--primary)',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={14} />
          Volver a iniciar sesión
        </Link>
      </div>
    </PasswordAuthShell>
  );
};

export default RestablecerPassword;
