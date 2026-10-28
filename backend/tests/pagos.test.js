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
    query: jest.fn(),
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
});
