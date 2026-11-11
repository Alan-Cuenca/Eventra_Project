import React, { useState } from 'react';
import { useOutletContext, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';

/**
 * =============================================================================
 * LoginClienteTenant
 * =============================================================================
 * Formulario de Inicio de Sesión de Marca Blanca para el Portal de Inquilino.
 * Se renderiza bajo /portal/:slug/login dentro de PortalTenantLayout.
 * Hereda automáticamente la paleta de colores, el logotipo y la identidad
 * del tenant activo (ej. Helados La Catedral o Recepciones & Eventos Imperial).
 * =============================================================================
 */
export const LoginClienteTenant = () => {
  const { empresa, slug } = useOutletContext();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMsg) setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.email.trim() || !formData.password) {
      setErrorMsg('Por favor completa tu correo y contraseña.');
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

      // Redirección inteligente según el rol autenticado
      if (rolId === 5) {
        navigate('/super-admin/dashboard', { replace: true });
      } else if (rolId === 4) {
        navigate('/portal-cliente', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('[LoginClienteTenant] Error de autenticación:', err);
      let msg = 'Credenciales incorrectas. Verifica tu correo y contraseña.';
      if (err?.status === 403 || err?.response?.status === 403) {
        msg = err?.data?.message || err?.response?.data?.message || 'Cuenta o empresa temporalmente inactiva.';
      } else if (err?.message && !err.message.includes('401')) {
        msg = err.message;
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[var(--ev-surface)] rounded-[24px] shadow-sm border border-[var(--ev-border)]/50 p-6 sm:p-8 max-w-md w-full transition-all duration-200">
      {/* Encabezado */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--ev-primary)] mb-1">
          <Sparkles size={14} />
          <span>Acceso al Portal</span>
        </div>
        <h2 className="text-2xl font-semibold text-[var(--ev-text-main)] tracking-tight">
          Iniciar Sesión
        </h2>
        <p className="text-xs text-[var(--ev-text-muted)] mt-1.5 leading-relaxed">
          Ingresa a tu cuenta para gestionar tus eventos y cotizaciones en <strong>{empresa?.nombre_comercial}</strong>.
        </p>
      </div>

      {/* Alerta de Error */}
      {errorMsg && (
        <div
          role="alert"
          className="mb-5 p-3 rounded-xl bg-[#C95C5C]/10 border border-[#C95C5C]/25 text-[#C95C5C] text-xs font-medium flex items-center gap-2.5 animate-fade-in"
        >
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-[var(--ev-text-main)] mb-1.5">
            Correo Electrónico
          </label>
          <div className="relative">
            <Mail
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ev-text-muted)] opacity-60"
            />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="tu@correo.com"
              required
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[var(--ev-border)]/70 bg-[var(--ev-surface)] text-[var(--ev-text-main)] placeholder:text-[var(--ev-text-muted)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--ev-primary)]/20 focus:border-[var(--ev-primary)] transition-all text-sm"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold text-[var(--ev-text-main)] mb-1.5">
            Contraseña
          </label>
          <div className="relative">
            <Lock
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ev-text-muted)] opacity-60"
            />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Tu contraseña"
              required
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[var(--ev-border)]/70 bg-[var(--ev-surface)] text-[var(--ev-text-main)] placeholder:text-[var(--ev-text-muted)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--ev-primary)]/20 focus:border-[var(--ev-primary)] transition-all text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ev-text-muted)] hover:text-[var(--ev-text-main)] transition-colors p-1"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {/* Botón CTA */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-[var(--ev-primary)] text-white font-semibold text-sm shadow-sm hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Iniciando sesión...</span>
              </>
            ) : (
              <>
                <span>Ingresar a {empresa?.nombre_comercial}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Enlace a Registro */}
      <div className="mt-6 pt-4 border-t border-[var(--ev-border)]/40 text-center">
        <p className="text-xs text-[var(--ev-text-muted)]">
          ¿Aún no tienes una cuenta en este portal?{' '}
          <Link
            to={`/portal/${slug}/registro`}
            className="font-semibold text-[var(--ev-primary)] hover:underline ml-1 inline-flex items-center gap-0.5"
          >
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginClienteTenant;
