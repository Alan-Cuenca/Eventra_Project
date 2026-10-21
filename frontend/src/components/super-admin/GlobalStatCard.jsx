import React from 'react';

/**
 * =============================================================================
 * GlobalStatCard
 * =============================================================================
 * Tarjeta de estadística para métricas del SaaS con diseño "Sofisticación Sutil".
 * Fondo blanco (#FFFFFF), bordes suaves (#CEC8B8), textos de alto contraste (#233D49)
 * e icono lineal en contenedor tintado.
 * =============================================================================
 */
export const GlobalStatCard = ({
  title,
  value,
  subtitle,
  icon,
  accentColor = '#4D7182',
  loading = false,
  badgeText = null,
  badgeColor = null,
}) => {
  if (loading) {
    return (
      <div
        className="bg-white rounded-2xl p-6 border border-[#CEC8B8] shadow-sm animate-pulse flex flex-col justify-between"
        style={{ minHeight: '140px' }}
      >
        <div className="flex items-center justify-between">
          <div className="h-4 bg-[#CEC8B8]/40 rounded w-1/2"></div>
          <div className="w-10 h-10 bg-[#CEC8B8]/30 rounded-xl"></div>
        </div>
        <div className="h-8 bg-[#CEC8B8]/50 rounded w-3/4 mt-4"></div>
        <div className="h-3 bg-[#CEC8B8]/30 rounded w-2/3 mt-2"></div>
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-2xl p-6 border border-[#CEC8B8] shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
      style={{ minHeight: '140px' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#4D7182]">
            {title}
          </span>
          {badgeText && (
            <span
              className="ml-2 px-2 py-0.5 text-[10px] font-bold rounded-full inline-block"
              style={{
                backgroundColor: `${badgeColor || accentColor}18`,
                color: badgeColor || accentColor,
              }}
            >
              {badgeText}
            </span>
          )}
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: `${accentColor}15`,
            color: accentColor,
          }}
        >
          {icon}
        </div>
      </div>

      <div className="mt-3">
        <div className="text-2xl lg:text-3xl font-extrabold text-[#233D49] tracking-tight">
          {value !== null && value !== undefined ? value : '—'}
        </div>
        {subtitle && (
          <p className="text-xs text-[#7d8f97] mt-1 line-clamp-1">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

export default GlobalStatCard;
