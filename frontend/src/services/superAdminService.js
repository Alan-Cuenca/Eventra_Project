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
   * ─────────────────────────────────────────────────────────────────────────────
   * OPERACIONES PREPARADAS PARA FASE 2 (Gestión Activa de Inquilinos)
   * ─────────────────────────────────────────────────────────────────────────────
   * Las siguientes funciones quedan preparadas a nivel de interfaz pero NO deben
   * ejecutarse de forma no supervisada en la Fase 1.
   * ─────────────────────────────────────────────────────────────────────────────
   */

  /**
   * Registra un nuevo inquilino SaaS y su administrador inicial.
   * Endpoint backend: POST /api/empresas
   *
   * @param {Object} datosEmpresa
   * @param {string} datosEmpresa.nombre_comercial
   * @param {string} [datosEmpresa.ruc]
   * @param {string} [datosEmpresa.plan_suscripcion]
   * @param {string} [datosEmpresa.admin_nombre]
   * @param {string} [datosEmpresa.admin_email]
   * @param {string} [datosEmpresa.admin_password]
   */
  async crearEmpresa(datosEmpresa) {
    return await api.post('/empresas', datosEmpresa);
  },

  /**
   * Actualiza el plan de suscripción de un inquilino.
   * Endpoint backend: PUT /api/empresas/:id/plan
   *
   * @param {number|string} id - ID de la empresa
   * @param {'Basico'|'Premium'|'Enterprise'|'Profesional'} plan - Nuevo plan
   */
  async actualizarPlan(id, plan) {
    return await api.put(`/empresas/${id}/plan`, { plan_suscripcion: plan });
  },

  /**
   * Suspende o reactiva el acceso de una empresa SaaS en la plataforma.
   * Endpoint backend: PUT /api/empresas/:id/suspender
   *
   * @param {number|string} id - ID de la empresa
   * @param {boolean} estadoActivo - true para reactivar, false para suspender
   */
  async suspenderEmpresa(id, estadoActivo) {
    return await api.put(`/empresas/${id}/suspender`, { estado_activo: Boolean(estadoActivo) });
  },
};

export default superAdminService;
