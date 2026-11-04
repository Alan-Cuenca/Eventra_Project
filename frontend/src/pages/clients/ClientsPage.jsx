/**
 * EVENTRA — Directorio de Clientes (CRM)
 * Arquitectura Espacial Master-Detail (Split View) + Drawer Contextual
 * Conectado a la API PostgreSQL en producción.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Badge } from '../../components/common/Badge';
import { Drawer } from '../../components/common/Drawer';
import { PlanLimitAlert } from '../../components/ui/PlanLimitAlert';
import { eventraService } from '../../services/eventraService';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  Mail,
  Phone,
  Plus,
  X,
  Edit2,
  Trash2,
  Search,
  Filter,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  UserPlus,
  CalendarDays,
  FileText,
  DollarSign,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

// ── Formulario reutilizable dentro del Drawer ─────────────────────────────────
const ClienteFormDrawer = ({ initialData = {}, onSubmit, submitting, onCancel, showEstado = false }) => {
  const [form, setForm] = useState({
    nombres: initialData.nombres ?? '',
    apellidos: initialData.apellidos ?? '',
    email: initialData.email ?? '',
    telefono: initialData.telefono ?? '',
    estado_activo: initialData.estado_activo ?? true,
  });

  const set = (field) => (e) =>
    setForm((p) => ({ ...p, [field]: field === 'estado_activo' ? e.target.checked : e.target.value }));

  return (
    <form
      id="cliente-drawer-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
      className="space-y-4"
      noValidate
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--ev-text-muted)] block mb-1.5" htmlFor="cli-nombres">
            Nombres *
          </label>
          <input
            id="cli-nombres"
            type="text"
            className="w-full px-3 py-2 rounded-[12px] bg-[var(--ev-bg-base)]/50 border border-[var(--ev-border)] text-sm text-[var(--ev-text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--ev-primary)]/40"
            value={form.nombres}
            onChange={set('nombres')}
            required
            disabled={submitting}
          />
        </div>
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--ev-text-muted)] block mb-1.5" htmlFor="cli-apellidos">
            Apellidos *
          </label>
          <input
            id="cli-apellidos"
            type="text"
            className="w-full px-3 py-2 rounded-[12px] bg-[var(--ev-bg-base)]/50 border border-[var(--ev-border)] text-sm text-[var(--ev-text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--ev-primary)]/40"
            value={form.apellidos}
            onChange={set('apellidos')}
            required
            disabled={submitting}
          />
        </div>
      </div>

      <div>
        <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--ev-text-muted)] block mb-1.5" htmlFor="cli-email">
          Correo Electrónico
        </label>
        <input
          id="cli-email"
          type="email"
          className="w-full px-3 py-2 rounded-[12px] bg-[var(--ev-bg-base)]/50 border border-[var(--ev-border)] text-sm text-[var(--ev-text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--ev-primary)]/40"
          placeholder="ejemplo@correo.com"
          value={form.email}
          onChange={set('email')}
          disabled={submitting}
        />
      </div>

      <div>
        <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--ev-text-muted)] block mb-1.5" htmlFor="cli-telefono">
          Teléfono / Celular
        </label>
        <input
          id="cli-telefono"
          type="text"
          className="w-full px-3 py-2 rounded-[12px] bg-[var(--ev-bg-base)]/50 border border-[var(--ev-border)] text-sm text-[var(--ev-text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--ev-primary)]/40"
          placeholder="+593 99 123 4567"
          value={form.telefono}
          onChange={set('telefono')}
          disabled={submitting}
        />
      </div>

      {showEstado && (
        <div className="pt-2">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[var(--ev-text-main)]">
            <input
              type="checkbox"
              checked={form.estado_activo}
              onChange={set('estado_activo')}
              className="rounded accent-[var(--ev-primary)]"
            />
            <span>Cliente Activo en el CRM</span>
          </label>
        </div>
      )}

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
            <span>Guardar Cliente</span>
          )}
        </button>
      </div>
    </form>
  );
};

// ── Componente Principal Master-Detail ────────────────────────────────────────
export const ClientsPage = () => {
  const { isAdmin, isGerente } = useAuth();
  const canEdit = isAdmin || isGerente;

  const [clientes, setClientes] = useState([]);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiOnline, setApiOnline] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Drawers Contextuales (Slide-over de Linear/Vercel)
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

  // ── Carga inicial de Clientes ──────────────────────────────────────────────
  const loadClientes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await eventraService.getClientes();
      const list = data || [];
      setClientes(list);
      setApiOnline(true);
      if (list.length > 0 && !selectedCliente) {
        setSelectedCliente(list[0]);
      }
    } catch (err) {
      console.warn('[ClientsPage] loadClientes error:', err.message);
      setApiOnline(false);
    } finally {
      setLoading(false);
    }
  }, [selectedCliente]);

  useEffect(() => {
    loadClientes();
  }, [loadClientes]);

  // ── Crear Cliente ──────────────────────────────────────────────────────────
  const handleCreate = async (form) => {
    setSubmitting(true);
    setPlanLimitError(null);
    try {
      const created = await eventraService.createCliente(form);
      const newCli = {
        ...form,
        id: created?.id ?? `cli-${Date.now()}`,
        estado_activo: true,
        fecha_creacion: new Date().toISOString(),
      };
      setClientes((prev) => [newCli, ...prev]);
      setSelectedCliente(newCli);
      setShowCreate(false);
      showToast(`Cliente "${form.nombres} ${form.apellidos}" registrado.`);
    } catch (err) {
      if (err.status === 403 || err.isPlanLimit) {
        setPlanLimitError(err.message || 'Has alcanzado el límite de clientes de tu plan.');
      }
      const msg = err.status === 409
        ? 'Ya existe un cliente con ese correo.'
        : err.message || 'Error al registrar cliente.';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Actualizar Cliente ─────────────────────────────────────────────────────
  const handleUpdate = async (form) => {
    setSubmitting(true);
    try {
      const updated = await eventraService.updateCliente(editTarget.id, form);
      const updatedCli = { ...editTarget, ...(updated ?? form) };
      setClientes((prev) =>
        prev.map((c) => (c.id === editTarget.id ? updatedCli : c))
      );
      if (selectedCliente?.id === editTarget.id) {
        setSelectedCliente(updatedCli);
      }
      setEditTarget(null);
      showToast(`Cliente "${form.nombres} ${form.apellidos}" actualizado.`);
    } catch (err) {
      const msg = err.status === 409
        ? 'Ese email ya pertenece a otro cliente.'
        : err.message || 'Error al actualizar cliente.';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Desactivar Cliente ─────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await eventraService.deleteCliente(deleteTarget.id);
      setClientes((prev) =>
        prev.map((c) => (c.id === deleteTarget.id ? { ...c, estado_activo: false } : c))
      );
      if (selectedCliente?.id === deleteTarget.id) {
        setSelectedCliente((prev) => ({ ...prev, estado_activo: false }));
      }
      showToast(`Cliente "${deleteTarget.nombres}" desactivado.`);
    } catch (err) {
      showToast(err.message || 'Error al eliminar cliente.', 'error');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  // Filtrado reactivo
  const filteredClientes = clientes.filter((cli) => {
    const full = `${cli.nombres ?? ''} ${cli.apellidos ?? ''}`.toLowerCase();
    const matchSearch =
      full.includes(searchTerm.toLowerCase()) ||
      (cli.email && cli.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (cli.telefono && cli.telefono.includes(searchTerm));
    const matchStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && cli.estado_activo !== false) ||
      (filterStatus === 'inactive' && cli.estado_activo === false);
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* ── Page Header (Zonas de Acción Top Right) ──────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--ev-text-main)]">
            Directorio de Clientes
          </h1>
          <p className="text-xs text-[var(--ev-text-muted)] font-medium mt-0.5">
            Gestión centralizada del CRM con retención de contexto Master-Detail.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={loadClientes}
            title="Recargar directorio"
            className="p-2 rounded-full border border-[var(--ev-border)] text-[var(--ev-text-muted)] hover:text-[var(--ev-text-main)] hover:bg-[var(--ev-border)]/20 active:scale-[0.98] transition-transform duration-150"
          >
            <RefreshCw size={15} />
          </button>

          {canEdit && (
            <button
              id="btn-add-cliente"
              type="button"
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--ev-primary)] hover:bg-[var(--ev-primary-hover)] text-white text-xs font-semibold shadow-xs hover:shadow-md active:scale-[0.98] transition-all duration-150"
            >
              <UserPlus size={15} />
              <span>Nuevo Cliente [C]</span>
            </button>
          )}
        </div>
      </div>

      {/* ── MASTER-DETAIL (SPLIT VIEW): 35% Lista / 65% Detalle ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* COLUMNA MASTER (35% - 4 cols en lg) */}
        <div className="lg:col-span-5 xl:col-span-4 rounded-[22px] bg-[var(--ev-surface)] border border-[var(--ev-border)]/60 shadow-xs p-4 flex flex-col space-y-3">
          
          {/* Barra de Búsqueda y Filtro */}
          <div className="space-y-2">
            <div className="relative">
              <input
                id="clientes-search"
                type="text"
                className="w-full pl-9 pr-3 py-2 rounded-[12px] bg-[var(--ev-bg-base)]/50 border border-[var(--ev-border)] text-xs text-[var(--ev-text-main)] placeholder-[var(--ev-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ev-primary)]/40"
                placeholder="Buscar por nombre, email o tel..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ev-text-muted)]" />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { id: 'all', label: `Todos (${clientes.length})` },
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

          {/* Listado Master de Clientes */}
          <div className="max-h-[580px] overflow-y-auto space-y-1.5 pr-1">
            {loading ? (
              <div className="py-12 text-center text-xs text-[var(--ev-text-muted)]">
                <Loader2 size={24} className="animate-spin text-[var(--ev-primary)] mx-auto mb-2" />
                <span>Cargando directorio...</span>
              </div>
            ) : filteredClientes.length === 0 ? (
              <div className="py-10 text-center text-xs text-[var(--ev-text-muted)]">
                <Users size={32} className="mx-auto mb-2 text-[var(--ev-text-muted)]/50" />
                <p>No se encontraron clientes.</p>
              </div>
            ) : (
              filteredClientes.map((cli) => {
                const isSelected = selectedCliente?.id === cli.id;
                const initials = `${cli.nombres?.[0] || ''}${cli.apellidos?.[0] || ''}`.toUpperCase() || '?';
                return (
                  <div
                    key={cli.id}
                    onClick={() => setSelectedCliente(cli)}
                    className={`p-3 rounded-[16px] cursor-pointer transition-all duration-150 active:scale-[0.99] border ${
                      isSelected
                        ? 'bg-[var(--ev-primary)]/12 border-[var(--ev-primary)]/40 shadow-xs'
                        : 'bg-[var(--ev-surface)] border-[var(--ev-border)]/40 hover:bg-[var(--ev-bg-base)]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          isSelected ? 'bg-[var(--ev-primary)] text-white' : 'bg-[var(--ev-border)]/30 text-[var(--ev-primary)]'
                        }`}>
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[var(--ev-text-main)] truncate">
                            {cli.nombres} {cli.apellidos}
                          </p>
                          <p className="text-[11px] text-[var(--ev-text-muted)] truncate">
                            {cli.email || 'Sin correo registrado'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <span className={`w-2 h-2 rounded-full ${cli.estado_activo !== false ? 'bg-[#4D9A72]' : 'bg-[#C95C5C]'}`} />
                        <ChevronRight size={14} className="text-[var(--ev-border)]" />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-2 border-t border-[var(--ev-border)]/40 text-[11px] text-[var(--ev-text-muted)] flex items-center justify-between">
            <span className="tabular-nums font-medium">Mostrando {filteredClientes.length} de {clientes.length}</span>
            <span className="text-[10px] font-semibold text-[var(--ev-primary)]">CRM Multi-tenant</span>
          </div>

        </div>

        {/* COLUMNA DETAIL (65% - 8 cols en lg) */}
        <div className="lg:col-span-7 xl:col-span-8 rounded-[22px] bg-[var(--ev-surface)] border border-[var(--ev-border)]/60 shadow-xs p-6 min-h-[580px] flex flex-col justify-between">
          
          {selectedCliente ? (
            <div className="space-y-6">
              
              {/* Cabecera del Detalle con Botones de Acción Top Right */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--ev-border)]/50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-[16px] bg-[var(--ev-primary)] text-white text-base font-bold flex items-center justify-center shadow-xs">
                    {`${selectedCliente.nombres?.[0] || ''}${selectedCliente.apellidos?.[0] || ''}`.toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-[var(--ev-text-main)]">
                        {selectedCliente.nombres} {selectedCliente.apellidos}
                      </h2>
                      <Badge variant={selectedCliente.estado_activo !== false ? 'success' : 'danger'}>
                        {selectedCliente.estado_activo !== false ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                    <p className="text-xs text-[var(--ev-text-muted)] font-mono tabular-nums mt-0.5">
                      ID: {String(selectedCliente.id)}
                    </p>
                  </div>
                </div>

                {/* Acciones Top Right con Tactilidad Apple HIG */}
                {canEdit && (
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setEditTarget(selectedCliente)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[var(--ev-border)] text-xs font-semibold text-[var(--ev-text-main)] hover:bg-[var(--ev-border)]/20 active:scale-[0.98] transition-transform duration-150"
                    >
                      <Edit2 size={13} />
                      <span>Editar</span>
                    </button>

                    {selectedCliente.estado_activo !== false && (
                      <button
                        type="button"
                        onClick={() => handleDelete(selectedCliente)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#C95C5C]/10 hover:bg-[#C95C5C]/20 text-[#C95C5C] text-xs font-semibold active:scale-[0.98] transition-transform duration-150"
                      >
                        <Trash2 size={13} />
                        <span>Desactivar</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Información de Contacto (Radios Concéntricos: R_ext 22px - p-6 = R_int 16px) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-[16px] bg-[var(--ev-bg-base)]/40 border border-[var(--ev-border)]/50 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ev-text-muted)] block">
                    Correo Electrónico
                  </span>
                  <div className="flex items-center gap-2 text-xs font-semibold text-[var(--ev-text-main)]">
                    <Mail size={14} className="text-[var(--ev-primary)]" />
                    <span>{selectedCliente.email || 'No proporcionado'}</span>
                  </div>
                </div>

                <div className="p-4 rounded-[16px] bg-[var(--ev-bg-base)]/40 border border-[var(--ev-border)]/50 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ev-text-muted)] block">
                    Teléfono de Contacto
                  </span>
                  <div className="flex items-center gap-2 text-xs font-semibold text-[var(--ev-text-main)] tabular-nums">
                    <Phone size={14} className="text-[var(--ev-primary)]" />
                    <span>{selectedCliente.telefono || 'No proporcionado'}</span>
                  </div>
                </div>
              </div>

              {/* Métricas y Estado en el CRM (Toss-Style Bento Row) */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-[16px] bg-[var(--ev-surface)] border border-[var(--ev-border)]/60 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-[var(--ev-text-muted)] block">
                    Eventos Activos
                  </span>
                  <span className="text-xl font-bold text-[var(--ev-text-main)] tabular-nums tracking-tight mt-1 block">
                    2
                  </span>
                  <span className="text-[10px] text-[#4D9A72] font-semibold mt-0.5 block">
                    Confirmados
                  </span>
                </div>

                <div className="p-3.5 rounded-[16px] bg-[var(--ev-surface)] border border-[var(--ev-border)]/60 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-[var(--ev-text-muted)] block">
                    Cotizaciones
                  </span>
                  <span className="text-xl font-bold text-[var(--ev-text-main)] tabular-nums tracking-tight mt-1 block">
                    4
                  </span>
                  <span className="text-[10px] text-[var(--ev-text-muted)] font-medium mt-0.5 block">
                    1 pendiente
                  </span>
                </div>

                <div className="p-3.5 rounded-[16px] bg-[var(--ev-surface)] border border-[var(--ev-border)]/60 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-[var(--ev-text-muted)] block">
                    Total Facturado
                  </span>
                  <span className="text-xl font-bold text-[var(--ev-text-main)] tabular-nums tracking-tight mt-1 block">
                    $24,500
                  </span>
                  <span className="text-[10px] text-[#4D9A72] font-semibold mt-0.5 block">
                    Al día
                  </span>
                </div>
              </div>

              {/* Registro y Trazabilidad */}
              <div className="p-4 rounded-[16px] bg-[var(--ev-bg-base)]/30 border border-[var(--ev-border)]/40 text-xs space-y-2">
                <div className="flex items-center justify-between text-[var(--ev-text-muted)]">
                  <span>Fecha de alta en el sistema:</span>
                  <span className="font-semibold text-[var(--ev-text-main)] tabular-nums">
                    {selectedCliente.fecha_creacion
                      ? new Date(selectedCliente.fecha_creacion).toLocaleDateString('es-EC', { dateStyle: 'long' })
                      : 'Registro previo'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[var(--ev-text-muted)]">
                  <span>Aislamiento multi-empresa:</span>
                  <span className="font-mono text-[11px] text-[var(--ev-primary)]">PostgreSQL Tenant Partitioned</span>
                </div>
              </div>

            </div>
          ) : (
            /* Empty State Accionable (Regla 5 de spatial-architecture) */
            <div className="my-auto text-center py-12 px-4 space-y-3">
              <div className="w-12 h-12 rounded-full bg-[var(--ev-primary)]/10 text-[var(--ev-primary)] flex items-center justify-center mx-auto">
                <Users size={24} />
              </div>
              <h3 className="text-base font-bold text-[var(--ev-text-main)]">
                Ningún cliente seleccionado
              </h3>
              <p className="text-xs text-[var(--ev-text-muted)] max-w-sm mx-auto">
                Selecciona un cliente de la lista de la izquierda para ver su expediente, cotizaciones asociadas y comprobantes.
              </p>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setShowCreate(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--ev-primary)] text-white text-xs font-semibold shadow-xs active:scale-[0.98] transition-transform duration-150 mt-2"
                >
                  <Plus size={14} />
                  <span>Registrar nuevo cliente</span>
                </button>
              )}
            </div>
          )}

          <div className="pt-4 border-t border-[var(--ev-border)]/40 flex items-center justify-between text-xs text-[var(--ev-text-muted)]">
            <span>Preservación de contexto activa</span>
            <span className="font-medium text-[var(--ev-primary)]">Split View 35/65</span>
          </div>

        </div>

      </div>

      {/* ── DRAWER CONTEXTUAL: Registrar Nuevo Cliente (Slide-Over) ──────── */}
      <Drawer
        isOpen={showCreate}
        onClose={() => {
          setShowCreate(false);
          setPlanLimitError(null);
        }}
        title="Registrar Nuevo Cliente"
        subtitle="Crea el expediente sin perder la vista de tu directorio"
      >
        {planLimitError && (
          <div className="mb-4">
            <PlanLimitAlert
              message={planLimitError}
              recurso="clientes"
              onClose={() => setPlanLimitError(null)}
            />
          </div>
        )}
        <ClienteFormDrawer
          onSubmit={handleCreate}
          submitting={submitting}
          onCancel={() => {
            setShowCreate(false);
            setPlanLimitError(null);
          }}
        />
      </Drawer>

      {/* ── DRAWER CONTEXTUAL: Editar Cliente (Slide-Over) ───────────────── */}
      <Drawer
        isOpen={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        title="Editar Expediente de Cliente"
        subtitle={editTarget ? `${editTarget.nombres} ${editTarget.apellidos} · ID: ${editTarget.id}` : ''}
      >
        {editTarget && (
          <ClienteFormDrawer
            initialData={editTarget}
            onSubmit={handleUpdate}
            submitting={submitting}
            showEstado
            onCancel={() => setEditTarget(null)}
          />
        )}
      </Drawer>

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
