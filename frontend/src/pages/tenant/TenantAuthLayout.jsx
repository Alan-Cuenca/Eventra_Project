import React, { useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

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
 * Determina la URL de la página principal del inquilino (salto de servidor / dominio externo)
 */
const getTenantLandingUrl = (slug, tenantData) => {
  if (tenantData?.sitio_web) return tenantData.sitio_web;
  if (tenantData?.url_landing) return tenantData.url_landing;

  const normalized = (slug || '').toLowerCase().trim();
  if (normalized.includes('catedral')) {
    return 'http://localhost:5174/';
  }
  if (normalized.includes('imperial')) {
    return 'http://localhost:5175/';
  }

  // Fallback al referrer si el cliente navegó desde un origen externo
  if (typeof window !== 'undefined' && document.referrer) {
    try {
      const refUrl = new URL(document.referrer);
      if (refUrl.origin !== window.location.origin) {
        return refUrl.origin;
      }
    } catch {}
  }

  return '/';
};

/**
 * =============================================================================
 * TenantAuthLayout
 * =============================================================================
 * Utiliza exactamente las clases (.login-root, .login-left, .login-right, .login-card)
 * y la tipografía (Outfit + Plus Jakarta Sans) oficiales de EVENTRA Login.jsx,
 * adaptándose automáticamente a la paleta oficial del inquilino activo.
 * =============================================================================
 */
export const TenantAuthLayout = ({ title, subtitle, children }) => {
  const context = useOutletContext() || {};
  const tenantData = context.tenantData || context.empresa || {};
  const slug = context.slug || tenantData.slug || '';

  const [logoError, setLogoError] = useState(false);

  const companyName = tenantData.nombre_comercial || 'Portal de Inquilino';
  const portalTitle =
    tenantData.portal_titulo || `Haz de cada evento una experiencia única`;
  const portalDesc =
    tenantData.portal_descripcion ||
    'La plataforma SaaS para planificar, coordinar y ejecutar recepciones y eventos con precisión profesional.';

  const landingUrl = getTenantLandingUrl(slug, tenantData);

  return (
    <div className="login-root">
      {/* ── Panel Izquierdo — Branding del Tenant con Estilo Idéntico a EVENTRA ── */}
      <div
        className="login-left"
        style={{
          background: 'linear-gradient(145deg, var(--cream) 0%, rgba(255,255,255,0.7) 50%, var(--cream) 100%)',
        }}
      >
        {/* Identidad de la Empresa: Logo o Monograma + Nombre */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.875rem',
            marginBottom: '2.5rem',
          }}
        >
          {tenantData.logo_url && !logoError ? (
            <img
              src={tenantData.logo_url}
              alt={companyName}
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                objectFit: 'contain',
                background: 'var(--white)',
                padding: '6px',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-sm)',
              }}
              onError={() => setLogoError(true)}
            />
          ) : (
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: 'var(--primary)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 900,
                fontSize: '1.25rem',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {getInitials(companyName)}
            </div>
          )}

          <div>
            <div
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '1.45rem',
                fontWeight: 900,
                letterSpacing: '0.04em',
                color: 'var(--primary-dark)',
                lineHeight: 1.1,
              }}
            >
              {companyName}
            </div>
            <div
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: 'var(--primary)',
                marginTop: '0.25rem',
              }}
            >
              Portal Oficial de Gestión
            </div>
          </div>
        </div>

        {/* Título Principal (Eslogan / H1) con Fuente Outfit */}
        <h1
          style={{
            fontFamily: 'Outfit, sans-serif',
            fontSize: '2.5rem',
            fontWeight: 900,
            color: 'var(--primary-dark)',
            lineHeight: 1.2,
            marginBottom: '1rem',
            maxWidth: '460px',
          }}
        >
          {portalTitle}
        </h1>

        {/* Descripción Elegante */}
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '1.05rem',
            lineHeight: 1.7,
            marginBottom: '2.5rem',
            maxWidth: '440px',
          }}
        >
          {portalDesc}
        </p>
      </div>

      {/* ── Panel Derecho — Formulario idéntico a Login.jsx ────────────────── */}
      <div className="login-right">
        <div className="login-card animate-fade-in">
          {/* Botón de Retorno: regresa al landing externo del inquilino */}
          <div style={{ marginBottom: '1.25rem' }}>
            {landingUrl.startsWith('http://') || landingUrl.startsWith('https://') ? (
              <a
                href={landingUrl}
                id="back-to-landing-link"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--primary)',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--primary-dark)';
                  e.currentTarget.style.transform = 'translateX(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--primary)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <ArrowLeft size={15} />
                <span>Volver a la página principal</span>
              </a>
            ) : (
              <Link
                to={landingUrl}
                id="back-to-landing-link"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--primary)',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--primary-dark)';
                  e.currentTarget.style.transform = 'translateX(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--primary)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <ArrowLeft size={15} />
                <span>Volver a la página principal</span>
              </Link>
            )}
          </div>

          {/* Encabezado del Formulario */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h2
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '1.6rem',
                fontWeight: 800,
                color: 'var(--primary-dark)',
                marginBottom: '0.3rem',
              }}
            >
              {title}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              {subtitle}
            </p>
          </div>

          {/* Formulario inyectado (children) */}
          {children}
        </div>
      </div>
    </div>
  );
};

export default TenantAuthLayout;
