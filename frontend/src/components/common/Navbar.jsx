import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Badge } from './Badge';
import {
  Bell, LogOut, Search, User, CheckCircle2, Clock, AlertCircle, X, ChevronDown, Moon, Sun,
} from 'lucide-react';
import { api } from '../../services/api';

const MOCK_NOTIFS = [
  {
    id: 1,
    icon: <CheckCircle2 size={14} />,
    color: '#4D9A72',
    title: 'Cotización aprobada',
    desc: 'Mis XV Años — Valentina fue confirmada.',
    time: 'Hace 5 min',
    unread: true,
  },
  {
    id: 2,
    icon: <AlertCircle size={14} />,
    color: '#C49A3A',
    title: 'Solicitud de modificación',
    desc: 'Pablo Vayas solicita +15 comensales.',
    time: 'Hace 1 h',
    unread: true,
  },
  {
    id: 3,
    icon: <Clock size={14} />,
    color: '#4D7182',
    title: 'Evento próximo',
    desc: 'Boda Alejandra & Carlos — 24 Oct 2026.',
    time: 'Hace 3 h',
    unread: false,
  },
];

export const Navbar = () => {
  const { user, roleConfig, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [backendStatus, setBackendStatus] = useState('checking');
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(2);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    api.get('/health')
      .then(() => { if (isMounted) setBackendStatus('connected'); })
      .catch(() => { if (isMounted) setBackendStatus('mock'); });
    return () => { isMounted = false; };
  }, []);

  // Cerrar panel al click fuera
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    if (notifOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notifOpen]);

  // Cerrar menú de perfil al click fuera o Escape
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    const escHandler = (e) => {
      if (e.key === 'Escape') setProfileOpen(false);
    };
    if (profileOpen) {
      document.addEventListener('mousedown', handler);
      document.addEventListener('keydown', escHandler);
    }
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', escHandler);
    };
  }, [profileOpen]);

  const initials = user?.nombre_completo
    ? user.nombre_completo.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const roleVariant =
    roleConfig?.badgeColor?.replace('badge-', '') || 'primary';

  return (
    <header className="app-header">
      {/* Lado Izquierdo (Espaciador / Contexto) */}
      <div className="header-left flex items-center gap-2" />

      {/* Acciones y Perfil Alineados a la Derecha */}
      <div className="header-actions" style={{ marginLeft: 'auto' }}>
        {/* Estado API Sutil */}
        <div
          className={`api-status-badge ${
            backendStatus === 'connected' ? 'connected' : 'offline'
          }`}
          title={backendStatus === 'connected' ? 'API Express & Supabase Conectadas' : 'Modo Frontend / Sin Conexión'}
        >
          <span
            className={`status-dot ${
              backendStatus === 'connected' ? 'online' : 'offline'
            }`}
          />
          {backendStatus === 'connected'
            ? 'API Conectada'
            : 'Sin Conexión'}
        </div>

        {/* Campana de notificaciones */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            id="notif-bell-btn"
            className="btn btn-secondary btn-icon"
            style={{ position: 'relative' }}
            onClick={() => { setNotifOpen(v => !v); setUnreadCount(0); }}
            aria-label="Notificaciones"
            aria-expanded={notifOpen}
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: 'var(--danger)',
                  color: '#fff',
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1.5px solid var(--white)',
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {/* Panel de notificaciones */}
          {notifOpen && (
            <div className="notif-panel" id="notif-panel">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.875rem 1.25rem',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                  Notificaciones
                </span>
                <button
                  className="btn btn-ghost btn-sm btn-icon"
                  onClick={() => setNotifOpen(false)}
                  aria-label="Cerrar"
                >
                  <X size={14} />
                </button>
              </div>
              {MOCK_NOTIFS.map((n) => (
                <div key={n.id} className="notif-item">
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: `${n.color}18`,
                      color: n.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {n.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: n.unread ? 700 : 500,
                        color: 'var(--text-primary)',
                        marginBottom: '0.15rem',
                      }}
                    >
                      {n.title}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      {n.desc}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {n.time}
                    </div>
                  </div>
                  {n.unread && <div className="notif-dot" />}
                </div>
              ))}
              <div
                style={{
                  padding: '0.625rem',
                  textAlign: 'center',
                  borderTop: '1px solid var(--border-subtle)',
                }}
              >
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ width: '100%', fontSize: '0.78rem' }}
                >
                  Ver todas las notificaciones
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Perfil de Usuario con Menú Desplegable */}
        <div style={{ position: 'relative' }} ref={profileRef}>
          <button
            id="user-profile-menu-btn"
            type="button"
            className={`profile-trigger-btn ${profileOpen ? 'active' : ''}`}
            onClick={() => setProfileOpen((prev) => !prev)}
            aria-expanded={profileOpen}
            aria-haspopup="true"
            aria-label="Menú de perfil de usuario"
          >
            <div className="avatar" id="user-avatar" style={{ pointerEvents: 'none' }}>
              {initials}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
              <span
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  lineHeight: 1.2,
                }}
              >
                {user?.nombre_completo?.split(' ')[0] || 'Usuario'}
              </span>
              <Badge variant={roleVariant} style={{ fontSize: '0.6rem', padding: '0.1rem 0.45rem' }}>
                {roleConfig?.nombre || 'Rol'}
              </Badge>
            </div>
            <ChevronDown
              size={14}
              style={{
                color: 'var(--text-muted)',
                transition: 'transform 0.2s ease',
                transform: profileOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                marginLeft: '0.1rem',
              }}
            />
          </button>

          {/* Menú Desplegable del Perfil */}
          {profileOpen && (
            <div className="profile-dropdown-panel" id="user-profile-dropdown">
              {/* Encabezado con datos del usuario */}
              <div className="profile-dropdown-header">
                <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.15rem' }}>
                  {user?.nombre_completo || 'Usuario'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', wordBreak: 'break-all' }}>
                  {user?.email || 'usuario@eventra.com'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Badge variant={roleVariant} style={{ fontSize: '0.62rem', padding: '0.12rem 0.45rem' }}>
                    {roleConfig?.nombre || 'Rol'}
                  </Badge>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Empresa #{user?.empresa_id || 1}
                  </span>
                </div>
              </div>

              {/* Sección de Preferencias / Tema */}
              <div className="profile-dropdown-section">
                <button
                  type="button"
                  id="profile-toggle-theme-btn"
                  className="profile-dropdown-item"
                  onClick={toggleTheme}
                  title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    {isDark ? (
                      <Moon size={16} color="var(--primary)" />
                    ) : (
                      <Sun size={16} color="var(--warning)" />
                    )}
                    <span>{isDark ? 'Modo Oscuro' : 'Modo Claro'}</span>
                  </div>

                  {/* Switch iOS/SaaS estilizado */}
                  <div className={`theme-switch-track ${isDark ? 'active' : ''}`} aria-hidden="true">
                    <div className={`theme-switch-thumb ${isDark ? 'active' : ''}`}>
                      {isDark ? (
                        <Moon size={11} color="#6594AA" />
                      ) : (
                        <Sun size={11} color="#C49A3A" />
                      )}
                    </div>
                  </div>
                </button>
              </div>

              <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '0 0.5rem' }} />

              {/* Sección de Salir / Logout */}
              <div className="profile-dropdown-section">
                <button
                  type="button"
                  id="logout-btn"
                  className="profile-dropdown-item danger"
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                  }}
                  title="Cerrar sesión"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <LogOut size={16} />
                    <span>Cerrar sesión</span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
