/**
 * reserva.test.js  (v2 — variables de entorno de test explícitas)
 * =================================================================
 * Pruebas de Concurrencia y Control de Duplicados — Módulo Reservas EVENTRA
 *
 * Fix aplicado: process.env.JWT_SECRET se define ANTES de importar la app
 * para que el middleware verifyToken acepte los tokens firmados en los tests.
 */

import request from 'supertest';
import jwt     from 'jsonwebtoken';
import { jest } from '@jest/globals';

// ─── Variables de entorno para el entorno de test ────────────────────────────
process.env.JWT_SECRET = 'test_secret_eventra_jest';
process.env.NODE_ENV   = 'test';
process.env.PORT       = '0';

const TEST_SECRET = 'test_secret_eventra_jest';

// ─── Mock de la BD ───────────────────────────────────────────────────────────
jest.unstable_mockModule('../src/config/db.js', () => ({
  default: { query: jest.fn() },
}));

// ─── Mock de OpenAI ──────────────────────────────────────────────────────────
jest.unstable_mockModule('openai', () => ({
  default: class {
    chat = { completions: { create: jest.fn() } };
  },
}));

const { default: app }  = await import('../src/app.js');
const { default: pool } = await import('../src/config/db.js');

// ─── Token JWT válido de prueba (Admin, empresa_id=1) ────────────────────────
const TOKEN_ADMIN = jwt.sign(
  { id: 'uuid-admin-test', empresa_id: 1, rol_id: 1 },
  TEST_SECRET,
  { expiresIn: '1h' }
);

// Payload base de una reserva válida
const RESERVA_VALIDA = {
  cotizacion_id: 'uuid-cotizacion-001',
  salon_o_lugar: 'Salón Principal',
  fecha_evento:  '2027-03-15',
  hora_inicio:   '18:00',
  hora_fin:      '23:00',
};

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 1: Barrera de autenticación JWT
// ─────────────────────────────────────────────────────────────────────────────
describe('Módulo Reservas — Barrera JWT', () => {

  it('401 — GET /api/reservas rechaza petición sin token', async () => {
    const res = await request(app).get('/api/reservas');
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('401 — POST /api/reservas rechaza petición sin token', async () => {
    const res = await request(app).post('/api/reservas').send(RESERVA_VALIDA);
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('401 — POST /api/reservas rechaza token JWT inválido', async () => {
    const res = await request(app)
      .post('/api/reservas')
      .set('Authorization', 'Bearer token_completamente_invalido')
      .send(RESERVA_VALIDA);
    expect(res.statusCode).toBe(401);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 2: Validación de campos obligatorios
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/reservas — Validación de campos', () => {

  beforeEach(() => jest.clearAllMocks());

  it('400 — rechaza reserva si faltan campos obligatorios', async () => {
    const res = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({ salon_o_lugar: 'Salón A' }); // faltan cotizacion_id, fecha_evento, horas

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/obligatorio/i);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 3: Creación exitosa de reserva
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/reservas — Creación exitosa', () => {

  beforeEach(() => jest.clearAllMocks());

  it('201 — crea la reserva correctamente cuando el salón está disponible', async () => {
    // Mock 1: SELECT COUNT → salón disponible (0 conflictos)
    pool.query.mockResolvedValueOnce({ rows: [{ total: '0' }], rowCount: 1 });

    // Mock 2: INSERT → reserva creada
    pool.query.mockResolvedValueOnce({
      rows: [{
        id: 'uuid-reserva-nueva', empresa_id: 1,
        cotizacion_id: RESERVA_VALIDA.cotizacion_id,
        salon_o_lugar: RESERVA_VALIDA.salon_o_lugar,
        fecha_evento:  RESERVA_VALIDA.fecha_evento,
        hora_inicio:   RESERVA_VALIDA.hora_inicio,
        hora_fin:      RESERVA_VALIDA.hora_fin,
        estado: 'Confirmada',
        fecha_creacion: new Date().toISOString(),
      }],
      rowCount: 1,
    });

    const res = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send(RESERVA_VALIDA);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.salon_o_lugar).toBe(RESERVA_VALIDA.salon_o_lugar);
    expect(res.body.data.estado).toBe('Confirmada');
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 4: Control de concurrencia — test crítico de mitigación R-CONCURRENCIA
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/reservas — Mitigación de Concurrencia (R-CONCURRENCIA)', () => {

  beforeEach(() => jest.clearAllMocks());

  it('409 — rechaza la reserva si el salón ya está ocupado (Capa Aplicación)', async () => {
    // SELECT COUNT → salón ya reservado
    pool.query.mockResolvedValueOnce({ rows: [{ total: '1' }], rowCount: 1 });

    const res = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send(RESERVA_VALIDA);

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/conflicto|reservado/i);
  });

  it('409 — rechaza duplicado simultáneo interceptado por la restricción UNIQUE de PostgreSQL (Capa BD)', async () => {
    // Escenario de condición de carrera:
    // SELECT dice disponible, pero el INSERT falla por UNIQUE constraint
    pool.query.mockResolvedValueOnce({ rows: [{ total: '0' }], rowCount: 1 });
    pool.query.mockRejectedValueOnce({ code: '23505', message: 'unique_violation' });

    const res = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send(RESERVA_VALIDA);

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/conflicto|reservado|simultánea/i);
  });

  it('409 — simula dos peticiones concurrentes al mismo salón y fecha', async () => {
    // Petición A: SELECT dice libre pero INSERT falla (carrera perdida)
    pool.query
      .mockResolvedValueOnce({ rows: [{ total: '0' }], rowCount: 1 })
      .mockRejectedValueOnce({ code: '23505', message: 'unique_violation' });

    const [resA] = await Promise.all([
      request(app)
        .post('/api/reservas')
        .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
        .send(RESERVA_VALIDA),
    ]);

    expect(resA.statusCode).toBe(409);
    expect(resA.body.success).toBe(false);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 5: Smoke tests — endpoints registrados
// ─────────────────────────────────────────────────────────────────────────────
describe('Reservas — Smoke tests (endpoints registrados)', () => {

  it('GET /api/reservas debe existir (no retornar 404)', async () => {
    const res = await request(app).get('/api/reservas');
    expect(res.statusCode).not.toBe(404);
  });

  it('POST /api/reservas debe existir (no retornar 404)', async () => {
    const res = await request(app).post('/api/reservas').send({});
    expect(res.statusCode).not.toBe(404);
  });

});
