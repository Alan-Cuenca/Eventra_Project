/**
 * pagos.test.js
 * ====================================================================
 * Pruebas Unitarias y de Integración: Módulo de Pagos y Anticipos
 * ====================================================================
 */

import request from 'supertest';
import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';

process.env.JWT_SECRET = 'test_secret_eventra_pagos';
process.env.NODE_ENV   = 'test';
process.env.PORT       = '0';

const TEST_SECRET = 'test_secret_eventra_pagos';

// Mock de la base de datos PostgreSQL
jest.unstable_mockModule('../src/config/db.js', () => ({
  default: {
    query: jest.fn(async () => ({ rows: [], rowCount: 0 })),
    connect: jest.fn(),
  },
}));

// Mock de Supabase Storage
jest.unstable_mockModule('../src/config/supabase.js', () => ({
  supabase: {
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({ data: { path: '1/fake.png' }, error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://supabase.co/storage/v1/object/public/comprobantes/1/fake.png' } }),
      })),
    },
  },
}));

// Mock de OpenAI
jest.unstable_mockModule('openai', () => ({
  default: class {
    chat = { completions: { create: jest.fn() } };
  },
}));

const { default: app }  = await import('../src/app.js');
const { default: pool } = await import('../src/config/db.js');

// Tokens para pruebas
const TOKEN_ADMIN_EMPRESA_1 = jwt.sign(
  { id: 'usr-admin-1', empresa_id: 1, rol_id: 1, rol: 'Administrador', email: 'admin@empresa1.com' },
  TEST_SECRET,
  { expiresIn: '1h' }
);

const TOKEN_CLIENTE_EMPRESA_1 = jwt.sign(
  { id: 'usr-cliente-1', empresa_id: 1, rol_id: 4, rol: 'Cliente', email: 'cliente@empresa1.com' },
  TEST_SECRET,
  { expiresIn: '1h' }
);

const TOKEN_TRABAJADOR_EMPRESA_1 = jwt.sign(
  { id: 'usr-trabajador-1', empresa_id: 1, rol_id: 3, rol: 'Trabajador', email: 'trabajador@empresa1.com' },
  TEST_SECRET,
  { expiresIn: '1h' }
);

describe('Módulo de Pagos y Anticipos — EVENTRA', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/pagos — Registro de pagos y prevención IDOR', () => {
    it('debe bloquear con 404 si el evento_id no pertenece a la empresa en sesión (Anti-IDOR)', async () => {
      // Evento no encontrado para empresa_id = 1
      pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

      const res = await request(app)
        .post('/api/pagos')
        .set('Authorization', `Bearer ${TOKEN_ADMIN_EMPRESA_1}`)
        .field('evento_id', 'evento-ajeno-uuid')
        .field('monto', '150.00')
        .field('concepto', 'Anticipo')
        .field('metodo_pago', 'Efectivo');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/no existe o no pertenece/i);
    });

    it('debe registrar un pago en "Efectivo" con estado "Pendiente" e ignorar comprobante', async () => {
      // 1. Check evento
      pool.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 'evento-valido-uuid' }] });
      // 2. Insert pago
      pool.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{
          id: 'pago-uuid-1',
          empresa_id: 1,
          evento_id: 'evento-valido-uuid',
          monto: 200.00,
          concepto: 'Anticipo',
          metodo_pago: 'Efectivo',
          estado: 'Pendiente',
          comprobante_url: null,
          fecha_pago: '2026-10-28',
        }]
      });

      const res = await request(app)
        .post('/api/pagos')
        .set('Authorization', `Bearer ${TOKEN_CLIENTE_EMPRESA_1}`)
        .field('evento_id', 'evento-valido-uuid')
        .field('monto', '200.00')
        .field('concepto', 'Anticipo')
        .field('metodo_pago', 'Efectivo');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.estado).toBe('Pendiente');
      expect(res.body.data.comprobante_url).toBeNull();
    });

    it('debe exigir comprobante si el método es Deuna o Transferencia', async () => {
      pool.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 'evento-valido-uuid' }] });

      const res = await request(app)
        .post('/api/pagos')
        .set('Authorization', `Bearer ${TOKEN_CLIENTE_EMPRESA_1}`)
        .field('evento_id', 'evento-valido-uuid')
        .field('monto', '350.00')
        .field('concepto', 'Anticipo')
        .field('metodo_pago', 'Transferencia');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/comprobante es obligatorio/i);
    });

    it('debe subir comprobante y guardar estado "En Revisión" para Transferencia', async () => {
      // Check evento
      pool.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 'evento-valido-uuid' }] });
      // Insert pago
      pool.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{
          id: 'pago-uuid-2',
          empresa_id: 1,
          evento_id: 'evento-valido-uuid',
          monto: 350.00,
          concepto: 'Anticipo',
          metodo_pago: 'Transferencia',
          estado: 'En Revisión',
          comprobante_url: 'https://supabase.co/storage/v1/object/public/comprobantes/1/fake.png',
        }]
      });

      const res = await request(app)
        .post('/api/pagos')
        .set('Authorization', `Bearer ${TOKEN_CLIENTE_EMPRESA_1}`)
        .field('evento_id', 'evento-valido-uuid')
        .field('monto', '350.00')
        .field('concepto', 'Anticipo')
        .field('metodo_pago', 'Transferencia')
        .attach('comprobante', Buffer.from('fake image content'), 'recibo.png');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.estado).toBe('En Revisión');
      expect(res.body.data.comprobante_url).toBeTruthy();
    });
  });

  describe('PUT /api/pagos/:id/estado — Aprobación y Rechazo RBAC', () => {
    it('debe permitir a Administrador actualizar estado a "Aprobado"', async () => {
      pool.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id: 'pago-uuid-2', estado: 'Aprobado' }]
      });

      const res = await request(app)
        .put('/api/pagos/pago-uuid-2/estado')
        .set('Authorization', `Bearer ${TOKEN_ADMIN_EMPRESA_1}`)
        .send({ estado: 'Aprobado' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.estado).toBe('Aprobado');
    });

    it('debe bloquear con 403 a Trabajadores (rol_id = 3) al intentar aprobar pagos', async () => {
      const res = await request(app)
        .put('/api/pagos/pago-uuid-2/estado')
        .set('Authorization', `Bearer ${TOKEN_TRABAJADOR_EMPRESA_1}`)
        .send({ estado: 'Aprobado' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // SUITE 3: Reducción Matemática de Saldo Pendiente (Scope: Pablo)
  // ───────────────────────────────────────────────────────────────────────────
  describe('Cálculo y Reducción Matemática del Saldo Pendiente de la Cotización', () => {
    const EVENTO_ID = 'evento-balance-test-uuid';
    const COTIZACION_TOTAL = 2500.00;

    it('debe aprobar el pago exitosamente y reflejar la reducción matemática en el saldo pendiente', async () => {
      const PAGO_1_MONTO = 750.00;
      const SALDO_ESPERADO_1 = COTIZACION_TOTAL - PAGO_1_MONTO; // 1750.00

      // 1. Simular PUT /api/pagos/:id/estado -> Aprobado
      pool.query
        // UPDATE pagos
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [{
            id: 'pago-01',
            empresa_id: 1,
            evento_id: EVENTO_ID,
            monto: PAGO_1_MONTO,
            estado: 'Aprobado',
          }],
        })
        // Consulta para notificación por correo
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [{
            monto: PAGO_1_MONTO,
            evento_titulo: 'Gala Anual Corporativa',
            cliente_email: 'cliente@empresa1.com',
          }],
        });

      const resAprobacion = await request(app)
        .put('/api/pagos/pago-01/estado')
        .set('Authorization', `Bearer ${TOKEN_ADMIN_EMPRESA_1}`)
        .send({ estado: 'Aprobado' });

      expect(resAprobacion.status).toBe(200);
      expect(resAprobacion.body.success).toBe(true);
      expect(resAprobacion.body.data.estado).toBe('Aprobado');

      // 2. Consultar el resumen de pagos del evento
      pool.query
        // SELECT pagos individuales
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [{
            id: 'pago-01',
            monto: PAGO_1_MONTO,
            estado: 'Aprobado',
            concepto: 'Anticipo',
          }],
        })
        // SELECT SUM(monto) AS total_pagado
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [{
            total_pagado: PAGO_1_MONTO,
            cantidad_pagos: 1,
          }],
        });

      const resPagos = await request(app)
        .get(`/api/pagos/evento/${EVENTO_ID}`)
        .set('Authorization', `Bearer ${TOKEN_ADMIN_EMPRESA_1}`);

      expect(resPagos.status).toBe(200);
      expect(resPagos.body.resumen.total_pagado).toBe(PAGO_1_MONTO);
      expect(resPagos.body.resumen.cantidad_pagos).toBe(1);

      // Verificación matemática del saldo pendiente en base a la cotización
      const totalPagado = Number(resPagos.body.resumen.total_pagado);
      const saldoPendienteCalculado = COTIZACION_TOTAL - totalPagado;
      expect(saldoPendienteCalculado).toBe(SALDO_ESPERADO_1);
      expect(saldoPendienteCalculado).toBe(1750.00);
    });

    it('debe acumular múltiples pagos aprobados y reducir el saldo restante a cero tras liquidación', async () => {
      const PAGO_1_MONTO = 1500.00;
      const PAGO_2_MONTO = 1000.00;
      const TOTAL_PAGADO = PAGO_1_MONTO + PAGO_2_MONTO; // 2500.00
      const SALDO_ESPERADO = COTIZACION_TOTAL - TOTAL_PAGADO; // 0.00

      pool.query
        // Pagos individuales
        .mockResolvedValueOnce({
          rowCount: 2,
          rows: [
            { id: 'pago-01', monto: PAGO_1_MONTO, estado: 'Aprobado' },
            { id: 'pago-02', monto: PAGO_2_MONTO, estado: 'Aprobado' },
          ],
        })
        // SUM(monto)
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [{
            total_pagado: TOTAL_PAGADO,
            cantidad_pagos: 2,
          }],
        });

      const res = await request(app)
        .get(`/api/pagos/evento/${EVENTO_ID}`)
        .set('Authorization', `Bearer ${TOKEN_ADMIN_EMPRESA_1}`);

      expect(res.status).toBe(200);
      expect(res.body.resumen.total_pagado).toBe(2500.00);
      expect(COTIZACION_TOTAL - Number(res.body.resumen.total_pagado)).toBe(SALDO_ESPERADO);
      expect(COTIZACION_TOTAL - Number(res.body.resumen.total_pagado)).toBe(0.00);
    });

    it('pagos con estado "Rechazado" o "En Revisión" no deben reducir el saldo pendiente', async () => {
      // 1 pago Aprobado (500) y 1 Rechazado (800)
      const PAGO_APROBADO = 500.00;
      const PAGO_RECHAZADO = 800.00;

      pool.query
        // Pagos individuales
        .mockResolvedValueOnce({
          rowCount: 2,
          rows: [
            { id: 'pago-01', monto: PAGO_APROBADO, estado: 'Aprobado' },
            { id: 'pago-02', monto: PAGO_RECHAZADO, estado: 'Rechazado' },
          ],
        })
        // SUM solo cuenta los de estado 'Aprobado'
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [{
            total_pagado: PAGO_APROBADO, // solo 500
            cantidad_pagos: 1,
          }],
        });

      const res = await request(app)
        .get(`/api/pagos/evento/${EVENTO_ID}`)
        .set('Authorization', `Bearer ${TOKEN_ADMIN_EMPRESA_1}`);

      expect(res.status).toBe(200);
      expect(res.body.resumen.total_pagado).toBe(500.00);
      // El saldo pendiente debe ser 2500 - 500 = 2000 (el pago de 800 no cuenta)
      const saldoPendiente = COTIZACION_TOTAL - Number(res.body.resumen.total_pagado);
      expect(saldoPendiente).toBe(2000.00);
      expect(saldoPendiente).not.toBe(COTIZACION_TOTAL - (PAGO_APROBADO + PAGO_RECHAZADO));
    });
  });
});
