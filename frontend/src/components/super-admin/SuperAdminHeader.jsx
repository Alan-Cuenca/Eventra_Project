import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../common/ThemeToggle';
import {
  Menu,
  LogOut,
  ShieldAlert,
  ShieldCheck,
  Server,
} from 'lucide-react';

/**
 * =============================================================================
 * SuperAdminHeader
 * =============================================================================
 * Barra superior exclusiva para la consola del Super Administrador.
 * Presenta el identificador global, datos del usuario activo, estado de API y
 * botón directo de cierre de sesión.
 * =============================================================================
 */
export const SuperAdminHeader = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();

  const iniciales = user?.nombre_completo
    ? user.nombre_completo
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'SA';

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-[#CEC8B8] px-4 lg:px-8 flex items-center justify-between">
      {/* Botón hamburguesa (móvil) + Título contextual */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-[#233D49] hover:bg-[#F3F0E4] lg:hidden transition-colors"
          aria-label="Abrir menú de navegación"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#4D7182]/10 text-[#4D7182] flex items-center justify-center font-bold text-sm">
            <ShieldAlert size={18} />
          </div>
          <div>
            <h1 className="text-sm lg:text-base font-bold text-[#233D49] leading-tight font-['Outfit']">
              EVENTRA <span className="font-normal text-[#7d8f97]">| Consola Global SaaS</span>
            </h1>
            <p className="text-[11px] text-[#4D7182] font-medium hidden sm:block">
              Supervisión de inquilinos y gobernanza de plataforma
            </p>
          </div>
        </div>
      </div>

      {/* Acciones del encabezado */}
      <div className="flex items-center gap-3 lg:gap-4">
        {/* Badge de Entorno / Conexión */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#4D9A72]/15 text-[#4D9A72] text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-[#4D9A72] animate-pulse"></span>
          <Server size={12} />
          <span>SaaS Backend</span>
        </div>

        {/* Toggle Claro / Oscuro */}
        <ThemeToggle />

        {/* Perfil del Super Administrador */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-[#CEC8B8]">
          <div
            className="w-9 h-9 rounded-xl bg-[#4D7182] text-white flex items-center justify-center font-bold text-xs shadow-sm"
            title={user?.email || 'Super Administrador'}
          >
            {iniciales}
          </div>

          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-bold text-[#233D49] leading-tight truncate max-w-[140px]">
              {user?.nombre_completo || 'Super Administrador'}
            </span>
            <span className="text-[10px] font-semibold text-[#4D7182] flex items-center gap-0.5">
              <ShieldCheck size={10} />
              Super_Admin
            </span>
          </div>

          {/* Botón Logout */}
          <button
            onClick={logout}
            className="p-2 rounded-xl text-[#C95C5C] hover:bg-[#C95C5C]/10 transition-colors flex items-center gap-1.5 text-xs font-semibold ml-1"
            title="Cerrar sesión global"
            aria-label="Cerrar sesión global"
          >
            <LogOut size={16} />
            <span className="hidden md:inline">Salir</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default SuperAdminHeader;
