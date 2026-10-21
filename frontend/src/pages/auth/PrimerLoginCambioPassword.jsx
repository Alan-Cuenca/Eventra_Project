import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { ThemeToggle } from '../../components/common/ThemeToggle';

import {
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import logoImg from '../../assets/logo.png';

/**
 * =============================================================================
 * PrimerLoginCambioPassword
 * =============================================================================
 * Pantalla preparada para forzar el cambio obligatorio de contraseña cuando
 * un administrador o usuario ingresa por primera vez con una contraseña temporal.
 * =============================================================================
 */
export const PrimerLoginCambioPassword = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    password_temporal: '',
    password_nuevo: '',
    password_confirmar: '',
  });

  const [showTemporal, setShowTemporal] = useState(false);
  const [showNuevo, setShowNuevo] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrorMsg('');
  };

  // Validaciones de seguridad de contraseña
  const tieneMinimo = formData.password_nuevo.length >= 8;
  const tieneMayuscula = /[A-Z]/.test(formData.password_nuevo);
  const tieneNumero = /\d/.test(formData.password_nuevo);
  const coinciden =
    formData.password_nuevo && formData.password_nuevo === formData.password_confirmar;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.password_temporal) {
      setErrorMsg('Debes ingresar la contraseña temporal recibida en tu correo.');
      return;
    }

    if (!tieneMinimo || !tieneMayuscula || !tieneNumero) {
      setErrorMsg('La nueva contraseña debe cumplir con todos los requisitos de seguridad.');
      return;
    }

    if (!coinciden) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.cambiarPasswordObligatorio({
        password_temporal: formData.password_temporal,
        password_nuevo: formData.password_nuevo,
        password_confirmar: formData.password_confirmar,
      });

      setSuccessMsg('Contraseña actualizada exitosamente. Redirigiendo a tu panel...');
      setTimeout(() => {
        const rolId = Number(user?.rol_id || response?.data?.rol_id);
        if (rolId === 5) {
          navigate('/super-admin/dashboard', { replace: true });
        } else if (rolId === 4) {
          navigate('/portal-cliente', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }, 1200);
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || err?.message || 'Error al actualizar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F0E4] flex flex-col items-center justify-center p-4 font-['Plus_Jakarta_Sans',sans-serif] relative">
      <ThemeToggle floating />

      <div className="w-full max-w-md bg-white rounded-2xl border border-[#CEC8B8] shadow-xl p-8 animate-fade-in my-6">
        {/* Branding */}
        <div className="flex items-center gap-3 mb-6">
          <img
            src={logoImg}
            alt="EVENTRA"
            className="w-11 h-11 rounded-xl object-contain bg-[#F3F0E4] p-1.5 border border-[#CEC8B8]"
          />
          <div>
            <h1 className="text-xl font-extrabold text-[#233D49] tracking-tight font-['Outfit']">
              EVENTRA <span className="text-[#4D7182] font-normal text-sm">| Seguridad</span>
            </h1>
            <p className="text-xs text-[#7d8f97]">Plataforma de Gestión de Eventos</p>
          </div>
        </div>

        {/* Título y Explicación */}
        <div className="mb-6">
          <div className="w-12 h-12 rounded-xl bg-[#4D7182]/10 text-[#4D7182] flex items-center justify-center mb-3">
            <KeyRound size={24} />
          </div>
          <h2 className="text-xl font-black text-[#233D49] font-['Outfit']">
            Cambio Obligatorio de Contraseña
          </h2>
          <p className="text-xs text-[#7d8f97] mt-1.5 leading-relaxed">
            Has iniciado sesión con una <strong>contraseña temporal</strong> generada automáticamente. Por seguridad de tu empresa, debes definir una contraseña personal definitiva antes de continuar.
          </p>
        </div>

        {/* Mensajes */}
        {errorMsg && (
          <div
            role="alert"
            className="mb-4 p-3 rounded-xl bg-[#C95C5C]/15 border border-[#C95C5C]/30 text-[#C95C5C] text-xs font-semibold flex items-center gap-2"
          >
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div
            role="status"
            className="mb-4 p-3 rounded-xl bg-[#4D9A72]/15 border border-[#4D9A72]/30 text-[#4D9A72] text-xs font-semibold flex items-center gap-2"
          >
            <CheckCircle2 size={16} className="flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Contraseña temporal */}
          <div>
            <label className="block text-xs font-bold text-[#233D49] mb-1">
              Contraseña Temporal Actual <span className="text-[#C95C5C]">*</span>
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7d8f97]" />
              <input
                type={showTemporal ? 'text' : 'password'}
                name="password_temporal"
                value={formData.password_temporal}
                onChange={handleChange}
                placeholder="Ingresa la contraseña del correo"
                required
                disabled={loading}
                className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-[#CEC8B8] bg-[#FAFAF7] text-xs text-[#233D49] focus:outline-none focus:border-[#4D7182] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowTemporal((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7d8f97] hover:text-[#233D49]"
                aria-label="Ver contraseña temporal"
              >
                {showTemporal ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Nueva contraseña */}
          <div>
            <label className="block text-xs font-bold text-[#233D49] mb-1">
              Nueva Contraseña Definitiva <span className="text-[#C95C5C]">*</span>
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7d8f97]" />
              <input
                type={showNuevo ? 'text' : 'password'}
                name="password_nuevo"
                value={formData.password_nuevo}
                onChange={handleChange}
                placeholder="Mínimo 8 caracteres"
                required
                disabled={loading}
                className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-[#CEC8B8] bg-[#FAFAF7] text-xs text-[#233D49] focus:outline-none focus:border-[#4D7182] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowNuevo((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7d8f97] hover:text-[#233D49]"
                aria-label="Ver nueva contraseña"
              >
                {showNuevo ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Confirmar contraseña */}
          <div>
            <label className="block text-xs font-bold text-[#233D49] mb-1">
              Confirmar Nueva Contraseña <span className="text-[#C95C5C]">*</span>
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7d8f97]" />
              <input
                type={showConfirmar ? 'text' : 'password'}
                name="password_confirmar"
                value={formData.password_confirmar}
                onChange={handleChange}
                placeholder="Repite tu nueva contraseña"
                required
                disabled={loading}
                className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-[#CEC8B8] bg-[#FAFAF7] text-xs text-[#233D49] focus:outline-none focus:border-[#4D7182] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowConfirmar((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7d8f97] hover:text-[#233D49]"
                aria-label="Ver confirmación"
              >
                {showConfirmar ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Checklist de requisitos de seguridad */}
          <div className="p-3 rounded-xl bg-[#FAFAF7] border border-[#CEC8B8] text-[11px] space-y-1 text-[#7d8f97]">
            <div className="font-bold text-[#233D49] mb-1">Requisitos de seguridad:</div>
            <div className={`flex items-center gap-1.5 ${tieneMinimo ? 'text-[#4D9A72] font-semibold' : ''}`}>
              <CheckCircle2 size={13} />
              <span>Al menos 8 caracteres</span>
            </div>
            <div className={`flex items-center gap-1.5 ${tieneMayuscula ? 'text-[#4D9A72] font-semibold' : ''}`}>
              <CheckCircle2 size={13} />
              <span>Al menos una letra mayúscula</span>
            </div>
            <div className={`flex items-center gap-1.5 ${tieneNumero ? 'text-[#4D9A72] font-semibold' : ''}`}>
              <CheckCircle2 size={13} />
              <span>Al menos un número</span>
            </div>
            <div className={`flex items-center gap-1.5 ${coinciden ? 'text-[#4D9A72] font-semibold' : ''}`}>
              <CheckCircle2 size={13} />
              <span>Las contraseñas coinciden</span>
            </div>
          </div>

          {/* Botón de envío */}
          <button
            type="submit"
            disabled={loading || !tieneMinimo || !tieneMayuscula || !tieneNumero || !coinciden}
            className="w-full mt-2 py-3 rounded-xl bg-[#4D7182] hover:bg-[#3d5f6e] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Actualizando contraseña...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={16} />
                <span>Establecer Contraseña Definitiva</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PrimerLoginCambioPassword;
