import React, { useState } from 'react';
import {
  X,
  Building2,
  User,
  Mail,
  AlertCircle,
  Layers,
  KeyRound,
  Loader2,
  CheckCircle2,
  Send,
  AlertTriangle,
} from 'lucide-react';
import { superAdminService } from '../../services/superAdminService';

const PLANES_DISPONIBLES = [
  { id: 'Basico', nombre: 'Básico' },
  { id: 'Premium', nombre: 'Premium' },
  { id: 'Enterprise', nombre: 'Enterprise' },
];

/**
 * Estados del flujo de registro con contraseña temporal
 */
export const ESTADOS_REGISTRO = {
  IDLE: 'IDLE',
  REGISTRANDO: 'REGISTRANDO',
  ENVIANDO: 'ENVIANDO',
  COMPLETADO: 'COMPLETADO',
  ERROR_REGISTRO: 'ERROR_REGISTRO',
  ERROR_ENVIO_CORREO: 'ERROR_ENVIO_CORREO',
};

/**
 * =============================================================================
 * CrearEmpresaModal
 * =============================================================================
 * Formulario de alta de empresa con generación de contraseña temporal en backend:
 *  - 4 campos obligatorios: nombre comercial, plan, admin_nombre, admin_email.
 *  - Sin campo de contraseña manual en el frontend.
 *  - Mensaje informativo del flujo de contraseña temporal y cambio obligatorio.
 *  - Botón: "Registrar Empresa y Enviar Credenciales".
 *  - Manejo de estados: registrando, completado, error de registro y error de correo.
 * =============================================================================
 */
export const CrearEmpresaModal = ({ isOpen, onClose, onEmpresaCreada }) => {
  const [formData, setFormData] = useState({
    nombre_comercial: '',
    plan_suscripcion: 'Basico',
    admin_nombre: '',
    admin_email: '',
  });

  const [estadoProceso, setEstadoProceso] = useState(ESTADOS_REGISTRO.IDLE);
  const [errorMsg, setErrorMsg] = useState('');
  const [errorDetalleCorreo, setErrorDetalleCorreo] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrorMsg('');
    setErrorDetalleCorreo('');
  };

  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.admin_email.trim());
  const formularioCompleto =
    formData.nombre_comercial.trim().length > 0 &&
    formData.admin_nombre.trim().length > 0 &&
    emailValido;

  const handleCrearEmpresa = async (e) => {
    if (e) e.preventDefault();
    if (!formularioCompleto || estadoProceso === ESTADOS_REGISTRO.REGISTRANDO) return;

    setErrorMsg('');
    setErrorDetalleCorreo('');
    setEstadoProceso(ESTADOS_REGISTRO.REGISTRANDO);

    try {
      const res = await superAdminService.crearEmpresa({
        nombre_comercial: formData.nombre_comercial.trim(),
        plan_suscripcion: formData.plan_suscripcion,
        admin_nombre: formData.admin_nombre.trim(),
        admin_email: formData.admin_email.trim().toLowerCase(),
      });

      if (res?.correo_enviado) {
        setEstadoProceso(ESTADOS_REGISTRO.COMPLETADO);
        if (onEmpresaCreada) onEmpresaCreada();
        setTimeout(() => {
          onClose();
          setEstadoProceso(ESTADOS_REGISTRO.IDLE);
          setFormData({
            nombre_comercial: '',
            plan_suscripcion: 'Basico',
            admin_nombre: '',
            admin_email: '',
          });
        }, 1800);
      } else {
        // La empresa se creó exitosamente pero falló el envío de correo
        setEstadoProceso(ESTADOS_REGISTRO.ERROR_ENVIO_CORREO);
        setErrorDetalleCorreo(res?.email_error || res?.message || '');
        if (onEmpresaCreada) onEmpresaCreada();
      }
    } catch (err) {
      setEstadoProceso(ESTADOS_REGISTRO.ERROR_REGISTRO);
      const isTimeout = err?.code === 'ECONNABORTED' || err?.message?.toLowerCase().includes('timeout');
      setErrorMsg(
        isTimeout
          ? 'El servidor tardó en responder (inicio en frío de Render). Por favor, intenta de nuevo en unos segundos.'
          : (err?.response?.data?.message || err?.message || 'Error al registrar la empresa en el servidor.')
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#233D49]/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-xl rounded-2xl border border-[#CEC8B8] shadow-xl overflow-hidden my-8 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del modal */}
        <div className="p-5 border-b border-[#CEC8B8] flex items-center justify-between bg-[#F3F0E4]/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4D7182]/10 text-[#4D7182] flex items-center justify-center">
              <Building2 size={22} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#233D49] font-['Outfit']">
                Alta de Empresa & Credenciales Temporales
              </h3>
              <p className="text-xs text-[#7d8f97]">
                Ingresa los datos requeridos para registrar el inquilino SaaS.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#7d8f97] hover:bg-[#CEC8B8]/30 transition-colors"
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mensaje Informativo Oficial del Flujo */}
        <div className="px-6 pt-5">
          <div className="p-4 rounded-xl bg-[#4D7182]/10 border border-[#4D7182]/25 flex items-start gap-3 text-xs text-[#233D49]">
            <KeyRound size={18} className="text-[#4D7182] flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold text-[#4D7182] block mb-0.5">
                Generación Automática de Contraseña Temporal
              </span>
              <p className="text-[#233D49]">
                Al registrar la empresa, se generará automáticamente una contraseña temporal criptográfica válida por 48 horas y se enviará al correo del administrador inicial. Por seguridad, deberá cambiarla obligatoriamente en su primer inicio de sesión.
              </p>
            </div>
          </div>
        </div>

        {/* Estados Visuales de Retroalimentación */}
        {estadoProceso === ESTADOS_REGISTRO.REGISTRANDO && (
          <div className="px-6 pt-3">
            <div className="p-3 rounded-xl bg-[#4D7182]/10 border border-[#4D7182]/20 text-[#4D7182] text-xs font-semibold flex items-center gap-2 animate-pulse">
              <Loader2 size={16} className="animate-spin" />
              <span>Registrando empresa y enviando credenciales por correo...</span>
            </div>
          </div>
        )}

        {estadoProceso === ESTADOS_REGISTRO.COMPLETADO && (
          <div className="px-6 pt-3">
            <div className="p-3 rounded-xl bg-[#4D9A72]/15 border border-[#4D9A72]/30 text-[#4D9A72] text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>Empresa registrada exitosamente. Credenciales temporales enviadas al administrador inicial.</span>
            </div>
          </div>
        )}

        {estadoProceso === ESTADOS_REGISTRO.ERROR_ENVIO_CORREO && (
          <div className="px-6 pt-3">
            <div className="p-3 rounded-xl bg-[#C49A3A]/15 border border-[#C49A3A]/30 text-[#C49A3A] text-xs font-semibold flex items-center gap-2">
              <AlertTriangle size={16} className="flex-shrink-0" />
              <span>
                Empresa registrada exitosamente, pero no fue posible enviar el correo de bienvenida en este momento
                {errorDetalleCorreo ? `: ${errorDetalleCorreo}` : '. Puede reenviarlo posteriormente.'}
              </span>
            </div>
          </div>
        )}

        {/* Mensaje de error general de registro */}
        {errorMsg && (
          <div className="px-6 pt-3">
            <div
              role="alert"
              className="p-3 rounded-xl bg-[#C95C5C]/15 border border-[#C95C5C]/30 text-[#C95C5C] text-xs font-semibold flex items-center gap-2"
            >
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        {/* Formulario con exactamente los 4 campos obligatorios */}
        <form onSubmit={handleCrearEmpresa} className="p-6 space-y-4">
          {/* 1. Nombre Comercial */}
          <div>
            <label className="block text-xs font-bold text-[#233D49] mb-1">
              Nombre Comercial de la Empresa <span className="text-[#C95C5C]">*</span>
            </label>
            <div className="relative">
              <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7d8f97]" />
              <input
                type="text"
                name="nombre_comercial"
                value={formData.nombre_comercial}
                onChange={handleChange}
                placeholder="Ej. Recepciones & Eventos Imperial"
                required
                disabled={estadoProceso === ESTADOS_REGISTRO.REGISTRANDO}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#CEC8B8] bg-[#FAFAF7] text-xs text-[#233D49] focus:outline-none focus:border-[#4D7182] transition-colors"
              />
            </div>
          </div>

          {/* 2. Plan de Suscripción Inicial */}
          <div>
            <label className="block text-xs font-bold text-[#233D49] mb-1">
              Plan de Suscripción Inicial <span className="text-[#C95C5C]">*</span>
            </label>
            <div className="relative">
              <Layers size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7d8f97]" />
              <select
                name="plan_suscripcion"
                value={formData.plan_suscripcion}
                onChange={handleChange}
                disabled={estadoProceso === ESTADOS_REGISTRO.REGISTRANDO}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#CEC8B8] bg-[#FAFAF7] text-xs text-[#233D49] focus:outline-none focus:border-[#4D7182] transition-colors font-semibold"
              >
                {PLANES_DISPONIBLES.map((p) => (
                  <option key={p.id} value={p.id}>
                    Plan {p.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Nombre Completo del Administrador */}
          <div>
            <label className="block text-xs font-bold text-[#233D49] mb-1">
              Nombre Completo del Administrador Inicial <span className="text-[#C95C5C]">*</span>
            </label>
            <div className="relative">
              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7d8f97]" />
              <input
                type="text"
                name="admin_nombre"
                value={formData.admin_nombre}
                onChange={handleChange}
                placeholder="Ej. Martín Falcon"
                required
                disabled={estadoProceso === ESTADOS_REGISTRO.REGISTRANDO}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#CEC8B8] bg-[#FAFAF7] text-xs text-[#233D49] focus:outline-none focus:border-[#4D7182] transition-colors"
              />
            </div>
          </div>

          {/* 4. Correo Electrónico del Administrador */}
          <div>
            <label className="block text-xs font-bold text-[#233D49] mb-1">
              Correo Electrónico del Administrador Inicial <span className="text-[#C95C5C]">*</span>
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7d8f97]" />
              <input
                type="email"
                name="admin_email"
                value={formData.admin_email}
                onChange={handleChange}
                placeholder="administrador@empresa.com"
                required
                disabled={estadoProceso === ESTADOS_REGISTRO.REGISTRANDO}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#CEC8B8] bg-[#FAFAF7] text-xs text-[#233D49] focus:outline-none focus:border-[#4D7182] transition-colors"
              />
            </div>
            <p className="text-[11px] text-[#7d8f97] mt-1">
              Las credenciales de acceso con la contraseña temporal se enviarán a esta casilla.
            </p>
          </div>

          {/* Footer de botones con el nombre oficial solicitado */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#CEC8B8]">
            <button
              type="button"
              onClick={onClose}
              disabled={estadoProceso === ESTADOS_REGISTRO.REGISTRANDO}
              className="px-4 py-2.5 rounded-xl border border-[#CEC8B8] text-xs font-semibold text-[#233D49] hover:bg-[#F3F0E4] transition-colors"
            >
              Cerrar
            </button>

            <button
              type="submit"
              disabled={!formularioCompleto || estadoProceso === ESTADOS_REGISTRO.REGISTRANDO || estadoProceso === ESTADOS_REGISTRO.COMPLETADO}
              className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold flex items-center gap-2 transition-all ${
                !formularioCompleto || estadoProceso === ESTADOS_REGISTRO.REGISTRANDO
                  ? 'bg-[#4D7182]/50 cursor-not-allowed shadow-none'
                  : 'bg-[#4D7182] hover:bg-[#3d5a68] shadow-sm hover:shadow active:scale-[0.98]'
              }`}
            >
              {estadoProceso === ESTADOS_REGISTRO.REGISTRANDO ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Registrando Empresa...</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>Registrar Empresa y Enviar Credenciales</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CrearEmpresaModal;
