/**
 * EVENTRA - Auth Service
 * Conectado a la API real en Render (https://eventra-project-l3hl.onrender.com/api).
 * Fallback a usuarios demo solo cuando el backend no responde por red.
 */

import { api } from './api';
import { DEMO_USERS } from './mockData';

const TOKEN_KEY    = 'token';
const USER_KEY     = 'eventra_user';
const ROL_ID_KEY   = 'rol_id';
const ROL_NOMBRE_KEY = 'rol_nombre';

const ROLES_NOMBRES = {
  1: 'Administrador',
  2: 'Gerente',
  3: 'Trabajador',
  4: 'Cliente',
};

export const authService = {
  /**
   * POST /auth/login
   * Guarda el JWT en localStorage con la clave 'eventra_token'.
   * Si el backend no está disponible (error de red sin status), usa demo.
   */
  async login(email, password) {
    try {
      const response = await api.post('/auth/login', { email, password });
      // response ya es el body gracias al interceptor de Axios
      if (response && response.token) {
        localStorage.setItem(TOKEN_KEY, response.token);
        localStorage.setItem(USER_KEY, JSON.stringify(response.data));
        return { user: response.data, token: response.token, isRealBackend: true };
      }
      throw new Error('Respuesta inválida del servidor');
    } catch (error) {
      // Si fue error HTTP del servidor (401, 409, 500…) → lo propagamos tal cual
      if (error.status) {
        throw error;
      }

      // Solo fallback si fue error de red (sin status, backend inaccesible)
      console.warn('[authService] Backend no accesible, usando demo:', error.message);

      const demoUser = DEMO_USERS.find(
        (u) =>
          u.email.toLowerCase() === email.toLowerCase() &&
          u.password === password
      );

      if (demoUser) {
        const mockToken = `mock-jwt-demo-role${demoUser.rol_id}-${Date.now()}`;
        const { password: _, ...userData } = demoUser;
        localStorage.setItem(TOKEN_KEY,     mockToken);
        localStorage.setItem(USER_KEY,      JSON.stringify(userData));
        localStorage.setItem(ROL_ID_KEY,    String(demoUser.rol_id));
        localStorage.setItem(ROL_NOMBRE_KEY, ROLES_NOMBRES[demoUser.rol_id] ?? 'Desconocido');
        return { user: userData, token: mockToken, isRealBackend: false };
      }

      throw new Error('No se pudo conectar al servidor y las credenciales no coinciden con ningún usuario demo');
    }
  },

  /**
   * POST /auth/register
   * Si el backend no está disponible por red, simula registro exitoso (solo dev).
   */
  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData);
      // 201 Created → response.data contiene el usuario creado
      return { success: true, user: response.data, isRealBackend: true };
    } catch (error) {
      // Error HTTP real → propagar (ej: 409 email duplicado)
      if (error.status) {
        throw error;
      }

      // Fallback de red (solo para pruebas sin backend)
      console.warn('[authService] Registro en modo offline/demo:', error.message);
      const newUser = {
        id: `usr-mock-${Date.now()}`,
        nombre_completo: userData.nombre_completo,
        email: userData.email,
        rol_id: userData.rol_id,
        empresa_id: userData.empresa_id,
        estado_activo: true,
        fecha_creacion: new Date().toISOString(),
      };
      return { success: true, user: newUser, isRealBackend: false };
    }
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ROL_ID_KEY);
    localStorage.removeItem(ROL_NOMBRE_KEY);
  },

  getStoredSession() {
    const token   = localStorage.getItem(TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);
    if (!token || !userStr) return null;
    try {
      const rolId = localStorage.getItem(ROL_ID_KEY);
      return {
        token,
        user: JSON.parse(userStr),
        rolId: rolId ? parseInt(rolId, 10) : null,
      };
    } catch {
      return null;
    }
  },
};
