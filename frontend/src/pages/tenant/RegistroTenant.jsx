import React, { useState } from 'react';
import { useOutletContext, useNavigate, Link } from 'react-router-dom';
import { eventraService } from '../../services/eventraService';
import { TenantAuthLayout } from './TenantAuthLayout';
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

/**
 * =============================================================================
 * RegistroTenant (Autoregistro White-Label en Split-Screen)
 * =============================================================================
 * Formulario de creación de cuenta de cliente bajo el Layout de pantalla
 * dividida. Comparte la envoltura TenantAuthLayout para una transición perfecta.
 * =============================================================================
 */
export const RegistroTenant = () => {
  const context = useOutletContext() || {};
  const tenantData = context.tenantData || context.empresa || {};
  const slug = context.slug || tenantData.slug || '';

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    email: '',
    telefono: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMsg) setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.nombres.trim() || !formData.apellidos.trim()) {
      setErrorMsg('Por favor ingresa tus nombres y apellidos completos.');
      return;
    }

    if (!formData.email.trim()) {
      setErrorMsg('El correo electrónico es obligatorio.');
      return;
    }

    if (formData.password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    if (!tenantData?.id) {
      setErrorMsg('No se pudo identificar la empresa organizadora.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        empresa_id: tenantData.id,
        empresa_slug: slug,
        nombres: formData.nombres.trim(),
        apellidos: formData.apellidos.trim(),
        nombre_completo: `${formData.nombres.trim()} ${formData.apellidos.trim()}`,
        email: formData.email.trim().toLowerCase(),
        telefono: formData.telefono.trim() || null,
        password: formData.password,
      };

      const response = await eventraService.registrarClientePublico(payload);

      // Guardar token JWT y sesión del cliente
      if (response && response.token) {
        localStorage.setItem('token', response.token);
        if (response.data?.usuario) {
          localStorage.setItem('eventra_user', JSON.stringify(response.data.usuario));
          localStorage.setItem('rol_id', '4');
          localStorage.setItem('rol_nombre', 'Cliente');
        }
      }

      setSuccess(true);

      setTimeout(() => {
        navigate('/portal-cliente', { replace: true });
      }, 1800);
    } catch (err) {
      console.error('[RegistroTenant] Error al registrar cliente:', err);
      let msg = 'Ocurrió un error al procesar tu cuenta. Intenta nuevamente.';

      if (err?.status === 409 || err?.response?.status === 409) {
        msg = 'Ya existe una cuenta con este correo electrónico. Por favor inicia sesión.';
      } else if (err?.status === 403 || err?.response?.status === 403) {
        msg =
          err?.data?.message ||
          err?.response?.data?.message ||
          'Límite de clientes alcanzado en este momento.';
      } else if (err?.message) {
        msg = err.message;
      }

      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ── Estado de Éxito con Retroalimentación Visual ───────────────────────── */
  if (success) {
    return (
      <TenantAuthLayout
        title="¡Cuenta creada con éxito!"
        subtitle="Redirigiendo a tu portal de eventos..."
      >
        <div className="text-center py-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
            <CheckCircle2 size={32} />
          </div>
          <p className="text-sm text-gray-600 mb-6">
            Te damos la bienvenida a{' '}
            <strong>{tenantData.nombre_comercial || 'este portal'}</strong>. Ya puedes
            revisar cotizaciones y dar seguimiento a tus eventos.
          </p>
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[var(--brand-primary)]">
            <Loader2 size={16} className="animate-spin" />
            <span>Ingresando al sistema...</span>
          </div>
        </div>
      </TenantAuthLayout>
    );
  }

  return (
    <TenantAuthLayout
      title="Crear cuenta"
      subtitle="Accede a tu panel de gestión"
    >
      {/* Alerta de Error */}
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
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Nombres y Apellidos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Nombres <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                name="nombres"
                value={formData.nombres}
                onChange={handleChange}
                placeholder="Ej. Valeria"
                required
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Apellidos <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="apellidos"
              value={formData.apellidos}
              onChange={handleChange}
              placeholder="Ej. Morales"
              required
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)] transition-all"
            />
          </div>
        </div>

        {/* Correo Electrónico */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Correo electrónico <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="valeria@ejemplo.com"
              required
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)] transition-all"
            />
          </div>
        </div>

        {/* Teléfono / WhatsApp */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Teléfono o WhatsApp
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="tel"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              placeholder="+593 987 654 321"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)] transition-all"
            />
          </div>
        </div>

        {/* Contraseñas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Contraseña <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Mínimo 6 caracteres"
                required
                className="w-full pl-9 pr-8 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                aria-label={showPassword ? 'Ocultar' : 'Ver'}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Confirmar Contraseña <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Repite la contraseña"
                required
                className="w-full pl-9 pr-8 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                aria-label={showConfirmPassword ? 'Ocultar' : 'Ver'}
              >
                {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
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
                <span>Creando cuenta oficial...</span>
              </>
            ) : (
              <>
                <span>Registrarme en el Portal</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Enlace de Pie de Formulario */}
      <div className="mt-6 pt-4 border-t border-gray-100 text-center text-xs text-gray-500">
        ¿Ya tienes una cuenta en este portal?{' '}
        <Link
          to={`/portal/${slug}/login`}
          className="font-semibold text-[var(--brand-primary)] hover:underline"
        >
          Inicia sesión aquí
        </Link>
      </div>
    </TenantAuthLayout>
  );
};

export default RegistroTenant;
