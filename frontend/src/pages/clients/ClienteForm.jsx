/**
 * EVENTRA — Formulario de Cliente (Página independiente)
 * Modo CREATE: accedido desde /clientes/nuevo → POST /api/clientes
 * Modo EDIT:   accedido desde /clientes/editar/:id → PUT /api/clientes/:id
 *
 * Tras guardar exitosamente (201 / 200), redirige a /clientes.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Card } from '../../components/common/Card';
import {
  User,
  Mail,
  Phone,
  ArrowLeft,
  Save,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  UserPlus,
  Edit2,
} from 'lucide-react';

const EMPTY_FORM = {
  nombres:       '',
  apellidos:     '',
  email:         '',
  telefono:      '',
  estado_activo: true,
};

export const ClienteForm = () => {
  const { id }     = useParams();          // undefined → modo CREATE
  const isEditMode = Boolean(id);

  const navigate = useNavigate();

  const [form, setForm]           = useState(EMPTY_FORM);
  const [loading, setLoading]     = useState(isEditMode); // carga datos si es edición
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState(false);
  const [notFound, setNotFound]   = useState(false);

  // ── Carga los datos actuales del cliente (solo modo edición) ──────────────
  useEffect(() => {
    if (!isEditMode) return;

    const fetchCliente = async () => {
      try {
        // GET /api/clientes — filtramos el cliente por ID del array
        const response = await api.get('/clientes');
        const data = response?.data ?? response;
        const found = Array.isArray(data) ? data.find((c) => String(c.id) === String(id)) : null;
        if (!found) {
          setNotFound(true);
        } else {
          setForm({
            nombres:       found.nombres      ?? '',
            apellidos:     found.apellidos    ?? '',
            email:         found.email        ?? '',
            telefono:      found.telefono     ?? '',
            estado_activo: found.estado_activo ?? true,
          });
        }
      } catch (err) {
        setError('No se pudo cargar la información del cliente. Verifica tu conexión.');
      } finally {
        setLoading(false);
      }
    };

    fetchCliente();
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  // ── Envío del formulario ──────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isEditMode) {
        // PUT /api/clientes/:id  →  200 OK
        await api.put(`/clientes/${id}`, form);
      } else {
        // POST /api/clientes  →  201 Created
        await api.post('/clientes', form);
      }

      setSuccess(true);
      // Redirigir a /clientes tras 1.5 s para que el usuario vea el mensaje de éxito
      setTimeout(() => navigate('/clientes', { replace: true }), 1500);
    } catch (err) {
      let msg = 'Error inesperado. Intenta de nuevo.';
      if (err.status === 409) msg = '⚠️ Ya existe un cliente registrado con ese email.';
      else if (err.status === 400) msg = err.message || 'Completa los campos obligatorios.';
      else if (err.status === 404) msg = 'Cliente no encontrado o no pertenece a tu empresa.';
      else if (!err.status) msg = 'Sin conexión al servidor. Verifica tu red.';
      else msg = err.message || msg;
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Pantalla "No encontrado" ──────────────────────────────────────────────
  if (notFound) {
    return (
      <div>
        <div className="page-header">
          <Link to="/clientes" className="btn btn-secondary" style={{ gap: '0.4rem' }}>
            <ArrowLeft size={16} /> Volver al directorio
          </Link>
        </div>
        <Card style={{ textAlign: 'center', padding: '3rem' }}>
          <AlertTriangle size={36} color="#e27d7c" style={{ marginBottom: '1rem' }} />
          <h2>Cliente no encontrado</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            El ID <code style={{ background: 'var(--bg-input)', padding: '2px 6px', borderRadius: '4px' }}>{id}</code> no existe
            o no pertenece a tu empresa.
          </p>
          <Link to="/clientes" className="btn btn-primary">Ir al directorio de clientes</Link>
        </Card>
      </div>
    );
  }

  // ── Pantalla de carga (solo edición) ─────────────────────────────────────
  if (loading) {
    return (
      <div>
        <div className="page-header"><h1>Cargando cliente...</h1></div>
        <Card style={{ textAlign: 'center', padding: '3rem' }}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)', marginBottom: '1rem' }} />
          <div style={{ color: 'var(--text-secondary)' }}>Obteniendo información del cliente...</div>
        </Card>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Pantalla de éxito ─────────────────────────────────────────────────────
  if (success) {
    return (
      <div>
        <div className="page-header">
          <h1>{isEditMode ? 'Cliente actualizado' : 'Cliente registrado'}</h1>
        </div>
        <Card style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'rgba(46,139,87,0.15)', border: '1px solid rgba(46,139,87,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem',
          }}>
            <CheckCircle2 size={32} color="#5bc286" />
          </div>
          <h2 style={{ marginBottom: '0.5rem' }}>
            {isEditMode ? '¡Cambios guardados!' : '¡Cliente registrado!'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            <strong>{form.nombres} {form.apellidos}</strong> ha sido {isEditMode ? 'actualizado' : 'creado'} exitosamente.
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Redirigiendo al directorio...</p>
        </Card>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Formulario principal ──────────────────────────────────────────────────
  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            {isEditMode
              ? <Edit2 size={22} color="var(--accent)" />
              : <UserPlus size={22} color="var(--accent)" />}
            <h1 style={{ margin: 0 }}>
              {isEditMode ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {isEditMode
              ? `Modificando datos del cliente ID: ${id}`
              : 'Complete los datos para añadir un cliente al directorio.'}
          </p>
        </div>
        <Link to="/clientes" className="btn btn-secondary">
          <ArrowLeft size={15} /> Volver al directorio
        </Link>
      </div>

      <div style={{ maxWidth: '600px' }}>
        <Card>
          {/* Error */}
          {error && (
            <div role="alert" style={{
              background: 'var(--danger-light)', border: '1px solid rgba(185,74,72,0.35)',
              borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem',
              marginBottom: '1.5rem', fontSize: '0.85rem', color: '#e27d7c', lineHeight: 1.5,
            }}>
              {error}
            </div>
          )}

          <form id="cliente-form-page" onSubmit={handleSubmit} noValidate>
            {/* Nombres y Apellidos */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="page-nombres">
                  <User size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                  Nombres <span style={{ color: 'var(--accent)' }}>*</span>
                </label>
                <input
                  id="page-nombres"
                  name="nombres"
                  type="text"
                  className="form-input"
                  placeholder="Juan Andrés"
                  value={form.nombres}
                  onChange={handleChange}
                  required
                  disabled={submitting}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="page-apellidos">
                  Apellidos <span style={{ color: 'var(--accent)' }}>*</span>
                </label>
                <input
                  id="page-apellidos"
                  name="apellidos"
                  type="text"
                  className="form-input"
                  placeholder="García Pérez"
                  value={form.apellidos}
                  onChange={handleChange}
                  required
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label" htmlFor="page-email">
                <Mail size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                Correo Electrónico
              </label>
              <input
                id="page-email"
                name="email"
                type="email"
                className="form-input"
                placeholder="juan@ejemplo.com"
                value={form.email}
                onChange={handleChange}
                disabled={submitting}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Debe ser único por empresa. Opcional pero recomendado.
              </span>
            </div>

            {/* Teléfono */}
            <div className="form-group">
              <label className="form-label" htmlFor="page-telefono">
                <Phone size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                Teléfono / Celular
              </label>
              <input
                id="page-telefono"
                name="telefono"
                type="text"
                className="form-input"
                placeholder="+593 99 123 4567"
                value={form.telefono}
                onChange={handleChange}
                disabled={submitting}
              />
            </div>

            {/* Estado activo (solo en modo edición) */}
            {isEditMode && (
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input
                    id="page-estado"
                    name="estado_activo"
                    type="checkbox"
                    checked={form.estado_activo}
                    onChange={handleChange}
                    disabled={submitting}
                    style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }}
                  />
                  <span>
                    Cliente <strong>{form.estado_activo ? 'Activo' : 'Inactivo'}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                      Los clientes inactivos no aparecen en cotizaciones nuevas.
                    </span>
                  </span>
                </label>
              </div>
            )}

            {/* Acciones */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
              <Link to="/clientes" className="btn btn-secondary">
                Cancelar
              </Link>
              <button
                id="cliente-form-page-submit"
                type="submit"
                className="btn btn-primary"
                style={{ minWidth: '160px' }}
                disabled={submitting}
              >
                {submitting ? (
                  <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Guardando...</>
                ) : (
                  <><Save size={16} /> {isEditMode ? 'Guardar Cambios' : 'Registrar Cliente'}</>
                )}
              </button>
            </div>
          </form>
        </Card>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default ClienteForm;
