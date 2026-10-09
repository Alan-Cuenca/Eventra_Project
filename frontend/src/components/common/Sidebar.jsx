import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
} from 'lucide-react';
import logoImg from '../../assets/logo.png';

export const Sidebar = () => {
  const { roleId, isAdmin, isGerente, isTrabajador, isCliente } = useAuth();

  const navGroups = [
    {
      label: 'Principal',
      items: [
        {
          to: '/dashboard',
          label: isCliente ? 'Mi Portal' : 'Panel Principal',
          icon: <LayoutDashboard size={18} />,
          visible: true,
        },
      ],
    },
    {
      label: 'Gestión de Eventos',
      items: [
        {
          to: '/eventos',
          label: isCliente ? 'Mi Evento' : 'Eventos',
          icon: <CalendarDays size={18} />,
          visible: isAdmin || isGerente || isCliente,
        },
        {
          to: '/actividades',
          label: isTrabajador ? 'Mis Actividades' : 'Checklist Operativo',
          icon: <CheckSquare size={18} />,
          visible: isAdmin || isGerente || isTrabajador,
        },
        {
          to: '/reservas',
          label: 'Reservas',
          icon: <CalendarCheck size={18} />,
          visible: isAdmin || isGerente || isTrabajador || isCliente,
        },
        {
          to: '/cotizaciones',
          label: 'Cotizaciones',
          icon: <Calculator size={18} />,
          visible: isAdmin || isGerente || isCliente,
        },
        {
          to: '/cotizador',
          label: 'Cotizador Dinámico',
          icon: <Sparkles size={18} />,
          visible: isAdmin || isGerente || isCliente,
        },
        {
          to: '/pagos',
          label: 'Gestión de Pagos',
          icon: <CreditCard size={18} />,
          visible: isAdmin || isGerente || isTrabajador,
        },
        {
          to: '/pagos/procesar',
          label: 'Realizar Pago',
          icon: <CreditCard size={18} />,
          visible: isCliente,
        },
      ],
    },
    {
      label: 'Catálogo & CRM',
      items: [
        {
          to: '/servicios',
          label: 'Servicios',
          icon: <Layers size={18} />,
          visible: isAdmin || isGerente,
        },
        {
          to: '/paquetes',
          label: 'Paquetes',
          icon: <Package size={18} />,
          visible: isAdmin || isGerente,
        },
        {
          to: '/clientes',
          label: 'Directorio de Clientes',
          icon: <Users size={18} />,
          visible: isAdmin || isGerente,
        },
        {
          to: '/proveedores',
          label: 'Proveedores',
          icon: <Building2 size={18} />,
          visible: isAdmin || isGerente,
        },
      ],
    },
  ];

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <img src={logoImg} alt="EVENTRA Logo" className="sidebar-logo" />
        <div>
          <div className="sidebar-brand-name">EVENTRA</div>
          <div className="sidebar-brand-tagline">Gestión Inteligente de Eventos</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((item) => item.visible);
          if (!visibleItems.length) return null;
          return (
            <div key={group.label}>
              <div className="sidebar-section-label">{group.label}</div>
              {visibleItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `sidebar-link ${isActive ? 'active' : ''}`
                  }
                >
                  <span className="link-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div
          style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            color: 'var(--primary)',
            marginBottom: '0.15rem',
          }}
        >
          EVENTRA
        </div>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
          Sistema de Gestión de Eventos
        </div>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
          Plataforma Protegida
        </div>
      </div>
    </aside>
  );
};
