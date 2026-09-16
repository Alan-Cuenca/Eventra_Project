import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  CalendarDays,
  Users,
  Layers,
  Calculator,
  LayoutDashboard,
  Building2,
  CheckSquare,
  FileCheck2,
} from 'lucide-react';
import logoImg from '../../assets/logo.png';

export const Sidebar = () => {
  const { roleId, isAdmin, isGerente, isTrabajador, isCliente } = useAuth();

  // Enlaces según los requerimientos del Project Charter y Planificación Scrum
  const navItems = [
    {
      to: '/dashboard',
      label: 'Panel Principal',
      icon: <LayoutDashboard size={19} />,
      visible: true,
    },
    {
      to: '/eventos',
      label: isTrabajador ? 'Mis Actividades' : isCliente ? 'Mi Evento' : 'Eventos & Reservas',
      icon: isTrabajador ? <CheckSquare size={19} /> : <CalendarDays size={19} />,
      visible: true,
    },
    {
      to: '/cotizador',
      label: 'Cotizador Dinámico',
      icon: <Calculator size={19} />,
      visible: isAdmin || isGerente || isCliente,
    },
    {
      to: '/servicios',
      label: 'Servicios & Paquetes',
      icon: <Layers size={19} />,
      visible: true,
    },
    {
      to: '/clientes',
      label: 'Directorio de Clientes',
      icon: <Users size={19} />,
      visible: isAdmin || isGerente,
    },
  ];

  return (
    <aside
      style={{
        width: '270px',
        backgroundColor: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.25rem 1rem',
        flexShrink: 0,
      }}
    >
      {/* Brand / Logo Oficial EVENTRA */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
          padding: '0.5rem 0.5rem 1.5rem 0.5rem',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <img
          src={logoImg}
          alt="EVENTRA Logo"
          style={{
            width: '46px',
            height: '46px',
            objectFit: 'contain',
            borderRadius: '50%',
            boxShadow: '0 4px 12px var(--shadow-sm)',
            background: '#FAF8F5',
            padding: '2px',
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h2
            style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              letterSpacing: '0.04em',
              color: 'var(--text-primary)',
              lineHeight: 1.1,
            }}
          >
            EVENTRA
          </h2>
          <span
            style={{
              fontSize: '0.62rem',
              color: 'var(--accent)',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginTop: '0.2rem',
            }}
          >
            Gestión Inteligente de Eventos
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
        <span
          style={{
            fontSize: '0.68rem',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            fontWeight: 700,
            letterSpacing: '0.08em',
            paddingLeft: '0.75rem',
            marginBottom: '0.35rem',
          }}
        >
          Navegación
        </span>

        {navItems
          .filter((item) => item.visible)
          .map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                fontSize: '0.88rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--ivory-pure)' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'rgba(69, 102, 119, 0.35)' : 'transparent',
                borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
                transition: 'all 0.15s ease',
              })}
            >
              <span style={{ display: 'flex', color: 'inherit' }}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
      </nav>

      {/* Footer Info con Trazabilidad Scrum */}
      <div
        style={{
          padding: '0.85rem',
          borderRadius: '10px',
          background: 'rgba(23, 36, 46, 0.6)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
        }}
      >
        <div style={{ fontWeight: 600, color: 'var(--accent)', marginBottom: '0.2rem' }}>
          EVENTRA SaaS MVP
        </div>
        <div style={{ fontSize: '0.7rem' }}>Fase 3: Construcción Ágil</div>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
          UTA - Software 7mo "A"
        </div>
      </div>
    </aside>
  );
};
