import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { eventraService } from '../../services/eventraService';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  Mail,
  Phone,
  Loader2,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  X,
  Briefcase,
  Users,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

export const ProveedoresList = () => {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [specialtyFilter, setSpecialtyFilter] = useState('all');
  const [deletingProv, setDeletingProv] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchProveedores = async () => {
    setLoading(true);
    try {
      const data = await eventraService.getProveedores();
      setProveedores(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast('Error al cargar proveedores: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProveedores();
  }, []);

  const confirmDelete = async () => {
    if (!deletingProv) return;
    setIsDeleting(true);
    try {
      await eventraService.deleteProveedor(deletingProv.id);
      setProveedores((prev) => prev.filter((p) => p.id !== deletingProv.id));
      showToast('Proveedor eliminado correctamente');
      setDeletingProv(null);
    } catch (err) {
      showToast('Error al eliminar: ' + err.message, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Obtener especialidades únicas para el filtro
  const especialidades = useMemo(() => {
    const set = new Set();
    proveedores.forEach((p) => {
      if (p.especialidad) set.add(p.especialidad);
    });
    return Array.from(set);
  }, [proveedores]);

  // Filtrado reactivo
  const filteredProveedores = useMemo(() => {
    return proveedores.filter((prov) => {
      const nombre = (prov.nombre_empresa_o_contacto || prov.empresa || prov.nombre || '').toLowerCase();
      const especialidad = (prov.especialidad || '').toLowerCase();
      const email = (prov.email || '').toLowerCase();
      const telefono = (prov.telefono || '').toLowerCase();
      const term = searchTerm.toLowerCase();

      const matchesSearch =
        nombre.includes(term) ||
        especialidad.includes(term) ||
        email.includes(term) ||
        telefono.includes(term);

      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'active'
          ? prov.estado_activo !== false
          : prov.estado_activo === false;

      const matchesSpecialty =
        specialtyFilter === 'all'
          ? true
          : prov.especialidad === specialtyFilter;

      return matchesSearch && matchesStatus && matchesSpecialty;
    });
  }, [proveedores, searchTerm, statusFilter, specialtyFilter]);

  const totalActivos = proveedores.filter((p) => p.estado_activo !== false).length;

  return (
    <div className="space-y-6 animate-fade-in text-[#233D49]">
      
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

      {/* Cabecera Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#CEC8B8]/60">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#4D7182] mb-1">
            <Building2 size={14} />
            <span>Red de Aliados Estratégicos</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#233D49] tracking-tight">
            Directorio de Proveedores
          </h1>
          <p className="text-sm text-[#4D7182]">
            Gestiona los contratistas externos, especialistas y servicios complementarios de tus recepciones.
          </p>
        </div>

        <Link
          to="/proveedores/nuevo"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#4D7182] hover:bg-[#3E5763] text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all"
        >
          <Plus size={16} />
          <span>Añadir Proveedor</span>
        </Link>
      </div>

      {/* Tarjetas de Métricas Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[#CEC8B8] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#4D7182]/10 text-[#4D7182] flex items-center justify-center shrink-0">
            <Building2 size={22} />
          </div>
          <div>
            <span className="text-xs font-semibold text-[#4D7182]">Total Registrados</span>
            <p className="text-2xl font-extrabold text-[#233D49]">{proveedores.length}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#CEC8B8] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#4D9A72]/15 text-[#4D9A72] flex items-center justify-center shrink-0">
            <ShieldCheck size={22} />
          </div>
          <div>
            <span className="text-xs font-semibold text-[#4D9A72]">Proveedores Activos</span>
            <p className="text-2xl font-extrabold text-[#4D9A72]">{totalActivos}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#CEC8B8] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#C49A3A]/15 text-[#C49A3A] flex items-center justify-center shrink-0">
            <Briefcase size={22} />
          </div>
          <div>
            <span className="text-xs font-semibold text-[#C49A3A]">Especialidades</span>
            <p className="text-2xl font-extrabold text-[#233D49]">{especialidades.length}</p>
          </div>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="p-4 rounded-2xl bg-white border border-[#CEC8B8] shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7D8F97]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por empresa, contacto o especialidad..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#CEC8B8] bg-[#F3F0E4]/30 text-sm text-[#233D49] placeholder-[#7D8F97] focus:outline-none focus:border-[#4D7182] focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Filtro Estado */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#CEC8B8] bg-white text-xs font-semibold text-[#233D49] focus:outline-none focus:border-[#4D7182]"
          >
            <option value="all">Todos los Estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>

          {/* Filtro Especialidad */}
          {especialidades.length > 0 && (
            <select
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-[#CEC8B8] bg-white text-xs font-semibold text-[#233D49] focus:outline-none focus:border-[#4D7182]"
            >
              <option value="all">Todas las Especialidades</option>
              {especialidades.map((esp) => (
                <option key={esp} value={esp}>
                  {esp}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Contenido Principal: Tabla o Empty State */}
      {loading ? (
        <div className="p-16 text-center text-[#4D7182] bg-white rounded-3xl border border-[#CEC8B8] space-y-2">
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-[#4D7182]" />
          <p className="text-sm font-semibold">Cargando directorio de proveedores...</p>
        </div>
      ) : filteredProveedores.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#CEC8B8] shadow-sm space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#4D7182]/10 text-[#4D7182] mx-auto flex items-center justify-center">
            <Building2 size={26} />
          </div>
          <h3 className="text-base font-bold text-[#233D49]">
            {searchTerm || statusFilter !== 'all' || specialtyFilter !== 'all'
              ? 'No se encontraron proveedores con los filtros aplicados'
              : 'No hay proveedores registrados aún'}
          </h3>
          <p className="text-xs text-[#7D8F97] max-w-sm mx-auto">
            {searchTerm || statusFilter !== 'all' || specialtyFilter !== 'all'
              ? 'Intenta ajustar tus términos de búsqueda o limpiar los filtros seleccionados.'
              : 'Comienza integrando a tus contratistas de confianza (música, fotografía, catering, ambientación).'}
          </p>
          {!(searchTerm || statusFilter !== 'all' || specialtyFilter !== 'all') && (
            <div className="pt-2">
              <Link
                to="/proveedores/nuevo"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4D7182] text-white text-xs font-semibold hover:bg-[#3E5763] transition-colors"
              >
                <Plus size={14} />
                <span>Registrar Primer Proveedor</span>
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#CEC8B8] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF8F5] border-b-2 border-[#CEC8B8] text-[11px] font-bold uppercase tracking-wider text-[#4D7182]">
                  <th className="py-4 px-6">Empresa / Contacto</th>
                  <th className="py-4 px-6">Especialidad</th>
                  <th className="py-4 px-6">Contacto Directo</th>
                  <th className="py-4 px-6">Estado</th>
                  <th className="py-4 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#CEC8B8]/40 text-xs">
                {filteredProveedores.map((prov) => {
                  const nombreEmpresa =
                    prov.nombre_empresa_o_contacto || prov.empresa || prov.nombre || 'Proveedor';
                  const iniciales = nombreEmpresa
                    .split(' ')
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();
                  const isActive = prov.estado_activo !== false;

                  return (
                    <tr key={prov.id} className="hover:bg-[#FAF8F2] transition-colors group">
                      {/* Empresa / Nombre */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#4D7182]/10 text-[#4D7182] font-bold flex items-center justify-center text-xs shrink-0 border border-[#4D7182]/20">
                            {iniciales}
                          </div>
                          <div>
                            <div className="font-bold text-[#233D49] text-sm group-hover:text-[#4D7182] transition-colors">
                              {nombreEmpresa}
                            </div>
                            {prov.empresa && prov.nombre && prov.empresa !== prov.nombre && (
                              <div className="text-[11px] text-[#7D8F97]">
                                Rep: {prov.nombre}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Especialidad */}
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#4D7182]/10 text-[#4D7182] border border-[#4D7182]/20">
                          {prov.especialidad || 'Servicios Generales'}
                        </span>
                      </td>

                      {/* Contacto */}
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          {prov.telefono ? (
                            <a
                              href={`tel:${prov.telefono}`}
                              className="flex items-center gap-1.5 text-xs font-medium text-[#233D49] hover:text-[#4D7182] transition-colors"
                            >
                              <Phone size={13} className="text-[#4D7182]" />
                              <span>{prov.telefono}</span>
                            </a>
                          ) : (
                            <span className="text-[#7D8F97] text-[11px]">Sin teléfono</span>
                          )}

                          {prov.email ? (
                            <a
                              href={`mailto:${prov.email}`}
                              className="flex items-center gap-1.5 text-xs text-[#7D8F97] hover:text-[#4D7182] transition-colors"
                            >
                              <Mail size={13} className="text-[#4D7182]" />
                              <span className="truncate max-w-[200px]">{prov.email}</span>
                            </a>
                          ) : (
                            <span className="text-[#7D8F97] text-[11px]">Sin email</span>
                          )}
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          isActive
                            ? 'bg-[#4D9A72]/15 text-[#4D9A72] border border-[#4D9A72]/30'
                            : 'bg-[#7D8F97]/15 text-[#7D8F97] border border-[#7D8F97]/30'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-[#4D9A72]' : 'bg-[#7D8F97]'}`} />
                          <span>{isActive ? 'Activo' : 'Inactivo'}</span>
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/proveedores/editar/${prov.id}`}
                            className="p-2 rounded-xl text-[#4D7182] hover:bg-[#4D7182]/10 transition-colors"
                            title="Editar Proveedor"
                          >
                            <Edit2 size={15} />
                          </Link>

                          <button
                            type="button"
                            onClick={() => setDeletingProv(prov)}
                            className="p-2 rounded-xl text-[#C95C5C] hover:bg-[#C95C5C]/10 transition-colors"
                            title="Eliminar Proveedor"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {deletingProv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full border border-[#CEC8B8] shadow-2xl space-y-4 my-auto max-h-[calc(100vh-3.5rem)] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#CEC8B8]/50">
              <div className="flex items-center gap-2 text-[#C95C5C]">
                <AlertCircle size={20} />
                <h3 className="text-base font-bold text-[#233D49]">
                  Eliminar Proveedor
                </h3>
              </div>
              <button
                onClick={() => setDeletingProv(null)}
                className="p-1 rounded-lg text-[#7D8F97] hover:bg-[#F3F0E4]"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-sm text-[#233D49]/80">
              ¿Estás seguro de que deseas eliminar al proveedor{' '}
              <strong className="text-[#233D49]">
                {deletingProv.nombre_empresa_o_contacto || deletingProv.empresa || deletingProv.nombre}
              </strong>
              ? Esta acción no se puede deshacer.
            </p>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingProv(null)}
                className="px-4 py-2 rounded-xl border border-[#CEC8B8] text-xs font-semibold text-[#233D49] hover:bg-[#FAF8F2]"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C95C5C] hover:bg-[#AF4E4E] text-white text-xs font-bold shadow-sm transition-colors"
              >
                {isDeleting && <Loader2 size={13} className="animate-spin" />}
                <span>Confirmar Eliminación</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProveedoresList;
