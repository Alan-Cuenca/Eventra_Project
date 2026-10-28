/**
 * planLimits.test.js
 * ====================================================================
 * Pruebas: Restricciones de Planes SaaS (Básico vs Premium)
 * ====================================================================
 */

import request from 'supertest';
import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';

process.env.JWT_SECRET = 'test_secret_eventra_limits';
process.env.NODE_ENV   = 'test';
process.env.PORT       = '0';

const TEST_SECRET = 'test_secret_eventra_limits';

// Mock de la base de datos PostgreSQL
jest.unstable_mockModule('../src/config/db.js', () => ({
  default: {
    query: jest.fn(),
    connect: jest.fn(),
  },
}));

// Mock de Gemini
jest.unstable_mockModule('@google/genai', () => ({
  GoogleGenAI: class {
    constructor() {
      this.models = {
        generateContent: jest.fn().mockResolvedValue({ text: 'Respuesta EVARA' }),
      };
    }
  },
}));

const { default: app }  = await import('../src/app.js');
const { default: pool } = await import('../src/config/db.js');

const TOKEN_ADMIN_BASICO = jwt.sign(
  { id: 'usr-admin-basico', empresa_id: 1, rol_id: 1, rol: 'Administrador', email: 'admin@basico.com' },
  TEST_SECRET,
  { expiresIn: '1h' }
);

const TOKEN_SUPER_ADMIN = jwt.sign(
  { id: 'usr-super-admin', empresa_id: null, rol_id: 5, rol: 'Super_Admin', email: 'super@eventra.com' },
  TEST_SECRET,
  { expiresIn: '1h' }
);

describe('Restricciones de Planes SaaS (Básico vs Premium)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Límite de Servicios (Básico: 20, Premium: 50)', () => {
    it('debe rechazar con 403 si la empresa con Plan Básico ya tiene 20 servicios', async () => {
      // 1. SELECT plan_suscripcion FROM empresas
      pool.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ plan_suscripcion: 'Basico', mensajes_chatbot_mes: 10 }],
      });

      // 2. COUNT(*) FROM servicios
      pool.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ count: '20' }],
      });

      const res = await request(app)
        .post('/api/servicios')
        .set('Authorization', `Bearer ${TOKEN_ADMIN_BASICO}`)
        .send({
          nombre: 'Servicio 21 Excedente',
          precio_base: 150.00,
          descripcion: 'Supera el límite de 20',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('PLAN_LIMIT_EXCEEDED');
      expect(res.body.message).toContain('límite de servicios');
    });

    it('debe permitir crear servicio si la empresa está bajo el límite (< 20)', async () => {
      // 1. SELECT plan_suscripcion FROM empresas
      pool.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ plan_suscripcion: 'Basico', mensajes_chatbot_mes: 10 }],
      });

      // 2. COUNT(*) FROM servicios
      pool.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ count: '15' }],
      });

      // 3. INSERT INTO servicios
      pool.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id: 'srv-16', nombre: 'Servicio 16', precio_base: 100.00, empresa_id: 1 }],
      });

      const res = await request(app)
        .post('/api/servicios')
        .set('Authorization', `Bearer ${TOKEN_ADMIN_BASICO}`)
        .send({
          nombre: 'Servicio 16 Permitido',
          precio_base: 100.00,
          descripcion: 'Dentro del límite',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Límite de Usuarios (Básico: 3, Premium: 10)', () => {
    it('debe rechazar con 403 invitar colaborador si la empresa ya tiene 3 usuarios', async () => {
      // 1. SELECT plan_suscripcion FROM empresas
      pool.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ plan_suscripcion: 'Basico', mensajes_chatbot_mes: 0 }],
      });

      // 2. COUNT(*) FROM usuarios
      pool.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ count: '3' }],
      });

      const res = await request(app)
        .post('/api/auth/invitar')
        .set('Authorization', `Bearer ${TOKEN_ADMIN_BASICO}`)
        .send({
          email: 'colaborador4@empresa.com',
          rol_id: 3,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('PLAN_LIMIT_EXCEEDED');
      expect(res.body.message).toContain('límite de usuarios');
    });
  });

  describe('Límite de Mensajes de Chatbot EVARA (Básico: 300, Premium: 1500)', () => {
    it('debe rechazar con 403 cuando el chatbot supera los 300 mensajes mensuales en Plan Básico', async () => {
      // 1. SELECT plan_suscripcion, mensajes_chatbot_mes FROM empresas
      pool.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ plan_suscripcion: 'Basico', mensajes_chatbot_mes: 300 }],
      });

      const res = await request(app)
        .post('/api/chatbot')
        .set('Authorization', `Bearer ${TOKEN_ADMIN_BASICO}`)
        .send({
          mensaje: 'Hola, ¿qué paquetes tienen?',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('PLAN_LIMIT_EXCEEDED');
      expect(res.body.message).toContain('chatbot');
    });
  });

  describe('Exención de Super_Admin', () => {
    it('debe invocar next() directamente sin consultar la base de datos si el rol es Super_Admin', async () => {
      const { verificarLimitePlan } = await import('../src/middlewares/planLimitsMiddleware.js');
      const middleware = verificarLimitePlan('usuarios');
      const req = { user: { rol_id: 5, id: 'super' } };
      const res = {};
      const next = jest.fn();

      await middleware(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);
      expect(pool.query).not.toHaveBeenCalled();
    });
  });
});
