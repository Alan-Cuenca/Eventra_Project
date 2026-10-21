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
} from 'lucide-react';
import logoImg from '../../assets/logo.png';

/**
 * =============================================================================
 * SuperAdminSidebar
 * =============================================================================
 * Menú lateral exclusivo para el Super Administrador de EVENTRA SaaS.
 * Muestra las secciones administrativas del SaaS con estado activo únicamente
 * para el Dashboard en esta Fase 1, y estados informativos "Próximamente" para
 * los módulos de fases siguientes.
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
      {/* Overlay para móviles */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-[#233D49]/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-[#CEC8B8] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-[#CEC8B8] flex items-center gap-3">
          <img
            src={logoImg}
            alt="EVENTRA Logo"
            className="w-10 h-10 rounded-xl object-contain bg-[#F3F0E4] p-1.5 border border-[#CEC8B8]"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-[#233D49] tracking-tight text-base font-['Outfit']">
                EVENTRA
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#4D7182] text-white uppercase tracking-wider">
                SaaS
              </span>
            </div>
            <div className="text-[11px] font-medium text-[#4D7182] flex items-center gap-1 truncate">
              <ShieldCheck size={12} />
              <span>Consola Global</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {menuItems.map((group) => (
            <div key={group.group}>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#7d8f97] px-3 mb-2">
                {group.group}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  if (item.enabled) {
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={onClose}
                        className={({ isActive }) =>
                          `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                            isActive
                              ? 'bg-[#4D7182] text-white shadow-sm'
                              : 'text-[#233D49] hover:bg-[#F3F0E4] hover:text-[#4D7182]'
                          }`
                        }
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex-shrink-0">{item.icon}</span>
                          <span>{item.label}</span>
                        </div>
                      </NavLink>
                    );
                  }

                  // Ítems deshabilitados / preparados para Fase 2+
                  return (
                    <div
                      key={item.label}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-[#7d8f97] cursor-not-allowed opacity-75 hover:bg-[#F3F0E4]/50"
                      title={`${item.label} - Disponible en ${item.badge}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex-shrink-0 text-[#7d8f97]">{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-[#CEC8B8]/40 text-[#233D49] flex items-center gap-0.5">
                        <Clock size={9} />
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
        <div className="p-4 border-t border-[#CEC8B8] bg-[#F3F0E4]/40">
          <div className="flex items-center justify-between text-xs text-[#7d8f97]">
            <span className="font-semibold text-[#233D49]">Super Admin v1.0</span>
            <span className="flex items-center gap-1 text-[#4D9A72] font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#4D9A72]"></span>
              Global
            </span>
          </div>
          <p className="text-[10px] text-[#7d8f97] mt-1">
            Gestión Multiempresa de EVENTRA
          </p>
        </div>
      </aside>
    </>
  );
};

export default SuperAdminSidebar;
