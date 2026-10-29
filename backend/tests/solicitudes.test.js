/**
 * solicitudes.test.js
 * ====================================================================
 * Pruebas Unitarias y de Integración: Módulo de Solicitudes y Notificaciones
 * ====================================================================
 */

import request from 'supertest';
import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';

process.env.JWT_SECRET = 'test_secret_eventra_solicitudes';
process.env.NODE_ENV   = 'test';
process.env.PORT       = '0';
process.env.EMAIL_SIMULATION_MODE = 'true';

const TEST_SECRET = 'test_secret_eventra_solicitudes';

// Mock de la base de datos PostgreSQL
jest.unstable_mockModule('../src/config/db.js', () => ({
  default: {
    query: jest.fn(),
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

// Tokens para pruebas
const TOKEN_ADMIN = jwt.sign(
  { id: 'usr-admin-1', empresa_id: 1, rol_id: 1, rol: 'Administrador', email: 'admin@empresa1.com' },
  TEST_SECRET,
  { expiresIn: '1h' }
);

const TOKEN_CLIENTE = jwt.sign(
  { id: 'usr-cliente-1', empresa_id: 1, rol_id: 4, rol: 'Cliente', email: 'cliente@empresa1.com' },
  TEST_SECRET,
  { expiresIn: '1h' }
);

describe('Módulo de Solicitudes de Modificación y Notificaciones Automáticas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/solicitudes', () => {
    it('rechaza la creación si faltan campos obligatorios', async () => {
      const res = await request(app)
        .post('/api/solicitudes')
        .set('Authorization', `Bearer ${TOKEN_CLIENTE}`)
        .send({ evento_id: '' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/obligatorios/i);
    });

    it('crea exitosamente una solicitud para un cliente', async () => {
      const eventoId = 'e0000000-0000-0000-0000-000000000001';

      // 1. Check evento
      pool.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id: eventoId, titulo: 'Boda Elegante', empresa_id: 1 }],
      });

      // 2. Lookup cliente por email
      pool.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id: 'c0000000-0000-0000-0000-000000000001' }],
      });

      // 3. Pertenencia check
      pool.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id: eventoId }],
      });

      // 4. Insert
      pool.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{
          id: 's0000000-0000-0000-0000-000000000001',
          empresa_id: 1,
          evento_id: eventoId,
          cliente_id: 'c0000000-0000-0000-0000-000000000001',
          descripcion_cambio: 'Solicito extender el evento 2 horas adicionales',
          descripcion: 'Solicito extender el evento 2 horas adicionales',
          estado: 'Pendiente',
          fecha_solicitud: new Date(),
        }],
      });

      const res = await request(app)
        .post('/api/solicitudes')
        .set('Authorization', `Bearer ${TOKEN_CLIENTE}`)
        .send({
          evento_id: eventoId,
          descripcion: 'Solicito extender el evento 2 horas adicionales',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.estado).toBe('Pendiente');
    });
  });

  describe('GET /api/solicitudes', () => {
    it('retorna las solicitudes de modificación filtradas según rol', async () => {
      pool.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{
          id: 's0000000-0000-0000-0000-000000000001',
          empresa_id: 1,
          descripcion_cambio: 'Cambio de mantelería a tono dorado',
          descripcion: 'Cambio de mantelería a tono dorado',
          estado: 'Pendiente',
          evento_id: 'e0000000-0000-0000-0000-000000000001',
          evento_titulo: 'XV Años Valentina',
          cliente: 'Valentina Pérez',
        }],
      });

      const res = await request(app)
        .get('/api/solicitudes')
        .set('Authorization', `Bearer ${TOKEN_ADMIN}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].evento_titulo).toBe('XV Años Valentina');
    });
  });

  describe('PUT /api/solicitudes/:id/estado', () => {
    it('rechaza si el estado no es válido', async () => {
      const res = await request(app)
        .put('/api/solicitudes/s0000000-0000-0000-0000-000000000001/estado')
        .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
        .send({ estado: 'EstadoInexistente' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('actualiza el estado a Aprobada y despacha notificación', async () => {
      const solicitudId = 's0000000-0000-0000-0000-000000000001';

      // Mock UPDATE
      pool.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{
          id: solicitudId,
          empresa_id: 1,
          evento_id: 'e0000000-0000-0000-0000-000000000001',
          descripcion_cambio: 'Adición de fuegos fríos',
          estado: 'Aprobada',
          fecha_solicitud: new Date(),
        }],
      });

      // Mock query info para notificación
      pool.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{
          descripcion_cambio: 'Adición de fuegos fríos',
          evento_titulo: 'Matrimonio Carla & David',
          cliente_email: 'carla@bodas.com',
          cliente_nombre: 'Carla Morales',
        }],
      });

      const res = await request(app)
        .put(`/api/solicitudes/${solicitudId}/estado`)
        .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
        .send({ estado: 'Aprobada' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.estado).toBe('Aprobada');
    });
  });
});
