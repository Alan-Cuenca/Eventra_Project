import { api } from './api';
import { DEMO_USERS } from './mockData';

export const authService = {
  /**
   * Intenta autenticar en el backend real.
   * Si el backend no está disponible o falla por red, usa las credenciales demo.
   */
  async login(email, password) {
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response && response.token) {
        localStorage.setItem('eventra_token', response.token);
        localStorage.setItem('eventra_user', JSON.stringify(response.data));
        return { user: response.data, token: response.token, isRealBackend: true };
      }
      throw new Error('Respuesta inválida del servidor');
    } catch (error) {
      console.warn('[authService] Backend no respondió o dio error:', error.message);
      
      // Fallback a usuarios Demo
      const demoUser = DEMO_USERS.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );

      if (demoUser) {
        const mockToken = `mock-jwt-token-role-${demoUser.rol_id}-${Date.now()}`;
        const { password: _, ...userData } = demoUser;
        localStorage.setItem('eventra_token', mockToken);
        localStorage.setItem('eventra_user', JSON.stringify(userData));
        return { user: userData, token: mockToken, isRealBackend: false };
      }

      // Si fue un 401 o 404 del backend real con mensaje específico:
      if (error.status === 401 || error.status === 404) {
        throw new Error(error.message || 'Credenciales inválidas');
      }

      // Si no es demo ni conectó:
      throw new Error(error.message || 'No se pudo conectar al servidor ni coincide con usuario Demo');
    }
  },

  /**
   * Registro en el backend real (con fallback para pruebas)
   */
  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData);
      return { success: true, user: response.data, isRealBackend: true };
    } catch (error) {
      console.warn('[authService] Error en register backend:', error.message);
      
      // Si el servidor de BD no está corriendo pero estamos probando:
      if (!error.status) {
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

      throw error;
    }
  },

  logout() {
    localStorage.removeItem('eventra_token');
    localStorage.removeItem('eventra_user');
  },

  getStoredSession() {
    const token = localStorage.getItem('eventra_token');
    const userStr = localStorage.getItem('eventra_user');
    if (!token || !userStr) return null;
    try {
      return { token, user: JSON.parse(userStr) };
    } catch {
      return null;
    }
  },
};
