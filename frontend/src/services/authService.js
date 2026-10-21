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
  5: 'Super_Admin',
};

export const authService = {
  /**
   * POST /auth/login
   * Guarda el JWT en localStorage con la clave 'token'.
   * Si el backend no está disponible (error de red sin status), usa demo.
   * IMPORTANTE: Los roles demo NUNCA conceden acceso a Super Admin.
   */
  async login(email, password) {
    try {
      const response = await api.post('/auth/login', { email, password });
      // response ya es el body gracias al interceptor de Axios
      if (response && response.token) {
        localStorage.setItem(TOKEN_KEY, response.token);
        localStorage.setItem(USER_KEY, JSON.stringify(response.data));
        if (response.data?.rol_id) {
          localStorage.setItem(ROL_ID_KEY, String(response.data.rol_id));
          localStorage.setItem(ROL_NOMBRE_KEY, response.data.rol_nombre || ROLES_NOMBRES[response.data.rol_id] || 'Usuario');
        }
        return { user: response.data, token: response.token, isRealBackend: true };
      }
      throw new Error('Respuesta inválida del servidor');
    } catch (error) {
      // Si fue error HTTP del servidor (401, 403, 404, 500…) → lo propagamos tal cual
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

      // Los usuarios demo solo son para roles locales (1 a 4). Ningún demo es Super_Admin.
      if (demoUser && demoUser.rol_id !== 5) {
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
   * GET /auth/me
   * Valida la sesión activa y retorna el payload del usuario autenticado (id, rol_id, empresa_id, email).
   */
  async getMe() {
    try {
      const response = await api.get('/auth/me');
      return response.data || response;
    } catch (error) {
      throw error;
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

  /**
   * POST /api/auth/cambiar-password-obligatorio
   * Actualiza la contraseña en el primer inicio de sesión y guarda el nuevo token limpio.
   */
  async cambiarPasswordObligatorio({ password_temporal, password_nuevo, password_confirmar }) {
    const response = await api.post('/auth/cambiar-password-obligatorio', {
      password_temporal,
      password_nuevo,
      password_confirmar,
    });

    if (response && response.token) {
      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem(USER_KEY, JSON.stringify(response.data));
      if (response.data?.rol_id) {
        localStorage.setItem(ROL_ID_KEY, String(response.data.rol_id));
        localStorage.setItem(ROL_NOMBRE_KEY, response.data.rol_nombre || ROLES_NOMBRES[response.data.rol_id] || 'Usuario');
      }
    }
    return response;
  },

  /**
   * POST /api/auth/recuperar-credencial
   * Solicita regeneración y despacho de credenciales caducadas por correo.
   */
  async solicitarRecuperacionCredencial(email) {
    return await api.post('/auth/recuperar-credencial', { email });
  },

  /**
   * GET /api/auth/portal/:slug
   * Obtiene la información pública del portal de una empresa.
   */
  async obtenerInfoPortal(slug) {
    const response = await api.get(`/auth/portal/${slug}`);
    return response.data || response;
  },

  /**
   * POST /api/auth/registro-cliente
   * Registra a un cliente final en el portal de una empresa específica.
   */
  async registrarClientePortal(payload) {
    const response = await api.post('/auth/registro-cliente', payload);
    if (response && response.token) {
      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem(USER_KEY, JSON.stringify(response.data.usuario));
      localStorage.setItem(ROL_ID_KEY, String(response.data.usuario.rol_id || 4));
      localStorage.setItem(ROL_NOMBRE_KEY, 'Cliente');
      return {
        user: response.data.usuario,
        token: response.token,
        cliente: response.data.cliente,
        empresa: response.data.empresa,
      };
    }
    return response;
  },
};

