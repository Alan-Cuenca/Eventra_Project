import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { TenantAuthLayout } from '../tenant/TenantAuthLayout';
import { ThemeToggle } from '../../components/common/ThemeToggle';
import logoImg from '../../assets/logo.png';

/**
 * Devuelve el contexto del portal de inquilino si la vista se renderiza dentro de
 * /portal/:slug (PortalTenantLayout). Fuera del portal retorna slug vacío.
 */
export const usePortalTenant = () => {
  const context = useOutletContext() || {};
  const tenantData = context.tenantData || context.empresa || {};
  const slug = context.slug || tenantData.slug || '';
  return { slug, tenantData, enPortal: Boolean(slug) };
};

/**
 * =============================================================================
 * PasswordAuthShell
 * =============================================================================
 * Contenedor de las vistas de recuperación de contraseña:
 *  - Dentro del portal de una empresa → usa TenantAuthLayout (marca blanca).
 *  - En el acceso general de EVENTRA → tarjeta centrada "Sofisticación Sutil".
 * =============================================================================
 */
export const PasswordAuthShell = ({ title, subtitle, icon, children }) => {
  const { enPortal } = usePortalTenant();

  if (enPortal) {
    return (
      <TenantAuthLayout title={title} subtitle={subtitle}>
        {children}
      </TenantAuthLayout>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F0E4] flex flex-col items-center justify-center p-4 font-['Plus_Jakarta_Sans',sans-serif] relative">
      <ThemeToggle floating />

      <div className="w-full max-w-md bg-white rounded-2xl border border-[#CEC8B8] shadow-xl p-8 animate-fade-in my-6">
        <div className="flex items-center gap-3 mb-6">
          <img
            src={logoImg}
            alt="EVENTRA"
            className="w-11 h-11 rounded-xl object-contain bg-[#F3F0E4] p-1.5 border border-[#CEC8B8]"
          />
          <div>
            <h1 className="text-xl font-extrabold text-[#233D49] tracking-tight font-['Outfit']">
              EVENTRA <span className="text-[#4D7182] font-normal text-sm">| Seguridad</span>
            </h1>
            <p className="text-xs text-[#7d8f97]">Plataforma de Gestión de Eventos</p>
          </div>
        </div>

        <div className="mb-6">
          {icon && (
            <div className="w-12 h-12 rounded-xl bg-[#4D7182]/10 text-[#4D7182] flex items-center justify-center mb-3">
              {icon}
            </div>
          )}
          <h2 className="text-xl font-black text-[#233D49] font-['Outfit']">{title}</h2>
          {subtitle && <p className="text-xs text-[#7d8f97] mt-1.5 leading-relaxed">{subtitle}</p>}
        </div>

        {children}
      </div>
    </div>
  );
};

/** Alerta de estado reutilizable (error / éxito) con la paleta oficial. */
export const AlertaEstado = ({ tipo = 'error', children }) => {
  const esError = tipo === 'error';
  return (
    <div
      role={esError ? 'alert' : 'status'}
      style={{
        background: esError ? 'rgba(201,92,92,0.12)' : 'rgba(77,154,114,0.12)',
        border: `1px solid ${esError ? 'rgba(201,92,92,0.3)' : 'rgba(77,154,114,0.3)'}`,
        borderRadius: '10px',
        padding: '0.75rem 1rem',
        marginBottom: '1.25rem',
        fontSize: '0.8375rem',
        color: esError ? '#8a2f2f' : '#2f6b4c',
        lineHeight: 1.5,
      }}
    >
      {children}
    </div>
  );
};

export default PasswordAuthShell;
