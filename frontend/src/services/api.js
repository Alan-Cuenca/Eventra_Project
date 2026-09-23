/**
 * EVENTRA - Cliente HTTP (Axios)
 * Conectado al backend en producción (Render).
 * Interceptor JWT: lee el token de localStorage y lo adjunta en cada petición.
 */

import axios from 'axios';

// URL base del backend desplegado en Render
const BASE_URL = 'https://eventra-project-l3hl.onrender.com/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 s — Render puede tardar en despertar del cold-start
});

// ── Interceptor de Request: inyecta JWT en cada petición protegida ──────────
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('eventra_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Interceptor de Response: normaliza los errores de la API ─────────────────
apiClient.interceptors.response.use(
  (response) => response.data,          // devuelve directamente el body
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Error al conectar con el servidor';

    const normalized = new Error(message);
    normalized.status = error.response?.status ?? null;
    normalized.data   = error.response?.data  ?? null;

    return Promise.reject(normalized);
  }
);

// Métodos de conveniencia (mantiene compatibilidad con el resto del código)
export const api = {
  get:    (endpoint, config = {})       => apiClient.get(endpoint, config),
  post:   (endpoint, body, config = {}) => apiClient.post(endpoint, body, config),
  put:    (endpoint, body, config = {}) => apiClient.put(endpoint, body, config),
  delete: (endpoint, config = {})       => apiClient.delete(endpoint, config),
};

export default apiClient;
