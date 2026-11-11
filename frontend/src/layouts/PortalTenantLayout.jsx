import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Outlet, Link, useNavigate } from 'react-router-dom';
import { eventraService } from '../services/eventraService';
import { PALETAS } from '../context/ThemeBrandingContext';
import {
  Building2,
  AlertTriangle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
  ChevronLeft,
} from 'lucide-react';
import logoFallback from '../assets/logo.png';

/**
 * =============================================================================
 * PortalTenantLayout
 * =============================================================================
 * Layout White-Label (Marca Blanca) para el Portal de Clientes de cada Inquilino.
 * Intercepta las rutas bajo /portal/:slug/ e inyecta dinámicamente las variables
 * CSS semánticas (--ev-bg-base, --ev-primary, --ev-surface, --ev-text-main, etc.)
 * basándose en la paleta oficial configurada por la empresa organizadora.
 * Estándares: Apple HIG + Liquid Glass + Squircles concéntricos.
 * =============================================================================
 */
export const PortalTenantLayout = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [empresa, setEmpresa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // 1. Cargar información pública del tenant
  useEffect(() => {
    if (!slug) {
      setErrorMsg('Identificador de empresa no especificado.');
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchPortal = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const data = await eventraService.getPortalInfo(slug.trim());
        if (isMounted) {
          if (data) {
            setEmpresa(data);
          } else {
            setErrorMsg('No se encontró el portal para este organizador.');
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('[PortalTenantLayout] Error al cargar portal:', err);
          const msg =
            err?.response?.data?.message ||
            err?.message ||
            'El portal de esta empresa organizadora no existe o se encuentra inactivo.';
          setErrorMsg(msg);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPortal();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  // 2. Motor de Tonalidades Dinámicas (CSS Variables Theming)
  const paletaActiva = useMemo(() => {
    const key = empresa?.paleta_colores || 'sofisticacion_sutil';
    return PALETAS[key] || PALETAS.sofisticacion_sutil;
  }, [empresa?.paleta_colores]);

  const cssVariables = useMemo(() => {
    const p = paletaActiva;
    const rgbPrimary = p.rgbPrimary ? p.rgbPrimary.join(' ') : '77 113 130';
    const rgbBg = p.rgbBg ? p.rgbBg.join(' ') : '243 240 228';
    const rgbBorder = p.rgbBorder ? p.rgbBorder.join(' ') : '206 200 184';
    const rgbText = p.rgbText ? p.rgbText.join(' ') : '29 51 62';

    return {
      '--ev-bg-base': p.bg || '#F3F0E4',
      '--ev-bg-base-rgb': rgbBg,
      '--ev-surface': p.surface || p.card || '#FFFFFF',
      '--ev-surface-rgb': '255 255 255',
      '--ev-border': p.border || '#CEC8B8',
      '--ev-border-rgb': rgbBorder,
      '--ev-primary': p.primary || '#4D7182',
      '--ev-primary-rgb': rgbPrimary,
      '--ev-primary-hover': p.primaryHover || '#385563',
      '--ev-primary-light': p.primaryLight || '#E4EFF4',
      '--ev-text-main': p.text || '#1D333E',
      '--ev-text-main-rgb': rgbText,
      '--ev-text-muted': p.textSecondary || '#3E5E6D',
      '--ev-accent': p.accent || '#C49A3A',
    };
  }, [paletaActiva]);

  // Aplicar también a nivel de documento para modales y portales
  useEffect(() => {
    if (cssVariables) {
      const root = document.documentElement;
      Object.entries(cssVariables).forEach(([key, value]) => {
        root.style.setProperty(key, value);
      });
    }
  }, [cssVariables]);

  /* ── Estado: Cargando Portal ───────────────────────────────────────────── */
  if (loading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-6"
        style={{
          backgroundColor: '#F3F0E4',
          color: '#233D49',
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        }}
      >
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-[#CEC8B8]/60 flex items-center justify-center animate-pulse">
            <Loader2 size={24} className="animate-spin text-[#4D7182]" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-[#233D49] tracking-tight">
              Conectando con el portal
            </h3>
            <p className="text-xs text-[#4D7182] mt-1">
              Cargando identidad de marca y servicios del organizador...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ── Estado: Error o Portal Inexistente ─────────────────────────────────── */
  if (errorMsg || !empresa) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-6"
        style={{
          backgroundColor: '#F3F0E4',
          color: '#233D49',
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        }}
      >
        <div className="bg-white rounded-[24px] shadow-sm border border-[#CEC8B8]/70 p-8 max-w-md w-full text-center flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-[#C95C5C]/10 text-[#C95C5C] flex items-center justify-center mb-4">
            <AlertTriangle size={28} />
          </div>
          <h2 className="text-xl font-bold text-[#233D49] tracking-tight">
            Portal no disponible
          </h2>
          <p className="text-sm text-[#4D7182] mt-2 mb-6">
            {errorMsg || 'No pudimos localizar la empresa solicitada en la red de EVENTRA.'}
          </p>
          <div className="flex flex-col w-full gap-2.5">
            <Link
              to="/"
              className="w-full py-2.5 px-4 rounded-xl bg-[#4D7182] text-white font-medium text-sm hover:opacity-95 transition-all text-center"
            >
              Ir a la página principal de EVENTRA
            </Link>
            <Link
              to="/login"
              className="w-full py-2.5 px-4 rounded-xl bg-[#F3F0E4] text-[#233D49] font-medium text-sm hover:bg-[#CEC8B8]/40 transition-all text-center border border-[#CEC8B8]/50"
            >
              Iniciar Sesión en Plataforma
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── Layout Activo con Liquid Glass y Theming Dinámico ─────────────────── */
  return (
    <div
      style={cssVariables}
      className="min-h-screen flex flex-col bg-[var(--ev-bg-base)] text-[var(--ev-text-main)] transition-colors duration-300 font-sans"
    >
      {/* ── Header Flotante en Liquid Glass (Apple HIG) ───────────────────── */}
      <header className="sticky top-0 z-40 backdrop-blur-xl backdrop-saturate-[180%] bg-[var(--ev-surface)]/80 border-b border-[var(--ev-border)]/50 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Lado Izquierdo: Logotipo y Nombre Comercial del Inquilino */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-[var(--ev-surface)] border border-[var(--ev-border)]/60 flex items-center justify-center p-1 shrink-0 shadow-sm">
              <img
                src={empresa.logo_url || logoFallback}
                alt={empresa.nombre_comercial}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = logoFallback;
                }}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-[var(--ev-text-main)] truncate">
                  {empresa.nombre_comercial}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[var(--ev-primary)]/10 text-[var(--ev-primary)] border border-[var(--ev-primary)]/20">
                  <ShieldCheck size={11} />
                  Verificado
                </span>
              </div>
              <p className="text-[11px] text-[var(--ev-text-muted)] truncate hidden md:block">
                {empresa.portal_descripcion || 'Portal de Autogestión de Eventos y Recepciones'}
              </p>
            </div>
          </div>

          {/* Lado Derecho: Acciones rápidas (Login y Contacto) */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to={`/portal/${slug}/login`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[var(--ev-primary)] bg-[var(--ev-primary)]/10 hover:bg-[var(--ev-primary)]/15 border border-[var(--ev-primary)]/20 transition-all active:scale-[0.98]"
            >
              <span>Iniciar Sesión</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Contenedor Central para Vistas Hijas (Outlet) ─────────────────── */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <Outlet context={{ empresa, slug, paleta: paletaActiva }} />
      </main>

      {/* ── Footer Discreto de Marca Blanca ───────────────────────────────── */}
      <footer className="py-4 px-6 text-center text-xs text-[var(--ev-text-muted)] border-t border-[var(--ev-border)]/40 bg-[var(--ev-surface)]/40 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            © {new Date().getFullYear()} {empresa.nombre_comercial}. Todos los derechos reservados.
          </span>
          <span className="text-[11px] opacity-75">
            Infraestructura segura proporcionada por <strong>EVENTRA SaaS</strong>
          </span>
        </div>
      </footer>
    </div>
  );
};

export default PortalTenantLayout;

