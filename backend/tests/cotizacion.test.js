/**
 * cotizacion.test.js  (v3 — variables de entorno de test explícitas)
 * ====================================================================
 * Pruebas de Cálculos y Control Financiero — Módulo Cotizaciones EVENTRA
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

// Payload mínimo válido para crear una cotización
const COTIZACION_VALIDA = {
  cliente_id:            'uuid-cliente-001',
  fecha_estimada_evento: '2027-06-20',
  total_calculado:       2500.00,
};

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 1: Barrera de autenticación JWT
// ─────────────────────────────────────────────────────────────────────────────
describe('Cotizaciones — Barrera de autenticación JWT', () => {

  it('401 — POST /api/cotizaciones rechaza petición sin token', async () => {
    const res = await request(app)
      .post('/api/cotizaciones')
      .send(COTIZACION_VALIDA);
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('401 — POST /api/cotizaciones rechaza token JWT inválido', async () => {
    const res = await request(app)
      .post('/api/cotizaciones')
      .set('Authorization', 'Bearer token_falso_xyz')
      .send(COTIZACION_VALIDA);
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('401 — GET /api/cotizaciones rechaza petición sin token', async () => {
    const res = await request(app).get('/api/cotizaciones');
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 2: Validación de campos y cálculos (R-FINANCE)
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/cotizaciones — Validación de payload', () => {

  beforeEach(() => jest.clearAllMocks());

  it('400 — rechaza si falta cliente_id', async () => {
    const res = await request(app)
      .post('/api/cotizaciones')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({ fecha_estimada_evento: '2027-06-20', total_calculado: 1500 });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/obligatorio/i);
  });

  it('400 — rechaza si falta fecha_estimada_evento', async () => {
    const res = await request(app)
      .post('/api/cotizaciones')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({ cliente_id: 'uuid-cliente-001', total_calculado: 1500 });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('400 — rechaza si total_calculado es negativo (cálculo inválido)', async () => {
    const res = await request(app)
      .post('/api/cotizaciones')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({
        cliente_id: 'uuid-cliente-001',
        fecha_estimada_evento: '2027-06-20',
        total_calculado: -500,
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/positivo|número/i);
  });

  it('400 — rechaza si total_calculado no es un número', async () => {
    const res = await request(app)
      .post('/api/cotizaciones')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({
        cliente_id: 'uuid-cliente-001',
        fecha_estimada_evento: '2027-06-20',
        total_calculado: 'no-es-numero',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 3: Creación exitosa de cotización
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/cotizaciones — Creación exitosa', () => {

  beforeEach(() => jest.clearAllMocks());

  it('201 — crea la cotización correctamente con payload válido', async () => {
    const fakeCotizacion = {
      id: 'uuid-cotizacion-001', empresa_id: 1,
      cliente_id: COTIZACION_VALIDA.cliente_id,
      paquete_id: null,
      fecha_estimada_evento: COTIZACION_VALIDA.fecha_estimada_evento,
      total_calculado: COTIZACION_VALIDA.total_calculado,
      estado: 'Pendiente',
      fecha_creacion: new Date().toISOString(),
    };

    pool.query.mockResolvedValueOnce({ rows: [fakeCotizacion], rowCount: 1 });

    const res = await request(app)
      .post('/api/cotizaciones')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send(COTIZACION_VALIDA);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(Number(res.body.data.total_calculado)).toBe(COTIZACION_VALIDA.total_calculado);
    expect(res.body.data.estado).toBe('Pendiente');
  });

  it('201 — crea cotización sin paquete_id (cotización sin paquete base)', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{
        id: 'uuid-cotizacion-002', empresa_id: 1,
        cliente_id: 'uuid-cliente-001',
        paquete_id: null,
        fecha_estimada_evento: '2027-09-10',
        total_calculado: 800.00,
        estado: 'Pendiente',
        fecha_creacion: new Date().toISOString(),
      }],
      rowCount: 1,
    });

    const res = await request(app)
      .post('/api/cotizaciones')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({
        cliente_id: 'uuid-cliente-001',
        fecha_estimada_evento: '2027-09-10',
        total_calculado: 800.00,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.paquete_id).toBeNull();
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 4: Listado de cotizaciones autenticado
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/cotizaciones — Listado con token válido', () => {

  beforeEach(() => jest.clearAllMocks());

  it('200 — retorna la lista de cotizaciones de la empresa', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        { id: 'uuid-cot-1', empresa_id: 1, total_calculado: 1500, estado: 'Pendiente', cliente_nombres: 'Ana' },
        { id: 'uuid-cot-2', empresa_id: 1, total_calculado: 3200, estado: 'Aprobada', cliente_nombres: 'Carlos' },
      ],
      rowCount: 2,
    });

    const res = await request(app)
      .get('/api/cotizaciones')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.total).toBe(2);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(2);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 5: Smoke tests — endpoints registrados
// ─────────────────────────────────────────────────────────────────────────────
describe('Cotizaciones — Smoke tests (endpoints registrados)', () => {

  it('POST /api/cotizaciones debe existir (no retornar 404)', async () => {
    const res = await request(app).post('/api/cotizaciones').send({});
    expect(res.statusCode).not.toBe(404);
  });

  it('GET /api/cotizaciones debe existir (no retornar 404)', async () => {
    const res = await request(app).get('/api/cotizaciones');
    expect(res.statusCode).not.toBe(404);
  });

});
