/**
 * EVENTRA — ColaboradoresPage.jsx
 * Módulo de Gestión de Equipo e Invitaciones (Nivel 2 SaaS).
 * Exclusivo para Administrador de la empresa (rol_id = 1).
 * Permite listar colaboradores e invitar nuevos empleados mediante Nodemailer y JWT.
 * Diseño: "Sofisticación Sutil" (Estrictamente Light Mode).
 */

import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  ExternalLink,
  Clock,
  Send,
  Briefcase,
} from 'lucide-react';

export const ColaboradoresPage = () => {
  const { isAdmin } = useAuth();

  const [colaboradores, setColaboradores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados del modal de invitación
  const [modalOpen, setModalOpen] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: '',
    rol_id: 3, // Trabajador por defecto
  });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState(null);

  // 1. Cargar colaboradores de la empresa
  const cargarColaboradores = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/usuarios');
      if (response && response.data) {
        setColaboradores(response.data);
      }
    } catch (err) {
      console.error('[ColaboradoresPage] Error al cargar equipo:', err);
      setError(err.message || 'No se pudo cargar la lista de colaboradores.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarColaboradores();
  }, []);

  // 2. Manejo de envío de invitación por correo
  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess(null);
    setInviteLoading(true);

    try {
      // POST /api/auth/invitar
      const response = await api.post('/auth/invitar', {
        email: inviteData.email.trim().toLowerCase(),
        rol_id: Number(inviteData.rol_id),
      });

      setInviteSuccess({
        message: response.message || '¡Invitación enviada exitosamente por correo!',
        email: inviteData.email,
        previewUrl: response.data?.preview_url,
        enlaceRegistro: response.data?.enlace_registro,
      });

      // Limpiar formulario y recargar listado
      setInviteData({ email: '', rol_id: 3 });
      cargarColaboradores();
    } catch (err) {
      console.error('[ColaboradoresPage] Error en invitarUsuario:', err);
      setInviteError(
        err.message ||
        'Ocurrió un error al enviar la invitación. Verifica los datos e intenta nuevamente.'
      );
    } finally {
      setInviteLoading(false);
    }
  };

  // Mapeo visual de roles
  const getRolBadge = (rolNombre, rolId) => {
    const id = Number(rolId);
    if (id === 1) {
      return {
        bg: '#ECE7D5',
        color: '#233D49',
        label: 'Administrador',
      };
    }
    if (id === 2) {
      return {
        bg: '#FDF3D8',
        color: '#B5882D',
        label: 'Gerente',
      };
    }
    return {
      bg: '#EAF0F3',
      color: '#4D7182',
      label: 'Trabajador',
    };
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '8px 4px' }}>
      {/* ── Encabezado ────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: '800',
              color: '#233D49',
              margin: '0 0 6px',
            }}
          >
            Equipo y Colaboradores
          </h1>
          <p style={{ color: '#4D7182', fontSize: '14px', margin: 0 }}>
            Administra los miembros de tu empresa e invita nuevo personal de forma segura por correo electrónico.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              setInviteError('');
              setInviteSuccess(null);
              setModalOpen(true);
            }}
            style={{
              backgroundColor: '#4D7182',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 18px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 8px rgba(77, 113, 130, 0.25)',
              transition: 'background-color 0.2s',
            }}
          >
            <UserPlus size={18} /> Invitar Colaborador
          </button>
        )}
      </div>

      {/* ── Toast / Notificación Global de Éxito al Invitar ────────────────── */}
      {inviteSuccess && !modalOpen && (
        <div
          style={{
            backgroundColor: '#E8F5EE',
            border: '1px solid #C4E6D2',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', gap: '12px' }}>
            <CheckCircle2 size={22} style={{ color: '#4D9A72', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ color: '#233D49', fontSize: '14px' }}>
                Invitación despachada a {inviteSuccess.email}
              </strong>
              <p style={{ color: '#4D7182', fontSize: '13px', margin: '4px 0 0' }}>
                Se ha enviado un correo con un enlace criptográfico válido por 48 horas para que el colaborador active su cuenta.
              </p>
              {inviteSuccess.previewUrl && (
                <a
                  href={inviteSuccess.previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: '#4D7182',
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginTop: '6px',
                  }}
                >
                  <ExternalLink size={13} /> Ver vista previa del correo de prueba (Ethereal)
                </a>
              )}
            </div>
          </div>
          <button
            onClick={() => setInviteSuccess(null)}
            style={{ background: 'none', border: 'none', color: '#7E919C', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* ── Alerta de Error ───────────────────────────────────────────────── */}
      {error && (
        <div
          style={{
            backgroundColor: '#FDF2F2',
            border: '1px solid #F8D7D7',
            borderRadius: '10px',
            padding: '14px 18px',
            color: '#C95C5C',
            fontSize: '14px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* ── Métricas Resumen del Equipo ────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #ECE7D5',
            boxShadow: '0 2px 8px rgba(35, 61, 73, 0.04)',
          }}
        >
          <div style={{ color: '#4D7182', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
            Total Colaboradores
          </div>
          <div style={{ color: '#233D49', fontSize: '26px', fontWeight: '800' }}>
            {colaboradores.length}
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #ECE7D5',
            boxShadow: '0 2px 8px rgba(35, 61, 73, 0.04)',
          }}
        >
          <div style={{ color: '#4D7182', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
            Gerentes de Operación
          </div>
          <div style={{ color: '#233D49', fontSize: '26px', fontWeight: '800' }}>
            {colaboradores.filter((u) => Number(u.rol_id) === 2).length}
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #ECE7D5',
            boxShadow: '0 2px 8px rgba(35, 61, 73, 0.04)',
          }}
        >
          <div style={{ color: '#4D7182', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
            Personal Operativo
          </div>
          <div style={{ color: '#233D49', fontSize: '26px', fontWeight: '800' }}>
            {colaboradores.filter((u) => Number(u.rol_id) === 3).length}
          </div>
        </div>
      </div>

      {/* ── Tabla de Colaboradores ────────────────────────────────────────── */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #ECE7D5',
          boxShadow: '0 4px 16px rgba(35, 61, 73, 0.04)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #ECE7D5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: '15px', fontWeight: '700', color: '#233D49' }}>
            Personal Registrado en la Empresa
          </div>
          <button
            onClick={cargarColaboradores}
            disabled={loading}
            style={{
              background: 'none',
              border: 'none',
              color: '#4D7182',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Actualizar
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: '#4D7182' }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
            <p style={{ margin: 0, fontSize: '14px' }}>Cargando equipo de trabajo...</p>
          </div>
        ) : colaboradores.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: '#4D7182' }}>
            <Users size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <h3 style={{ margin: '0 0 6px', color: '#233D49', fontSize: '16px' }}>
              No hay colaboradores registrados
            </h3>
            <p style={{ margin: 0, fontSize: '13px' }}>
              Usa el botón "Invitar Colaborador" para enviar el primer acceso a tu equipo.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: '#FBF9F4', borderBottom: '1px solid #ECE7D5', color: '#4D7182', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '14px 24px' }}>Colaborador</th>
                  <th style={{ padding: '14px 20px' }}>Rol en la Empresa</th>
                  <th style={{ padding: '14px 20px' }}>Estado</th>
                  <th style={{ padding: '14px 24px' }}>Fecha de Ingreso</th>
                </tr>
              </thead>
              <tbody>
                {colaboradores.map((colab) => {
                  const badge = getRolBadge(colab.rol_nombre, colab.rol_id);
                  return (
                    <tr
                      key={colab.id}
                      style={{
                        borderBottom: '1px solid #F3F0E4',
                        transition: 'background-color 0.15s',
                      }}
                    >
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ fontWeight: '600', color: '#233D49' }}>
                          {colab.nombre_completo || colab.nombre}
                        </div>
                        <div style={{ fontSize: '13px', color: '#7E919C', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                          <Mail size={13} /> {colab.email}
                        </div>
                      </td>

                      <td style={{ padding: '16px 20px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '700',
                            backgroundColor: badge.bg,
                            color: badge.color,
                          }}
                        >
                          {badge.label}
                        </span>
                      </td>

                      <td style={{ padding: '16px 20px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            backgroundColor: colab.estado_activo ? '#E8F5EE' : '#FDF2F2',
                            color: colab.estado_activo ? '#4D9A72' : '#C95C5C',
                          }}
                        >
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: colab.estado_activo ? '#4D9A72' : '#C95C5C',
                            }}
                          />
                          {colab.estado_activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>

                      <td style={{ padding: '16px 24px', color: '#4D7182', fontSize: '13px' }}>
                        {colab.fecha_creacion
                          ? new Date(colab.fecha_creacion).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal: Invitar Colaborador (Exclusivo Administrador) ───────────── */}
      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(35, 61, 73, 0.45)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 1000,
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '460px',
              width: '100%',
              boxShadow: '0 8px 32px rgba(35, 61, 73, 0.15)',
              position: 'relative',
              boxSizing: 'border-box',
              maxHeight: 'calc(100vh - 3.5rem)',
              overflowY: 'auto',
              margin: 'auto',
            }}
          >
            {/* Botón cerrar */}
            <button
              onClick={() => setModalOpen(false)}
              style={{
                position: 'absolute',
                right: '20px',
                top: '20px',
                background: 'none',
                border: 'none',
                color: '#7E919C',
                cursor: 'pointer',
              }}
            >
              <X size={20} />
            </button>

            <div style={{ textAlign: 'left', marginBottom: '20px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  backgroundColor: '#ECE7D5',
                  color: '#4D7182',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '14px',
                }}
              >
                <Send size={22} />
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#233D49', margin: '0 0 4px' }}>
                Invitar Colaborador
              </h2>
              <p style={{ color: '#4D7182', fontSize: '13px', margin: 0 }}>
                El usuario recibirá un correo con un enlace criptográfico válido por 48 horas para activar su cuenta.
              </p>
            </div>

            {/* Error dentro del modal */}
            {inviteError && (
              <div
                style={{
                  backgroundColor: '#FDF2F2',
                  border: '1px solid #F8D7D7',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: '#C95C5C',
                  fontSize: '13px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{inviteError}</span>
              </div>
            )}

            <form onSubmit={handleInviteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Correo Electrónico */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#233D49', marginBottom: '6px' }}>
                  Correo Electrónico del Colaborador *
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#7E919C' }} />
                  <input
                    type="email"
                    required
                    value={inviteData.email}
                    onChange={(e) => setInviteData((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="colaborador@empresa.com"
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 40px',
                      borderRadius: '8px',
                      border: '1px solid #CEC8B8',
                      fontSize: '14px',
                      color: '#233D49',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Selector de Rol Permitido (Gerente o Trabajador únicamente) */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#233D49', marginBottom: '6px' }}>
                  Rol a Asignar *
                </label>
                <div style={{ position: 'relative' }}>
                  <Briefcase size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#7E919C' }} />
                  <select
                    value={inviteData.rol_id}
                    onChange={(e) => setInviteData((prev) => ({ ...prev, rol_id: parseInt(e.target.value, 10) }))}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 40px',
                      borderRadius: '8px',
                      border: '1px solid #CEC8B8',
                      fontSize: '14px',
                      color: '#233D49',
                      outline: 'none',
                      boxSizing: 'border-box',
                      backgroundColor: '#FFFFFF',
                    }}
                  >
                    <option value={3}>Trabajador (Personal operativo de eventos)</option>
                    <option value={2}>Gerente (Gestión de eventos y reportes)</option>
                  </select>
                </div>
                <div style={{ fontSize: '11px', color: '#7E919C', marginTop: '6px' }}>
                  * Por seguridad SaaS, no se permite invitar usuarios con privilegios de Administrador ni Clientes.
                </div>
              </div>

              {/* Botón de Enviar */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{
                    flex: 1,
                    backgroundColor: '#F3F0E4',
                    color: '#233D49',
                    border: 'none',
                    padding: '11px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  style={{
                    flex: 2,
                    backgroundColor: '#4D7182',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '11px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: inviteLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  {inviteLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Enviando...
                    </>
                  ) : (
                    <>
                      <Send size={16} /> Enviar Invitación
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
