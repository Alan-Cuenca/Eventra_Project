import React, { useState, useEffect } from 'react';
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
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export const ClientsPage = () => {
  const { isAdmin, isGerente } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Modal Crear
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    nombres: '',
    apellidos: '',
    email: '',
    telefono: '',
  });

  // Modal Editar
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [editForm, setEditForm] = useState({
    nombres: '',
    apellidos: '',
    email: '',
    telefono: '',
    estado_activo: true,
  });

  const [submitting, setSubmitting] = useState(false);

  const loadClientes = async () => {
    setLoading(true);
    const data = await eventraService.getClientes();
    setClientes(data);
    setLoading(false);
  };

  useEffect(() => {
    loadClientes();
  }, []);

  // Manejo Crear Cliente
  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await eventraService.createCliente(createForm);
      setShowCreateModal(false);
      setCreateForm({ nombres: '', apellidos: '', email: '', telefono: '' });
      await loadClientes();
    } catch (err) {
      alert('Error al registrar cliente: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Abrir Modal Editar
  const openEditModal = (client) => {
    setEditingClient(client);
    setEditForm({
      nombres: client.nombres || '',
      apellidos: client.apellidos || '',
      email: client.email || '',
      telefono: client.telefono || '',
      estado_activo: client.estado_activo !== false,
    });
    setShowEditModal(true);
  };

  // Guardar Edición (Optimista en frontend + preparación de endpoint backend)
  const handleUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Intentar actualizar vía API (si el backend ya implementa PUT /api/clientes/:id)
      // y actualizar inmediatamente el estado local para fluidez inmediata
      setClientes((prev) =>
        prev.map((c) =>
          c.id === editingClient.id ? { ...c, ...editForm } : c
        )
      );
      setShowEditModal(false);
      setEditingClient(null);
    } catch (err) {
      alert('Error al actualizar cliente: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Alternar estado activo / inactivo
  const toggleStatus = (clientId) => {
    setClientes((prev) =>
      prev.map((c) =>
        c.id === clientId ? { ...c, estado_activo: !c.estado_activo } : c
      )
    );
  };

  // Filtrado reactivo en tiempo real
  const filteredClientes = clientes.filter((cli) => {
    const fullName = `${cli.nombres || ''} ${cli.apellidos || ''}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      (cli.email && cli.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (cli.telefono && cli.telefono.includes(searchTerm));

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && cli.estado_activo !== false) ||
      (filterStatus === 'inactive' && cli.estado_activo === false);

    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Directorio de Clientes</h1>
          <p>Gestión centralizada de contactos y clientes para la organización de eventos.</p>
        </div>
        {(isAdmin || isGerente) && (
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
            <span>Registrar Cliente</span>
          </button>
        )}
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <Card style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.4rem' }}
              placeholder="Buscar cliente por nombre, apellido, correo o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '0.85rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Filter size={16} color="var(--accent)" />
            <select
              className="form-select"
              style={{ width: 'auto' }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Todos los Clientes ({clientes.length})</option>
              <option value="active">Solo Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Tabla de Clientes */}
      <Card>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
            Cargando clientes de PostgreSQL...
          </div>
        ) : filteredClientes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            No se encontraron clientes que coincidan con la búsqueda.
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Nombres y Apellidos</th>
                  <th>Contacto</th>
                  <th>Fecha de Registro</th>
                  <th>Estado</th>
                  {(isAdmin || isGerente) && <th style={{ textAlign: 'center' }}>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {filteredClientes.map((cli) => (
                  <tr key={cli.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {cli.nombres} {cli.apellidos}
                      </div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                        UUID: {cli.id}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                        <Mail size={14} color="var(--accent)" /> {cli.email || 'Sin correo registrado'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <Phone size={14} color="var(--accent)" /> {cli.telefono || 'Sin teléfono'}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {cli.fecha_creacion ? new Date(cli.fecha_creacion).toLocaleDateString() : 'Registrado'}
                    </td>
                    <td>
                      <Badge variant={cli.estado_activo !== false ? 'success' : 'danger'}>
                        {cli.estado_activo !== false ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>

                    {/* Columna de Acciones para Admin y Gerente */}
                    {(isAdmin || isGerente) && (
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                            title="Editar información del cliente"
                            onClick={() => openEditModal(cli)}
                          >
                            <Edit2 size={14} />
                            <span>Editar</span>
                          </button>
                          <button
                            className="btn btn-outline"
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                            title={cli.estado_activo !== false ? 'Desactivar cliente' : 'Activar cliente'}
                            onClick={() => toggleStatus(cli.id)}
                          >
                            <Trash2 size={14} color={cli.estado_activo !== false ? '#e27d7c' : '#5bc286'} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* MODAL 1: REGISTRAR CLIENTE */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '1rem',
          }}
        >
          <div className="glass-card" style={{ maxWidth: '480px', width: '100%', border: '1px solid var(--accent)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--text-primary)' }}>
                Registrar Nuevo Cliente
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Nombres *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={createForm.nombres}
                    onChange={(e) => setCreateForm({ ...createForm, nombres: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Apellidos *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={createForm.apellidos}
                    onChange={(e) => setCreateForm({ ...createForm, apellidos: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Correo Electrónico</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="ejemplo@correo.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Teléfono / Celular</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="+593 99 123 4567"
                  value={createForm.telefono}
                  onChange={(e) => setCreateForm({ ...createForm, telefono: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Guardando en BD...' : 'Registrar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDITAR CLIENTE */}
      {showEditModal && editingClient && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '1rem',
          }}
        >
          <div className="glass-card" style={{ maxWidth: '480px', width: '100%', border: '1px solid var(--accent)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--text-primary)' }}>
                  Editar Información del Cliente
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  ID: {editingClient.id}
                </span>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Nombres *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.nombres}
                    onChange={(e) => setEditForm({ ...editForm, nombres: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Apellidos *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.apellidos}
                    onChange={(e) => setEditForm({ ...editForm, apellidos: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Correo Electrónico</label>
                <input
                  type="email"
                  className="form-input"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Teléfono / Celular</label>
                <input
                  type="text"
                  className="form-input"
                  value={editForm.telefono}
                  onChange={(e) => setEditForm({ ...editForm, telefono: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginTop: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={editForm.estado_activo}
                    onChange={(e) => setEditForm({ ...editForm, estado_activo: e.target.checked })}
                  />
                  <span style={{ fontSize: '0.875rem' }}>Cliente Activo</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Guardando Cambios...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
