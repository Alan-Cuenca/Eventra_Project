import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { ROLES, ROLES_CONFIG, DEMO_USERS } from '../services/mockData';

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

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
  };

  // Función utilitaria para conmutar rápidamente de rol en modo demo
  const switchDemoRole = (rolId) => {
    const targetUser = DEMO_USERS.find((u) => u.rol_id === rolId) || DEMO_USERS[0];
    const mockToken = `mock-token-demo-${rolId}-${Date.now()}`;
    const { password: _, ...userData } = targetUser;
    
    localStorage.setItem('token', mockToken);
    localStorage.setItem('eventra_user', JSON.stringify(userData));
    
    setUser(userData);
    setToken(mockToken);
  };

  const currentRoleConfig = user?.rol_id ? ROLES_CONFIG[user.rol_id] : null;

  const value = {
    user,
    token,
    loading,
    roleId: user?.rol_id || null,
    roleConfig: currentRoleConfig,
    isAdmin: user?.rol_id === ROLES.ADMIN,
    isGerente: user?.rol_id === ROLES.GERENTE,
    isTrabajador: user?.rol_id === ROLES.TRABAJADOR,
    isCliente: user?.rol_id === ROLES.CLIENTE,
    login,
    register,
    logout,
    switchDemoRole,
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
