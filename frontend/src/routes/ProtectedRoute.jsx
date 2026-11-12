import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, token, loading, roleId, debeCambiarPassword } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ color: 'var(--primary)', fontWeight: 600 }}>Cargando EVENTRA...</div>
      </div>
    );
  }

  if (!token || !user) {
    const lastSlug = typeof window !== 'undefined' ? localStorage.getItem('last_tenant_slug') : null;
    if (lastSlug && lastSlug !== 'eventra') {
      return <Navigate to={`/portal/${lastSlug}/login`} replace />;
    }
    return <Navigate to="/login" replace />;
  }

  // Cuenta con contraseña temporal: no puede usar el sistema hasta definir una propia
  if (debeCambiarPassword) {
    return <Navigate to="/primer-acceso/cambiar-password" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(roleId)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
