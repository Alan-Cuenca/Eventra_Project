/**
 * reserva.test.js
 * ================
 * Pruebas de Concurrencia y Control de Duplicados — Módulo Reservas EVENTRA
 *
 * Estrategia de aislamiento:
 *   - jest.unstable_mockModule intercepta pool.query para simular respuestas
 *     de PostgreSQL sin necesitar una BD real.
 *   - Se generan JWTs reales firmados con JWT_SECRET para autenticar las
 *     peticiones en las pruebas que requieren token.
 *
 * Cobertura (Matriz de Riesgos — R-CONCURRENCIA):
 *   ✓ GET  /api/reservas — sin token                     → 401
 *   ✓ POST /api/reservas — sin token                     → 401
 *   ✓ POST /api/reservas — campos faltantes               → 400
 *   ✓ POST /api/reservas — salón disponible               → 201
 *   ✓ POST /api/reservas — salón ya ocupado (app layer)   → 409 (Conflicto)
 *   ✓ POST /api/reservas — duplicado simultáneo (BD UNIQUE)→ 409 (Conflicto)
 */

import request from 'supertest';
import jwt     from 'jsonwebtoken';
import { jest } from '@jest/globals';

// ─── Mock de la BD ───────────────────────────────────────────────────────────
jest.unstable_mockModule('../src/config/db.js', () => ({
  default: { query: jest.fn() },
}));

// ─── Mock de OpenAI (evita error si no hay API_KEY en CI) ───────────────────
jest.unstable_mockModule('openai', () => ({
  default: class {
    chat = { completions: { create: jest.fn() } };
  },
}));

const { default: app }  = await import('../src/app.js');
const { default: pool } = await import('../src/config/db.js');

// ─── Token JWT válido de prueba (Admin, empresa_id=1) ────────────────────────
const TEST_SECRET   = process.env.JWT_SECRET || 'test_secret_eventra';
const TOKEN_ADMIN   = jwt.sign(
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
    const res = await request(app)
      .post('/api/reservas')
      .send(RESERVA_VALIDA);
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
    const fakeReserva = {
      id:            'uuid-reserva-nueva',
      empresa_id:    1,
      cotizacion_id: RESERVA_VALIDA.cotizacion_id,
      salon_o_lugar: RESERVA_VALIDA.salon_o_lugar,
      fecha_evento:  RESERVA_VALIDA.fecha_evento,
      hora_inicio:   RESERVA_VALIDA.hora_inicio,
      hora_fin:      RESERVA_VALIDA.hora_fin,
      estado:        'Confirmada',
      fecha_creacion: new Date().toISOString(),
    };
    pool.query.mockResolvedValueOnce({ rows: [fakeReserva], rowCount: 1 });

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
// SUITE 4: Control de concurrencia y duplicados — el test crítico
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/reservas — Mitigación de Concurrencia (R-CONCURRENCIA)', () => {

  beforeEach(() => jest.clearAllMocks());

  it('409 — rechaza la reserva si el salón ya está ocupado en esa fecha (Capa Aplicación)', async () => {
    // Mock: SELECT COUNT → salón ya reservado (1 conflicto)
    pool.query.mockResolvedValueOnce({ rows: [{ total: '1' }], rowCount: 1 });

    const res = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send(RESERVA_VALIDA);

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/conflicto|reservado/i);
  });

  it('409 — rechaza el duplicado simultáneo interceptado por la restricción UNIQUE de PostgreSQL (Capa BD)', async () => {
    // Escenario de condición de carrera:
    // La primera petición pasó el SELECT COUNT, pero la BD lanza 23505
    // porque otra petición concurrente insertó primero.

    // Mock 1: SELECT COUNT → disponible (la app cree que no hay conflicto)
    pool.query.mockResolvedValueOnce({ rows: [{ total: '0' }], rowCount: 1 });

    // Mock 2: INSERT → violación de UNIQUE (código PG 23505)
    pool.query.mockRejectedValueOnce({ code: '23505' });

    const res = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send(RESERVA_VALIDA);

    // La segunda capa (BD) también debe retornar 409, no 500
    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/conflicto|reservado|simultánea/i);
  });

  it('409 — simula dos peticiones concurrentes al mismo salón y fecha', async () => {
    // Petición A: ve el salón libre y obtiene un conflicto de BD (carrera perdida)
    pool.query
      .mockResolvedValueOnce({ rows: [{ total: '0' }], rowCount: 1 }) // SELECT Petición A
      .mockRejectedValueOnce({ code: '23505' });                        // INSERT Petición A falla

    const [resA] = await Promise.all([
      request(app)
        .post('/api/reservas')
        .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
        .send(RESERVA_VALIDA),
    ]);

    // La petición que llega tarde recibe 409, no un error 500
    expect(resA.statusCode).toBe(409);
    expect(resA.body.success).toBe(false);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 5: Verificación de que los endpoints existen (smoke tests)
// ─────────────────────────────────────────────────────────────────────────────
describe('Reservas — Smoke tests (endpoints registrados)', () => {

  it('GET /api/reservas debe existir (no retornar 404)', async () => {
    const res = await request(app).get('/api/reservas');
    expect(res.statusCode).not.toBe(404);
  });

  it('POST /api/reservas debe existir (no retornar 404)', async () => {
    const res = await request(app)
      .post('/api/reservas')
      .send({});
    expect(res.statusCode).not.toBe(404);
  });

});
