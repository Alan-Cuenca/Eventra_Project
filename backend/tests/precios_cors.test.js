/**
 * precios_cors.test.js
 * =============================================================================
 * - POST /api/suscripciones/pagar registra el precio vigente del plan según la
 *   configuración del Super Admin, nunca el monto que envía el navegador.
 * - CORS: un origen no permitido no recibe cabeceras CORS y no provoca un 500.
 * =============================================================================
 */
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';

process.env.JWT_SECRET = 'test_secret_precios_cors';
process.env.NODE_ENV = 'test';
process.env.PORT = '0';
process.env.CORS_ORIGINS = 'https://eventraproject.up.railway.app/, http://localhost:5173';

let mockQueryHandler = null;
const mockPool = {
  query: jest.fn(async (sql, params) => (mockQueryHandler ? mockQueryHandler(sql, params) : { rows: [], rowCount: 0 })),
  connect: jest.fn(),
};
jest.unstable_mockModule('../src/config/db.js', () => ({ default: mockPool }));
jest.unstable_mockModule('../src/config/supabase.js', () => ({
  supabase: {
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({ data: {}, error: null }),
        createSignedUrls: jest.fn(async (paths) => ({ data: paths.map((path) => ({ path, signedUrl: `https://x/sign/${path}`, error: null })), error: null })),
      })),
    },
  },
}));
jest.unstable_mockModule('openai', () => ({ default: class { chat = { completions: { create: jest.fn() } }; } }));

const { default: app } = await import('../src/app.js');
const plataforma = await import('../src/middlewares/configuracionPlataforma.js');

const TOKEN_ADMIN = jwt.sign({ id: 'a1', rol_id: 1, empresa_id: 3, email: 'a@e.com' }, process.env.JWT_SECRET, { expiresIn: '1h' });

const pagar = (campos) => {
  let req = request(app).post('/api/suscripciones/pagar').set('Authorization', `Bearer ${TOKEN_ADMIN}`);
  for (const [k, v] of Object.entries(campos)) req = req.field(k, v);
  return req.attach('comprobante', Buffer.from('%PDF-1.4'), { filename: 'pago.pdf', contentType: 'application/pdf' });
};

const montoRegistrado = () => mockPool.query.mock.calls.find(([sql]) => /INSERT INTO suscripciones_pagos/.test(sql))[1][2];

beforeEach(() => {
  jest.clearAllMocks();
  plataforma.invalidarCachePlataforma();
  mockQueryHandler = async (sql, params) => {
    if (/FROM empresas WHERE id/.test(sql)) return { rows: [{ id: 3, nombre_comercial: 'E', plan_suscripcion: 'Basico' }], rowCount: 1 };
    if (/INSERT INTO suscripciones_pagos/.test(sql)) return { rows: [{ id: 'sp1', monto: params[2], comprobante_url: params[3] }], rowCount: 1 };
    return { rows: [], rowCount: 0 };
  };
});

describe('Monto de la suscripción', () => {
  it('ignora el monto del navegador y usa el precio por defecto del plan', async () => {
    const res = await pagar({ plan_nombre: 'Premium', monto: '1.00' });
    expect(res.status).toBe(201);
    expect(montoRegistrado()).toBe(99);
  });

  it('usa el precio configurado por el Super Admin', async () => {
    plataforma.establecerCachePlataforma({ planes: { basico_precio: 59.5, premium_precio: 120 } });
    await pagar({ plan_nombre: 'Basico', monto: '49.00' }).expect(201);
    expect(montoRegistrado()).toBe(59.5);

    jest.clearAllMocks();
    await pagar({ plan_nombre: 'premium' }).expect(201);
    expect(montoRegistrado()).toBe(120);
  });

  it('si el precio configurado es inválido vuelve al valor por defecto', async () => {
    plataforma.establecerCachePlataforma({ planes: { basico_precio: 'gratis' } });
    await pagar({ plan_nombre: 'Basico' }).expect(201);
    expect(montoRegistrado()).toBe(49);
  });
});

describe('CORS', () => {
  it('permite el frontend de Railway aunque la variable tenga "/" final o distinto uso de mayúsculas', async () => {
    const res = await request(app).get('/api/health').set('Origin', 'https://EventraProject.up.railway.app');
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('https://EventraProject.up.railway.app');
  });

  it('un origen no permitido responde 200 sin cabeceras CORS (no 500)', async () => {
    const res = await request(app).get('/api/health').set('Origin', 'https://malicioso.example');
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('las peticiones sin Origin (servidor a servidor, health checks) siguen funcionando', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
  });
});
