/**
 * EVENTRA - Cliente HTTP (Axios)
 * En desarrollo local apunta a http://localhost:3000/api
 * En producción apunta al backend desplegado en Render.
 * Interceptor JWT: lee el token de la sesión de esta pestaña (ver sesion.js) y lo adjunta en cada petición.
 */

import axios from 'axios';
import { obtenerToken, leerSesion, cerrarSesionLocal } from './sesion';

// ── Configuración de URL Base (VITE_API_URL) ──────────────────────────────────
// Prioriza la variable de entorno VITE_API_URL; si estamos en localhost, apunta al backend local.
// En despliegue remoto sin variable, apunta al backend de Render.
const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:3000/api';
  }
  return 'https://eventra-project-l3hl.onrender.com/api';
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
    const token = obtenerToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // Si la petición contiene FormData (ej. carga de logotipo), eliminar el
    // Content-Type por defecto (application/json) para que Axios y el navegador
    // generen el header multipart/form-data con su respectivo boundary automáticamente.
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      delete config.headers['Content-Type'];
      if (config.headers?.common) {
        delete config.headers.common['Content-Type'];
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ── Interceptor de Response: errores de red y 401 → forzar logout ──────────
/** Aviso que la pantalla de login muestra tras cerrar la sesión desde el interceptor. */
const AVISO_SESION_KEY = 'eventra_aviso_sesion';
// Lectura sin efectos (los inicializadores de useState se ejecutan dos veces en StrictMode);
// el aviso se descarta aparte, una vez montada la pantalla.
export const leerAvisoSesion = () => {
  try { return sessionStorage.getItem(AVISO_SESION_KEY) || ''; } catch { return ''; }
};
export const descartarAvisoSesion = () => {
  try { sessionStorage.removeItem(AVISO_SESION_KEY); } catch { /* sin almacenamiento */ }
};

apiClient.interceptors.response.use(
  (response) => response.data,          // devuelve directamente el body
  (error) => {
    // ── Manejo crítico: token expirado o inválido (401 Unauthorized) ─────────
    const urlPeticion = String(error.config?.url || '');
    const esEndpointDeLogin = /\/(auth\/(login|recuperar-password|restablecer-password|cambiar-password-obligatorio|completar-registro|registro-cliente)|clientes\/registro-publico)/.test(urlPeticion);
    // Empresa suspendida con la sesión abierta: se cierra la sesión igual que con un 401
    const empresaSuspendida = error.response?.status === 403 && error.response?.data?.error === 'EMPRESA_SUSPENDIDA';
    if ((error.response?.status === 401 || empresaSuspendida) && !esEndpointDeLogin) {
      console.warn('[api] Token expirado o inválido — cerrando sesión...');
      if (empresaSuspendida || error.response?.data?.error === 'SESION_INVALIDA') {
        try { sessionStorage.setItem(AVISO_SESION_KEY, error.response.data.message || ''); } catch { /* sin almacenamiento */ }
      }
      // El destino depende de la cuenta de ESTA pestaña (el Super Admin vuelve a /login)
      let usuarioPestana = null;
      try { usuarioPestana = JSON.parse(leerSesion('eventra_user') || 'null'); } catch { usuarioPestana = null; }
      const esSuperAdmin = Number(leerSesion('rol_id') || usuarioPestana?.rol_id) === 5;
      // Cerrar solo la sesión de esta pestaña (otra pestaña puede tener otra cuenta abierta)
      cerrarSesionLocal();
      const lastSlug = esSuperAdmin ? null : (usuarioPestana?.empresa_slug || (typeof window !== 'undefined' ? localStorage.getItem('last_tenant_slug') : null));
      const targetLogin = lastSlug && lastSlug !== 'eventra' ? `/portal/${lastSlug}/login` : '/login';
      // Redirigir fuera del contexto de React Router para resetear el estado hacia el portal correcto
      if (window.location.pathname !== targetLogin) {
        window.location.href = targetLogin;
      }
    }

    // ── Contraseña temporal pendiente de cambio (403 PASSWORD_CHANGE_REQUIRED) ──
    const requiereCambioPassword =
      error.response?.status === 403 &&
      error.response?.data?.error === 'PASSWORD_CHANGE_REQUIRED';
    if (requiereCambioPassword && typeof window !== 'undefined') {
      const destino = '/primer-acceso/cambiar-password';
      if (window.location.pathname !== destino) {
        window.location.href = destino;
      }
    }

    // ── Manejo crítico: límite de plan SaaS alcanzado (403 Forbidden) ───────
    let isPlanLimit = false;
    if (error.response?.status === 403 && !requiereCambioPassword) {
      const errorData = error.response?.data;
      // Solo el código explícito del backend cuenta como límite de plan (evita falsos
      // positivos con mensajes que contengan "plan", como "planificación").
      isPlanLimit = errorData?.error === 'PLAN_LIMIT_EXCEEDED';

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

    const status = error.response?.status ?? null;
    const MENSAJES_POR_ESTADO = {
      400: 'Los datos enviados no son válidos. Revisa el formulario e intenta de nuevo.',
      401: 'Tu sesión expiró. Inicia sesión nuevamente.',
      403: 'No tienes permisos para realizar esta acción.',
      404: 'No se encontró la información solicitada.',
      409: 'La operación entra en conflicto con datos existentes.',
      413: 'El archivo es demasiado grande.',
      429: 'Demasiadas solicitudes. Espera un momento e intenta de nuevo.',
    };
    // Prioridad: mensaje del backend (ya en español) → mensaje por código → mensaje de red
    let message = error.response?.data?.message;
    if (!message) {
      if (status && status >= 500) {
        message = 'Ocurrió un problema en el servidor. Intenta nuevamente en unos minutos.';
      } else if (status && MENSAJES_POR_ESTADO[status]) {
        message = MENSAJES_POR_ESTADO[status];
      } else if (error.code === 'ECONNABORTED') {
        message = 'El servidor tardó demasiado en responder. Intenta nuevamente.';
      } else {
        message = 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
      }
    }

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
  patch:  (endpoint, body, config = {}) => apiClient.patch(endpoint, body, config),
  delete: (endpoint, config = {})       => apiClient.delete(endpoint, config),
};

export default apiClient;
