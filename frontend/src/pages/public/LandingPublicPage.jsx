import React, { useEffect } from 'react';
import { NavbarPublic } from './NavbarPublic';
import { HeroPublic } from './HeroPublic';
import { BeneficiosPublic } from './BeneficiosPublic';
import { ModulosPublic } from './ModulosPublic';
import { PreciosPublic } from './PreciosPublic';
import { FooterPublic } from './FooterPublic';

export const LandingPublicPage = () => {
  useEffect(() => {
    document.title = 'EVENTRA - Plataforma SaaS de Gestión Inteligente de Eventos';
  }, []);

  return (
    <div className="min-h-screen bg-[#EEEBDD] text-[#233D49] font-sans selection:bg-[#526F7D] selection:text-white antialiased">
      {/* ── Navegación Fija Superior ────────────────────────────────────── */}
      <NavbarPublic />

      {/* ── Secciones Comerciales de la Landing ─────────────────────────── */}
      <main>
        {/* 1. Hero Asimétrico (7:5) */}
        <HeroPublic />

        {/* 2. Propuesta de Valor & Beneficios Clave */}
        <BeneficiosPublic />

        {/* 3. Módulos Operativos (Cotizador, Reservas, Cronograma, Pagos) */}
        <ModulosPublic />

        {/* 4. Tabla de Precios SaaS (Plan Básico vs Plan Premium) */}
        <PreciosPublic />
      </main>

      {/* ── Footer Corporativo ─────────────────────────────────────────── */}
      <FooterPublic />
    </div>
  );
};
