import pool from '../config/db.js';
import { ROL_SUPER_ADMIN } from './authMiddleware.js';

/**
 * Límites oficiales de recursos por plan de suscripción en EVENTRA SaaS.
 */
export const PLAN_LIMITS = {
  Basico: {
    usuarios: 3,
    clientes: 50,
    servicios: 20,
    chatbot: 300,
  },
  Premium: {
    usuarios: 10,
    clientes: 200,
    servicios: 50,
    chatbot: 1500,
  },
};

/**
 * Middleware: verificarLimitePlan(recurso)
 * ============================================================================
 * Valida si la empresa ha alcanzado el límite permitido de un recurso específico
 * según su plan de suscripción actual ('Basico' o 'Premium').
 *
 * Recursos soportados:
 *   - 'usuarios'  : Colaboradores activos de la empresa
 *   - 'clientes'  : Directorio de clientes registrados
 *   - 'servicios' : Catálogo de servicios disponibles
 *   - 'chatbot'   : Mensajes procesados por EVARA AI en el mes
 *
 * Comportamiento:
 *   - Super_Admin (rol_id 5): Exento de límites (invocación directa a next()).
 *   - Si usoActual >= límite: Retorna HTTP 403 Forbidden con detalle estructurado.
 *   - Si usoActual < límite : Continúa hacia el siguiente middleware / controlador.
 *
 * @param {'usuarios' | 'clientes' | 'servicios' | 'chatbot'} recurso
 */
export const verificarLimitePlan = (recurso) => {
  return async (req, res, next) => {
    try {
      // 1. Super_Admin está exento de cualquier restricción de suscripción
      if (Number(req.user?.rol_id) === ROL_SUPER_ADMIN) {
        return next();
      }

      // 2. Extraer y determinar el tenant (empresa_id)
      let empresa_id = req.user?.empresa_id;

      // Si la petición es pública (ej. autoregistro o chatbot en portal)
      if (!empresa_id && (req.body?.empresa_slug || req.params?.slug || req.body?.slug)) {
        const slug = req.body?.empresa_slug || req.params?.slug || req.body?.slug;
        const empSlugRes = await pool.query(
          'SELECT id FROM empresas WHERE slug = $1 AND estado_activo = true',
          [slug]
        );
        if (empSlugRes.rowCount > 0) {
          empresa_id = empSlugRes.rows[0].id;
        }
      }

      if (!empresa_id && req.body?.empresa_id) {
        const empIdRes = await pool.query(
          'SELECT id FROM empresas WHERE id = $1 AND estado_activo = true',
          [req.body.empresa_id]
        );
        if (empIdRes.rowCount > 0) {
          empresa_id = empIdRes.rows[0].id;
        }
      }

      // Si es chatbot y no hay sesión, fallback a primera empresa activa
      if (!empresa_id && recurso === 'chatbot') {
        const defaultEmpRes = await pool.query(
          'SELECT id FROM empresas WHERE estado_activo = true ORDER BY id ASC LIMIT 1'
        );
        if (defaultEmpRes.rowCount > 0) {
          empresa_id = defaultEmpRes.rows[0].id;
        }
      }

      if (!empresa_id) {
        return res.status(400).json({
          success: false,
          message: 'No se pudo identificar la empresa para validar las restricciones de su plan.',
        });
      }

      // 3. Consultar los datos de suscripción de la empresa
      const empRes = await pool.query(
        'SELECT plan_suscripcion, COALESCE(mensajes_chatbot_mes, 0) AS mensajes_chatbot_mes FROM empresas WHERE id = $1',
        [empresa_id]
      );

      if (!empRes) {
        return next();
      }

      if (empRes.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Empresa no encontrada.',
        });
      }

      const planNombre = empRes.rows[0].plan_suscripcion === 'Premium' ? 'Premium' : 'Basico';
      const limitesPlan = PLAN_LIMITS[planNombre] || PLAN_LIMITS.Basico;
      const maximo = limitesPlan[recurso];

      if (maximo === undefined) {
        return next();
      }

      // 4. Calcular el conteo actual del recurso en la base de datos
      let usoActual = 0;

      if (recurso === 'usuarios') {
        const countRes = await pool.query(
          'SELECT COUNT(*) FROM usuarios WHERE empresa_id = $1 AND estado_activo = true',
          [empresa_id]
        );
        usoActual = countRes?.rows?.[0]?.count ? parseInt(countRes.rows[0].count, 10) : 0;
      } else if (recurso === 'clientes') {
        const countRes = await pool.query(
          'SELECT COUNT(*) FROM clientes WHERE empresa_id = $1 AND estado_activo = true',
          [empresa_id]
        );
        usoActual = countRes?.rows?.[0]?.count ? parseInt(countRes.rows[0].count, 10) : 0;
      } else if (recurso === 'servicios') {
        const countRes = await pool.query(
          'SELECT COUNT(*) FROM servicios WHERE empresa_id = $1 AND estado_activo = true',
          [empresa_id]
        );
        usoActual = countRes?.rows?.[0]?.count ? parseInt(countRes.rows[0].count, 10) : 0;
      } else if (recurso === 'chatbot') {
        usoActual = empRes?.rows?.[0]?.mensajes_chatbot_mes ? parseInt(empRes.rows[0].mensajes_chatbot_mes, 10) : 0;
      }

      // 5. Validar si superó el límite permitido
      if (usoActual >= maximo) {
        return res.status(403).json({
          success: false,
          error: 'PLAN_LIMIT_EXCEEDED',
          message: `Has alcanzado el límite de ${recurso} (${maximo}) para tu Plan ${planNombre}. Por favor, actualiza tu suscripción al Plan Premium para continuar expandiendo tu negocio.`,
          data: {
            recurso,
            plan: planNombre,
            limite_maximo: maximo,
            uso_actual: usoActual,
          },
        });
      }

      // Inyectar contexto en la petición para trazabilidad
      req.planInfo = {
        empresa_id,
        plan: planNombre,
        recurso,
        limite: maximo,
        usoActual,
      };

      next();
    } catch (error) {
      console.error(`[planLimitsMiddleware] Error al verificar límite de ${recurso}:`, error.message);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor al verificar las restricciones del plan SaaS.',
      });
    }
  };
};

/**
 * Función auxiliar para consultar el uso y límites completos de una empresa.
 *
 * @param {number} empresa_id
 * @returns {Promise<object>}
 */
export const obtenerConsumoPlanEmpresa = async (empresa_id) => {
  const [empRes, usrRes, cliRes, srvRes] = await Promise.all([
    pool.query('SELECT plan_suscripcion, COALESCE(mensajes_chatbot_mes, 0) AS chatbot_uso FROM empresas WHERE id = $1', [empresa_id]),
    pool.query('SELECT COUNT(*) FROM usuarios WHERE empresa_id = $1 AND estado_activo = true', [empresa_id]),
    pool.query('SELECT COUNT(*) FROM clientes WHERE empresa_id = $1 AND estado_activo = true', [empresa_id]),
    pool.query('SELECT COUNT(*) FROM servicios WHERE empresa_id = $1 AND estado_activo = true', [empresa_id]),
  ]);

  if (empRes.rowCount === 0) {
    throw new Error('Empresa no encontrada');
  }

  const plan = empRes.rows[0].plan_suscripcion === 'Premium' ? 'Premium' : 'Basico';
  const limites = PLAN_LIMITS[plan];

  return {
    plan,
    limites,
    uso: {
      usuarios: parseInt(usrRes.rows[0].count, 10),
      clientes: parseInt(cliRes.rows[0].count, 10),
      servicios: parseInt(srvRes.rows[0].count, 10),
      chatbot: parseInt(empRes.rows[0].chatbot_uso, 10),
    },
  };
};

