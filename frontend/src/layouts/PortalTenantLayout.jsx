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
    if (empresa?.paleta_colores === 'custom_ia' && empresa?.paleta_personalizada) {
      try {
        const p = typeof empresa.paleta_personalizada === 'string'
          ? JSON.parse(empresa.paleta_personalizada)
          : empresa.paleta_personalizada;
        if (p && p.primary) return p;
      } catch {}
    }
    const key = empresa?.paleta_colores || 'sofisticacion_sutil';
    return PALETAS[key] || PALETAS.sofisticacion_sutil;
  }, [empresa?.paleta_colores, empresa?.paleta_personalizada]);

  const cssVariables = useMemo(() => {
    const p = paletaActiva;
    const rgbPrimary = p.rgbPrimary ? p.rgbPrimary.join(' ') : '77 113 130';
    const rgbBg = p.rgbBg ? p.rgbBg.join(' ') : '243 240 228';
    const rgbBorder = p.rgbBorder ? p.rgbBorder.join(' ') : '206 200 184';
    const rgbText = p.rgbText ? p.rgbText.join(' ') : '29 51 62';

    return {
      // 1. Tokens semánticos globales
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

      // 2. Variables exactas del Design System de EVENTRA (Sofisticación Sutil)
      '--cream': p.bg || '#F3F0E4',
      '--beige': p.border || '#CEC8B8',
      '--primary': p.primary || '#4D7182',
      '--primary-hover': p.primaryHover || '#3d5f6e',
      '--primary-dark': p.text || '#233D49',
      '--primary-light': p.primaryLight || '#e8f0f4',
      '--text-primary': p.text || '#233D49',
      '--text-secondary': p.textSecondary || '#4D7182',
      '--border-subtle': p.border || '#CEC8B8',
      '--border-focus': p.primary || '#4D7182',
      '--bg-main': p.bg || '#F3F0E4',
      '--bg-input': p.inputBg || '#FAFAF7',

      // 3. Variables semánticas de marca para el Split-Screen White-Label
      '--brand-bg': p.bg || '#F3F0E4',
      '--brand-primary': p.primary || '#4D7182',
      '--brand-primary-hover': p.primaryHover || '#385563',
      '--brand-text': p.text || '#1D333E',
      '--brand-border': p.border || '#CEC8B8',
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

  /* ── Layout Activo con Split-Screen White-Label Theming ───────────────── */
  return (
    <div
      style={cssVariables}
      className="min-h-screen w-full bg-[var(--brand-bg)] text-[var(--brand-text)] font-sans antialiased"
    >
      <Outlet context={{ tenantData: empresa, empresa, slug, paleta: paletaActiva }} />
    </div>
  );
};

export default PortalTenantLayout;

