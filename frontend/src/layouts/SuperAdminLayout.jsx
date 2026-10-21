import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { SuperAdminSidebar } from '../components/super-admin/SuperAdminSidebar';
import { SuperAdminHeader } from '../components/super-admin/SuperAdminHeader';

/**
 * =============================================================================
 * SuperAdminLayout
 * =============================================================================
 * Layout estructural para el portal del Super Administrador de EVENTRA SaaS.
 * Unificado con la arquitectura de diseño del SaaS (.app-container, .main-content,
 * .page-body) con soporte completo para Light Mode y Dark Mode nativo.
 * =============================================================================
 */
export const SuperAdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-container">
      {/* Sidebar de Super Admin */}
      <SuperAdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Contenedor principal */}
      <div className="main-content">
        {/* Encabezado unificado con Navbar y Perfil */}
        <SuperAdminHeader
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        />

        {/* Cuerpo de página con espaciado y ancho estándar */}
        <main className="page-body animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
