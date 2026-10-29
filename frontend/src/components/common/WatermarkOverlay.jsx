import React from 'react';
import { useBranding } from '../../context/ThemeBrandingContext';

export const WatermarkOverlay = () => {
  const { branding, marcaAguaActiva } = useBranding();

  if (!marcaAguaActiva) return null;

  const logoUrl = branding?.logo_url;
  const nombreComercial = branding?.nombre_comercial || 'EVENTRA';

  return (
    <aside
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none select-none z-0 overflow-hidden flex items-center justify-center opacity-[0.032]"
      style={{ userSelect: 'none' }}
    >
      <div className="transform -rotate-12 flex flex-col items-center justify-center text-center max-w-2xl px-6">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt=""
            className="max-h-72 max-w-md object-contain grayscale filter contrast-125 mb-4"
          />
        ) : (
          <div className="flex flex-col items-center">
            <span
              className="text-7xl font-extrabold tracking-widest uppercase font-serif"
              style={{ color: 'var(--brand-text, #233D49)' }}
            >
              {nombreComercial}
            </span>
            <span
              className="text-xs uppercase tracking-[0.35em] mt-3 font-semibold"
              style={{ color: 'var(--brand-text, #233D49)' }}
            >
              Identidad Oficial Registrada
            </span>
          </div>
        )}
      </div>
    </aside>
  );
};

export default WatermarkOverlay;
