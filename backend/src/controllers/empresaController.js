import pool from '../config/db.js';
import bcrypt from 'bcrypt';

/**
 * =============================================================================
 * CONTROLADOR: empresaController.js
 * =============================================================================
 * Módulo de Administración Global de Inquilinos (Tenants) de EVENTRA SaaS.
 * Acceso EXCLUSIVO para usuarios con rol Super_Admin (rol_id 5 / 0).
 * =============================================================================
 */

/**
 * Obtiene el listado completo de empresas registradas en la plataforma SaaS,
 * con métricas agregadas de usuarios, eventos y facturación.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
export const obtenerEmpresas = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
         e.id, 
         e.nombre_comercial, 
         e.ruc, 
         e.plan_suscripcion, 
         e.estado_activo, 
         e.fecha_registro,
         COUNT(DISTINCT u.id)  AS total_usuarios,
         COUNT(DISTINCT ev.id) AS total_eventos,
         COALESCE(SUM(p.monto) FILTER (WHERE p.estado = 'Completado'), 0) AS total_ingresos
       FROM empresas e
       LEFT JOIN usuarios u  ON u.empresa_id = e.id
       LEFT JOIN eventos ev  ON ev.empresa_id = e.id
       LEFT JOIN pagos p     ON p.empresa_id = e.id
       GROUP BY e.id, e.nombre_comercial, e.ruc, e.plan_suscripcion, e.estado_activo, e.fecha_registro
       ORDER BY e.fecha_registro DESC`
    );

    return res.status(200).json({
      success: true,
      total: result.rowCount,
      data: result.rows,
    });
  } catch (error) {
    console.error('[empresaController] Error en obtenerEmpresas:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener las empresas.',
    });
  }
};

/**
 * Da de alta a una nueva empresa (inquilino / tenant) en EVENTRA SaaS.
 * Opcionalmente crea en una transacción atómica el usuario Administrador inicial.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
export const crearEmpresa = async (req, res) => {
  const {
    nombre_comercial,
    ruc,
    plan_suscripcion = 'Basico',
    admin_nombre,
    admin_email,
    admin_password,
  } = req.body;

  if (!nombre_comercial) {
    return res.status(400).json({
      success: false,
      message: 'El campo nombre_comercial es obligatorio.',
    });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Crear el tenant
    const empresaRes = await client.query(
      `INSERT INTO empresas (nombre_comercial, ruc, plan_suscripcion, estado_activo)
       VALUES ($1, $2, $3, true)
       RETURNING id, nombre_comercial, ruc, plan_suscripcion, estado_activo, fecha_registro`,
      [nombre_comercial, ruc || null, plan_suscripcion]
    );

    const nuevaEmpresa = empresaRes.rows[0];
    let adminUsuario = null;

    // 2. Si se suministran credenciales de Administrador inicial, darlo de alta en el tenant
    if (admin_email && admin_password) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(admin_password, salt);

      const adminRes = await client.query(
        `INSERT INTO usuarios (empresa_id, rol_id, nombre_completo, email, password_hash)
         VALUES ($1, 1, $2, $3, $4)
         RETURNING id, empresa_id, rol_id, nombre_completo, email, estado_activo, fecha_creacion`,
        [nuevaEmpresa.id, admin_nombre || `Admin ${nombre_comercial}`, admin_email, passwordHash]
      );
      adminUsuario = adminRes.rows[0];
    }

    await client.query('COMMIT');

    return res.status(201).json({
      success: true,
      message: 'Empresa (Tenant) creada exitosamente en EVENTRA SaaS.',
      data: {
        empresa: nuevaEmpresa,
        administrador_inicial: adminUsuario,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'El RUC de la empresa o el email del administrador ya se encuentra registrado.',
      });
    }
    console.error('[empresaController] Error en crearEmpresa:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al crear la empresa.',
    });
  } finally {
    client.release();
  }
};

/**
 * Actualiza el plan de suscripción de una empresa SaaS.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
export const actualizarPlanEmpresa = async (req, res) => {
  const { id } = req.params;
  const { plan_suscripcion } = req.body;

  const planesValidos = ['Basico', 'Premium', 'Enterprise', 'Profesional'];
  if (!plan_suscripcion || !planesValidos.some(p => p.toLowerCase() === String(plan_suscripcion).toLowerCase())) {
    return res.status(400).json({
      success: false,
      message: `Plan inválido. Opciones válidas: ${planesValidos.join(', ')}.`,
    });
  }

  try {
    const result = await pool.query(
      `UPDATE empresas
       SET plan_suscripcion = $1
       WHERE id = $2
       RETURNING id, nombre_comercial, ruc, plan_suscripcion, estado_activo`,
      [plan_suscripcion, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Empresa no encontrada.',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Plan de suscripción actualizado a "${plan_suscripcion}".`,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('[empresaController] Error en actualizarPlanEmpresa:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno al actualizar el plan de la empresa.',
    });
  }
};

/**
 * Suspende o reactiva el acceso de una empresa SaaS y todos sus usuarios.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
export const suspenderEmpresa = async (req, res) => {
  const { id } = req.params;
  // Si en el body no se pasa estado_activo, se suspende (false)
  const nuevoEstado = req.body.estado_activo !== undefined ? Boolean(req.body.estado_activo) : false;

  try {
    const result = await pool.query(
      `UPDATE empresas
       SET estado_activo = $1
       WHERE id = $2
       RETURNING id, nombre_comercial, ruc, plan_suscripcion, estado_activo`,
      [nuevoEstado, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Empresa no encontrada.',
      });
    }

    const accion = nuevoEstado ? 'reactivada' : 'suspendida';

    return res.status(200).json({
      success: true,
      message: `Empresa ${accion} exitosamente.`,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('[empresaController] Error en suspenderEmpresa:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno al actualizar el estado de la empresa.',
    });
  }
};
