/**
 * jwt_configurable.test.js — La duración del JWT sale de configuracion_saas
 * =============================================================================
 * seguridad.expiracion_jwt_horas (1–72) define cuánto dura el token de sesión.
 * =============================================================================
 */
import request from 'supertest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';

process.env.JWT_SECRET = 'test_secret_jwt_configurable';
process.env.NODE_ENV = 'test';
process.env.PORT = '0';

let mockQueryHandler = null;
const mockPool = {
  query: jest.fn(async (sql, params) => (mockQueryHandler ? mockQueryHandler(sql, params) : { rows: [], rowCount: 0 })),
  connect: jest.fn(),
};
jest.unstable_mockModule('../src/config/db.js', () => ({ default: mockPool }));
jest.unstable_mockModule('../src/config/supabase.js', () => ({ supabase: null }));
jest.unstable_mockModule('openai', () => ({ default: class { chat = { completions: { create: jest.fn() } }; } }));

const { default: app } = await import('../src/app.js');
const plataforma = await import('../src/middlewares/configuracionPlataforma.js');

const PASSWORD = 'EventraSeguro2026!';
const HASH = await bcrypt.hash(PASSWORD, 4);
const usuario = {
  id: 'uuid-gerente', empresa_id: 1, rol_id: 2, nombre_completo: 'Gerente', email: 'g@e.com',
  password_hash: HASH, estado_activo: true, debe_cambiar_password: false, rol_nombre: 'Gerente',
  empresa_nombre: 'E', plan_suscripcion: 'Premium', empresa_activa: true,
};

const loginYDuracion = async () => {
  mockQueryHandler = async (sql) => (String(sql).includes('FROM usuarios u') ? { rows: [usuario], rowCount: 1 } : { rows: [], rowCount: 0 });
  const res = await request(app).post('/api/auth/login').send({ email: 'g@e.com', password: PASSWORD });
  expect(res.statusCode).toBe(200);
  const { iat, exp } = jwt.decode(res.body.token);
  return (exp - iat) / 3600;
};

beforeEach(() => {
  jest.clearAllMocks();
  mockQueryHandler = null;
  plataforma.invalidarCachePlataforma();
});

describe('normalizarHorasJwt', () => {
  it.each([[0, 8], ['abc', 8], [-5, 8], [0.4, 8], [100, 72], [12, 12], ['24', 24], [1, 1]])('%p → %p', (entrada, salida) => {
    expect(plataforma.normalizarHorasJwt(entrada)).toBe(salida);
  });
});

describe('Login', () => {
  it('sin configuración guardada el token dura 8 horas (ya no 1 día)', async () => {
    expect(await loginYDuracion()).toBe(8);
  });

  it('usa las horas configuradas por el Super Admin', async () => {
    plataforma.establecerCachePlataforma({ seguridad: { expiracion_jwt_horas: 3 } });
    expect(await loginYDuracion()).toBe(3);
  });

  it('un valor fuera de rango guardado a mano se limita a 72 horas', async () => {
    plataforma.establecerCachePlataforma({ seguridad: { expiracion_jwt_horas: 9999 } });
    expect(await loginYDuracion()).toBe(72);
  });
});

describe('PUT /api/configuracion', () => {
  const TOKEN_SUPER = jwt.sign({ id: 'sa', rol_id: 5, empresa_id: null }, process.env.JWT_SECRET, { expiresIn: '1h' });

  it('guarda expiracion_jwt_horas ya normalizado', async () => {
    const res = await request(app)
      .put('/api/configuracion')
      .set('Authorization', `Bearer ${TOKEN_SUPER}`)
      .send({ seguridad: { expiracion_jwt_horas: 500 } });
    expect(res.statusCode).toBe(200);
    const [, [valor]] = mockPool.query.mock.calls.find(([sql]) => /INSERT INTO configuracion_saas/.test(sql));
    expect(JSON.parse(valor).seguridad.expiracion_jwt_horas).toBe(72);
  });
});
