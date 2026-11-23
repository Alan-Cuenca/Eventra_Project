/**
 * Resumen comercial de un cliente a partir de las cotizaciones y eventos reales de la empresa.
 * Se usa en la ficha del Directorio de Clientes.
 */
const ESTADOS_EVENTO_ACTIVO = ['En Planificación', 'En Progreso'];

export const resumenCliente = (clienteId, cotizaciones = [], eventos = []) => {
  const id = String(clienteId ?? '');
  const cots = (cotizaciones || []).filter((c) => String(c.cliente_id) === id);
  const evs = (eventos || []).filter((e) => String(e.cliente_id) === id);
  const activos = evs.filter((e) => ESTADOS_EVENTO_ACTIVO.includes(e.estado_progreso));

  return {
    cotizaciones: cots.length,
    cotizacionesPendientes: cots.filter((c) => c.estado === 'Pendiente').length,
    eventos: evs.length,
    eventosActivos: activos.length,
    totalPagado: evs.reduce((suma, e) => suma + (Number(e.anticipo_pagado) || 0), 0),
    saldoPendiente: activos.reduce((suma, e) => suma + Math.max(Number(e.saldo_pendiente) || 0, 0), 0),
  };
};
