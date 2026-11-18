/**
 * EVENTRA - Auth Service
 * Conectado a la API real en Render (https://eventra-project-l3hl.onrender.com/api).
 * Fallback a usuarios demo solo cuando el backend no responde por red.
 */

import { api } from './api';

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
        if (response.data?.empresa_slug) {
          localStorage.setItem('last_tenant_slug', response.data.empresa_slug);
        }
        return { user: response.data, token: response.token, isRealBackend: true };
      }
      throw new Error('Respuesta inválida del servidor');
    } catch (error) {
      // Sin backend no hay acceso: se propaga un mensaje amigable (sin sesión simulada)
      if (error.status) throw error;
      throw new Error('No se pudo conectar con el servidor. Verifica tu conexión e intenta nuevamente.');
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
      if (error.status) throw error;
      throw new Error('No se pudo conectar con el servidor. Intenta nuevamente.');
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
   * POST /api/auth/recuperar-password
   * Solicita el envío de un enlace de restablecimiento de contraseña al correo.
   * El backend responde siempre con un mensaje genérico (exista o no la cuenta).
   */
  async solicitarRecuperacionPassword(email) {
    return await api.post('/auth/recuperar-password', { email });
  },

  /**
   * POST /api/auth/restablecer-password
   * Establece una nueva contraseña con el token recibido por correo.
   * Retorna { data: { redirect } } con la ruta de login correspondiente.
   */
  async restablecerPassword({ token, password_nuevo, password_confirmar }) {
    return await api.post('/auth/restablecer-password', {
      token,
      password_nuevo,
      password_confirmar,
    });
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

