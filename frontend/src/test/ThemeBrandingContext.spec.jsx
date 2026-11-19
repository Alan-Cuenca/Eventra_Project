import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';

// Sesión estable: el mismo objeto en cada render, como hace el AuthContext real
const usuarioEstable = { id: 'u1', rol_id: 1, empresa_id: 7 };
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: usuarioEstable }) }));

const getMiBranding = vi.fn();
vi.mock('../services/eventraService', () => ({
  eventraService: { getMiBranding: (...args) => getMiBranding(...args), actualizarMiBranding: vi.fn() },
}));

const { ThemeBrandingProvider, useBranding } = await import('../context/ThemeBrandingContext');

const Sonda = () => {
  const { branding } = useBranding();
  return <div>EMPRESA:{branding.nombre_comercial || 'sin-nombre'}</div>;
};

// Cada respuesta JSON es un objeto NUEVO (como lo entrega axios), con paleta personalizada
const respuestaConPaleta = () => ({
  data: {
    id: 7,
    nombre_comercial: 'Eventos ALIS',
    slug: 'eventos-alis',
    paleta_colores: 'custom_ia',
    paleta_personalizada: { key: 'custom_ia', primary: '#112233', bg: '#F5F5F0', text: '#101820', border: '#CCCCCC' },
  },
});

const esperar = (ms) => act(() => new Promise((r) => setTimeout(r, ms)));

beforeEach(() => {
  getMiBranding.mockReset();
  localStorage.clear();
});

describe('ThemeBrandingContext', () => {
  it('pide el branding una sola vez aunque la respuesta traiga una paleta personalizada', async () => {
    getMiBranding.mockImplementation(async () => respuestaConPaleta());

    render(<ThemeBrandingProvider><Sonda /></ThemeBrandingProvider>);
    await waitFor(() => expect(screen.getByText('EMPRESA:Eventos ALIS')).toBeInTheDocument());

    // Deja correr los efectos: un bucle de re-carga seguiría llamando a la API
    await esperar(300);
    expect(getMiBranding).toHaveBeenCalledTimes(1);
  });

  it('sigue aplicando la paleta personalizada de la respuesta', async () => {
    getMiBranding.mockImplementation(async () => respuestaConPaleta());

    render(<ThemeBrandingProvider><Sonda /></ThemeBrandingProvider>);
    await waitFor(() => expect(document.documentElement.style.getPropertyValue('--ev-primary')).toBe('#112233'));
    expect(localStorage.getItem('eventra_custom_ia_palette')).toContain('#112233');
  });
});
