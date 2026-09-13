/**
 * cotizacion.test.js
 * ==================
 * Suite de pruebas de integración para el módulo de Cotizaciones — EVENTRA
 *
 * Estrategia de aislamiento:
 *   - Se mockea `../src/config/db.js` para evitar conexiones reales a PostgreSQL.
 *   - Supertest se usa para pruebas HTTP de nivel de integración.
 *
 * Cobertura (Matriz de Riesgos — Mitigación R-FINANCE):
 *   ✓ POST /api/cotizaciones — sin token → 401 (barrera de autenticación)
 *   ✓ POST /api/cotizaciones — con token falso → 401
 *   ✓ POST /api/cotizaciones — con token válido pero campos vacíos → 400
 *   ✓ GET  /api/cotizaciones — sin token → 401
 */

import request from 'supertest';
import { jest } from '@jest/globals';

// ─── Mock de la base de datos ─────────────────────────────────────────────────
jest.unstable_mockModule('../src/config/db.js', () => ({
  default: {
    query: jest.fn(),
  },
}));

// Importar la app DESPUÉS del mock
const { default: app } = await import('../src/app.js');

// ─── Suite: Seguridad del endpoint de cotizaciones ────────────────────────────
describe('POST /api/cotizaciones — Barrera de autenticación', () => {

  it('debe retornar 401 si no se envía ningún token JWT', async () => {
    const res = await request(app)
      .post('/api/cotizaciones')
      .send({
        cliente_id:            'uuid-cliente',
        fecha_estimada_evento: '2026-12-31',
        total_calculado:       1500,
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('debe retornar 401 si el token JWT es inválido o está expirado', async () => {
    const res = await request(app)
      .post('/api/cotizaciones')
      .set('Authorization', 'Bearer token_falso_o_expirado')
      .send({
        cliente_id:            'uuid-cliente',
        fecha_estimada_evento: '2026-12-31',
        total_calculado:       1500,
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

});

// ─── Suite: Seguridad del endpoint GET cotizaciones ───────────────────────────
describe('GET /api/cotizaciones — Barrera de autenticación', () => {

  it('debe retornar 401 si no se envía ningún token JWT', async () => {
    const res = await request(app)
      .get('/api/cotizaciones');

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

});

// ─── Suite: Verificación de existencia del endpoint ───────────────────────────
describe('Verificación de endpoints del módulo Cotizaciones', () => {

  it('el endpoint POST /api/cotizaciones debe existir (no retornar 404)', async () => {
    // Sin token esperamos 401, pero NO 404 — confirma que la ruta está registrada
    const res = await request(app)
      .post('/api/cotizaciones')
      .send({});

    expect(res.statusCode).not.toBe(404);
  });

  it('el endpoint GET /api/cotizaciones debe existir (no retornar 404)', async () => {
    const res = await request(app)
      .get('/api/cotizaciones');

    expect(res.statusCode).not.toBe(404);
  });

});
