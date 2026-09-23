/**
 * EVENTRA — Directorio de Clientes (CRM)
 * Consume la API real:
 *   GET    /api/clientes        → lista todos
 *   POST   /api/clientes        → crear nuevo
 *   PUT    /api/clientes/:id    → actualizar (Admin / Gerente)
 *   DELETE /api/clientes/:id    → borrado lógico (Admin / Gerente)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
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
} from 'lucide-react';

// ── Toast de Notificación ────────────────────────────────────────────────────
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  const colors = {
    success: { bg: 'rgba(46,139,87,0.15)', border: 'rgba(46,139,87,0.4)', color: '#5bc286' },
    error:   { bg: 'rgba(185,74,72,0.15)',  border: 'rgba(185,74,72,0.4)',  color: '#e27d7c' },
  };
  const c = colors[type] || colors.success;

  return (
    <div style={{
      position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 99999,
      display: 'flex', alignItems: 'center', gap: '0.75rem',
      padding: '0.85rem 1.25rem',
      background: c.bg, border: `1px solid ${c.border}`, borderRadius: '10px',
      color: c.color, fontSize: '0.88rem', fontWeight: 600,
      boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
      animation: 'slideIn 0.25s ease',
      maxWidth: '360px',
    }}>
      {type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
      <span>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', marginLeft: '0.25rem', padding: '2px' }}>
        <X size={15} />
      </button>
    </div>
  );
};

// ── Modal Genérico ───────────────────────────────────────────────────────────
const Modal = ({ title, subtitle, onClose, children }) => (
  <div style={{
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 10000, padding: '1rem',
  }}>
    <div className="glass-card animate-fade-in" style={{ maxWidth: '480px', width: '100%', border: '1px solid var(--accent)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', margin: 0 }}>{title}</h3>
          {subtitle && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{subtitle}</span>}
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}>
          <X size={20} />
        </button>
      </div>
      {children}
    </div>
  </div>
);

// ── Formulario reutilizable dentro de modal ──────────────────────────────────
const ClienteFormModal = ({ initialData = {}, onSubmit, submitting, onCancel, showEstado = false }) => {
  const [form, setForm] = useState({
    nombres:       initialData.nombres      ?? '',
    apellidos:     initialData.apellidos    ?? '',
    email:         initialData.email        ?? '',
    telefono:      initialData.telefono     ?? '',
    estado_activo: initialData.estado_activo ?? true,
  });
  const set = (field) => (e) =>
    setForm((p) => ({ ...p, [field]: field === 'estado_activo' ? e.target.checked : e.target.value }));

  return (
    <form id="cliente-modal-form" onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} noValidate>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div className="form-group">
          <label className="form-label" htmlFor="cli-nombres">Nombres *</label>
          <input id="cli-nombres" type="text" className="form-input" value={form.nombres} onChange={set('nombres')} required disabled={submitting} />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="cli-apellidos">Apellidos *</label>
          <input id="cli-apellidos" type="text" className="form-input" value={form.apellidos} onChange={set('apellidos')} required disabled={submitting} />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="cli-email">Correo Electrónico</label>
        <input id="cli-email" type="email" className="form-input" placeholder="ejemplo@correo.com" value={form.email} onChange={set('email')} disabled={submitting} />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="cli-telefono">Teléfono / Celular</label>
        <input id="cli-telefono" type="text" className="form-input" placeholder="+593 99 123 4567" value={form.telefono} onChange={set('telefono')} disabled={submitting} />
      </div>

      {showEstado && (
        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
            <input type="checkbox" checked={form.estado_activo} onChange={set('estado_activo')} style={{ accentColor: 'var(--primary)' }} />
            Cliente Activo
          </label>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={submitting}>Cancelar</button>
        <button type="submit" className="btn btn-primary" disabled={submitting} id="cliente-form-submit">
          {submitting ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Guardando...</> : 'Guardar Cliente'}
        </button>
      </div>
    </form>
  );
};

// ── Componente Principal ─────────────────────────────────────────────────────
export const ClientsPage = () => {
  const { isAdmin, isGerente } = useAuth();
  const canEdit = isAdmin || isGerente;

  const [clientes, setClientes]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [apiOnline, setApiOnline]     = useState(true);
  const [searchTerm, setSearchTerm]   = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Modales
  const [showCreate, setShowCreate]   = useState(false);
  const [editTarget, setEditTarget]   = useState(null);   // cliente a editar
  const [deleteTarget, setDeleteTarget] = useState(null); // cliente a eliminar

  // Estado de operaciones
  const [submitting, setSubmitting]   = useState(false);
  const [deleting, setDeleting]       = useState(false);
  const [toast, setToast]             = useState(null);   // { message, type }

  const showToast = (message, type = 'success') => setToast({ message, type });

  // ── Carga inicial ─────────────────────────────────────────────────────────
  const loadClientes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await eventraService.getClientes();
      setClientes(data);
      setApiOnline(true);
    } catch (err) {
      console.warn('[ClientsPage] loadClientes error:', err.message);
      setApiOnline(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadClientes(); }, [loadClientes]);

  // ── CREAR — POST /api/clientes ────────────────────────────────────────────
  const handleCreate = async (form) => {
    setSubmitting(true);
    try {
      const created = await eventraService.createCliente(form);
      // Añadir el cliente creado al estado local sin recargar toda la lista
      setClientes((prev) => [{ ...form, id: created?.id ?? `cli-${Date.now()}`, estado_activo: true, fecha_creacion: new Date().toISOString() }, ...prev]);
      setShowCreate(false);
      showToast(`✅ Cliente "${form.nombres} ${form.apellidos}" registrado.`);
    } catch (err) {
      const msg = err.status === 409
        ? '⚠️ Ya existe un cliente con ese email.'
        : err.message || 'Error al registrar cliente.';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── EDITAR — PUT /api/clientes/:id ───────────────────────────────────────
  const handleUpdate = async (form) => {
    setSubmitting(true);
    try {
      const updated = await eventraService.updateCliente(editTarget.id, form);
      // Actualiza el item en el estado local con los datos devueltos por el server
      setClientes((prev) =>
        prev.map((c) => c.id === editTarget.id ? { ...c, ...(updated ?? form) } : c)
      );
      setEditTarget(null);
      showToast(`✅ Cliente "${form.nombres} ${form.apellidos}" actualizado.`);
    } catch (err) {
      const msg = err.status === 409
        ? '⚠️ Ese email ya pertenece a otro cliente.'
        : err.message || 'Error al actualizar cliente.';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── ELIMINAR — DELETE /api/clientes/:id (borrado lógico) ─────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await eventraService.deleteCliente(deleteTarget.id);
      // Marcar como inactivo en el estado local
      setClientes((prev) =>
        prev.map((c) => c.id === deleteTarget.id ? { ...c, estado_activo: false } : c)
      );
      showToast(`🗑️ Cliente "${deleteTarget.nombres}" desactivado.`);
    } catch (err) {
      showToast(err.message || 'Error al eliminar cliente.', 'error');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  // ── Filtrado reactivo ─────────────────────────────────────────────────────
  const filteredClientes = clientes.filter((cli) => {
    const full = `${cli.nombres ?? ''} ${cli.apellidos ?? ''}`.toLowerCase();
    const matchSearch =
      full.includes(searchTerm.toLowerCase()) ||
      (cli.email    && cli.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (cli.telefono && cli.telefono.includes(searchTerm));
    const matchStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active'   && cli.estado_activo !== false) ||
      (filterStatus === 'inactive' && cli.estado_activo === false);
    return matchSearch && matchStatus;
  });

  return (
    <div>
      {/* ── Page Header ───────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1>Directorio de Clientes</h1>
          <p>Gestión centralizada del CRM conectada a la API en producción.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {/* Badge estado API */}
          <div style={{
            padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: '0.72rem', fontWeight: 700,
            background: apiOnline ? 'rgba(46,139,87,0.15)' : 'rgba(194,136,52,0.15)',
            border: `1px solid ${apiOnline ? 'rgba(46,139,87,0.35)' : 'rgba(194,136,52,0.35)'}`,
            color: apiOnline ? '#5bc286' : '#e5b067', display: 'flex', alignItems: 'center', gap: '0.4rem',
          }}>
            <span style={{ fontSize: '0.6rem' }}>●</span>
            {apiOnline ? 'API en línea' : 'Modo demo'}
          </div>
          <button className="btn btn-secondary" onClick={loadClientes} title="Recargar lista">
            <RefreshCw size={15} />
          </button>
          {canEdit && (
            <button id="btn-add-cliente" className="btn btn-primary" onClick={() => setShowCreate(true)}>
              <UserPlus size={16} />
              <span>Añadir Cliente</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Barra de Búsqueda y Filtros ──────────────────────────────── */}
      <Card style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <input
              id="clientes-search"
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.4rem' }}
              placeholder="Buscar por nombre, email o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search size={17} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Filter size={15} color="var(--accent)" />
            <select id="clientes-filter" className="form-select" style={{ width: 'auto' }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">Todos ({clientes.length})</option>
              <option value="active">Solo Activos</option>
              <option value="inactive">Solo Inactivos</option>
            </select>
          </div>
        </div>
      </Card>

      {/* ── Tabla de Clientes ─────────────────────────────────────────── */}
      <Card>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', marginBottom: '0.75rem', color: 'var(--primary)' }} />
            <div>Cargando clientes desde PostgreSQL...</div>
          </div>
        ) : filteredClientes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <Users size={36} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
            <div style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              {searchTerm ? 'No se encontraron clientes que coincidan con la búsqueda.' : 'No hay clientes registrados aún.'}
            </div>
            {canEdit && !searchTerm && (
              <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                <Plus size={16} /> Registrar el primer cliente
              </button>
            )}
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Nombre Completo</th>
                  <th>Correo Electrónico</th>
                  <th>Teléfono</th>
                  <th>Registro</th>
                  <th>Estado</th>
                  {canEdit && <th style={{ textAlign: 'center' }}>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {filteredClientes.map((cli) => (
                  <tr key={cli.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{cli.nombres} {cli.apellidos}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>ID: {String(cli.id).substring(0, 8)}…</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                        <Mail size={13} color="var(--accent)" />
                        {cli.email || <span style={{ color: 'var(--text-muted)' }}>Sin correo</span>}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                        <Phone size={13} color="var(--accent)" />
                        {cli.telefono || <span style={{ color: 'var(--text-muted)' }}>Sin teléfono</span>}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {cli.fecha_creacion ? new Date(cli.fecha_creacion).toLocaleDateString('es-EC') : '—'}
                    </td>
                    <td>
                      <Badge variant={cli.estado_activo !== false ? 'success' : 'danger'}>
                        {cli.estado_activo !== false ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    {canEdit && (
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <button
                            id={`btn-edit-${cli.id}`}
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                            title="Editar cliente"
                            onClick={() => setEditTarget(cli)}
                          >
                            <Edit2 size={13} /> Editar
                          </button>
                          {cli.estado_activo !== false && (
                            <button
                              id={`btn-delete-${cli.id}`}
                              className="btn btn-outline"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                              title="Desactivar cliente"
                              onClick={() => setDeleteTarget(cli)}
                            >
                              <Trash2 size={13} color="#e27d7c" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer con conteo */}
        {!loading && filteredClientes.length > 0 && (
          <div style={{ padding: '0.75rem 0 0', borderTop: '1px solid var(--border-subtle)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Mostrando {filteredClientes.length} de {clientes.length} clientes
          </div>
        )}
      </Card>

      {/* ── MODAL: Crear Cliente ──────────────────────────────────────── */}
      {showCreate && (
        <Modal title="Registrar Nuevo Cliente" onClose={() => setShowCreate(false)}>
          <ClienteFormModal
            onSubmit={handleCreate}
            submitting={submitting}
            onCancel={() => setShowCreate(false)}
          />
        </Modal>
      )}

      {/* ── MODAL: Editar Cliente ─────────────────────────────────────── */}
      {editTarget && (
        <Modal
          title="Editar Cliente"
          subtitle={`ID: ${editTarget.id}`}
          onClose={() => setEditTarget(null)}
        >
          <ClienteFormModal
            initialData={editTarget}
            onSubmit={handleUpdate}
            submitting={submitting}
            onCancel={() => setEditTarget(null)}
            showEstado
          />
        </Modal>
      )}

      {/* ── MODAL: Confirmar Eliminación ──────────────────────────────── */}
      {deleteTarget && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000, padding: '1rem',
        }}>
          <div className="glass-card animate-fade-in" style={{ maxWidth: '400px', width: '100%', border: '1px solid rgba(185,74,72,0.4)', textAlign: 'center' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: 'rgba(185,74,72,0.15)', border: '1px solid rgba(185,74,72,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem',
            }}>
              <AlertTriangle size={26} color="#e27d7c" />
            </div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>¿Desactivar cliente?</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
              El cliente <strong style={{ color: 'var(--text-primary)' }}>
                {deleteTarget.nombres} {deleteTarget.apellidos}
              </strong> será marcado como inactivo. Esta acción se puede revertir editando el cliente.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                Cancelar
              </button>
              <button
                id="btn-confirm-delete"
                className="btn btn-primary"
                style={{ background: 'rgba(185,74,72,0.85)', borderColor: 'rgba(185,74,72,0.6)' }}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Desactivando...</> : '🗑️ Sí, desactivar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast de notificación */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
};
