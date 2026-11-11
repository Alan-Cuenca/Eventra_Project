import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Badge } from './Badge';
import {
  Bell, LogOut, Search, User, CheckCircle2, Clock, AlertCircle, X, ChevronDown, Moon, Sun, ChevronRight, Sparkles, Command
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
    desc: 'Cliente solicita +15 comensales.',
    time: 'Hace 1 h',
    unread: true,
  },
  {
    id: 3,
    icon: <Clock size={14} />,
    color: '#4D7182',
    title: 'Evento próximo',
    desc: 'Boda Alejandra & Carlos — 24 Nov 2026.',
    time: 'Hace 3 h',
    unread: false,
  },
];

export const Navbar = ({ onOpenCommandPalette }) => {
  const location = useLocation();
  const { user, roleConfig, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [backendStatus, setBackendStatus] = useState('checking');
  const [planActivo, setPlanActivo] = useState(() => {
    return user?.plan_suscripcion || 'Basico';
  });

  useEffect(() => {
    if (user?.empresa_id) {
      api.get('/suscripciones/mi-consumo')
        .then((res) => {
          const plan = res?.data?.plan || res?.plan || user?.plan_suscripcion;
          if (plan) setPlanActivo(plan);
        })
        .catch(() => {});
    }
  }, [user?.empresa_id, user?.plan_suscripcion]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifCoords, setNotifCoords] = useState(null);
  const [profileCoords, setProfileCoords] = useState(null);
  const [unreadCount, setUnreadCount] = useState(2);
  const notifRef = useRef(null);
  const notifMenuRef = useRef(null);
  const profileRef = useRef(null);
  const profileMenuRef = useRef(null);

  const toggleProfileMenu = () => {
    if (!profileOpen && profileRef.current) {
      const rect = profileRef.current.getBoundingClientRect();
      setProfileCoords({
        top: rect.bottom + 8,
        right: Math.max(16, window.innerWidth - rect.right),
      });
      setNotifOpen(false);
    }
    setProfileOpen((prev) => !prev);
  };

  const toggleNotifMenu = () => {
    if (!notifOpen && notifRef.current) {
      const rect = notifRef.current.getBoundingClientRect();
      setNotifCoords({
        top: rect.bottom + 8,
        right: Math.max(16, window.innerWidth - rect.right),
      });
      setProfileOpen(false);
    }
    setNotifOpen((v) => !v);
    setUnreadCount(0);
  };

  useEffect(() => {
    let isMounted = true;
    api.get('/health')
      .then(() => { if (isMounted) setBackendStatus('connected'); })
      .catch(() => { if (isMounted) setBackendStatus('mock'); });
    return () => { isMounted = false; };
  }, []);

  // Cerrar notificaciones al click fuera o Escape
  useEffect(() => {
    const handler = (e) => {
      if (
        notifRef.current && !notifRef.current.contains(e.target) &&
        (!notifMenuRef.current || !notifMenuRef.current.contains(e.target))
      ) {
        setNotifOpen(false);
      }
    };
    const escHandler = (e) => {
      if (e.key === 'Escape') setNotifOpen(false);
    };
    if (notifOpen) {
      document.addEventListener('mousedown', handler);
      document.addEventListener('keydown', escHandler);
    }
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', escHandler);
    };
  }, [notifOpen]);

  // Cerrar menú de perfil al click fuera o Escape
  useEffect(() => {
    const handler = (e) => {
      if (
        profileRef.current && !profileRef.current.contains(e.target) &&
        (!profileMenuRef.current || !profileMenuRef.current.contains(e.target))
      ) {
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

  // Sincronizar coordenadas en viewport resize y scroll
  useEffect(() => {
    if (!profileOpen && !notifOpen) return;
    const updatePositions = () => {
      if (profileOpen && profileRef.current) {
        const rect = profileRef.current.getBoundingClientRect();
        setProfileCoords({
          top: rect.bottom + 8,
          right: Math.max(16, window.innerWidth - rect.right),
        });
      }
      if (notifOpen && notifRef.current) {
        const rect = notifRef.current.getBoundingClientRect();
        setNotifCoords({
          top: rect.bottom + 8,
          right: Math.max(16, window.innerWidth - rect.right),
        });
      }
    };
    window.addEventListener('resize', updatePositions);
    window.addEventListener('scroll', updatePositions, true);
    return () => {
      window.removeEventListener('resize', updatePositions);
      window.removeEventListener('scroll', updatePositions, true);
    };
  }, [profileOpen, notifOpen]);

  const initials = user?.nombre_completo
    ? user.nombre_completo.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const roleVariant = roleConfig?.badgeColor?.replace('badge-', '') || 'primary';

  // Breadcrumbs Dinámicos según la ruta
  const getBreadcrumbs = () => {
    const path = location.pathname;
    const parts = [{ label: 'EVENTRA', to: '/dashboard' }];

    if (path.startsWith('/dashboard')) {
      parts.push({ label: 'Panel Principal' });
    } else if (path.startsWith('/eventos')) {
      parts.push({ label: 'Eventos', to: '/eventos' });
      if (path.includes('/nuevo')) parts.push({ label: 'Nuevo Evento' });
      else if (path.includes('/editar')) parts.push({ label: 'Editar' });
    } else if (path.startsWith('/actividades')) {
      parts.push({ label: 'Checklist Operativo' });
    } else if (path.startsWith('/reservas')) {
      parts.push({ label: 'Reservas Anti-Colisión' });
    } else if (path.startsWith('/cotizaciones')) {
      parts.push({ label: 'Cotizaciones' });
    } else if (path.startsWith('/cotizador')) {
      parts.push({ label: 'Cotizador Dinámico' });
    } else if (path.startsWith('/pagos')) {
      parts.push({ label: 'Gestión de Pagos' });
    } else if (path.startsWith('/solicitudes')) {
      parts.push({ label: 'Solicitudes' });
    } else if (path.startsWith('/clientes')) {
      parts.push({ label: 'Directorio de Clientes' });
    } else if (path.startsWith('/servicios')) {
      parts.push({ label: 'Catálogo de Servicios' });
    } else if (path.startsWith('/paquetes')) {
      parts.push({ label: 'Paquetes de Gala' });
    } else if (path.startsWith('/proveedores')) {
      parts.push({ label: 'Proveedores' });
    } else if (path.startsWith('/reportes')) {
      parts.push({ label: 'Reportes & Analítica' });
    } else if (path.startsWith('/colaboradores')) {
      parts.push({ label: 'Equipo' });
    } else if (path.startsWith('/mi-suscripcion')) {
      parts.push({ label: 'Suscripción SaaS' });
    } else if (path.startsWith('/configuracion-marca')) {
      parts.push({ label: 'Identidad & Marca Blanca' });
    } else {
      parts.push({ label: 'Workspace' });
    }

    return parts;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="app-header h-16 sticky top-0 z-50 px-4 sm:px-6 backdrop-blur-xl backdrop-saturate-[180%] bg-[var(--ev-surface)]/80 border-0 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6),_0_10px_25px_-5px_rgba(35,61,73,0.1)] flex items-center justify-between transition-colors duration-300">
      
      {/* ── Izquierda: Breadcrumbs Dinámicos Orientados a Ruta ──────────── */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs">
        {breadcrumbs.map((crumb, idx) => {
          const isLast = idx === breadcrumbs.length - 1;
          return (
            <React.Fragment key={idx}>
              {idx > 0 && (
                <ChevronRight size={12} className="text-[var(--ev-border)]" />
              )}
              {isLast ? (
                <span className="font-bold text-[var(--ev-text-main)] truncate max-w-[200px]">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  to={crumb.to || '#'}
                  className="text-[var(--ev-text-muted)] hover:text-[var(--ev-text-main)] transition-colors truncate max-w-[140px]"
                >
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </nav>

      {/* ── Centro / Derecha: Omnibar ⌘K + Estado + Notifs + Perfil ────── */}
      <div className="flex items-center gap-3">
        
        {/* Disparador de Command Palette (⌘K) */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--ev-surface)] hover:bg-[var(--ev-surface-elevated)] border-0 text-xs text-[var(--ev-text-muted)] hover:text-[var(--ev-text-main)] shadow-2xs active:scale-[0.98] transition-all duration-150 focus:outline-none"
        >
          <Search size={13} className="text-[var(--ev-primary)]" />
          <span>Buscar o comando...</span>
          <kbd className="px-1.5 py-0.5 rounded-md bg-[var(--ev-bg-base)] text-[10px] font-mono font-semibold text-[var(--ev-text-muted)] border-0">
            ⌘K
          </kbd>
        </button>

        {/* Badge de Plan Activo */}
        <Link
          to="/mi-suscripcion"
          title="Ver consumo y detalles de mi suscripción"
          className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border-0 transition-all hover:opacity-90 active:scale-95 no-underline ${
            String(planActivo).toLowerCase().includes('premium')
              ? 'bg-[var(--ev-primary)]/12 text-[var(--ev-primary)]'
              : 'bg-[#CEC8B8]/30 text-[#233D49]'
          }`}
        >
          <Sparkles size={11} className={String(planActivo).toLowerCase().includes('premium') ? 'text-[var(--ev-primary)]' : 'text-[#8C6D32]'} />
          <span>Plan {String(planActivo).toLowerCase().includes('premium') ? 'Premium' : 'Básico'}</span>
        </Link>

        {/* Estado API Sutil */}
        <div
          className={`api-status-badge ${backendStatus === 'connected' ? 'connected' : 'offline'}`}
          title={backendStatus === 'connected' ? 'API Express & Supabase Conectadas' : 'Modo Frontend / Sin Conexión'}
        >
          <span className={`status-dot ${backendStatus === 'connected' ? 'online' : 'offline'}`} />
          <span className="hidden lg:inline">
            {backendStatus === 'connected' ? 'API Cloud' : 'Offline'}
          </span>
        </div>

        {/* Campana de Notificaciones con Badge */}
        <div className="relative" ref={notifRef}>
          <button
            id="notif-bell-btn"
            type="button"
            className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--ev-text-muted)] hover:text-[var(--ev-text-main)] hover:bg-[var(--ev-surface)] active:scale-[0.98] transition-all duration-150 relative border-0 focus:outline-none"
            onClick={toggleNotifMenu}
            aria-label="Notificaciones"
            aria-expanded={notifOpen}
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#C95C5C] ring-2 ring-[var(--ev-surface)]" />
            )}
          </button>

          {/* Panel Flotante en Liquid Glass Portal (Apple HIG) */}
          {notifOpen && notifCoords && createPortal(
            <div
              ref={notifMenuRef}
              style={{
                position: 'fixed',
                top: `${notifCoords.top}px`,
                right: `${notifCoords.right}px`,
                zIndex: 9999,
              }}
              className="liquid-glass-dropdown w-80 rounded-[20px] overflow-hidden animate-fade-in"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--ev-border)]/40 bg-[var(--ev-bg-base)]/40">
                <span className="text-xs font-bold text-[var(--ev-text-main)]">
                  Notificaciones
                </span>
                <button
                  type="button"
                  onClick={() => setNotifOpen(false)}
                  className="p-1 rounded-md text-[var(--ev-text-muted)] hover:text-[var(--ev-text-main)]"
                >
                  <X size={13} />
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-[var(--ev-border)]/30">
                {MOCK_NOTIFS.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 flex items-start gap-3 hover:bg-[var(--ev-bg-base)]/30 transition-colors ${
                      n.unread ? 'bg-[var(--ev-primary)]/5' : ''
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: `${n.color}20`, color: n.color }}
                    >
                      {n.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[var(--ev-text-main)] leading-tight">
                        {n.title}
                      </p>
                      <p className="text-[11px] text-[var(--ev-text-muted)] mt-0.5 leading-snug">
                        {n.desc}
                      </p>
                      <span className="text-[10px] text-[var(--ev-text-muted)] block mt-1 tabular-nums">
                        {n.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>,
            document.body
          )}
        </div>

        {/* Perfil de Usuario con Dropdown Portal */}
        <div className="relative" ref={profileRef}>
          <button
            id="user-profile-menu-btn"
            type="button"
            className="flex items-center gap-2.5 p-1 pl-1.5 pr-3 rounded-full hover:bg-[var(--ev-surface)] active:scale-[0.98] transition-all duration-150 border-0 focus:outline-none"
            onClick={toggleProfileMenu}
            aria-expanded={profileOpen}
            aria-haspopup="true"
          >
            <div className="w-8 h-8 rounded-full bg-[var(--ev-primary)] text-white text-xs font-bold flex items-center justify-center border-0 shadow-xs">
              {initials}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-[var(--ev-text-main)] leading-none truncate max-w-[100px]">
                {user?.nombre_completo?.split(' ')[0] || 'Usuario'}
              </span>
              <span className="text-[10px] text-[var(--ev-text-muted)] mt-0.5 font-medium">
                {roleConfig?.nombre || 'Rol'}
              </span>
            </div>
            <ChevronDown size={13} className="text-[var(--ev-text-muted)]" />
          </button>

          {/* Menú Desplegable con Portal y Liquid Glass Verdadero (Apple HIG) */}
          {profileOpen && profileCoords && createPortal(
            <div
              ref={profileMenuRef}
              id="user-profile-dropdown"
              style={{
                position: 'fixed',
                top: `${profileCoords.top}px`,
                right: `${profileCoords.right}px`,
                zIndex: 9999,
              }}
              className="liquid-glass-dropdown w-72 rounded-2xl p-2 animate-fade-in"
            >
              {/* Sección de Usuario & Empresa */}
              <div className="p-3 border-b border-[var(--ev-border)]/40 mb-1 flex flex-col gap-y-3">
                <div>
                  <p className="text-xs font-bold text-[var(--ev-text-main)] truncate">
                    {user?.nombre_completo || 'Usuario'}
                  </p>
                  <p className="text-[11px] text-[var(--ev-text-muted)] truncate mt-0.5">
                    {user?.email || 'usuario@eventra.com'}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Badge variant={roleVariant} style={{ fontSize: '0.62rem', padding: '0.12rem 0.45rem' }}>
                    {roleConfig?.nombre || 'Rol'}
                  </Badge>
                  <span className="text-[10px] text-[var(--ev-text-muted)] font-mono font-medium shrink-0">
                    Empresa #{user?.empresa_id || 1}
                  </span>
                </div>
              </div>

              {/* Toggle de Modo Claro / Oscuro */}
              <div className="px-1 py-0.5">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between p-2 rounded-xl text-xs text-[var(--ev-text-main)] hover:bg-[var(--ev-bg-base)]/50 active:scale-[0.98] transition-colors duration-150"
                >
                  <div className="flex items-center gap-2">
                    {isDark ? <Moon size={15} className="text-[var(--ev-primary)]" /> : <Sun size={15} className="text-[#C49A3A]" />}
                    <span>{isDark ? 'Modo Oscuro' : 'Modo Claro'}</span>
                  </div>
                  <span className="text-[10px] text-[var(--ev-text-muted)] font-medium">
                    {isDark ? 'Dark' : 'Light'}
                  </span>
                </button>
              </div>

              <div className="h-px bg-[var(--ev-border)]/40 my-1" />

              {/* Botón Logout */}
              <div className="px-1 py-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-xl text-xs text-[#9E3B3B] hover:bg-[#C95C5C]/10 active:scale-[0.98] font-semibold transition-colors duration-150"
                >
                  <LogOut size={15} />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            </div>,
            document.body
          )}
        </div>

      </div>

    </header>
  );
};
