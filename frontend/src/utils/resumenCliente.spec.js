import { describe, it, expect } from 'vitest';
import { resumenCliente } from './resumenCliente';

describe('resumenCliente', () => {
  const cotizaciones = [
    { cliente_id: 'a', estado: 'Aprobada' },
    { cliente_id: 'a', estado: 'Pendiente' },
    { cliente_id: 'b', estado: 'Pendiente' },
  ];
  const eventos = [
    { cliente_id: 'a', estado_progreso: 'En Planificación', anticipo_pagado: '2450.00', saldo_pendiente: '2450.00' },
    { cliente_id: 'a', estado_progreso: 'Finalizado', anticipo_pagado: '1000.00', saldo_pendiente: '0.00' },
    { cliente_id: 'b', estado_progreso: 'En Progreso', anticipo_pagado: '99.00', saldo_pendiente: '1.00' },
  ];

  it('cuenta solo los datos del cliente indicado', () => {
    expect(resumenCliente('a', cotizaciones, eventos)).toEqual({
      cotizaciones: 2,
      cotizacionesPendientes: 1,
      eventos: 2,
      eventosActivos: 1,
      totalPagado: 3450,
      saldoPendiente: 2450,
    });
  });

  it('devuelve ceros para un cliente sin historial o sin datos cargados', () => {
    expect(resumenCliente('z', cotizaciones, eventos)).toMatchObject({ cotizaciones: 0, eventosActivos: 0, totalPagado: 0, saldoPendiente: 0 });
    expect(resumenCliente('a')).toMatchObject({ cotizaciones: 0, eventos: 0 });
  });
});
