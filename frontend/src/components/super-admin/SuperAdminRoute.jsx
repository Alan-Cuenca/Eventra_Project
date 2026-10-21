import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Loader2 } from 'lucide-react';

/**
 * =============================================================================
 * SuperAdminRoute
 * =============================================================================
 * Componente guardián de rutas exclusivo para el Super Administrador global.
 *
 * Reglas de acceso:
 * 1. Durante la carga de la sesión (loading = true), no expone UI sensible.
 * 2. Si no hay sesión o token, redirige a /login.
 * 3. Si el usuario está autenticado pero NO tiene rol de Super Administrador (rol_id = 5),
 *    lo redirige a su panel correspondiente (portal cliente o dashboard de empresa).
 * 4. Solo concede paso al Outlet si isSuperAdmin === true.
 * =============================================================================
 */
export const SuperAdminRoute = () => {
  const { user, token, loading, isSuperAdmin, isCliente } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: '#F3F0E4',
          color: '#233D49',
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          gap: '1rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            backgroundColor: '#FFFFFF',
            boxShadow: '0 4px 16px rgba(35, 61, 73, 0.08)',
            border: '1px solid #CEC8B8',
          }}
        >
          <ShieldCheck size={32} color="#4D7182" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
          <Loader2 size={18} className="animate-spin" color="#4D7182" />
          <span>Validando credenciales de Super Administrador...</span>
        </div>
      </div>
    );
  }

  // Sin sesión iniciada → pantalla de login
  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Usuario autenticado pero SIN permisos de Super Administrador
  if (!isSuperAdmin) {
    console.warn('[SuperAdminRoute] Intento de acceso no autorizado al panel global por usuario rol:', user?.rol_id);
    return <Navigate to={isCliente ? '/portal-cliente' : '/dashboard'} replace />;
  }

  return <Outlet />;
};

export default SuperAdminRoute;
