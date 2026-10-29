import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { eventraService } from '../services/eventraService';
import { useAuth } from './AuthContext';

export const PALETAS = {
  sofisticacion_sutil: {
    key: 'sofisticacion_sutil',
    name: 'Sofisticación Sutil',
    category: 'Oficial EVENTRA',
    desc: 'Esencia minimalista y distinguida con tonos crema cálido y azul pizarra.',
    bg: '#EEEBDD',
    surface: '#FFFFFF',
    border: '#CBC6B6',
    primary: '#526F7D',
    primaryHover: '#3E5764',
    primaryLight: '#E6ECEF',
    text: '#233D49',
    rgbPrimary: [82, 111, 125],
    rgbBg: [238, 235, 221],
  },
  bosque_olivo: {
    key: 'bosque_olivo',
    name: 'Bosque Olivo',
    category: 'Campestre / Haciendas',
    desc: 'Tonos naturales y botánicos ideales para fincas, viñedos y recepciones campestres.',
    bg: '#F4F3EE',
    surface: '#FFFFFF',
    border: '#D5D3C8',
    primary: '#566B59',
    primaryHover: '#435546',
    primaryLight: '#E8EDE9',
    text: '#243026',
    rgbPrimary: [86, 107, 89],
    rgbBg: [244, 243, 238],
  },
  terracota_real: {
    key: 'terracota_real',
    name: 'Terracota Real',
    category: 'Gastronomía / Tradición',
    desc: 'Calidez artesanal y elegancia terrosa pensada para catering y salones tradicionales.',
    bg: '#F6F1EB',
    surface: '#FFFFFF',
    border: '#DECFC2',
    primary: '#8C5A4B',
    primaryHover: '#724639',
    primaryLight: '#F4ECE8',
    text: '#382620',
    rgbPrimary: [140, 90, 75],
    rgbBg: [246, 241, 235],
  },
  champagne_gala: {
    key: 'champagne_gala',
    name: 'Champagne Gala',
    category: 'Bodas / Lujo',
    desc: 'Brillo sutil y distinción sobria para recepciones de alta gama y bodas de ensueño.',
    bg: '#F7F5F0',
    surface: '#FFFFFF',
    border: '#DFD8C8',
    primary: '#7D6B4D',
    primaryHover: '#64553B',
    primaryLight: '#EFECE4',
    text: '#2E2922',
    rgbPrimary: [125, 107, 77],
    rgbBg: [247, 245, 240],
  },
  lavanda_imperial: {
    key: 'lavanda_imperial',
    name: 'Lavanda Imperial',
    category: 'Boutique / Recepciones',
    desc: 'Suavidad artística y serenidad romántica para aniversarios y eventos boutique.',
    bg: '#F4F2F7',
    surface: '#FFFFFF',
    border: '#D3CDD9',
    primary: '#685A7C',
    primaryHover: '#524663',
    primaryLight: '#ECE8F1',
    text: '#2B2338',
    rgbPrimary: [104, 90, 124],
    rgbBg: [244, 242, 247],
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

const ThemeBrandingContext = createContext(null);

export const ThemeBrandingProvider = ({ children }) => {
  const { user } = useAuth();
  const [branding, setBranding] = useState(DEFAULT_BRANDING);
  const [paletaKey, setPaletaKey] = useState('sofisticacion_sutil');
  const [loading, setLoading] = useState(true);

  // Aplica variables CSS al :root
  const aplicarVariablesCSS = useCallback((key) => {
    const paleta = PALETAS[key] || PALETAS.sofisticacion_sutil;
    const root = document.documentElement;

    root.style.setProperty('--brand-bg', paleta.bg);
    root.style.setProperty('--brand-surface', paleta.surface);
    root.style.setProperty('--brand-border', paleta.border);
    root.style.setProperty('--brand-primary', paleta.primary);
    root.style.setProperty('--brand-text', paleta.text);
    root.style.setProperty('--brand-primary-hover', paleta.primaryHover);
    root.style.setProperty('--brand-primary-light', paleta.primaryLight);

    // Integración fluida con el sistema de estilos general de EVENTRA
    root.style.setProperty('--cream', paleta.bg);
    root.style.setProperty('--bg-primary', paleta.bg);
    root.style.setProperty('--beige', paleta.border);
    root.style.setProperty('--border-color', paleta.border);
    root.style.setProperty('--primary', paleta.primary);
    root.style.setProperty('--primary-hover', paleta.primaryHover);
    root.style.setProperty('--primary-dark', paleta.text);
    root.style.setProperty('--text-primary', paleta.text);
    root.style.setProperty('--primary-light', paleta.primaryLight);
  }, []);

  // Cargar branding desde la API cuando el usuario esté autenticado
  const cargarBranding = useCallback(async () => {
    if (!user) {
      setBranding(DEFAULT_BRANDING);
      setPaletaKey('sofisticacion_sutil');
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
        aplicarVariablesCSS(targetPaleta);
      }
    } catch (err) {
      console.warn('[ThemeBrandingContext] No se pudo cargar branding personalizado:', err?.message);
      aplicarVariablesCSS('sofisticacion_sutil');
    } finally {
      setLoading(false);
    }
  }, [user, aplicarVariablesCSS]);

  useEffect(() => {
    cargarBranding();
  }, [cargarBranding]);

  // Previsualización local inmediata
  const previsualizarPaleta = (nuevaKey) => {
    if (PALETAS[nuevaKey]) {
      setPaletaKey(nuevaKey);
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
