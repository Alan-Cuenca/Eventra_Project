import React from 'react';

/**
 * =============================================================================
 * GlobalStatCard
 * =============================================================================
 * Tarjeta de estadística para métricas del SaaS unificada con la clase .kpi-card
 * del sistema de diseño EVENTRA. Soporta Light Mode y Dark Mode nativamente.
 * =============================================================================
 */
export const GlobalStatCard = ({
  title,
  value,
  subtitle,
  icon,
  accentColor = 'var(--primary)',
  loading = false,
  badgeText = null,
  badgeColor = null,
}) => {
  if (loading) {
    return (
      <div
        className="kpi-card"
        style={{ minHeight: '140px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="skeleton" style={{ height: '14px', width: '50%' }} />
          <div className="skeleton" style={{ width: '38px', height: '38px', borderRadius: '10px' }} />
        </div>
        <div className="skeleton" style={{ height: '28px', width: '70%', marginTop: '1rem' }} />
        <div className="skeleton" style={{ height: '12px', width: '40%', marginTop: '0.5rem' }} />
      </div>
    );
  }

  return (
    <div
      className="kpi-card"
      style={{ minHeight: '140px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--text-secondary)',
            }}
          >
            {title}
          </span>
          {badgeText && (
            <span
              style={{
                marginLeft: '0.5rem',
                padding: '0.15rem 0.5rem',
                fontSize: '0.65rem',
                fontWeight: 700,
                borderRadius: '9999px',
                background: `${badgeColor || accentColor}18`,
                color: badgeColor || accentColor,
                display: 'inline-block',
                border: `1px solid ${badgeColor || accentColor}33`,
              }}
            >
              {badgeText}
            </span>
          )}
        </div>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            background: `${accentColor}18`,
            color: accentColor,
            border: `1px solid ${accentColor}25`,
          }}
        >
          {icon}
        </div>
      </div>

      <div style={{ marginTop: '0.75rem' }}>
        <div
          style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            fontFamily: 'Outfit, sans-serif',
          }}
        >
          {value !== null && value !== undefined ? value : '—'}
        </div>
        {subtitle && (
          <p
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              marginTop: '0.25rem',
              lineHeight: 1.3,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

export default GlobalStatCard;
