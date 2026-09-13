import pool from '../config/db.js';

/**
 * Genera el resumen ejecutivo para el panel de control Admin/Gerente.
 *
 * Ejecuta 4 consultas en paralelo con Promise.all para maximizar el rendimiento,
 * filtrando siempre por empresa_id del JWT (aislamiento SaaS).
 *
 * Indicadores retornados:
 *   1. total_eventos_activos  — Eventos en estado 'En Planificación' o 'En Progreso'
 *   2. total_clientes         — Clientes activos registrados en la empresa
 *   3. ingresos_totales       — Suma de todos los pagos con estado 'Completado'
 *   4. tareas_pendientes      — Actividades en estado 'Pendiente'
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
export const obtenerResumenAdmin = async (req, res) => {
  const empresa_id = req.user.empresa_id;

  try {
    // --- Ejecución paralela de las 4 consultas de KPIs ---
    const [
      eventosResult,
      clientesResult,
      ingresosResult,
      tareasResult,
    ] = await Promise.all([

      // 1. Total de eventos activos (En Planificación o En Progreso)
      pool.query(
        `SELECT COUNT(*) AS total_eventos_activos
         FROM eventos
         WHERE empresa_id     = $1
           AND estado_progreso IN ('En Planificación', 'En Progreso')`,
        [empresa_id]
      ),

      // 2. Total de clientes registrados y activos
      pool.query(
        `SELECT COUNT(*) AS total_clientes
         FROM clientes
         WHERE empresa_id   = $1
           AND estado_activo = true`,
        [empresa_id]
      ),

      // 3. Ingresos totales de pagos completados
      pool.query(
        `SELECT COALESCE(SUM(monto), 0) AS ingresos_totales
         FROM pagos
         WHERE empresa_id = $1
           AND estado     = 'Completado'`,
        [empresa_id]
      ),

      // 4. Total de actividades/tareas pendientes
      pool.query(
        `SELECT COUNT(*) AS tareas_pendientes
         FROM actividades
         WHERE empresa_id = $1
           AND estado     = 'Pendiente'`,
        [empresa_id]
      ),

    ]);

    return res.status(200).json({
      success: true,
      empresa_id,
      kpis: {
        total_eventos_activos: Number(eventosResult.rows[0].total_eventos_activos),
        total_clientes:        Number(clientesResult.rows[0].total_clientes),
        ingresos_totales:      Number(ingresosResult.rows[0].ingresos_totales),
        tareas_pendientes:     Number(tareasResult.rows[0].tareas_pendientes),
      },
    });

  } catch (error) {
    console.error('[dashboardController] Error en obtenerResumenAdmin:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener el resumen del dashboard.',
    });
  }
};
