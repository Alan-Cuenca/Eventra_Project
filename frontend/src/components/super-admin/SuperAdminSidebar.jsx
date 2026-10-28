import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  UserCheck,
  Users2,
  FileText,
  Settings,
  ShieldCheck,
  Clock,
  CreditCard,
} from 'lucide-react';
import logoImg from '../../assets/logo.png';

/**
 * =============================================================================
 * SuperAdminSidebar
 * =============================================================================
 * Menú lateral exclusivo para el Super Administrador de EVENTRA SaaS.
 * Estandarizado con la arquitectura oficial .sidebar, .sidebar-nav, .sidebar-link
 * para consistencia visual idéntica a los demás roles del sistema.
 * =============================================================================
 */
export const SuperAdminSidebar = ({ isOpen, onClose }) => {
  const menuItems = [
    {
      group: 'Supervisión Global',
      items: [
        {
          to: '/super-admin/dashboard',
          label: 'Dashboard Global',
          icon: <LayoutDashboard size={18} />,
          enabled: true,
        },
      ],
    },
    {
      group: 'Gestión Multi-Tenant',
      items: [
        {
          to: '/super-admin/empresas',
          label: 'Empresas (Tenants)',
          icon: <Building2 size={18} />,
          enabled: true,
        },
        {
          to: '/super-admin/facturacion',
          label: 'Facturación SaaS',
          icon: <CreditCard size={18} />,
          enabled: true,
        },
        {
          to: '/super-admin/solicitudes',
          label: 'Solicitudes de Ingreso',
          icon: <UserCheck size={18} />,
          enabled: false,
          badge: 'Próximamente',
        },
        {
          to: '/super-admin/administradores',
          label: 'Administradores Tenant',
          icon: <Users2 size={18} />,
          enabled: false,
          badge: 'Próximamente',
        },
      ],
    },
    {
      group: 'Gobernanza & Sistema',
      items: [
        {
          to: '/super-admin/auditoria',
          label: 'Auditoría y Logs',
          icon: <FileText size={18} />,
          enabled: false,
          badge: 'Próximamente',
        },
        {
          to: '/super-admin/configuracion',
          label: 'Configuración SaaS',
          icon: <Settings size={18} />,
          enabled: false,
          badge: 'Próximamente',
        },
      ],
    },
  ];

  return (
    <>
      {/* Overlay para dispositivos móviles */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 900,
            background: 'rgba(35, 61, 73, 0.45)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-brand">
          <img
            src={logoImg}
            alt="EVENTRA Logo"
            className="sidebar-logo"
          />
          <div className="min-w-0">
            <div className="sidebar-brand-name">
              EVENTRA
            </div>
            <div className="sidebar-brand-tagline">
              Consola Global SaaS
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {menuItems.map((group) => (
            <div key={group.group}>
              <div className="sidebar-section-label">{group.group}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {group.items.map((item) => {
                  if (item.enabled) {
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={onClose}
                        className={({ isActive }) =>
                          `sidebar-link ${isActive ? 'active' : ''}`
                        }
                      >
                        <span className="link-icon">{item.icon}</span>
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  }

                  // Ítems deshabilitados / preparados para Fase 2+
                  return (
                    <div
                      key={item.label}
                      className="sidebar-link"
                      style={{ opacity: 0.55, cursor: 'not-allowed' }}
                      title={`${item.label} - Disponible en ${item.badge}`}
                    >
                      <span className="link-icon" style={{ opacity: 0.7 }}>{item.icon}</span>
                      <span style={{ flex: 1 }}>{item.label}</span>
                      <span
                        style={{
                          fontSize: '0.62rem',
                          fontWeight: 700,
                          padding: '0.1rem 0.4rem',
                          borderRadius: '9999px',
                          background: 'var(--cream)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-muted)',
                        }}
                      >
                        {item.badge}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              color: 'var(--primary)',
              marginBottom: '0.15rem',
            }}
          >
            SUPER ADMINISTRADOR
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            Gobernanza Multi-Tenant
          </div>
          <div
            style={{
              fontSize: '0.65rem',
              color: 'var(--success)',
              marginTop: '0.2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontWeight: 600,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--success)',
                display: 'inline-block',
              }}
            />
            Consola Activa
          </div>
        </div>
      </aside>
    </>
  );
};

export default SuperAdminSidebar;
