import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { eventraService } from '../services/eventraService';
import { useAuth } from './AuthContext';

export const PALETAS = {
  sofisticacion_sutil: {
    key: 'sofisticacion_sutil',
    name: 'Sofisticación Sutil',
    category: 'Oficial EVENTRA',
    desc: 'Esencia minimalista y distinguida con tonos crema cálido y azul pizarra.',
    bg: '#F3F0E4',
    surface: '#FAF8F1',
    card: '#FFFFFF',
    inputBg: '#FAFAF5',
    border: '#CEC8B8',
    primary: '#4D7182',
    primaryHover: '#3B5968',
    primaryLight: '#E3EEF3',
    text: '#233D49',
    textSecondary: '#4D7182',
    accent: '#C49A3A',
    rgbPrimary: [77, 113, 130],
    rgbBg: [243, 240, 228],
  },
  bosque_olivo: {
    key: 'bosque_olivo',
    name: 'Bosque Olivo',
    category: 'Campestre / Haciendas',
    desc: 'Tonos naturales y botánicos intensos ideales para fincas, viñedos y recepciones campestres.',
    bg: '#E4EFE5',
    surface: '#F1F7F1',
    card: '#FFFFFF',
    inputBg: '#F5FAF5',
    border: '#B4CCB5',
    primary: '#2F6B48',
    primaryHover: '#235236',
    primaryLight: '#D5ECDE',
    text: '#183523',
    textSecondary: '#2F6B48',
    accent: '#8C7A3E',
    rgbPrimary: [47, 107, 72],
    rgbBg: [228, 239, 229],
  },
  terracota_real: {
    key: 'terracota_real',
    name: 'Terracota Real',
    category: 'Gastronomía / Tradición',
    desc: 'Calidez artesanal y elegancia terrosa pensada para catering y salones tradicionales.',
    bg: '#F5E5DD',
    surface: '#FBF2EE',
    card: '#FFFFFF',
    inputBg: '#FCF6F3',
    border: '#DFBCB0',
    primary: '#A84A32',
    primaryHover: '#873824',
    primaryLight: '#F7DFD8',
    text: '#3D1C14',
    textSecondary: '#8F3F2B',
    accent: '#C87D32',
    rgbPrimary: [168, 74, 50],
    rgbBg: [245, 229, 221],
  },
  champagne_gala: {
    key: 'champagne_gala',
    name: 'Champagne Gala',
    category: 'Bodas / Lujo',
    desc: 'Brillo dorado imperial y distinción sobria para recepciones de alta gama y bodas de ensueño.',
    bg: '#F6EDDA',
    surface: '#FCF7EC',
    card: '#FFFFFF',
    inputBg: '#FDFBF4',
    border: '#DFCAA0',
    primary: '#8F6826',
    primaryHover: '#70501B',
    primaryLight: '#F5E7C8',
    text: '#36270C',
    textSecondary: '#7A581E',
    accent: '#B8892E',
    rgbPrimary: [143, 104, 38],
    rgbBg: [246, 237, 218],
  },
  lavanda_imperial: {
    key: 'lavanda_imperial',
    name: 'Lavanda Imperial',
    category: 'Boutique / Recepciones',
    desc: 'Suavidad artística y serenidad romántica para aniversarios y eventos boutique.',
    bg: '#EBE4F5',
    surface: '#F5F1FB',
    card: '#FFFFFF',
    inputBg: '#F8F5FC',
    border: '#C5B5DE',
    primary: '#63438E',
    primaryHover: '#4C326E',
    primaryLight: '#E5DBF5',
    text: '#26173B',
    textSecondary: '#583B7E',
    accent: '#9A63B8',
    rgbPrimary: [99, 67, 142],
    rgbBg: [235, 228, 245],
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

const ThemeBrandingContext = createContext(null);

export const ThemeBrandingProvider = ({ children }) => {
  const { user } = useAuth();
  const [branding, setBranding] = useState(DEFAULT_BRANDING);
  const [paletaKey, setPaletaKey] = useState(() => {
    const cached = localStorage.getItem(PALETTE_CACHE_KEY);
    return cached && PALETAS[cached] ? cached : 'sofisticacion_sutil';
  });
  const [loading, setLoading] = useState(true);

  // Aplica todas las variables CSS del sistema al :root para transformación completa
  const aplicarVariablesCSS = useCallback((key) => {
    const paleta = PALETAS[key] || PALETAS.sofisticacion_sutil;
    const root = document.documentElement;
    const [r, g, b] = paleta.rgbPrimary || [77, 113, 130];

    root.setAttribute('data-palette', paleta.key);

    // Variables de marca blanca explícitas
    root.style.setProperty('--brand-bg', paleta.bg);
    root.style.setProperty('--brand-surface', paleta.surface || '#FFFFFF');
    root.style.setProperty('--brand-border', paleta.border);
    root.style.setProperty('--brand-primary', paleta.primary);
    root.style.setProperty('--brand-text', paleta.text);
    root.style.setProperty('--brand-primary-hover', paleta.primaryHover);
    root.style.setProperty('--brand-primary-light', paleta.primaryLight);

    // Integración global completa con el sistema de estilos de EVENTRA
    root.style.setProperty('--cream', paleta.bg);
    root.style.setProperty('--bg-main', paleta.bg);
    root.style.setProperty('--bg-primary', paleta.bg);
    root.style.setProperty('--bg-surface', paleta.surface || '#FFFFFF');
    root.style.setProperty('--bg-card', paleta.card || '#FFFFFF');
    root.style.setProperty('--bg-card-hover', paleta.surface || '#FAFAF7');
    root.style.setProperty('--bg-input', paleta.inputBg || '#FAFAF7');
    root.style.setProperty('--beige', paleta.border);
    root.style.setProperty('--border-subtle', paleta.border);
    root.style.setProperty('--border-color', paleta.border);
    root.style.setProperty('--border-focus', paleta.primary);
    root.style.setProperty('--primary', paleta.primary);
    root.style.setProperty('--primary-hover', paleta.primaryHover);
    root.style.setProperty('--primary-dark', paleta.text);
    root.style.setProperty('--primary-light', paleta.primaryLight);
    root.style.setProperty('--primary-glow', `rgba(${r}, ${g}, ${b}, 0.24)`);
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
      aplicarVariablesCSS('sofisticacion_sutil');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await eventraService.getMiBranding();
      const data = res?.data || res;
      if (data && typeof data === 'object') {
        setBranding((prev) => ({ ...prev, ...data }));
        const targetPaleta = data.paleta_colores && PALETAS[data.paleta_colores]
          ? data.paleta_colores
          : 'sofisticacion_sutil';
        setPaletaKey(targetPaleta);
        localStorage.setItem(PALETTE_CACHE_KEY, targetPaleta);
        aplicarVariablesCSS(targetPaleta);
      }
    } catch (err) {
      console.warn('[ThemeBrandingContext] No se pudo cargar branding personalizado:', err?.message);
      const fallback = localStorage.getItem(PALETTE_CACHE_KEY);
      const activeKey = fallback && PALETAS[fallback] ? fallback : 'sofisticacion_sutil';
      setPaletaKey(activeKey);
      aplicarVariablesCSS(activeKey);
    } finally {
      setLoading(false);
    }
  }, [user, aplicarVariablesCSS]);

  useEffect(() => {
    cargarBranding();
  }, [cargarBranding]);

  // Previsualización local inmediata en toda la app
  const previsualizarPaleta = (nuevaKey) => {
    if (PALETAS[nuevaKey]) {
      setPaletaKey(nuevaKey);
      localStorage.setItem(PALETTE_CACHE_KEY, nuevaKey);
      aplicarVariablesCSS(nuevaKey);
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
        aplicarVariablesCSS(updated.paleta_colores);
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
