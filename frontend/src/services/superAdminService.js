/**
 * =============================================================================
 * EVENTRA SaaS — Servicio de Super Administrador (ADMIN_GLOBAL)
 * =============================================================================
 * Encapsula la comunicación con los endpoints de gestión global de inquilinos
 * (/api/empresas) protegidos por rol_id = 5 (Super_Admin).
 *
 * Utiliza la instancia centralizada de Axios en api.js, la cual inyecta el token
 * JWT automáticamente y procesa respuestas y errores de sesión.
 * =============================================================================
 */

import { api } from './api';

export const superAdminService = {
  /**
   * Obtiene el listado global de todas las empresas registradas (Tenants)
   * junto con sus métricas agregadas (usuarios, eventos, ingresos).
   * Endpoint: GET /api/empresas
   *
   * @returns {Promise<{ success: boolean, total: number, data: Array }>}
   */
  async obtenerEmpresas() {
    try {
      const response = await api.get('/empresas');
      return response;
    } catch (error) {
      console.error('[superAdminService] Error al obtener empresas:', error);
      throw error;
    }
  },

  /**
   * Obtiene el directorio global de administradores de todos los inquilinos.
   * Endpoint backend: GET /api/empresas/administradores
   */
  async obtenerAdministradoresTenant() {
    const response = await api.get('/empresas/administradores');
    return Array.isArray(response?.data) ? response.data : [];
  },

  /**
   * Registra un nuevo inquilino SaaS y su administrador inicial.
   * Endpoint backend: POST /api/empresas
   */
  async crearEmpresa(datosEmpresa) {
    return await api.post('/empresas', datosEmpresa);
  },

  /**
   * Actualiza el plan de suscripción de un inquilino.
   * Endpoint backend: PUT /api/empresas/:id/plan
   */
  async actualizarPlan(id, plan) {
    return await api.put(`/empresas/${id}/plan`, { plan_suscripcion: plan });
  },

  /**
   * Suspende o reactiva el acceso de una empresa SaaS en la plataforma.
   * Endpoint backend: PUT /api/empresas/:id/suspender
   */
  async suspenderEmpresa(id, estadoActivo) {
    return await api.put(`/empresas/${id}/suspender`, { estado_activo: Boolean(estadoActivo) });
  },

  /**
   * Obtiene la configuración global de EVENTRA SaaS (Planes, Límites, Datos Bancarios).
   * Endpoint backend: GET /api/configuracion
   */
  async obtenerConfiguracion() {
    try {
      const res = await api.get('/configuracion');
      return res?.data?.data || res?.data || res;
    } catch (err) {
      console.warn('[superAdminService] Error al obtener configuracion:', err);
      return null;
    }
  },

  /**
   * Guarda y sincroniza la configuración global de EVENTRA SaaS en PostgreSQL.
   * Endpoint backend: PUT /api/configuracion
   */
  async guardarConfiguracion(configData) {
    const res = await api.put('/configuracion', configData);
    return res?.data || res;
  },
};

export default superAdminService;
