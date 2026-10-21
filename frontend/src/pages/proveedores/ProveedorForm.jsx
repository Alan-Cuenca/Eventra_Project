import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { eventraService } from '../../services/eventraService';
import { 
  Building2, 
  Save, 
  X, 
  Loader2, 
  ArrowLeft, 
  Briefcase, 
  Phone, 
  Mail, 
  MapPin, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export const ProveedorForm = () => {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre_empresa_o_contacto: '',
    especialidad: '',
    telefono: '',
    email: '',
    direccion: '',
    estado_activo: true,
  });

  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (isEditing) {
      eventraService.getProveedor(id)
        .then((data) => {
          const item = data?.data || data || {};
          setForm({
            nombre_empresa_o_contacto:
              item.nombre_empresa_o_contacto || item.empresa || item.nombre || '',
            especialidad: item.especialidad || '',
            telefono: item.telefono || '',
            email: item.email || '',
            direccion: item.direccion || '',
            estado_activo: item.estado_activo !== undefined ? item.estado_activo : true,
          });
        })
        .catch((err) => showToast('Error al cargar proveedor: ' + err.message, 'error'))
        .finally(() => setLoading(false));
    }
  }, [id, isEditing]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        nombre_empresa_o_contacto: form.nombre_empresa_o_contacto.trim(),
        especialidad: form.especialidad.trim(),
        telefono: form.telefono.trim() || null,
        email: form.email.trim() || null,
        estado_activo: form.estado_activo,
      };

      if (isEditing) {
        await eventraService.updateProveedor(id, payload);
      } else {
        await eventraService.createProveedor(payload);
      }
      navigate('/proveedores');
    } catch (err) {
      showToast(err.message || 'Error al guardar el proveedor.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-[#4D7182] bg-white rounded-3xl border border-[#CEC8B8] space-y-2 max-w-2xl mx-auto">
        <Loader2 className="w-8 h-8 mx-auto animate-spin text-[#4D7182]" />
        <p className="text-sm font-semibold">Cargando datos del proveedor...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in text-[#233D49]">
      
      {/* Toast Feedback */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold animate-fade-in ${
          toast.type === 'error'
            ? 'bg-[#C95C5C] text-white border-[#C95C5C]'
            : 'bg-[#4D9A72] text-white border-[#4D9A72]'
        }`}>
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Regreso y Título */}
      <div className="space-y-2">
        <Link
          to="/proveedores"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4D7182] hover:text-[#233D49] transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Volver al Directorio de Proveedores</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#233D49] tracking-tight">
          {isEditing ? 'Editar Proveedor' : 'Registrar Nuevo Proveedor'}
        </h1>
        <p className="text-xs sm:text-sm text-[#4D7182]">
          Completa los datos de la empresa o profesional independiente para su asignación en eventos.
        </p>
      </div>

      {/* Tarjeta del Formulario */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#CEC8B8] shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Nombre Empresa o Contacto */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#4D7182]">
                Empresa o Nombre del Proveedor *
              </label>
              <div className="relative">
                <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7D8F97]" />
                <input
                  type="text"
                  name="nombre_empresa_o_contacto"
                  value={form.nombre_empresa_o_contacto}
                  onChange={handleChange}
                  required
                  placeholder="Ej. AudioLuz Pro o Ing. Carlos Paredes"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#CEC8B8] bg-[#F3F0E4]/30 text-sm text-[#233D49] placeholder-[#7D8F97] focus:outline-none focus:border-[#4D7182] focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            {/* Especialidad */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#4D7182]">
                Especialidad o Rubro *
              </label>
              <div className="relative">
                <Briefcase size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7D8F97]" />
                <input
                  type="text"
                  name="especialidad"
                  value={form.especialidad}
                  onChange={handleChange}
                  required
                  placeholder="Ej. Fotografía y Video, Catering, Música..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#CEC8B8] bg-[#F3F0E4]/30 text-sm text-[#233D49] placeholder-[#7D8F97] focus:outline-none focus:border-[#4D7182] focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            {/* Teléfono */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#4D7182]">
                Teléfono de Contacto *
              </label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7D8F97]" />
                <input
                  type="tel"
                  name="telefono"
                  value={form.telefono}
                  onChange={handleChange}
                  required
                  placeholder="Ej. 0991238844"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#CEC8B8] bg-[#F3F0E4]/30 text-sm text-[#233D49] placeholder-[#7D8F97] focus:outline-none focus:border-[#4D7182] focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            {/* Correo Electrónico */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#4D7182]">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7D8F97]" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="contacto@proveedor.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#CEC8B8] bg-[#F3F0E4]/30 text-sm text-[#233D49] placeholder-[#7D8F97] focus:outline-none focus:border-[#4D7182] focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            {/* Estado Activo */}
            {isEditing && (
              <div className="sm:col-span-2 pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    name="estado_activo"
                    checked={form.estado_activo}
                    onChange={handleChange}
                    className="w-4 h-4 rounded text-[#4D7182] focus:ring-[#4D7182] accent-[#4D7182]"
                  />
                  <span className="text-sm font-semibold text-[#233D49]">
                    Proveedor activo y disponible para cotizaciones
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Botones de Acción */}
          <div className="pt-6 border-t border-[#CEC8B8]/50 flex items-center justify-end gap-3">
            <Link
              to="/proveedores"
              className="px-5 py-2.5 rounded-xl border border-[#CEC8B8] text-xs font-semibold text-[#233D49] hover:bg-[#FAF8F2] transition-colors"
            >
              Cancelar
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#4D7182] hover:bg-[#3E5763] text-white text-xs font-bold shadow-sm transition-all"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>{isEditing ? 'Actualizar Proveedor' : 'Guardar Proveedor'}</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
};

export default ProveedorForm;
