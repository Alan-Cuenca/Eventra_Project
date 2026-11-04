/**
 * EVENTRA — Catálogo: Servicios Individuales
 * Arquitectura Espacial Master-Detail (Split View) + Drawer Contextual
 * Cumple con estándares de retención de contexto (Linear / Vercel).
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Badge } from '../../components/common/Badge';
import { Drawer } from '../../components/common/Drawer';
import { PlanLimitAlert } from '../../components/ui/PlanLimitAlert';
import { eventraService } from '../../services/eventraService';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Plus,
  Search,
  Filter,
  Loader2,
  Edit2,
  Trash2,
  AlertTriangle,
  Layers,
  X,
  CheckCircle2,
  RefreshCw,
  ChevronRight,
  DollarSign,
  Tag,
  Check,
} from 'lucide-react';

// ── Formulario reutilizable dentro del Drawer ─────────────────────────────────
const ServicioFormDrawer = ({ initialData = {}, onSubmit, submitting, onCancel }) => {
  const [form, setForm] = useState({
    nombre: initialData.nombre ?? '',
    descripcion: initialData.descripcion ?? '',
    precio_base: initialData.precio_base ?? '',
    estado_activo: initialData.estado_activo ?? true,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  return (
    <form
      id="servicio-drawer-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
      className="space-y-4"
      noValidate
    >
      <div>
        <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--ev-text-muted)] block mb-1.5" htmlFor="srv-nombre">
          Nombre del Servicio *
        </label>
        <input
          id="srv-nombre"
          name="nombre"
          type="text"
          className="w-full px-3 py-2 rounded-[12px] bg-[var(--ev-bg-base)]/50 border border-[var(--ev-border)] text-sm text-[var(--ev-text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--ev-primary)]/40"
          placeholder="Ej: Iluminación Robótica & Estrobos"
          value={form.nombre}
          onChange={handleChange}
          required
          disabled={submitting}
        />
      </div>

      <div>
        <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--ev-text-muted)] block mb-1.5" htmlFor="srv-precio">
          Precio Base ($) *
        </label>
        <div className="relative">
          <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ev-text-muted)]" />
          <input
            id="srv-precio"
            name="precio_base"
            type="number"
            step="0.01"
            className="w-full pl-8 pr-3 py-2 rounded-[12px] bg-[var(--ev-bg-base)]/50 border border-[var(--ev-border)] text-sm text-[var(--ev-text-main)] font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-[var(--ev-primary)]/40"
            placeholder="0.00"
            value={form.precio_base}
            onChange={handleChange}
            required
            disabled={submitting}
          />
        </div>
      </div>

      <div>
        <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--ev-text-muted)] block mb-1.5" htmlFor="srv-descripcion">
          Descripción Detallada
        </label>
        <textarea
          id="srv-descripcion"
          name="descripcion"
          rows={3}
          className="w-full px-3 py-2 rounded-[12px] bg-[var(--ev-bg-base)]/50 border border-[var(--ev-border)] text-sm text-[var(--ev-text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--ev-primary)]/40 resize-none"
          placeholder="Especificaciones técnicas, cantidad de operadores o equipamiento incluido..."
          value={form.descripcion}
          onChange={handleChange}
          disabled={submitting}
        />
      </div>

      <div className="pt-2">
        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[var(--ev-text-main)]">
          <input
            type="checkbox"
            name="estado_activo"
            checked={form.estado_activo}
            onChange={handleChange}
            className="rounded accent-[var(--ev-primary)]"
          />
          <span>Servicio Disponible en Catálogo</span>
        </label>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--ev-border)]/40">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="px-4 py-2 rounded-full border border-[var(--ev-border)] text-xs font-semibold text-[var(--ev-text-main)] hover:bg-[var(--ev-border)]/20 active:scale-[0.98] transition-transform duration-150"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[var(--ev-primary)] hover:bg-[var(--ev-primary-hover)] text-white text-xs font-semibold shadow-xs active:scale-[0.98] transition-transform duration-150"
        >
          {submitting ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>Guardando...</span>
            </>
          ) : (
            <span>Guardar Servicio</span>
          )}
        </button>
      </div>
    </form>
  );
};

export const ServiciosList = () => {
  const { isAdmin, isGerente } = useAuth();
  const canEdit = isAdmin || isGerente;

  const [servicios, setServicios] = useState([]);
  const [selectedServicio, setSelectedServicio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Drawers Contextuales
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [planLimitError, setPlanLimitError] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadServicios = useCallback(async () => {
    setLoading(true);
    try {
      const data = await eventraService.getServicios();
      const list = data || [];
      setServicios(list);
      if (list.length > 0 && !selectedServicio) {
        setSelectedServicio(list[0]);
      }
    } catch (err) {
      showToast('Error al cargar catálogo de servicios', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedServicio]);

  useEffect(() => {
    loadServicios();
  }, [loadServicios]);

  // Crear servicio
  const handleCreate = async (form) => {
    setSubmitting(true);
    setPlanLimitError(null);
    try {
      const res = await api.post('/servicios', {
        ...form,
        precio_base: parseFloat(form.precio_base) || 0,
      });
      const created = res?.data || res;
      const newSrv = {
        ...form,
        id: created?.id ?? `srv-${Date.now()}`,
        precio_base: parseFloat(form.precio_base) || 0,
        estado_activo: true,
      };
      setServicios((prev) => [newSrv, ...prev]);
      setSelectedServicio(newSrv);
      setShowCreate(false);
      showToast(`Servicio "${form.nombre}" añadido al catálogo.`);
    } catch (err) {
      if (err.status === 403 || err.isPlanLimit) {
        setPlanLimitError(err.message || 'Límite de servicios alcanzado en tu plan.');
      } else {
        showToast(err.message || 'Error al crear servicio.', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Actualizar servicio
  const handleUpdate = async (form) => {
    setSubmitting(true);
    try {
      await api.put(`/servicios/${editTarget.id}`, {
        ...form,
        precio_base: parseFloat(form.precio_base) || 0,
      });
      const updatedSrv = {
        ...editTarget,
        ...form,
        precio_base: parseFloat(form.precio_base) || 0,
      };
      setServicios((prev) =>
        prev.map((s) => (s.id === editTarget.id ? updatedSrv : s))
      );
      if (selectedServicio?.id === editTarget.id) {
        setSelectedServicio(updatedSrv);
      }
      setEditTarget(null);
      showToast(`Servicio "${form.nombre}" actualizado.`);
    } catch (err) {
      showToast(err.message || 'Error al actualizar servicio.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Eliminar (desactivar) servicio
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await eventraService.deleteServicio(deleteTarget.id);
      setServicios((prev) =>
        prev.map((s) => (s.id === deleteTarget.id ? { ...s, estado_activo: false } : s))
      );
      if (selectedServicio?.id === deleteTarget.id) {
        setSelectedServicio((prev) => ({ ...prev, estado_activo: false }));
      }
      showToast('Servicio desactivado correctamente.');
    } catch (err) {
      showToast(err.message || 'Error al desactivar servicio', 'error');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const filteredServicios = servicios.filter((s) => {
    const matchSearch = s.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && s.estado_activo !== false) ||
      (filterStatus === 'inactive' && s.estado_activo === false);
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* ── Page Header (Zonas de Acción Top Right) ──────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--ev-text-main)]">
            Catálogo de Servicios
          </h1>
          <p className="text-xs text-[var(--ev-text-muted)] font-medium mt-0.5">
            Prestaciones individuales y servicios base para eventos y cotizaciones.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={loadServicios}
            title="Recargar catálogo"
            className="p-2 rounded-full border border-[var(--ev-border)] text-[var(--ev-text-muted)] hover:text-[var(--ev-text-main)] hover:bg-[var(--ev-border)]/20 active:scale-[0.98] transition-transform duration-150"
          >
            <RefreshCw size={15} />
          </button>

          {canEdit && (
            <button
              id="btn-add-servicio"
              type="button"
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--ev-primary)] hover:bg-[var(--ev-primary-hover)] text-white text-xs font-semibold shadow-xs hover:shadow-md active:scale-[0.98] transition-all duration-150"
            >
              <Plus size={15} />
              <span>Nuevo Servicio [C]</span>
            </button>
          )}
        </div>
      </div>

      {/* ── MASTER-DETAIL (SPLIT VIEW): 35% Lista / 65% Detalle ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* COLUMNA MASTER (35% - 4 cols en lg) */}
        <div className="lg:col-span-5 xl:col-span-4 rounded-[22px] bg-[var(--ev-surface)] border border-[var(--ev-border)]/60 shadow-xs p-4 flex flex-col space-y-3">
          
          {/* Búsqueda y Filtros */}
          <div className="space-y-2">
            <div className="relative">
              <input
                type="text"
                className="w-full pl-9 pr-3 py-2 rounded-[12px] bg-[var(--ev-bg-base)]/50 border border-[var(--ev-border)] text-xs text-[var(--ev-text-main)] placeholder-[var(--ev-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ev-primary)]/40"
                placeholder="Buscar servicio por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ev-text-muted)]" />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { id: 'all', label: `Todos (${servicios.length})` },
                { id: 'active', label: 'Activos' },
                { id: 'inactive', label: 'Inactivos' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setFilterStatus(pill.id)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all active:scale-[0.98] ${
                    filterStatus === pill.id
                      ? 'bg-[var(--ev-primary)] text-white shadow-2xs'
                      : 'bg-[var(--ev-bg-base)]/60 text-[var(--ev-text-muted)] hover:bg-[var(--ev-border)]/30'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* Listado Master de Servicios */}
          <div className="max-h-[580px] overflow-y-auto space-y-1.5 pr-1">
            {loading ? (
              <div className="py-12 text-center text-xs text-[var(--ev-text-muted)]">
                <Loader2 size={24} className="animate-spin text-[var(--ev-primary)] mx-auto mb-2" />
                <span>Cargando catálogo...</span>
              </div>
            ) : filteredServicios.length === 0 ? (
              <div className="py-10 text-center text-xs text-[var(--ev-text-muted)]">
                <Layers size={32} className="mx-auto mb-2 text-[var(--ev-text-muted)]/50" />
                <p>No se encontraron servicios.</p>
              </div>
            ) : (
              filteredServicios.map((srv) => {
                const isSelected = selectedServicio?.id === srv.id;
                return (
                  <div
                    key={srv.id}
                    onClick={() => setSelectedServicio(srv)}
                    className={`p-3 rounded-[16px] cursor-pointer transition-all duration-150 active:scale-[0.99] border ${
                      isSelected
                        ? 'bg-[var(--ev-primary)]/12 border-[var(--ev-primary)]/40 shadow-xs'
                        : 'bg-[var(--ev-surface)] border-[var(--ev-border)]/40 hover:bg-[var(--ev-bg-base)]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-bold text-[var(--ev-text-main)] truncate">
                          {srv.nombre}
                        </p>
                        <p className="text-[11px] text-[var(--ev-text-muted)] truncate mt-0.5">
                          {srv.descripcion || 'Sin descripción'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-bold text-[var(--ev-primary)] tabular-nums tracking-tight">
                          ${parseFloat(srv.precio_base || 0).toFixed(2)}
                        </span>
                        <ChevronRight size={14} className="text-[var(--ev-border)]" />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-2 border-t border-[var(--ev-border)]/40 text-[11px] text-[var(--ev-text-muted)] flex items-center justify-between">
            <span className="tabular-nums font-medium">Mostrando {filteredServicios.length} de {servicios.length}</span>
            <span className="text-[10px] font-semibold text-[var(--ev-primary)]">Tarifario Base</span>
          </div>

        </div>

        {/* COLUMNA DETAIL (65% - 8 cols en lg) */}
        <div className="lg:col-span-7 xl:col-span-8 rounded-[22px] bg-[var(--ev-surface)] border border-[var(--ev-border)]/60 shadow-xs p-6 min-h-[580px] flex flex-col justify-between">
          
          {selectedServicio ? (
            <div className="space-y-6">
              
              {/* Header del Detalle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--ev-border)]/50">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl font-bold text-[var(--ev-text-main)]">
                      {selectedServicio.nombre}
                    </h2>
                    <Badge variant={selectedServicio.estado_activo !== false ? 'success' : 'danger'}>
                      {selectedServicio.estado_activo !== false ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                  <p className="text-xs text-[var(--ev-text-muted)] font-mono tabular-nums mt-0.5">
                    Código: SRV-{String(selectedServicio.id).padStart(4, '0')}
                  </p>
                </div>

                {canEdit && (
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setEditTarget(selectedServicio)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[var(--ev-border)] text-xs font-semibold text-[var(--ev-text-main)] hover:bg-[var(--ev-border)]/20 active:scale-[0.98] transition-transform duration-150"
                    >
                      <Edit2 size={13} />
                      <span>Editar</span>
                    </button>

                    {selectedServicio.estado_activo !== false && (
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(selectedServicio)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#C95C5C]/10 hover:bg-[#C95C5C]/20 text-[#C95C5C] text-xs font-semibold active:scale-[0.98] transition-transform duration-150"
                      >
                        <Trash2 size={13} />
                        <span>Desactivar</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Tarjeta de Precio & Valoración (Radios Concéntricos: R_int 16px) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-[16px] bg-[var(--ev-bg-base)]/40 border border-[var(--ev-border)]/50">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ev-text-muted)] block mb-1">
                    Precio Base de Catálogo
                  </span>
                  <div className="text-3xl font-black text-[var(--ev-text-main)] tabular-nums tracking-tight">
                    ${parseFloat(selectedServicio.precio_base || 0).toFixed(2)}
                  </div>
                  <span className="text-[10px] text-[var(--ev-primary)] font-medium mt-1 block">
                    Calculable por evento o por comensal
                  </span>
                </div>

                <div className="p-4 rounded-[16px] bg-[var(--ev-bg-base)]/40 border border-[var(--ev-border)]/50">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ev-text-muted)] block mb-1">
                    Disponibilidad en Cotizador
                  </span>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#4D9A72]" />
                    <span className="text-sm font-semibold text-[var(--ev-text-main)]">
                      Sincronizado con EVARA AI
                    </span>
                  </div>
                  <span className="text-[10px] text-[var(--ev-text-muted)] mt-1 block">
                    Disponible para cotización instantánea 24/7
                  </span>
                </div>
              </div>

              {/* Especificaciones y Descripción */}
              <div className="p-4 rounded-[16px] bg-[var(--ev-surface)] border border-[var(--ev-border)]/60 shadow-2xs space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--ev-text-muted)]">
                  Descripción del Servicio
                </h4>
                <p className="text-sm text-[var(--ev-text-main)] leading-relaxed">
                  {selectedServicio.descripcion || 'No se han ingresado especificaciones adicionales para esta prestación.'}
                </p>
              </div>

              {/* Bento de Integración */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-[14px] bg-[var(--ev-bg-base)]/30 border border-[var(--ev-border)]/40">
                  <span className="text-[10px] text-[var(--ev-text-muted)] uppercase font-semibold block">Margen Operativo</span>
                  <span className="text-base font-bold text-[var(--ev-text-main)] tabular-nums mt-0.5 block">Protegido (30%)</span>
                </div>
                <div className="p-3 rounded-[14px] bg-[var(--ev-bg-base)]/30 border border-[var(--ev-border)]/40">
                  <span className="text-[10px] text-[var(--ev-text-muted)] uppercase font-semibold block">Partición Inquilino</span>
                  <span className="text-base font-bold text-[var(--ev-primary)] mt-0.5 block">Catálogo Propio</span>
                </div>
              </div>

            </div>
          ) : (
            <div className="my-auto text-center py-12 px-4 space-y-3">
              <div className="w-12 h-12 rounded-full bg-[var(--ev-primary)]/10 text-[var(--ev-primary)] flex items-center justify-center mx-auto">
                <Layers size={24} />
              </div>
              <h3 className="text-base font-bold text-[var(--ev-text-main)]">
                Ningún servicio seleccionado
              </h3>
              <p className="text-xs text-[var(--ev-text-muted)] max-w-sm mx-auto">
                Selecciona un ítem de la lista para ver su descripción, tarifas y parametrización de cotizador.
              </p>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setShowCreate(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--ev-primary)] text-white text-xs font-semibold shadow-xs active:scale-[0.98] transition-transform duration-150 mt-2"
                >
                  <Plus size={14} />
                  <span>Añadir primer servicio</span>
                </button>
              )}
            </div>
          )}

          <div className="pt-4 border-t border-[var(--ev-border)]/40 flex items-center justify-between text-xs text-[var(--ev-text-muted)]">
            <span>Preservación de contexto</span>
            <span className="font-medium text-[var(--ev-primary)]">Split View 35/65</span>
          </div>

        </div>

      </div>

      {/* ── DRAWER CONTEXTUAL: Crear Servicio (Slide-Over) ───────────────── */}
      <Drawer
        isOpen={showCreate}
        onClose={() => {
          setShowCreate(false);
          setPlanLimitError(null);
        }}
        title="Añadir Servicio al Catálogo"
        subtitle="Agrega una prestación sin salir de la lista"
      >
        {planLimitError && (
          <div className="mb-4">
            <PlanLimitAlert
              message={planLimitError}
              recurso="servicios"
              onClose={() => setPlanLimitError(null)}
            />
          </div>
        )}
        <ServicioFormDrawer
          onSubmit={handleCreate}
          submitting={submitting}
          onCancel={() => {
            setShowCreate(false);
            setPlanLimitError(null);
          }}
        />
      </Drawer>

      {/* ── DRAWER CONTEXTUAL: Editar Servicio (Slide-Over) ──────────────── */}
      <Drawer
        isOpen={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        title="Editar Servicio"
        subtitle={editTarget ? editTarget.nombre : ''}
      >
        {editTarget && (
          <ServicioFormDrawer
            initialData={editTarget}
            onSubmit={handleUpdate}
            submitting={submitting}
            onCancel={() => setEditTarget(null)}
          />
        )}
      </Drawer>

      {/* Modal Desactivar */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-[22px] backdrop-blur-xl backdrop-saturate-[180%] bg-[var(--ev-surface)]/80 border-0 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6),_0_10px_25px_-5px_rgba(35,61,73,0.1)] p-6 text-center animate-fade-in">
            <div className="w-10 h-10 rounded-full bg-[#C95C5C]/15 text-[#C95C5C] flex items-center justify-center mx-auto mb-3">
              <AlertTriangle size={20} />
            </div>
            <h3 className="text-base font-bold text-[var(--ev-text-main)] mb-1">
              ¿Desactivar servicio?
            </h3>
            <p className="text-xs text-[var(--ev-text-muted)] mb-5">
              El servicio <strong>{deleteTarget.nombre}</strong> no se mostrará a clientes en el cotizador dinámico.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-full border border-[var(--ev-border)] text-xs font-semibold text-[var(--ev-text-main)] active:scale-[0.98]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-5 py-2 rounded-full bg-[#C95C5C] hover:bg-[#B54A4A] text-white text-xs font-semibold shadow-xs active:scale-[0.98]"
              >
                {deleting ? 'Desactivando...' : 'Desactivar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notificación */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-[14px] text-xs font-semibold shadow-lg backdrop-blur-md border animate-fade-in ${
            toast.type === 'error'
              ? 'bg-[#C95C5C]/90 text-white border-[#C95C5C]'
              : 'bg-[var(--ev-surface)] text-[var(--ev-text-main)] border-[var(--ev-border)] shadow-md'
          }`}
        >
          {toast.type === 'error' ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} className="text-[#4D9A72]" />}
          <span>{toast.message}</span>
        </div>
      )}

    </div>
  );
};
