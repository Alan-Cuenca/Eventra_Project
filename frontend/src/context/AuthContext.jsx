import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { ROLES, ROLES_CONFIG } from '../services/mockData';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restaurar sesión persistida
    const session = authService.getStoredSession();
    if (session) {
      setUser(session.user);
      setToken(session.token);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const result = await authService.login(email, password);
    setUser(result.user);
    setToken(result.token);
    return result;
  };

  const register = async (userData) => {
    return await authService.register(userData);
  };

  const logout = (customRedirect) => {
    // 1. Identificar si es Super Admin (ADMIN_GLOBAL)
    const isSuper =
      Number(user?.rol_id) === 5 ||
      Number(user?.rol_id) === ROLES.SUPER_ADMIN ||
      user?.rol === 'Super_Admin' ||
      user?.rol_nombre === 'Super_Admin';

    // 2. Obtener el slug exclusivo de la empresa del usuario
    const tenantSlug = isSuper
      ? null
      : (user?.empresa_slug || user?.slug || localStorage.getItem('last_tenant_slug'));

    let targetUrl = '/login';
    if (customRedirect) {
      targetUrl = customRedirect;
    } else if (tenantSlug && tenantSlug !== 'eventra') {
      targetUrl = `/portal/${tenantSlug}/login`;
    }

    if (isSuper) {
      localStorage.removeItem('last_tenant_slug');
    }

    // 3. Limpiar estado de sesión
    authService.logout();
    setUser(null);
    setToken(null);

    // 4. Redirección al portal de autenticación correspondiente (portal exclusivo del inquilino)
    if (typeof window !== 'undefined') {
      window.location.href = targetUrl;
    }
  };

  const refreshSession = async () => {
    try {
      const meData = await authService.getMe();
      if (meData) {
        setUser((prev) => ({ ...prev, ...meData }));
        return meData;
      }
    } catch (err) {
      console.warn('[AuthContext] No se pudo validar la sesión actual:', err?.message);
      return null;
    }
  };

  const isSuperAdmin =
    Number(user?.rol_id) === 5 ||
    Number(user?.rol_id) === ROLES.SUPER_ADMIN ||
    user?.rol === 'Super_Admin' ||
    user?.rol_nombre === 'Super_Admin';

  const currentRoleConfig = user?.rol_id ? ROLES_CONFIG[user.rol_id] : null;

  const value = {
    user,
    token,
    loading,
    roleId: user?.rol_id ? Number(user.rol_id) : null,
    roleConfig: currentRoleConfig,
    isSuperAdmin,
    isAdmin: Number(user?.rol_id) === ROLES.ADMIN,
    isGerente: Number(user?.rol_id) === ROLES.GERENTE,
    isTrabajador: Number(user?.rol_id) === ROLES.TRABAJADOR,
    isCliente: Number(user?.rol_id) === ROLES.CLIENTE,
    login,
    register,
    logout,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
