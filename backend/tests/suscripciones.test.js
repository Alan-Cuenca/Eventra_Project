/**
 * suscripciones.test.js
 * ====================================================================
 * Pruebas: Módulo de Suscripciones SaaS y Facturación Global
 * ====================================================================
 */

import request from 'supertest';
import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';

process.env.JWT_SECRET = 'test_secret_eventra_suscripciones';
process.env.NODE_ENV   = 'test';
process.env.PORT       = '0';

const TEST_SECRET = 'test_secret_eventra_suscripciones';

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
        upload: jest.fn().mockResolvedValue({ data: { path: 'suscripciones/1/fake.png' }, error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://supabase.co/storage/v1/object/public/comprobantes/suscripciones/1/fake.png' } }),
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

const TOKEN_SUPER_ADMIN = jwt.sign(
  { id: 'usr-superadmin', rol_id: 5, rol: 'Super_Admin', email: 'superadmin@eventra.com' },
  TEST_SECRET,
  { expiresIn: '1h' }
);

const TOKEN_ADMIN_EMPRESA_1 = jwt.sign(
  { id: 'usr-admin-empresa-1', empresa_id: 1, rol_id: 1, rol: 'Administrador', email: 'admin@empresa1.com' },
  TEST_SECRET,
  { expiresIn: '1h' }
);

const TOKEN_CLIENTE_EMPRESA_1 = jwt.sign(
  { id: 'usr-cliente-empresa-1', empresa_id: 1, rol_id: 4, rol: 'Cliente', email: 'cliente@empresa1.com' },
  TEST_SECRET,
  { expiresIn: '1h' }
);

describe('Módulo de Suscripciones y Facturación SaaS — EVENTRA', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/suscripciones/pagar', () => {
    it('debe registrar un pago de suscripción para la empresa en sesión con estado "En Revisión"', async () => {
      // 1. check empresa
      pool.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id: 1, nombre_comercial: 'Eventos del Norte', plan_suscripcion: 'Basico' }]
      });

      // 2. insert suscripciones_pagos
      pool.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{
          id: 'susc-uuid-1',
          empresa_id: 1,
          plan_nombre: 'Premium',
          monto: 99.00,
          comprobante_url: 'https://supabase.co/storage/v1/object/public/comprobantes/suscripciones/1/fake.png',
          estado: 'En Revisión',
          fecha_pago: '2026-10-28',
        }]
      });

      const res = await request(app)
        .post('/api/suscripciones/pagar')
        .set('Authorization', `Bearer ${TOKEN_ADMIN_EMPRESA_1}`)
        .field('plan_nombre', 'Premium')
        .field('monto', '99.00')
        .attach('comprobante', Buffer.from('mock voucher'), 'comprobante.png');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.estado).toBe('En Revisión');
      expect(res.body.data.plan_nombre).toBe('Premium');
    });

    it('debe rechazar a usuarios sin rol de administración o gerencia (ej. Cliente 4)', async () => {
      const res = await request(app)
        .post('/api/suscripciones/pagar')
        .set('Authorization', `Bearer ${TOKEN_CLIENTE_EMPRESA_1}`)
        .field('plan_nombre', 'Basico');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/suscripciones', () => {
    it('Super_Admin (5) recibe las suscripciones de todas las empresas', async () => {
      pool.query.mockResolvedValueOnce({
        rowCount: 2,
        rows: [
          { id: 's1', empresa_id: 1, plan_nombre: 'Premium', monto: 99.00, empresa_nombre: 'Empresa A' },
          { id: 's2', empresa_id: 2, plan_nombre: 'Basico', monto: 49.00, empresa_nombre: 'Empresa B' },
        ]
      });

      const res = await request(app)
        .get('/api/suscripciones')
        .set('Authorization', `Bearer ${TOKEN_SUPER_ADMIN}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.total).toBe(2);
    });

    it('Administrador (1) recibe únicamente las suscripciones de su empresa', async () => {
      pool.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [
          { id: 's1', empresa_id: 1, plan_nombre: 'Basico', monto: 49.00, empresa_nombre: 'Empresa A' },
        ]
      });

      const res = await request(app)
        .get('/api/suscripciones')
        .set('Authorization', `Bearer ${TOKEN_ADMIN_EMPRESA_1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.total).toBe(1);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE sp.empresa_id = $1'),
        [1]
      );
    });
  });

  describe('PUT /api/suscripciones/:id/estado', () => {
    it('Super_Admin puede aprobar la suscripción y renueva el plan de la empresa', async () => {
      // 1. SELECT suscripciones_pagos
      pool.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id: 'susc-uuid-1', empresa_id: 1, plan_nombre: 'Premium', monto: 99.00 }]
      });

      // 2. UPDATE suscripciones_pagos
      pool.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id: 'susc-uuid-1', estado: 'Aprobado', plan_nombre: 'Premium' }]
      });

      // 3. UPDATE empresas
      pool.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id: 1, plan_suscripcion: 'Premium', estado_activo: true }]
      });

      const res = await request(app)
        .put('/api/suscripciones/susc-uuid-1/estado')
        .set('Authorization', `Bearer ${TOKEN_SUPER_ADMIN}`)
        .send({ estado: 'Aprobado' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.estado).toBe('Aprobado');
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE empresas'),
        ['Premium', 1]
      );
    });

    it('Bloquea con 401/403 a usuarios que no sean Super_Admin', async () => {
      const res = await request(app)
        .put('/api/suscripciones/susc-uuid-1/estado')
        .set('Authorization', `Bearer ${TOKEN_ADMIN_EMPRESA_1}`)
        .send({ estado: 'Aprobado' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});

