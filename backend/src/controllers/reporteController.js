import pool from '../config/db.js';

/**
 * Genera el resumen consolidado de reportes analíticos con membrete corporativo.
 *
 * RBAC: Exclusivo para Administrador (1) y Gerente (2).
 * Excluye a Super_Admin (5) para proteger la privacidad y aislamiento multi-tenant.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
export const obtenerResumenReportes = async (req, res) => {
  const rolId = Number(req.user.rol_id);
  const empresa_id = req.user.empresa_id;

  // Validar RBAC estricto
  if (rolId === 5 || !empresa_id) {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Los reportes corporativos están reservados exclusivamente para Administradores y Gerentes de la empresa.',
    });
  }

  if (rolId !== 1 && rolId !== 2) {
    return res.status(403).json({
      success: false,
      message: 'No posees permisos suficientes para acceder al módulo de reportes.',
    });
  }

  try {
    // Ejecución en paralelo de consultas especializadas
    const [
      empresaResult,
      ingresosTendenciaResult,
      ingresosMetodoResult,
      transaccionesResult,
      eventosPorEstadoResult,
      eventosListadoResult,
      saldosResult,
    ] = await Promise.all([
      // 1. Membrete de la Empresa
      pool.query(
        `SELECT id, nombre_comercial, ruc, slug, plan_suscripcion, logo_url
         FROM empresas
         WHERE id = $1`,
        [empresa_id]
      ),

      // 2. Reporte de Ingresos — Tendencia Mensual
      pool.query(
        `SELECT
           TO_CHAR(COALESCE(fecha_pago, fecha_registro), 'YYYY-MM') AS periodo,
           TO_CHAR(COALESCE(fecha_pago, fecha_registro), 'Mon YYYY') AS mes_etiqueta,
           COALESCE(SUM(monto), 0)::numeric AS total_ingresos,
           COALESCE(SUM(CASE WHEN metodo_pago = 'Deuna' THEN monto ELSE 0 END), 0)::numeric AS deuna,
           COALESCE(SUM(CASE WHEN metodo_pago = 'Transferencia' THEN monto ELSE 0 END), 0)::numeric AS transferencia,
           COALESCE(SUM(CASE WHEN metodo_pago = 'Efectivo' THEN monto ELSE 0 END), 0)::numeric AS efectivo,
           COUNT(*)::integer AS total_transacciones
         FROM pagos
         WHERE empresa_id = $1
           AND estado IN ('Aprobado', 'Completado')
         GROUP BY TO_CHAR(COALESCE(fecha_pago, fecha_registro), 'YYYY-MM'), TO_CHAR(COALESCE(fecha_pago, fecha_registro), 'Mon YYYY')
         ORDER BY periodo ASC`,
        [empresa_id]
      ),

      // 3. Reporte de Ingresos — Por Método de Pago
      pool.query(
        `SELECT
           COALESCE(metodo_pago, 'Otros') AS metodo_pago,
           COALESCE(SUM(monto), 0)::numeric AS total,
           COUNT(*)::integer AS transacciones
         FROM pagos
         WHERE empresa_id = $1
           AND estado IN ('Aprobado', 'Completado')
         GROUP BY metodo_pago
         ORDER BY total DESC`,
        [empresa_id]
      ),

      // 4. Reporte de Ingresos — Transacciones Detalladas
      pool.query(
        `SELECT
           p.id,
           p.monto::numeric AS monto,
           p.concepto,
           p.metodo_pago,
           COALESCE(p.fecha_pago, p.fecha_registro) AS fecha,
           p.estado,
           e.titulo AS evento_titulo,
           CONCAT(cl.nombres, ' ', cl.apellidos) AS cliente_nombre
         FROM pagos p
         JOIN eventos e ON p.evento_id = e.id
         LEFT JOIN reservas r ON e.reserva_id = r.id
         LEFT JOIN cotizaciones c ON r.cotizacion_id = c.id
         LEFT JOIN clientes cl ON c.cliente_id = cl.id
         WHERE p.empresa_id = $1
           AND p.estado IN ('Aprobado', 'Completado')
         ORDER BY fecha DESC
         LIMIT 100`,
        [empresa_id]
      ),

      // 5. Reporte Operativo de Eventos — Conteo por Estado de Progreso
      pool.query(
        `SELECT
           COALESCE(estado_progreso, 'En Planificación') AS estado_progreso,
           COUNT(*)::integer AS total
         FROM eventos
         WHERE empresa_id = $1
         GROUP BY estado_progreso
         ORDER BY total DESC`,
        [empresa_id]
      ),

      // 6. Reporte Operativo de Eventos — Listado Completo
      pool.query(
        `SELECT
           e.id,
           e.titulo,
           e.estado_progreso,
           r.fecha_evento,
           r.salon_o_lugar,
           CONCAT(cl.nombres, ' ', cl.apellidos) AS cliente_nombre,
           cl.email AS cliente_email,
           COALESCE(c.total_calculado, 0)::numeric AS costo_total
         FROM eventos e
         LEFT JOIN reservas r ON e.reserva_id = r.id
         LEFT JOIN cotizaciones c ON r.cotizacion_id = c.id
         LEFT JOIN clientes cl ON c.cliente_id = cl.id
         WHERE e.empresa_id = $1
         ORDER BY r.fecha_evento ASC NULLS LAST, e.fecha_creacion DESC`,
        [empresa_id]
      ),

      // 7. Reporte de Saldos Pendientes (Cuentas por Cobrar)
      pool.query(
        `SELECT
           e.id AS evento_id,
           e.titulo AS evento_titulo,
           e.estado_progreso,
           r.fecha_evento,
           r.salon_o_lugar,
           CONCAT(cl.nombres, ' ', cl.apellidos) AS cliente_nombre,
           cl.email AS cliente_email,
           cl.telefono AS cliente_telefono,
           COALESCE(c.total_calculado, 0)::numeric AS costo_total,
           COALESCE(pagos_sub.total_pagado, 0)::numeric AS total_abonado,
           GREATEST(0, COALESCE(c.total_calculado, 0) - COALESCE(pagos_sub.total_pagado, 0))::numeric AS saldo_pendiente,
           CASE
             WHEN COALESCE(c.total_calculado, 0) = 0 THEN 'Sin Cotización'
             WHEN COALESCE(pagos_sub.total_pagado, 0) >= COALESCE(c.total_calculado, 0) THEN 'Pagado'
             WHEN COALESCE(pagos_sub.total_pagado, 0) > 0 THEN 'Abonado Parcial'
             ELSE 'Sin Abonos'
           END AS estado_pago
         FROM eventos e
         LEFT JOIN reservas r ON e.reserva_id = r.id
         LEFT JOIN cotizaciones c ON r.cotizacion_id = c.id
         LEFT JOIN clientes cl ON c.cliente_id = cl.id
         LEFT JOIN (
           SELECT evento_id, SUM(monto) AS total_pagado
           FROM pagos
           WHERE empresa_id = $1
             AND estado IN ('Aprobado', 'Completado')
           GROUP BY evento_id
         ) pagos_sub ON e.id = pagos_sub.evento_id
         WHERE e.empresa_id = $1
         ORDER BY saldo_pendiente DESC, r.fecha_evento ASC NULLS LAST`,
        [empresa_id]
      ),
    ]);

    // Membrete enriquecido
    const empresaData = empresaResult.rows[0] || {
      id: empresa_id,
      nombre_comercial: 'Empresa de Eventos',
      ruc: '0000000000001',
      slug: 'empresa',
      plan_suscripcion: 'Basico',
      logo_url: '/logo_Helados_Catedral.jpg',
    };

    if (!empresaData.logo_url) {
      empresaData.logo_url = '/logo_Helados_Catedral.jpg';
    }

    // Totales calculados
    const saldosRows = saldosResult.rows;
    const transaccionesRows = transaccionesResult.rows;

    const totalRecaudado = transaccionesRows.reduce((acc, curr) => acc + Number(curr.monto || 0), 0);
    const totalSaldosPendientes = saldosRows.reduce((acc, curr) => acc + Number(curr.saldo_pendiente || 0), 0);
    const totalEventos = eventosListadoResult.rowCount;
    const eventosActivos = eventosListadoResult.rows.filter(
      (e) => e.estado_progreso === 'En Planificación' || e.estado_progreso === 'En Progreso'
    ).length;

    return res.status(200).json({
      success: true,
      membrete: {
        empresa_id: empresaData.id,
        nombre_comercial: empresaData.nombre_comercial,
        ruc: empresaData.ruc || 'N/A',
        slug: empresaData.slug,
        plan_suscripcion: empresaData.plan_suscripcion,
        logo_url: empresaData.logo_url,
        fecha_emision: new Date().toISOString(),
        usuario_responsable: req.user.nombre_completo || req.user.email,
      },
      kpis: {
        total_recaudado: totalRecaudado,
        total_saldos_pendientes: totalSaldosPendientes,
        total_eventos: totalEventos,
        eventos_activos: eventosActivos,
      },
      reporte_ingresos: {
        tendencia_mensual: ingresosTendenciaResult.rows,
        por_metodo: ingresosMetodoResult.rows,
        transacciones: transaccionesRows,
      },
      reporte_eventos: {
        por_estado: eventosPorEstadoResult.rows,
        listado: eventosListadoResult.rows,
      },
      reporte_saldos: {
        listado: saldosRows,
      },
    });

  } catch (error) {
    console.error('[reporteController] Error en obtenerResumenReportes:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al consolidar los reportes corporativos.',
    });
  }
};
