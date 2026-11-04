import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Badge } from '../common/Badge';
import {
  Menu,
  LogOut,
  ShieldCheck,
  Server,
  ChevronDown,
  Moon,
  Sun,
} from 'lucide-react';
import logoImg from '../../assets/logo.png';

/**
 * =============================================================================
 * SuperAdminHeader
 * =============================================================================
 * Barra superior unificada para la consola del Super Administrador.
 * Implementa la estética "Sofisticación Sutil", logotipo oficial de EVENTRA,
 * indicador de API y menú desplegable de perfil con switch de Modo Oscuro.
 * =============================================================================
 */
export const SuperAdminHeader = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // Cerrar menú de perfil al click fuera o tecla Escape
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

  const iniciales = user?.nombre_completo
    ? user.nombre_completo
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'SA';

  return (
    <header className="app-header">
      {/* Lado Izquierdo: Botón móvil + Logotipo Oficial de EVENTRA */}
      <div className="header-left flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="btn btn-secondary btn-icon lg:hidden"
          aria-label="Abrir menú de navegación"
        >
          <Menu size={18} />
        </button>

        <div className="flex items-center gap-2.5">
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '11px',
              background: '#FFFFFF',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-xs)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '3px',
              flexShrink: 0,
              overflow: 'hidden',
            }}
          >
            <img
              src={logoImg}
              alt="EVENTRA"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          </div>
          <div>
            <div
              style={{
                fontSize: '0.875rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                lineHeight: 1.2,
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              EVENTRA <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>| Consola Global</span>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Supervisión y Gobernanza SaaS Multi-Tenant
            </div>
          </div>
        </div>
      </div>

      {/* Lado Derecho: Estado API + Perfil con Dropdown */}
      <div className="header-actions" style={{ marginLeft: 'auto' }}>
        {/* Badge de Conexión SaaS Backend */}
        <div className="api-status-badge connected" title="API Express & Supabase Conectadas">
          <span className="status-dot online" />
          <Server size={12} style={{ display: 'inline', marginRight: '2px' }} />
          <span>SaaS Backend</span>
        </div>

        {/* Perfil de Usuario con Menú Desplegable */}
        <div style={{ position: 'relative' }} ref={profileRef}>
          <button
            id="superadmin-profile-menu-btn"
            type="button"
            className={`profile-trigger-btn ${profileOpen ? 'active' : ''}`}
            onClick={() => setProfileOpen((prev) => !prev)}
            aria-expanded={profileOpen}
            aria-haspopup="true"
            aria-label="Menú de perfil del Super Administrador"
          >
            <div className="avatar" id="superadmin-avatar" style={{ pointerEvents: 'none' }}>
              {iniciales}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  lineHeight: 1.2,
                  maxWidth: '140px',
                }}
                className="truncate"
              >
                {user?.nombre_completo || 'Super Administrador'}
              </span>
              <Badge variant="primary" style={{ fontSize: '0.6rem', padding: '0.1rem 0.45rem' }}>
                <ShieldCheck size={10} style={{ display: 'inline', marginRight: '3px' }} />
                Super_Admin
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
            <div className="profile-dropdown-panel" id="superadmin-profile-dropdown">
              {/* Encabezado con datos del usuario */}
              <div className="profile-dropdown-header">
                <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.15rem' }}>
                  {user?.nombre_completo || 'Super Administrador'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', wordBreak: 'break-all' }}>
                  {user?.email || 'superadmin@eventra.com'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Badge variant="primary" style={{ fontSize: '0.62rem', padding: '0.12rem 0.45rem' }}>
                    Super_Admin (Rol 5)
                  </Badge>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Gobernanza Global
                  </span>
                </div>
              </div>

              {/* Sección de Preferencias / Tema */}
              <div className="profile-dropdown-section">
                <button
                  type="button"
                  id="superadmin-toggle-theme-btn"
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
                  id="superadmin-logout-btn"
                  className="profile-dropdown-item danger"
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                  }}
                  title="Cerrar sesión global"
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

export default SuperAdminHeader;
