/**
 * EVENTRA - Cliente HTTP (Axios)
 * En desarrollo local apunta a http://localhost:3000/api
 * En producción apunta al backend desplegado en Render.
 * Interceptor JWT: lee el token de localStorage y lo adjunta en cada petición.
 */

import axios from 'axios';

// ── Configuración de URL Base (VITE_API_URL) ──────────────────────────────────
// Prioriza la variable de entorno VITE_API_URL; si no está definida, apunta
// directamente al backend desplegado en Render.
const getBaseUrl = () => {
  return import.meta.env.VITE_API_URL || 'https://eventra-project-l3hl.onrender.com/api';
};

const BASE_URL = getBaseUrl();

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 s — Soporta el Cold-Start de Render (~30-50s) y el despacho de correo SMTP
});

// ── Interceptor de Request: inyecta JWT en cada petición protegida ──────────
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Interceptor de Response: errores de red y 401 → forzar logout ──────────
apiClient.interceptors.response.use(
  (response) => response.data,          // devuelve directamente el body
  (error) => {
    // ── Manejo crítico: token expirado o inválido (401 Unauthorized) ─────────
    if (error.response?.status === 401) {
      console.warn('[api] Token expirado o inválido — cerrando sesión...');
      // Limpiar todas las claves de sesión del localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('eventra_user');
      localStorage.removeItem('rol_id');
      localStorage.removeItem('rol_nombre');
      // Redirigir fuera del contexto de React Router para resetear el estado
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // ── Manejo crítico: límite de plan SaaS alcanzado (403 Forbidden) ───────
    let isPlanLimit = false;
    if (error.response?.status === 403) {
      const errorData = error.response?.data;
      isPlanLimit =
        errorData?.error === 'PLAN_LIMIT_EXCEEDED' ||
        (typeof errorData?.message === 'string' &&
          (errorData.message.toLowerCase().includes('límite') ||
           errorData.message.toLowerCase().includes('limite') ||
           errorData.message.toLowerCase().includes('plan')));

      if (isPlanLimit) {
        console.warn('[api] Límite de plan SaaS alcanzado:', errorData?.message);
        if (typeof window !== 'undefined' && window.dispatchEvent) {
          window.dispatchEvent(
            new CustomEvent('eventra:plan-limit-exceeded', {
              detail: {
                message: errorData?.message || 'Has alcanzado el límite de tu plan de suscripción.',
                recurso: errorData?.data?.recurso || errorData?.recurso,
                plan: errorData?.data?.plan || errorData?.plan || 'Basico',
                limite: errorData?.data?.limite_maximo || errorData?.limite,
                actual: errorData?.data?.uso_actual || errorData?.actual,
                data: errorData,
              },
            })
          );
        }
      }
    }
    // ─────────────────────────────────────────────────────────────────

    const message =
      error.response?.data?.message ||
      error.message ||
      'Error al conectar con el servidor';

    const normalized = new Error(message);
    normalized.status      = error.response?.status ?? null;
    normalized.data        = error.response?.data   ?? null;
    normalized.isPlanLimit = isPlanLimit;

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
