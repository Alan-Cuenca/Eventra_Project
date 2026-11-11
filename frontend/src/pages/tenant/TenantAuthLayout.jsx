import React from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Sparkles } from 'lucide-react';

/**
 * Función auxiliar para obtener las iniciales de la empresa cuando no hay logotipo
 */
const getInitials = (name) => {
  if (!name) return 'EV';
  return name
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

/**
 * =============================================================================
 * TenantAuthLayout (Envoltura de Pantalla Dividida / Split-Screen)
 * =============================================================================
 * Estructura de pantalla completa compartida entre LoginTenant y RegistroTenant.
 * - Lado Izquierdo (50% escritorio, oculto en móvil): Presentación dinámica
 *   con logotipo, H1 impactante, descripción y marca de agua sutil de EVENTRA.
 * - Lado Derecho (100% móvil, 50% escritorio): Formulario limpio sobre fondo blanco
 *   con botón de retorno a /portal/:slug y acciones estilizadas con la paleta activa.
 * =============================================================================
 */
export const TenantAuthLayout = ({ title, subtitle, children }) => {
  const context = useOutletContext() || {};
  const tenantData = context.tenantData || context.empresa || {};
  const slug = context.slug || tenantData.slug || '';

  const companyName = tenantData.nombre_comercial || 'Portal de Inquilino';
  const portalTitle = tenantData.portal_titulo || `Bienvenido a ${companyName}`;
  const portalDesc =
    tenantData.portal_descripcion ||
    'Accede a tu panel exclusivo para gestionar eventos, cotizaciones y servicios con total distinción.';

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white">
      {/* ── COLUMNA IZQUIERDA: Presentación Dinámica de la Empresa (50% escritorio) ── */}
      <section className="hidden lg:flex flex-col justify-between w-1/2 p-12 xl:p-16 bg-[var(--brand-bg)] text-[var(--brand-text)] relative overflow-hidden select-none">
        {/* Marca de agua muy sutil de EVENTRA y geometría decorativa concéntrica */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute -right-24 -bottom-24 w-96 h-96 rounded-full border border-[var(--brand-primary)]/10" />
          <div className="absolute -right-44 -bottom-44 w-[34rem] h-[34rem] rounded-full border border-[var(--brand-primary)]/10" />
          <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-[var(--brand-primary)]/5 blur-3xl" />

          {/* Marca de agua tipográfica EVENTRA */}
          <div className="absolute right-10 bottom-8 text-[7rem] font-black tracking-widest text-[var(--brand-primary)]/[0.04] uppercase leading-none select-none font-sans pointer-events-none">
            EVENTRA
          </div>
        </div>

        {/* Zona Superior: Logotipo Oficial o Insignia con Iniciales */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            {tenantData.logo_url ? (
              <img
                src={tenantData.logo_url}
                alt={companyName}
                className="h-14 xl:h-16 w-auto max-w-[240px] object-contain rounded-2xl shadow-xs transition-transform duration-300 hover:scale-105"
                onError={(e) => {
                  e.target.style.display = 'none';
                  const fallbackEl = document.getElementById(`initials-badge-${slug}`);
                  if (fallbackEl) fallbackEl.classList.remove('hidden');
                }}
              />
            ) : null}

            <div
              id={`initials-badge-${slug}`}
              className={`w-14 h-14 xl:w-16 xl:h-16 rounded-2xl bg-[var(--brand-primary)] text-white flex items-center justify-center font-bold text-xl xl:text-2xl shadow-sm ${
                tenantData.logo_url ? 'hidden' : 'flex'
              }`}
            >
              {getInitials(companyName)}
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] border border-[var(--brand-primary)]/20">
              <ShieldCheck size={13} />
              <span>Verificado</span>
            </span>
          </div>
        </div>

        {/* Zona Central: H1 Impactante y Descripción */}
        <div className="relative z-10 my-auto py-12 max-w-lg">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--brand-primary)] mb-4">
            <Sparkles size={14} />
            <span>Portal White-Label</span>
          </div>
          <h1 className="text-4xl xl:text-5xl font-bold text-[var(--brand-text)] mt-2 mb-6 leading-[1.15] tracking-tight">
            {portalTitle}
          </h1>
          <p className="text-lg text-[var(--brand-text)]/80 max-w-md leading-relaxed font-light">
            {portalDesc}
          </p>
        </div>

        {/* Zona Inferior: Firma de Marca y Garantía de Infraestructura */}
        <div className="relative z-10 pt-6 border-t border-[var(--brand-border)]/40 flex items-center justify-between text-xs text-[var(--brand-text)]/60 font-medium">
          <span>© {new Date().getFullYear()} {companyName}</span>
          <span className="text-[11px] opacity-75">
            Infraestructura segura por <strong>EVENTRA SaaS</strong>
          </span>
        </div>
      </section>

      {/* ── COLUMNA DERECHA: Formulario de Interacción (100% móvil, 50% escritorio) ── */}
      <section className="flex flex-col justify-center w-full lg:w-1/2 p-8 sm:p-12 lg:p-16 xl:p-24 bg-white relative min-h-screen lg:min-h-0">
        {/* Botón de Retorno: Superior izquierda */}
        <div className="absolute top-6 left-6 sm:top-8 sm:left-12 lg:left-16 xl:left-24">
          <Link
            to={`/portal/${slug}`}
            className="inline-flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-[var(--brand-text)] transition-colors duration-200 group"
          >
            <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
            <span>Volver a la página principal</span>
          </Link>
        </div>

        {/* Encabezado visible únicamente en móviles cuando la columna izquierda se oculta */}
        <div className="lg:hidden flex items-center gap-3 pt-10 mb-6 pb-4 border-b border-gray-100">
          {tenantData.logo_url ? (
            <img
              src={tenantData.logo_url}
              alt={companyName}
              className="h-10 w-auto object-contain rounded-xl"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-[var(--brand-primary)] text-white flex items-center justify-center font-bold text-sm">
              {getInitials(companyName)}
            </div>
          )}
          <div>
            <h3 className="font-bold text-sm text-gray-900 leading-tight">
              {companyName}
            </h3>
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">
              Portal Oficial
            </span>
          </div>
        </div>

        {/* Contenedor Limpio del Formulario */}
        <div className="max-w-md w-full mx-auto my-auto py-4">
          {/* Cabecera del Formulario */}
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              {title}
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              {subtitle}
            </p>
          </div>

          {/* Formulario inyectado (children) */}
          {children}
        </div>
      </section>
    </div>
  );
};

export default TenantAuthLayout;
