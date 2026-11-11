import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { eventraService } from '../services/eventraService';
import { useAuth } from './AuthContext';

export const PALETAS = {
  sofisticacion_sutil: {
    key: 'sofisticacion_sutil',
    name: 'Sofisticación Sutil',
    category: 'Oficial EVENTRA',
    desc: 'Esencia minimalista de alto contraste con crema cálido y azul pizarra profundo.',
    bg: '#F3F0E4',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    inputBg: '#FAFAF7',
    border: '#CEC8B8',
    primary: '#4D7182',
    primaryHover: '#385563',
    primaryLight: '#E4EFF4',
    text: '#1D333E',
    textSecondary: '#3E5E6D',
    accent: '#C49A3A',
    rgbPrimary: [77, 113, 130],
    rgbBg: [243, 240, 228],
  },
  bosque_olivo: {
    key: 'bosque_olivo',
    name: 'Bosque Olivo',
    category: 'Campestre / Haciendas',
    desc: 'Contraste botánico nítido ideal para fincas, viñedos y recepciones campestres.',
    bg: '#E8F0E8',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    inputBg: '#F6FAF6',
    border: '#B5CBB6',
    primary: '#2A6240',
    primaryHover: '#1E492F',
    primaryLight: '#D8EDE0',
    text: '#142B1D',
    textSecondary: '#245236',
    accent: '#8C7A3E',
    rgbPrimary: [42, 98, 64],
    rgbBg: [232, 240, 232],
  },
  terracota_real: {
    key: 'terracota_real',
    name: 'Terracota Real',
    category: 'Gastronomía / Tradición',
    desc: 'Calidez artesanal de alto contraste pensada para catering y salones tradicionales.',
    bg: '#F6EAE4',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    inputBg: '#FCF7F5',
    border: '#DDBCB0',
    primary: '#9E422B',
    primaryHover: '#7A311E',
    primaryLight: '#F6DFD9',
    text: '#33160E',
    textSecondary: '#7D3320',
    accent: '#C87D32',
    rgbPrimary: [158, 66, 43],
    rgbBg: [246, 234, 228],
  },
  champagne_gala: {
    key: 'champagne_gala',
    name: 'Champagne Gala',
    category: 'Bodas / Lujo',
    desc: 'Distinción dorada imperial con máxima legibilidad para recepciones de alta gama.',
    bg: '#F6EFE0',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    inputBg: '#FDFBF6',
    border: '#DCC8A2',
    primary: '#825D1F',
    primaryHover: '#634615',
    primaryLight: '#F4E6C8',
    text: '#2B1E08',
    textSecondary: '#694B18',
    accent: '#B8892E',
    rgbPrimary: [130, 93, 31],
    rgbBg: [246, 239, 224],
  },
  lavanda_imperial: {
    key: 'lavanda_imperial',
    name: 'Lavanda Imperial',
    category: 'Boutique / Recepciones',
    desc: 'Armonía real y contraste profundo para aniversarios y eventos boutique.',
    bg: '#EEE9F6',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    inputBg: '#F9F7FC',
    border: '#C6B7DE',
    primary: '#5A3B85',
    primaryHover: '#432A66',
    primaryLight: '#E6DDF5',
    text: '#211336',
    textSecondary: '#4B3070',
    accent: '#9A63B8',
    rgbPrimary: [90, 59, 133],
    rgbBg: [238, 233, 246],
  },
};

const DEFAULT_BRANDING = {
  id: null,
  nombre_comercial: 'EVENTRA',
  ruc: '1799999999001',
  slug: 'eventra',
  logo_url: null,
  paleta_colores: 'sofisticacion_sutil',
  marca_agua_activa: true,
  portal_titulo: 'Portal de Clientes EVENTRA',
  portal_descripcion: 'Gestión inteligente y sofisticada de eventos sociales y corporativos.',
};

const PALETTE_CACHE_KEY = 'eventra_palette_cache';

const hexToRgb = (hex, fallback = [82, 111, 125]) => {
  if (!hex || typeof hex !== 'string') return fallback;
  let clean = hex.replace('#', '');
  if (clean.length === 3) clean = clean.split('').map((c) => c + c).join('');
  if (clean.length !== 6) return fallback;
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
};

const ThemeBrandingContext = createContext(null);

export const ThemeBrandingProvider = ({ children }) => {
  const { user } = useAuth();
  const [branding, setBranding] = useState(DEFAULT_BRANDING);
  const [paletaKey, setPaletaKey] = useState(() => {
    const cached = localStorage.getItem(PALETTE_CACHE_KEY);
    return cached && PALETAS[cached] ? cached : 'sofisticacion_sutil';
  });
  const [loading, setLoading] = useState(true);

  // Aplica las variables CSS al :root asegurando alto contraste y aislamiento de vistas públicas
  const aplicarVariablesCSS = useCallback((key, isAuthenticated = true) => {
    const paleta = PALETAS[key] || PALETAS.sofisticacion_sutil;
    const root = document.documentElement;
    const [r, g, b] = paleta.rgbPrimary || hexToRgb(paleta.primary, [82, 111, 125]);
    const rgbBg = paleta.rgbBg || hexToRgb(paleta.bg, [238, 235, 221]);
    const rgbText = hexToRgb(paleta.text, [35, 61, 73]);
    const rgbBorder = hexToRgb(paleta.border, [203, 198, 182]);
    const rgbSurface = hexToRgb(paleta.card || '#FFFFFF', [255, 255, 255]);

    // ── EVENTRA Token-Driven Architecture (Semantic --ev-* CSS Variables) ──
    root.style.setProperty('--ev-bg-base', paleta.bg);
    root.style.setProperty('--ev-bg-base-rgb', rgbBg.join(' '));
    root.style.setProperty('--ev-surface', paleta.card || '#FFFFFF');
    root.style.setProperty('--ev-surface-rgb', rgbSurface.join(' '));
    root.style.setProperty('--ev-surface-glass', `rgb(${rgbSurface.join(' ')} / 0.72)`);
    root.style.setProperty('--ev-border', paleta.border);
    root.style.setProperty('--ev-border-rgb', rgbBorder.join(' '));
    root.style.setProperty('--ev-primary', paleta.primary);
    root.style.setProperty('--ev-primary-rgb', `${r} ${g} ${b}`);
    root.style.setProperty('--ev-primary-hover', paleta.primaryHover);
    root.style.setProperty('--ev-text-main', paleta.text);
    root.style.setProperty('--ev-text-main-rgb', rgbText.join(' '));
    root.style.setProperty('--ev-text-muted', `rgb(${rgbText.join(' ')} / 0.68)`);

    if (isAuthenticated) {
      root.setAttribute('data-palette', paleta.key);
    } else {
      root.removeAttribute('data-palette');
    }

    // Variables de marca blanca explícitas
    root.style.setProperty('--brand-bg', paleta.bg);
    root.style.setProperty('--brand-surface', paleta.surface || '#FFFFFF');
    root.style.setProperty('--brand-border', paleta.border);
    root.style.setProperty('--brand-primary', paleta.primary);
    root.style.setProperty('--brand-text', paleta.text);
    root.style.setProperty('--brand-primary-hover', paleta.primaryHover);
    root.style.setProperty('--brand-primary-light', paleta.primaryLight);

    // Integración con las variables del portal interno manteniendo alto contraste
    root.style.setProperty('--cream', paleta.bg);
    root.style.setProperty('--bg-main', paleta.bg);
    root.style.setProperty('--bg-primary', paleta.bg);
    root.style.setProperty('--bg-surface', paleta.surface || '#FFFFFF');
    root.style.setProperty('--bg-card', paleta.card || '#FFFFFF');
    root.style.setProperty('--bg-card-hover', '#FAFAF7');
    root.style.setProperty('--bg-input', paleta.inputBg || '#FAFAF7');
    root.style.setProperty('--beige', paleta.border);
    root.style.setProperty('--border-subtle', paleta.border);
    root.style.setProperty('--border-color', paleta.border);
    root.style.setProperty('--border-focus', paleta.primary);
    root.style.setProperty('--primary', paleta.primary);
    root.style.setProperty('--primary-hover', paleta.primaryHover);
    root.style.setProperty('--primary-dark', paleta.text);
    root.style.setProperty('--primary-light', paleta.primaryLight);
    root.style.setProperty('--primary-glow', `rgba(${r}, ${g}, ${b}, 0.22)`);
    root.style.setProperty('--text-primary', paleta.text);
    root.style.setProperty('--text-secondary', paleta.textSecondary || paleta.primary);
    root.style.setProperty('--info', paleta.primary);
    root.style.setProperty('--info-light', `rgba(${r}, ${g}, ${b}, 0.14)`);
    if (paleta.accent) {
      root.style.setProperty('--accent', paleta.accent);
    }
  }, []);

  // Cargar branding desde la API cuando el usuario esté autenticado
  const cargarBranding = useCallback(async () => {
    if (!user) {
      setBranding(DEFAULT_BRANDING);
      setPaletaKey('sofisticacion_sutil');
      localStorage.removeItem(PALETTE_CACHE_KEY);
      aplicarVariablesCSS('sofisticacion_sutil', false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await eventraService.getMiBranding();
      const data = res?.data || res;
      if (data && typeof data === 'object') {
        setBranding((prev) => ({ ...prev, ...data }));
        if (data.slug && data.slug !== 'eventra') {
          localStorage.setItem('last_tenant_slug', data.slug);
        }
        const targetPaleta = data.paleta_colores && PALETAS[data.paleta_colores]
          ? data.paleta_colores
          : 'sofisticacion_sutil';
        setPaletaKey(targetPaleta);
        localStorage.setItem(PALETTE_CACHE_KEY, targetPaleta);
        aplicarVariablesCSS(targetPaleta, true);
      }
    } catch (err) {
      console.warn('[ThemeBrandingContext] No se pudo cargar branding personalizado:', err?.message);
      const fallback = localStorage.getItem(PALETTE_CACHE_KEY);
      const activeKey = fallback && PALETAS[fallback] ? fallback : 'sofisticacion_sutil';
      setPaletaKey(activeKey);
      aplicarVariablesCSS(activeKey, true);
    } finally {
      setLoading(false);
    }
  }, [user, aplicarVariablesCSS]);

  useEffect(() => {
    cargarBranding();
  }, [cargarBranding]);

  // Previsualización local inmediata en el portal interno
  const previsualizarPaleta = (nuevaKey) => {
    if (PALETAS[nuevaKey]) {
      setPaletaKey(nuevaKey);
      localStorage.setItem(PALETTE_CACHE_KEY, nuevaKey);
      aplicarVariablesCSS(nuevaKey, true);
    }
  };

  // Guardar branding a la API
  const guardarBranding = async (formDataOrPayload) => {
    const res = await eventraService.actualizarMiBranding(formDataOrPayload);
    const updated = res?.data || res;
    if (updated && typeof updated === 'object') {
      setBranding((prev) => ({ ...prev, ...updated }));
      if (updated.paleta_colores && PALETAS[updated.paleta_colores]) {
        setPaletaKey(updated.paleta_colores);
        localStorage.setItem(PALETTE_CACHE_KEY, updated.paleta_colores);
        aplicarVariablesCSS(updated.paleta_colores, true);
      }
    }
    return updated;
  };

  const palette = PALETAS[paletaKey] || PALETAS.sofisticacion_sutil;

  const value = {
    branding,
    palette,
    paletaKey,
    PALETAS,
    loading,
    marcaAguaActiva: Boolean(branding?.marca_agua_activa),
    previsualizarPaleta,
    guardarBranding,
    recargarBranding: cargarBranding,
    aplicarVariablesCSS,
  };

  return (
    <ThemeBrandingContext.Provider value={value}>
      {children}
    </ThemeBrandingContext.Provider>
  );
};

export const useBranding = () => {
  const context = useContext(ThemeBrandingContext);
  if (!context) {
    throw new Error('useBranding debe usarse dentro de un ThemeBrandingProvider');
  }
  return context;
};

export default ThemeBrandingContext;
