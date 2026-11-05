/**
 * tenant.test.js — EVENTRA SaaS
 * =============================================================================
 * Scope: Jorge — Backend, Seguridad y Aislamiento Multi-Tenant (Anti-IDOR)
 * Verifica que un usuario con Rol 1 (Administrador de Tenant) no pueda consultar,
 * modificar ni alterar eventos, clientes o pagos pertenecientes a otra empresa (empresa_id).
 * =============================================================================
 */

import request from 'supertest';
import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';

process.env.JWT_SECRET = 'test_secret_eventra_jest';
process.env.NODE_ENV   = 'test';
process.env.PORT       = '0';

const TEST_SECRET = 'test_secret_eventra_jest';

let mockQueryHandler = null;

// Mock de PostgreSQL
jest.unstable_mockModule('../src/config/db.js', () => ({
  default: {
    query: jest.fn((sql, params) => {
      if (mockQueryHandler) {
        return mockQueryHandler(sql, params);
      }
      return Promise.resolve({ rows: [], rowCount: 0 });
    }),
    connect: jest.fn(),
  },
}));

// Mock de OpenAI
jest.unstable_mockModule('openai', () => ({
  default: class {
    chat = { completions: { create: jest.fn() } };
  },
}));

// Mock de Supabase
jest.unstable_mockModule('../src/config/supabase.js', () => ({
  supabase: {
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({ error: null }),
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://storage.supabase.co/fake.png' } })),
      })),
    },
  },
}));

const { default: app }  = await import('../src/app.js');
const { default: pool } = await import('../src/config/db.js');

// Tokens de prueba:
// Admin de Empresa 1
const TOKEN_ADMIN_TENANT_1 = jwt.sign(
  { id: 'uuid-admin-empresa-1', empresa_id: 1, rol_id: 1, email: 'admin@empresa1.com' },
  TEST_SECRET,
  { expiresIn: '1h' }
);

// Admin de Empresa 2
const TOKEN_ADMIN_TENANT_2 = jwt.sign(
  { id: 'uuid-admin-empresa-2', empresa_id: 2, rol_id: 1, email: 'admin@empresa2.com' },
  TEST_SECRET,
  { expiresIn: '1h' }
);

describe('Seguridad Multi-Tenant y Protección Anti-IDOR (Scope: Jorge)', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    mockQueryHandler = null;
  });

  // ───────────────────────────────────────────────────────────────────────────
  // SUITE 1: Aislamiento Multi-Tenant en EVENTOS
  // ───────────────────────────────────────────────────────────────────────────
  describe('Aislamiento en Módulo de Eventos (/api/eventos)', () => {

    it('IDOR Check: Admin Empresa 1 no puede consultar el detalle de un evento de Empresa 2', async () => {
      const EVENTO_ID_EMPRESA_2 = 'evento-uuid-tenant-2';

      mockQueryHandler = async (sql, params) => {
        const queryStr = typeof sql === 'string' ? sql : sql?.text || '';
        // El controlador ejecuta WHERE e.id = $1 AND e.empresa_id = $2
        if (queryStr.includes('WHERE e.id = $1') && queryStr.includes('e.empresa_id = $2')) {
          const [idParam, empresaParam] = params;
          if (idParam === EVENTO_ID_EMPRESA_2 && empresaParam === 1) {
            // Empresa 1 buscando evento ajeno -> no encuentra nada
            return { rows: [], rowCount: 0 };
          }
          if (idParam === EVENTO_ID_EMPRESA_2 && empresaParam === 2) {
            return { rows: [{ id: EVENTO_ID_EMPRESA_2, empresa_id: 2, titulo: 'Boda Empresa 2' }], rowCount: 1 };
          }
        }
        return { rows: [], rowCount: 0 };
      };

      const res = await request(app)
        .get(`/api/eventos/${EVENTO_ID_EMPRESA_2}`)
        .set('Authorization', `Bearer ${TOKEN_ADMIN_TENANT_1}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/no encontrado|no pertenece/i);
    });

    it('IDOR Check: Admin Empresa 1 no puede modificar el estado de un evento de Empresa 2', async () => {
      const EVENTO_ID_EMPRESA_2 = 'evento-uuid-tenant-2';

      mockQueryHandler = async (sql, params) => {
        const queryStr = typeof sql === 'string' ? sql : sql?.text || '';
        if (queryStr.includes('UPDATE eventos') && queryStr.includes('empresa_id = $3')) {
          const [, idParam, empresaParam] = params;
          if (idParam === EVENTO_ID_EMPRESA_2 && empresaParam === 1) {
            // Filtrado por empresa_id previene la modificación
            return { rows: [], rowCount: 0 };
          }
        }
        return { rows: [], rowCount: 0 };
      };

      const res = await request(app)
        .patch(`/api/eventos/${EVENTO_ID_EMPRESA_2}/estado`)
        .set('Authorization', `Bearer ${TOKEN_ADMIN_TENANT_1}`)
        .send({ estado_progreso: 'En Progreso' });

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/no pertenece a tu empresa|no encontrado/i);
    });

  });

  // ───────────────────────────────────────────────────────────────────────────
  // SUITE 2: Aislamiento Multi-Tenant en CLIENTES
  // ───────────────────────────────────────────────────────────────────────────
  describe('Aislamiento en Módulo de Clientes (/api/clientes)', () => {

    it('IDOR Check: Admin Empresa 1 no puede modificar los datos de un cliente de Empresa 2', async () => {
      const CLIENTE_ID_EMPRESA_2 = 'cliente-uuid-tenant-2';

      mockQueryHandler = async (sql, params) => {
        const queryStr = typeof sql === 'string' ? sql : sql?.text || '';
        if (queryStr.includes('UPDATE clientes') && queryStr.includes('empresa_id = $7')) {
          const idParam = params[5];
          const empresaParam = params[6];
          if (idParam === CLIENTE_ID_EMPRESA_2 && empresaParam === 1) {
            return { rows: [], rowCount: 0 };
          }
        }
        return { rows: [], rowCount: 0 };
      };

      const res = await request(app)
        .put(`/api/clientes/${CLIENTE_ID_EMPRESA_2}`)
        .set('Authorization', `Bearer ${TOKEN_ADMIN_TENANT_1}`)
        .send({
          nombres: 'Cliente Alterado',
          apellidos: 'Ilegalmente',
          email: 'hack@empresa2.com',
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/no pertenece a la empresa|no encontrado/i);
    });

    it('Aislamiento de lectura: Admin Empresa 1 solo recibe clientes vinculados a su empresa_id', async () => {
      mockQueryHandler = async (sql, params) => {
        const queryStr = typeof sql === 'string' ? sql : sql?.text || '';
        if (queryStr.includes('FROM clientes') && queryStr.includes('empresa_id = $1')) {
          const [empresaParam] = params;
          if (empresaParam === 1) {
            return {
              rows: [
                { id: 'cl-1', empresa_id: 1, nombres: 'Carlos', apellidos: 'Tenorio' },
                { id: 'cl-2', empresa_id: 1, nombres: 'Diana', apellidos: 'Quispe' },
              ],
              rowCount: 2,
            };
          }
        }
        return { rows: [], rowCount: 0 };
      };

      const res = await request(app)
        .get('/api/clientes')
        .set('Authorization', `Bearer ${TOKEN_ADMIN_TENANT_1}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data.every((c) => c.empresa_id === 1)).toBe(true);
    });

  });

  // ───────────────────────────────────────────────────────────────────────────
  // SUITE 3: Aislamiento Multi-Tenant en PAGOS
  // ───────────────────────────────────────────────────────────────────────────
  describe('Aislamiento en Módulo de Pagos (/api/pagos)', () => {

    it('IDOR Check: Admin Empresa 1 no puede registrar un pago en un evento ajeno', async () => {
      const EVENTO_ID_EMPRESA_2 = 'evento-uuid-tenant-2';

      mockQueryHandler = async (sql, params) => {
        const queryStr = typeof sql === 'string' ? sql : sql?.text || '';
        // Valida si el evento pertenece a la empresa
        if (queryStr.includes('SELECT id FROM eventos WHERE id = $1 AND empresa_id = $2')) {
          const [evId, empId] = params;
          if (evId === EVENTO_ID_EMPRESA_2 && empId === 1) {
            return { rows: [], rowCount: 0 }; // Empresa 1 no es dueña del evento
          }
        }
        return { rows: [], rowCount: 0 };
      };

      const res = await request(app)
        .post('/api/pagos')
        .set('Authorization', `Bearer ${TOKEN_ADMIN_TENANT_1}`)
        .send({
          evento_id: EVENTO_ID_EMPRESA_2,
          monto: 350.00,
          concepto: 'Anticipo',
          metodo_pago: 'Efectivo',
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/no existe o no pertenece a su empresa/i);
    });

    it('IDOR Check: Admin Empresa 1 no puede aprobar ni alterar el estado de un pago de Empresa 2', async () => {
      const PAGO_ID_EMPRESA_2 = 'pago-uuid-tenant-2';

      mockQueryHandler = async (sql, params) => {
        const queryStr = typeof sql === 'string' ? sql : sql?.text || '';
        if (queryStr.includes('UPDATE pagos') && queryStr.includes('empresa_id = $3')) {
          const [, pagoId, empId] = params;
          if (pagoId === PAGO_ID_EMPRESA_2 && empId === 1) {
            return { rows: [], rowCount: 0 };
          }
        }
        return { rows: [], rowCount: 0 };
      };

      const res = await request(app)
        .put(`/api/pagos/${PAGO_ID_EMPRESA_2}/estado`)
        .set('Authorization', `Bearer ${TOKEN_ADMIN_TENANT_1}`)
        .send({ estado: 'Aprobado' });

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/no encontrado o no pertenece a la empresa/i);
    });

  });

});
