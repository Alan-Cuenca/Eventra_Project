import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Loader2, Send, ArrowLeft, KeyRound } from 'lucide-react';
import { authService } from '../../services/authService';
import { PasswordAuthShell, AlertaEstado, usePortalTenant } from './PasswordAuthShell';

/**
 * =============================================================================
 * RecuperarPassword
 * =============================================================================
 * Solicitud de enlace de restablecimiento de contraseña.
 * Rutas: /recuperar-password  y  /portal/:slug/recuperar-password
 * =============================================================================
 */
export const RecuperarPassword = () => {
  const { slug, enPortal } = usePortalTenant();
  const rutaLogin = enPortal ? `/portal/${slug}/login` : '/login';

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [enviado, setEnviado] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.solicitarRecuperacionPassword(email.trim());
      setEnviado(
        response?.message ||
          'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.'
      );
    } catch (err) {
      setError(
        err?.status === 400
          ? err.message
          : 'No fue posible procesar la solicitud en este momento. Intenta nuevamente en unos minutos.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <PasswordAuthShell
      title="Recuperar contraseña"
      subtitle="Ingresa el correo de tu cuenta y te enviaremos un enlace para crear una nueva contraseña."
      icon={<KeyRound size={24} />}
    >
      {error && <AlertaEstado tipo="error">{error}</AlertaEstado>}

      {enviado ? (
        <>
          <AlertaEstado tipo="exito">
            {enviado} El enlace es válido por 30 minutos. Revisa también tu carpeta de spam.
          </AlertaEstado>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ width: '100%' }}
            onClick={() => {
              setEnviado('');
              setEmail('');
            }}
          >
            Enviar a otro correo
          </button>
        </>
      ) : (
        <form id="recuperar-password-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="recuperar-email">
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
                id="recuperar-email"
                type="email"
                className="form-input"
                style={{ paddingLeft: '2.65rem' }}
                placeholder="usuario@empresa.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                autoComplete="email"
                required
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                Enviando enlace...
              </>
            ) : (
              <>
                Enviar enlace de recuperación
                <Send size={16} />
              </>
            )}
          </button>
        </form>
      )}

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

export default RecuperarPassword;
