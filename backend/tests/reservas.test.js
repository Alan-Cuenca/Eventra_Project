/**
 * reservas.test.js — EVENTRA SaaS
 * =============================================================================
 * Scope: Pablo — Pruebas Funcionales, Reglas de Negocio y Motor Anti-Colisiones
 * Verifica la mitigación estricta de colisiones de reservas en salón y fecha:
 * - Capa de Aplicación: Validación previa con SELECT COUNT (HTTP 409 Conflict)
 * - Capa de Persistencia: Captura de UNIQUE constraint PostgreSQL (HTTP 409 Conflict)
 * - Concurrencia y Aislamiento Multi-Tenant
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

const { default: app }  = await import('../src/app.js');
const { default: pool } = await import('../src/config/db.js');

// Token JWT de prueba para Administrador de Empresa 1
const TOKEN_ADMIN = jwt.sign(
  { id: 'uuid-admin-pablo', empresa_id: 1, rol_id: 1, email: 'admin@eventra.com' },
  TEST_SECRET,
  { expiresIn: '1h' }
);

describe('Motor Anti-Colisiones de Reservas — EVENTRA (Scope: Pablo)', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    mockQueryHandler = null;
  });

  const SALON = 'Salón Diamante Imperial';
  const FECHA = '2027-10-15';
  const COTIZACION_ID = 'cot-uuid-valida-01';

  // ───────────────────────────────────────────────────────────────────────────
  // SUITE 1: Motor Anti-Colisiones (Misma Fecha y Mismo Salón)
  // ───────────────────────────────────────────────────────────────────────────
  describe('Detección y Prevención de Doble Reserva (Regla de Negocio)', () => {

    it('201 — Registra exitosamente la primera reserva cuando el salón está disponible', async () => {
      mockQueryHandler = async (sql, params) => {
        const queryStr = typeof sql === 'string' ? sql : sql?.text || '';

        // 1. Verificación IDOR de cotización
        if (queryStr.includes('FROM cotizaciones WHERE id = $1')) {
          return { rows: [{ id: COTIZACION_ID, empresa_id: 1 }], rowCount: 1 };
        }

        // 2. Control de concurrencia: disponibilidad del salón (0 colisiones)
        if (queryStr.includes('FROM reservas') && queryStr.includes('COUNT(*)')) {
          return { rows: [{ total: '0' }], rowCount: 1 };
        }

        // 3. Inserción de la reserva
        if (queryStr.includes('INSERT INTO reservas')) {
          return {
            rows: [{
              id: 'reserva-uuid-001',
              empresa_id: 1,
              cotizacion_id: COTIZACION_ID,
              salon_o_lugar: SALON,
              fecha_evento: FECHA,
              hora_inicio: '18:00',
              hora_fin: '23:30',
              estado: 'Confirmada',
              fecha_creacion: new Date().toISOString(),
            }],
            rowCount: 1,
          };
        }

        return { rows: [], rowCount: 0 };
      };

      const res = await request(app)
        .post('/api/reservas')
        .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
        .send({
          cotizacion_id: COTIZACION_ID,
          salon_o_lugar: SALON,
          fecha_evento: FECHA,
          hora_inicio: '18:00',
          hora_fin: '23:30',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.salon_o_lugar).toBe(SALON);
      expect(res.body.data.fecha_evento).toBe(FECHA);
      expect(res.body.data.estado).toBe('Confirmada');
    });

    it('409 (Conflicto) — Bloquea el segundo intento de reserva para el MISMO salón en la MISMA fecha', async () => {
      mockQueryHandler = async (sql, params) => {
        const queryStr = typeof sql === 'string' ? sql : sql?.text || '';

        // 1. Cotización válida
        if (queryStr.includes('FROM cotizaciones WHERE id = $1')) {
          return { rows: [{ id: 'cot-uuid-segunda', empresa_id: 1 }], rowCount: 1 };
        }

        // 2. Control de colisión: ya existe 1 reserva confirmada para este salón y fecha
        if (queryStr.includes('FROM reservas') && queryStr.includes('COUNT(*)')) {
          const [, salonParam, fechaParam] = params;
          if (salonParam === SALON && fechaParam === FECHA) {
            return { rows: [{ total: '1' }], rowCount: 1 }; // Colisión detectada
          }
        }

        return { rows: [], rowCount: 0 };
      };

      const res = await request(app)
        .post('/api/reservas')
        .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
        .send({
          cotizacion_id: 'cot-uuid-segunda',
          salon_o_lugar: SALON,
          fecha_evento: FECHA,
          hora_inicio: '19:00',
          hora_fin: '01:00',
        });

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/conflicto/i);
      expect(res.body.message).toMatch(new RegExp(SALON, 'i'));
      expect(res.body.message).toMatch(/ya se encuentra reservado/i);
    });

    it('409 (Conflicto BD) — Captura la violación de unicidad UNIQUE(empresa_id, salon, fecha) ante condición de carrera', async () => {
      mockQueryHandler = async (sql) => {
        const queryStr = typeof sql === 'string' ? sql : sql?.text || '';

        if (queryStr.includes('FROM cotizaciones WHERE id = $1')) {
          return { rows: [{ id: COTIZACION_ID, empresa_id: 1 }], rowCount: 1 };
        }

        // Simula que la verificación previa no vio conflicto (carrera entre microsegundos)
        if (queryStr.includes('FROM reservas') && queryStr.includes('COUNT(*)')) {
          return { rows: [{ total: '0' }], rowCount: 1 };
        }

        // Pero la base de datos lanza error 23505 (unique_violation)
        if (queryStr.includes('INSERT INTO reservas')) {
          const dbError = new Error('duplicate key value violates unique constraint "reservas_empresa_id_salon_o_lugar_fecha_evento_key"');
          dbError.code = '23505';
          throw dbError;
        }

        return { rows: [], rowCount: 0 };
      };

      const res = await request(app)
        .post('/api/reservas')
        .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
        .send({
          cotizacion_id: COTIZACION_ID,
          salon_o_lugar: SALON,
          fecha_evento: FECHA,
          hora_inicio: '18:00',
          hora_fin: '23:30',
        });

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/conflicto.*solicitud simultánea/i);
    });

  });

  // ───────────────────────────────────────────────────────────────────────────
  // SUITE 2: Casos No Colisionantes
  // ───────────────────────────────────────────────────────────────────────────
  describe('Disponibilidad de Fechas y Salones Independientes', () => {

    it('201 — Permite reservar el MISMO salón en una FECHA DISTINTA', async () => {
      const OTRA_FECHA = '2027-10-16';

      mockQueryHandler = async (sql, params) => {
        const queryStr = typeof sql === 'string' ? sql : sql?.text || '';
        if (queryStr.includes('FROM cotizaciones WHERE id = $1')) {
          return { rows: [{ id: 'cot-uuid-03', empresa_id: 1 }], rowCount: 1 };
        }
        if (queryStr.includes('FROM reservas') && queryStr.includes('COUNT(*)')) {
          return { rows: [{ total: '0' }], rowCount: 1 };
        }
        if (queryStr.includes('INSERT INTO reservas')) {
          return {
            rows: [{
              id: 'reserva-uuid-003',
              empresa_id: 1,
              salon_o_lugar: SALON,
              fecha_evento: OTRA_FECHA,
              estado: 'Confirmada',
            }],
            rowCount: 1,
          };
        }
        return { rows: [], rowCount: 0 };
      };

      const res = await request(app)
        .post('/api/reservas')
        .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
        .send({
          cotizacion_id: 'cot-uuid-03',
          salon_o_lugar: SALON,
          fecha_evento: OTRA_FECHA,
          hora_inicio: '14:00',
          hora_fin: '20:00',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.fecha_evento).toBe(OTRA_FECHA);
    });

    it('201 — Permite reservar en la MISMA FECHA pero en un SALÓN DISTINTO', async () => {
      const OTRO_SALON = 'Salón Esmeralda Jardín';

      mockQueryHandler = async (sql, params) => {
        const queryStr = typeof sql === 'string' ? sql : sql?.text || '';
        if (queryStr.includes('FROM cotizaciones WHERE id = $1')) {
          return { rows: [{ id: 'cot-uuid-04', empresa_id: 1 }], rowCount: 1 };
        }
        if (queryStr.includes('FROM reservas') && queryStr.includes('COUNT(*)')) {
          return { rows: [{ total: '0' }], rowCount: 1 };
        }
        if (queryStr.includes('INSERT INTO reservas')) {
          return {
            rows: [{
              id: 'reserva-uuid-004',
              empresa_id: 1,
              salon_o_lugar: OTRO_SALON,
              fecha_evento: FECHA,
              estado: 'Confirmada',
            }],
            rowCount: 1,
          };
        }
        return { rows: [], rowCount: 0 };
      };

      const res = await request(app)
        .post('/api/reservas')
        .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
        .send({
          cotizacion_id: 'cot-uuid-04',
          salon_o_lugar: OTRO_SALON,
          fecha_evento: FECHA,
          hora_inicio: '18:00',
          hora_fin: '23:00',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.salon_o_lugar).toBe(OTRO_SALON);
    });

  });

  // ───────────────────────────────────────────────────────────────────────────
  // SUITE 3: Validaciones de Entrada e Integridad
  // ───────────────────────────────────────────────────────────────────────────
  describe('Validación de Entradas e Integridad Relacional', () => {

    it('400 — Rechaza si faltan campos requeridos para la reserva', async () => {
      const res = await request(app)
        .post('/api/reservas')
        .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
        .send({ salon_o_lugar: 'Solo Salón' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/obligatorios/i);
    });

    it('404 — Rechaza si la cotización no pertenece a la empresa del usuario (Anti-IDOR)', async () => {
      mockQueryHandler = async (sql) => {
        const queryStr = typeof sql === 'string' ? sql : sql?.text || '';
        if (queryStr.includes('FROM cotizaciones WHERE id = $1')) {
          return { rows: [], rowCount: 0 }; // No encontrada o de otra empresa
        }
        return { rows: [], rowCount: 0 };
      };

      const res = await request(app)
        .post('/api/reservas')
        .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
        .send({
          cotizacion_id: 'cot-ajena-uuid',
          salon_o_lugar: SALON,
          fecha_evento: FECHA,
          hora_inicio: '18:00',
          hora_fin: '23:00',
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/no pertenece a su empresa/i);
    });

  });

});
