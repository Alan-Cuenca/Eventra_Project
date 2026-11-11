import React, { useState } from 'react';
import { useOutletContext, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { TenantAuthLayout } from './TenantAuthLayout';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
} from 'lucide-react';

/**
 * =============================================================================
 * LoginTenant (Autenticación White-Label en Split-Screen)
 * =============================================================================
 * Formulario de inicio de sesión de marca blanca adaptado al nuevo Layout
 * de pantalla dividida. Consume dinámicamente el contexto del tenant activo.
 * =============================================================================
 */
export const LoginTenant = () => {
  const context = useOutletContext() || {};
  const tenantData = context.tenantData || context.empresa || {};
  const slug = context.slug || tenantData.slug || '';

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
      setErrorMsg('Por favor completa tu correo electrónico y contraseña.');
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

      // Redirección por rol
      if (rolId === 5) {
        navigate('/super-admin/dashboard', { replace: true });
      } else if (rolId === 4) {
        navigate('/portal-cliente', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('[LoginTenant] Error de autenticación:', err);
      let msg = 'Credenciales incorrectas. Verifica tu correo y contraseña.';
      if (err?.status === 403 || err?.response?.status === 403) {
        msg =
          err?.data?.message ||
          err?.response?.data?.message ||
          'Cuenta o empresa temporalmente inactiva.';
      } else if (err?.message && !err.message.includes('401')) {
        msg = err.message;
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TenantAuthLayout
      title="Iniciar sesión"
      subtitle="Accede a tu panel de gestión"
    >
      {/* Alerta de Error amigable */}
      {errorMsg && (
        <div
          role="alert"
          className="mb-5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-medium flex items-center gap-2.5 animate-in fade-in duration-200"
        >
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Campo: Correo Electrónico */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Correo electrónico
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="tu@correo.com"
              required
              className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)] transition-all"
            />
          </div>
        </div>

        {/* Campo: Contraseña con Enlace de Recuperación */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-medium text-gray-700">
              Contraseña
            </label>
            <a
              href="#recuperar"
              onClick={(e) => {
                e.preventDefault();
                alert(
                  `Para restablecer tus accesos, contacta al administrador de ${
                    tenantData.nombre_comercial || 'tu empresa organizadora'
                  }.`
                );
              }}
              className="text-xs text-[var(--brand-primary)] hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </a>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)] transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Botón CTA Dinámico */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-[var(--brand-primary)] text-white w-full py-3 rounded-lg hover:opacity-90 transition-opacity font-medium text-sm flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Validando credenciales...</span>
              </>
            ) : (
              <>
                <span>Ingresar al Portal</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Enlace de Pie de Formulario */}
      <div className="mt-8 pt-6 border-t border-gray-100 text-center text-xs text-gray-500">
        ¿Aún no tienes cuenta en este portal?{' '}
        <Link
          to={`/portal/${slug}/registro`}
          className="font-semibold text-[var(--brand-primary)] hover:underline"
        >
          Regístrate aquí
        </Link>
      </div>
    </TenantAuthLayout>
  );
};

export default LoginTenant;
