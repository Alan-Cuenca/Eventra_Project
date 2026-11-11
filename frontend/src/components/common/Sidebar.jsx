import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useBranding } from '../../context/ThemeBrandingContext';
import {
  CalendarDays,
  Users,
  Layers,
  Calculator,
  LayoutDashboard,
  CheckSquare,
  CalendarCheck,
  Package,
  Sparkles,
  Building2,
  CreditCard,
  UserCheck,
  ShieldCheck,
  FileEdit,
  BarChart3,
  Palette,
  ChevronLeft,
  ChevronRight,
  Command,
} from 'lucide-react';
import logoImg from '../../assets/logo.png';

export const Sidebar = ({ onOpenCommandPalette }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, isGerente, isTrabajador, isCliente, isSuperAdmin } = useAuth();
  const { branding } = useBranding();

  const [secondaryCollapsed, setSecondaryCollapsed] = useState(false);

  const brandLogo = branding?.logo_url ? branding.logo_url : logoImg;
  const brandName = branding?.nombre_comercial ? branding.nombre_comercial : 'EVENTRA';
  const brandTagline = branding?.portal_titulo ? branding.portal_titulo : 'Gestión Inteligente de Eventos';

  // Macro Módulos del Primary Rail
  const MACRO_MODULES = [
    {
      id: 'dashboard',
      label: 'Panel',
      icon: <LayoutDashboard size={20} />,
      basePath: '/dashboard',
      matches: ['/dashboard'],
      visible: true,
    },
    {
      id: 'eventos',
      label: 'Eventos',
      icon: <CalendarDays size={20} />,
      basePath: '/eventos',
      matches: ['/eventos', '/actividades', '/reservas', '/solicitudes'],
      visible: isAdmin || isGerente || isTrabajador || isCliente,
    },
    {
      id: 'cotizaciones',
      label: 'Cotizaciones',
      icon: <Calculator size={20} />,
      basePath: '/cotizaciones',
      matches: ['/cotizaciones', '/cotizador', '/pagos'],
      visible: isAdmin || isGerente || isCliente,
    },
    {
      id: 'crm',
      label: 'Catálogo & CRM',
      icon: <Users size={20} />,
      basePath: '/clientes',
      matches: ['/clientes', '/servicios', '/paquetes', '/proveedores'],
      visible: isAdmin || isGerente,
    },
    {
      id: 'admin',
      label: 'Ajustes',
      icon: <ShieldCheck size={20} />,
      basePath: '/reportes',
      matches: ['/reportes', '/colaboradores', '/mi-suscripcion', '/configuracion-marca'],
      visible: isAdmin || isGerente,
    },
  ];

  // Determinar macro activo según la URL
  const currentPath = location.pathname;
  const activeMacro = MACRO_MODULES.find((m) =>
    m.matches.some((match) => currentPath.startsWith(match))
  ) || MACRO_MODULES[0];

  // Elementos contextuales del Secondary Sidebar según el Macro Módulo Activo
  const contextualNavConfig = {
    dashboard: [
      {
        section: 'Vista General',
        items: [
          { to: '/dashboard', label: isCliente ? 'Mi Portal' : 'Métricas & KPIs', icon: <LayoutDashboard size={16} />, visible: true },
        ],
      },
    ],
    eventos: [
      {
        section: 'Operación de Pista',
        items: [
          { to: '/eventos', label: isCliente ? 'Mi Evento' : 'Eventos Programados', icon: <CalendarDays size={16} />, visible: isAdmin || isGerente || isTrabajador || isCliente },
          { to: '/actividades', label: isTrabajador ? 'Mis Actividades' : 'Checklist Operativo', icon: <CheckSquare size={16} />, visible: isAdmin || isGerente || isTrabajador },
          { to: '/reservas', label: 'Reservas Anti-Colisión', icon: <CalendarCheck size={16} />, visible: isAdmin || isGerente || isTrabajador || isCliente },
          { to: '/solicitudes', label: 'Solicitudes de Modificación', icon: <FileEdit size={16} />, visible: isAdmin || isGerente || isCliente },
        ],
      },
    ],
    cotizaciones: [
      {
        section: 'Área Comercial',
        items: [
          { to: '/cotizaciones', label: 'Lista de Cotizaciones', icon: <Calculator size={16} />, visible: isAdmin || isGerente || isCliente },
          { to: '/cotizador', label: 'Cotizador Dinámico', icon: <Sparkles size={16} />, visible: isAdmin || isGerente || isCliente },
          { to: '/pagos', label: 'Gestión de Pagos & Abonos', icon: <CreditCard size={16} />, visible: isAdmin || isGerente || isTrabajador },
          { to: '/pagos/procesar', label: 'Realizar Pago', icon: <CreditCard size={16} />, visible: isCliente },
        ],
      },
    ],
    crm: [
      {
        section: 'Directorio & Prestaciones',
        items: [
          { to: '/clientes', label: 'Directorio de Clientes', icon: <Users size={16} />, visible: isAdmin || isGerente },
          { to: '/servicios', label: 'Catálogo de Servicios', icon: <Layers size={16} />, visible: isAdmin || isGerente },
          { to: '/paquetes', label: 'Paquetes de Gala', icon: <Package size={16} />, visible: isAdmin || isGerente },
          { to: '/proveedores', label: 'Proveedores & Aliados', icon: <Building2 size={16} />, visible: isAdmin || isGerente },
        ],
      },
    ],
    admin: [
      {
        section: 'Gobernanza SaaS',
        items: [
          { to: '/reportes', label: 'Reportes y Analítica', icon: <BarChart3 size={16} />, visible: isAdmin || isGerente },
          { to: '/colaboradores', label: 'Equipo y Colaboradores', icon: <UserCheck size={16} />, visible: isAdmin },
          { to: '/mi-suscripcion', label: 'Mi Suscripción SaaS', icon: <ShieldCheck size={16} />, visible: isAdmin },
          { to: '/configuracion-marca', label: 'Identidad y Marca Blanca', icon: <Palette size={16} />, visible: isAdmin },
        ],
      },
    ],
  };

  const activeSecondaryGroups = contextualNavConfig[activeMacro.id] || [];

  return (
    <aside className="flex h-screen sticky top-0 z-40 shrink-0 select-none">
      
      {/* ── 1. PRIMARY RAIL (GLOBAL - w-16) ─────────────────────────────── */}
      <div className="w-16 h-full bg-[var(--ev-surface)] border-r border-[var(--ev-border)]/60 flex flex-col justify-between items-center py-4 z-20 shadow-xs">
        
        {/* Logo / Marca Reducida */}
        <div className="flex flex-col items-center gap-4">
          <div
            onClick={() => navigate('/dashboard')}
            className="w-10 h-10 rounded-[12px] bg-[var(--ev-primary)]/10 border border-[var(--ev-primary)]/30 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-[0.98] transition-transform duration-150 shadow-xs overflow-hidden"
            title={brandName}
          >
            <img
              src={brandLogo}
              alt={brandName}
              className="w-7 h-7 object-contain"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = logoImg;
              }}
            />
          </div>

          {/* Divisor sutil */}
          <div className="w-8 h-px bg-[var(--ev-border)]/50" />

          {/* Íconos de Macros de Navegación (Primary Rail) */}
          <nav className="flex flex-col items-center gap-2">
            {MACRO_MODULES.filter((m) => m.visible).map((macro) => {
              const isSelected = activeMacro.id === macro.id;
              return (
                <button
                  key={macro.id}
                  type="button"
                  onClick={() => {
                    navigate(macro.basePath);
                    setSecondaryCollapsed(false);
                  }}
                  className={`w-11 h-11 rounded-xl border-0 focus:outline-none flex items-center justify-center transition-transform duration-150 active:scale-[0.98] ${
                    isSelected
                      ? 'bg-[var(--ev-primary)]/12 text-[var(--ev-primary)] font-semibold shadow-2xs'
                      : 'text-[var(--ev-text-muted)] hover:text-[var(--ev-text-main)] hover:bg-[var(--ev-border)]/20'
                  }`}
                  title={macro.label}
                >
                  {macro.icon}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Acciones al Pie del Rail */}
        <div className="flex flex-col items-center gap-2">
          {/* Botón Atajo Command Palette (⌘K) */}
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="w-10 h-10 rounded-[12px] border-0 focus:outline-none text-[var(--ev-text-muted)] hover:text-[var(--ev-text-main)] hover:bg-[var(--ev-border)]/25 flex items-center justify-center transition-all active:scale-[0.98]"
            title="Búsqueda rápida y Comandos (⌘K)"
          >
            <Command size={18} />
          </button>
        </div>

      </div>

      {/* ── 2. SECONDARY CONTEXT SIDEBAR (LOCAL - w-60) ────────────────── */}
      <div
        className={`h-full bg-[var(--ev-bg-base)]/40 backdrop-blur-md border-r border-[var(--ev-border)]/60 flex flex-col justify-between transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          secondaryCollapsed ? 'w-0 overflow-hidden opacity-0 border-r-0' : 'w-60 opacity-100'
        }`}
      >
        {/* Cabecera del Módulo Contextual */}
        <div className="p-4 border-b border-[var(--ev-border)]/50 flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--ev-primary)] block truncate">
              {brandName}
            </span>
            <h2 className="text-sm font-bold text-[var(--ev-text-main)] truncate mt-0.5">
              {activeMacro.label}
            </h2>
          </div>
          
          <button
            type="button"
            onClick={() => setSecondaryCollapsed(true)}
            className="p-1 rounded-[8px] border-0 focus:outline-none text-[var(--ev-text-muted)] hover:text-[var(--ev-text-main)] hover:bg-[var(--ev-border)]/30 active:scale-[0.98] transition-transform"
            title="Minimizar panel secundario"
          >
            <ChevronLeft size={16} />
          </button>
        </div>

        {/* Lista de Navegación Contextual con Radios Concéntricos */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {activeSecondaryGroups.map((group, gIdx) => {
            const visibleItems = group.items.filter((i) => i.visible);
            if (!visibleItems.length) return null;
            return (
              <div key={gIdx} className="space-y-1">
                <span className="text-[10px] uppercase font-semibold tracking-wider text-[var(--ev-text-muted)] px-2 block mb-1">
                  {group.section}
                </span>
                {visibleItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-transform duration-150 active:scale-[0.98] ${
                        isActive
                          ? 'bg-[var(--ev-primary)]/12 text-[var(--ev-primary)] shadow-2xs'
                          : 'text-[var(--ev-text-muted)] hover:bg-[var(--ev-surface)] hover:text-[var(--ev-text-main)]'
                      }`
                    }
                  >
                    <span className="shrink-0">{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            );
          })}
        </div>

        {/* Footer del Secondary Sidebar */}
        <div className="p-3 border-t border-[var(--ev-border)]/50 bg-[var(--ev-surface)]/40 text-[11px] text-[var(--ev-text-muted)] flex items-center justify-between">
          <span className="truncate">SaaS Multi-tenant</span>
          <span className="px-1.5 py-0.5 rounded-full bg-[var(--ev-primary)]/10 text-[var(--ev-primary)] font-bold text-[10px]">
            v2.4
          </span>
        </div>

      </div>

      {/* Botón flotante para expandir si está colapsado */}
      {secondaryCollapsed && (
        <button
          type="button"
          onClick={() => setSecondaryCollapsed(false)}
          className="absolute left-16 top-4 z-30 p-1.5 rounded-r-[10px] bg-[var(--ev-surface)] border-0 focus:outline-none text-[var(--ev-text-muted)] hover:text-[var(--ev-text-main)] shadow-xs active:scale-[0.98]"
          title="Expandir panel contextual"
        >
          <ChevronRight size={16} />
        </button>
      )}

    </aside>
  );
};
