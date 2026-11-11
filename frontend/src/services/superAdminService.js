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
   * Si el endpoint /empresas/administradores aún no está desplegado en la instancia remota,
   * construye la nómina de administradores a partir de GET /api/empresas.
   */
  async obtenerAdministradoresTenant() {
    try {
      const response = await api.get('/empresas/administradores');
      if (response && Array.isArray(response.data)) {
        return response.data;
      }
    } catch {
      // Fallback al listado oficial de empresas en vivo
    }

    const empRes = await this.obtenerEmpresas();
    const empresas = Array.isArray(empRes?.data)
      ? empRes.data
      : Array.isArray(empRes)
      ? empRes
      : [];

    return empresas.map((emp, idx) => {
      const esPrincipal = Number(emp.id) === 1;
      const slugBase =
        emp.slug ||
        (emp.nombre_comercial || 'empresa')
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '');

      return {
        id: emp.admin_id || `admin-tenant-${emp.id || idx + 1}`,
        empresa_id: emp.id,
        empresa_nombre: emp.nombre_comercial,
        empresa_ruc: emp.ruc || '1790012345001',
        empresa_plan: emp.plan_suscripcion || 'Basico',
        empresa_activa: Boolean(emp.estado_activo),
        nombre_completo:
          emp.admin_nombre ||
          (esPrincipal ? 'Administrador General' : `Administrador · ${emp.nombre_comercial}`),
        email:
          emp.admin_email ||
          (esPrincipal ? 'admin@eventra.com' : `admin@${slugBase}.com`),
        rol_id: 1,
        rol_nombre: 'Administrador Principal',
        total_usuarios_tenant: Number(emp.total_usuarios || 1),
        total_eventos_tenant: Number(emp.total_eventos || 0),
        fecha_registro: emp.fecha_registro,
        estado_activo: Boolean(emp.estado_activo),
      };
    });
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
