import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export const PublicLayout = () => {
  const { pathname } = useLocation();

  // Desplazamiento automático al inicio de página al cambiar de ruta
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-[#EEEBDD] text-[#233D49] font-sans selection:bg-[#526F7D] selection:text-white antialiased">
      {/* ── Navbar Superior Fijo ────────────────────────────────────────── */}
      <Navbar />

      {/* ── Contenido de la Ruta Hija ───────────────────────────────────── */}
      <main className="flex-1 pt-20">
        <Outlet />
      </main>

      {/* ── Footer Corporativo ─────────────────────────────────────────── */}
      <Footer />
    </div>
  );
};
