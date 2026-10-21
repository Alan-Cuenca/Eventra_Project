import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { SuperAdminSidebar } from '../components/super-admin/SuperAdminSidebar';
import { SuperAdminHeader } from '../components/super-admin/SuperAdminHeader';

/**
 * =============================================================================
 * SuperAdminLayout
 * =============================================================================
 * Layout estructural exclusivo para el portal del Super Administrador de EVENTRA.
 * Incluye sidebar lateral desacoplado de las vistas de empresa, encabezado
 * dedicado con branding SaaS y contenedor principal con la paleta oficial (#F3F0E4).
 * =============================================================================
 */
export const SuperAdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F3F0E4] text-[#233D49] flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Sidebar fijo */}
      <SuperAdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Contenedor principal desplazado en desktop para compensar el ancho del sidebar */}
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0 transition-all duration-300">
        {/* Encabezado */}
        <SuperAdminHeader
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        />

        {/* Cuerpo de página */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
