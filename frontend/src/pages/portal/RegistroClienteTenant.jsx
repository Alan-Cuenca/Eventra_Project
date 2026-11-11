import React, { useState } from 'react';
import { useOutletContext, useNavigate, Link } from 'react-router-dom';
import { eventraService } from '../../services/eventraService';
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

/**
 * =============================================================================
 * RegistroClienteTenant
 * =============================================================================
 * Formulario de Autoregistro Dinámico de Clientes en el Portal de Inquilino.
 * Se carga en la ruta /portal/:slug/registro bajo PortalTenantLayout.
 * Arquitectura Toss-Style de alta densidad, radios concéntricos (Apple HIG) y
 * aislamiento multi-tenant estricto (asociación automática de empresa_id).
 * =============================================================================
 */
export const RegistroClienteTenant = () => {
  const { empresa, slug } = useOutletContext();
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

    // Validaciones del formulario
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

    if (!empresa?.id) {
      setErrorMsg('No se pudo resolver el contexto de la empresa organizadora.');
      return;
    }

    setLoading(true);

    try {
      // ── Enviar solicitud a POST /api/clientes/registro-publico ─────────────
      // El formulario nunca pregunta la empresa; el empresa_id se asocia internamente
      const payload = {
        empresa_id: empresa.id,
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

      // Redirección suave al portal exclusivo del cliente
      setTimeout(() => {
        navigate('/portal-cliente', { replace: true });
      }, 1800);
    } catch (err) {
      console.error('[RegistroClienteTenant] Error al registrar cliente:', err);
      let msg = 'Ocurrió un error al procesar tu cuenta. Intenta nuevamente.';

      if (err?.status === 409 || err?.response?.status === 409) {
        msg = 'Ya existe una cuenta con este correo electrónico. Por favor inicia sesión.';
      } else if (err?.status === 403 || err?.response?.status === 403) {
        msg = err?.data?.message || err?.response?.data?.message || 'Límite de clientes alcanzado en este momento.';
      } else if (err?.message) {
        msg = err.message;
      }

      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ── Estado: Registro Exitoso (Toss-Style Feedback) ─────────────────────── */
  if (success) {
    return (
      <div className="bg-[var(--ev-surface)] rounded-[24px] shadow-sm border border-[var(--ev-border)]/50 p-8 max-w-md w-full text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-[var(--ev-primary)]/10 text-[var(--ev-primary)] flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={32} />
        </div>
        <h2 className="text-2xl font-bold text-[var(--ev-text-main)] tracking-tight">
          ¡Cuenta creada con éxito!
        </h2>
        <p className="text-sm text-[var(--ev-text-muted)] mt-2 mb-6">
          Te damos la bienvenida a <strong>{empresa.nombre_comercial}</strong>. Redirigiendo a tu portal de cliente...
        </p>
        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[var(--ev-primary)]">
          <Loader2 size={16} className="animate-spin" />
          <span>Ingresando a tu panel de eventos...</span>
        </div>
      </div>
    );
  }

  /* ── Formulario de Registro Principal ──────────────────────────────────── */
  return (
    <div className="bg-[var(--ev-surface)] rounded-[24px] shadow-sm border border-[var(--ev-border)]/50 p-6 sm:p-8 max-w-lg w-full transition-all duration-200">
      {/* Encabezado Personalizado de la Empresa */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--ev-primary)] mb-1">
          <Sparkles size={14} />
          <span>Registro de Clientes</span>
        </div>
        <h2 className="text-2xl font-semibold text-[var(--ev-text-main)] tracking-tight">
          {empresa.portal_titulo || `Bienvenido a ${empresa.nombre_comercial}`}
        </h2>
        <p className="text-xs text-[var(--ev-text-muted)] mt-1.5 leading-relaxed">
          {empresa.portal_descripcion ||
            'Crea tu cuenta oficial para cotizar, revisar presupuestos y dar seguimiento en tiempo real a tu evento.'}
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
        {/* Nombres y Apellidos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-[var(--ev-text-main)] mb-1.5">
              Nombres <span className="text-[#C95C5C]">*</span>
            </label>
            <div className="relative">
              <User
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ev-text-muted)] opacity-60"
              />
              <input
                type="text"
                name="nombres"
                value={formData.nombres}
                onChange={handleChange}
                placeholder="Ej. María Belén"
                required
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[var(--ev-border)]/70 bg-[var(--ev-surface)] text-[var(--ev-text-main)] placeholder:text-[var(--ev-text-muted)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--ev-primary)]/20 focus:border-[var(--ev-primary)] transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--ev-text-main)] mb-1.5">
              Apellidos <span className="text-[#C95C5C]">*</span>
            </label>
            <input
              type="text"
              name="apellidos"
              value={formData.apellidos}
              onChange={handleChange}
              placeholder="Ej. Morales Pérez"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--ev-border)]/70 bg-[var(--ev-surface)] text-[var(--ev-text-main)] placeholder:text-[var(--ev-text-muted)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--ev-primary)]/20 focus:border-[var(--ev-primary)] transition-all text-sm"
            />
          </div>
        </div>

        {/* Correo Electrónico */}
        <div>
          <label className="block text-xs font-semibold text-[var(--ev-text-main)] mb-1.5">
            Correo Electrónico <span className="text-[#C95C5C]">*</span>
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
              placeholder="ejemplo@correo.com"
              required
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[var(--ev-border)]/70 bg-[var(--ev-surface)] text-[var(--ev-text-main)] placeholder:text-[var(--ev-text-muted)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--ev-primary)]/20 focus:border-[var(--ev-primary)] transition-all text-sm"
            />
          </div>
        </div>

        {/* Teléfono */}
        <div>
          <label className="block text-xs font-semibold text-[var(--ev-text-main)] mb-1.5">
            Teléfono de Contacto
          </label>
          <div className="relative">
            <Phone
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ev-text-muted)] opacity-60"
            />
            <input
              type="tel"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              placeholder="Ej. +593 99 123 4567"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[var(--ev-border)]/70 bg-[var(--ev-surface)] text-[var(--ev-text-main)] placeholder:text-[var(--ev-text-muted)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--ev-primary)]/20 focus:border-[var(--ev-primary)] transition-all text-sm"
            />
          </div>
        </div>

        {/* Contraseña y Confirmación */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-[var(--ev-text-main)] mb-1.5">
              Contraseña <span className="text-[#C95C5C]">*</span>
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
                placeholder="Mínimo 6 caracteres"
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

          <div>
            <label className="block text-xs font-semibold text-[var(--ev-text-main)] mb-1.5">
              Confirmar <span className="text-[#C95C5C]">*</span>
            </label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ev-text-muted)] opacity-60"
              />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Repite tu contraseña"
                required
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[var(--ev-border)]/70 bg-[var(--ev-surface)] text-[var(--ev-text-main)] placeholder:text-[var(--ev-text-muted)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--ev-primary)]/20 focus:border-[var(--ev-primary)] transition-all text-sm"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ev-text-muted)] hover:text-[var(--ev-text-main)] transition-colors p-1"
                aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
        </div>

        {/* Botón CTA Principal */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-[var(--ev-primary)] text-white font-semibold text-sm shadow-sm hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Creando cuenta segura...</span>
              </>
            ) : (
              <>
                <span>Registrarme en {empresa.nombre_comercial}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Enlace a Login */}
      <div className="mt-6 pt-4 border-t border-[var(--ev-border)]/40 text-center">
        <p className="text-xs text-[var(--ev-text-muted)]">
          ¿Ya dispones de una cuenta en este portal?{' '}
          <Link
            to={`/portal/${slug}/login`}
            className="font-semibold text-[var(--ev-primary)] hover:underline ml-1 inline-flex items-center gap-0.5"
          >
            Iniciar Sesión
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegistroClienteTenant;

