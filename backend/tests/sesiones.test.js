/**
 * sesiones.test.js — Revalidación de JWT (lógica con la BD simulada: caché, errores, públicos).
 * El comportamiento contra Postgres real está en tests/integration/flujo_real.int.js.
 */
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';

process.env.JWT_SECRET = 'test_secret_eventra_jest';
process.env.NODE_ENV = 'test';
process.env.PORT = '0';
process.env.REVALIDAR_SESIONES = 'true';

const mockPool = { query: jest.fn(), connect: jest.fn() };
jest.unstable_mockModule('../src/config/db.js', () => ({ default: mockPool }));

const { default: app } = await import('../src/app.js');
const sesiones = await import('../src/services/sesionService.js');

const ID = '77777777-7777-7777-7777-777777777777';
const token = (rol_id = 1, id = ID) => jwt.sign({ id, empresa_id: 1, rol_id, email: 'x@test.com' }, process.env.JWT_SECRET, { expiresIn: '1h' });
const auth = (rol, id) => ({ Authorization: `Bearer ${token(rol, id)}` });

const sesionBd = (extra = {}) => ({ id: ID, rol_id: 1, empresa_id: 1, estado_activo: true, empresa_activa: true, ...extra });
const consultasDeSesion = () => mockPool.query.mock.calls.filter(([sql]) => /FROM usuarios u\s+LEFT JOIN empresas e/.test(sql));

beforeEach(() => {
  sesiones.limpiarCacheSesiones();
  mockPool.query.mockReset();
  mockPool.query.mockImplementation(async (sql) => {
    if (/FROM usuarios u\s+LEFT JOIN empresas e/.test(sql)) return { rows: [sesionBd()], rowCount: 1 };
    return { rows: [], rowCount: 0 };
  });
});

describe('Revalidación de sesión (BD simulada)', () => {
  it('usuario activo de empresa activa: pasa', async () => {
    expect((await request(app).get('/api/clientes').set(auth(1))).statusCode).toBe(200);
  });

  it('usuario desactivado: 401', async () => {
    mockPool.query.mockImplementation(async () => ({ rows: [sesionBd({ estado_activo: false })], rowCount: 1 }));
    const res = await request(app).get('/api/clientes').set(auth(1));
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/sesión ya no es válida/i);
  });

  it('usuario inexistente: 401', async () => {
    mockPool.query.mockImplementation(async () => ({ rows: [], rowCount: 0 }));
    expect((await request(app).get('/api/clientes').set(auth(1))).statusCode).toBe(401);
  });

  it('empresa suspendida: 403, salvo para el Super Admin', async () => {
    mockPool.query.mockImplementation(async () => ({ rows: [sesionBd({ empresa_activa: false })], rowCount: 1 }));
    const res = await request(app).get('/api/clientes').set(auth(1));
    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/suspendida/i);
    expect(res.body.error).toBe('EMPRESA_SUSPENDIDA'); // el frontend cierra la sesión con este código

    sesiones.limpiarCacheSesiones();
    mockPool.query.mockImplementation(async () => ({ rows: [sesionBd({ rol_id: 5, empresa_id: null, empresa_activa: null })], rowCount: 1 }));
    expect((await request(app).get('/api/empresas').set(auth(5))).statusCode).toBe(200);
  });

  it('el rol de la BD manda sobre el del token (token de Administrador, BD dice Trabajador)', async () => {
    mockPool.query.mockImplementation(async (sql) => {
      if (/FROM usuarios u\s+LEFT JOIN empresas e/.test(sql)) return { rows: [sesionBd({ rol_id: 3 })], rowCount: 1 };
      return { rows: [], rowCount: 0 };
    });
    expect((await request(app).get('/api/usuarios').set(auth(1))).statusCode).toBe(403);
  });

  it('si la BD falla responde 503 (no deja pasar sin validar)', async () => {
    mockPool.query.mockRejectedValue(new Error('conexión caída'));
    const res = await request(app).get('/api/clientes').set(auth(1));
    expect(res.statusCode).toBe(503);
  });

  it('un token inválido sigue siendo 401 sin consultar la BD', async () => {
    const res = await request(app).get('/api/clientes').set('Authorization', 'Bearer basura');
    expect(res.statusCode).toBe(401);
    expect(consultasDeSesion()).toHaveLength(0);
  });
});

describe('Caché de sesiones', () => {
  it('varias peticiones seguidas consultan la BD una sola vez', async () => {
    for (let i = 0; i < 4; i += 1) await request(app).get('/api/clientes').set(auth(1));
    expect(consultasDeSesion()).toHaveLength(1);
  });

  it('invalidarSesionUsuario fuerza una nueva consulta', async () => {
    await request(app).get('/api/clientes').set(auth(1));
    sesiones.invalidarSesionUsuario(ID);
    await request(app).get('/api/clientes').set(auth(1));
    expect(consultasDeSesion()).toHaveLength(2);
  });

  it('invalidarSesionesEmpresa solo olvida las sesiones de esa empresa', async () => {
    await request(app).get('/api/clientes').set(auth(1));
    sesiones.invalidarSesionesEmpresa(99); // otra empresa: no afecta
    await request(app).get('/api/clientes').set(auth(1));
    expect(consultasDeSesion()).toHaveLength(1);
    sesiones.invalidarSesionesEmpresa(1);
    await request(app).get('/api/clientes').set(auth(1));
    expect(consultasDeSesion()).toHaveLength(2);
  });

  it('el estado desactivado también se cachea (una ráfaga de peticiones no golpea la BD)', async () => {
    mockPool.query.mockImplementation(async () => ({ rows: [sesionBd({ estado_activo: false })], rowCount: 1 }));
    for (let i = 0; i < 3; i += 1) expect((await request(app).get('/api/clientes').set(auth(1))).statusCode).toBe(401);
    expect(consultasDeSesion()).toHaveLength(1);
  });
});

describe('Rutas públicas con token (optionalVerifyToken)', () => {
  it('con sesión inválida el chatbot/configuración tratan al usuario como visitante', async () => {
    mockPool.query.mockImplementation(async (sql) => {
      if (/FROM usuarios u\s+LEFT JOIN empresas e/.test(sql)) return { rows: [sesionBd({ estado_activo: false })], rowCount: 1 };
      return { rows: [], rowCount: 0 };
    });
    const res = await request(app).get('/api/configuracion').set(auth(5));
    expect(res.statusCode).toBe(200);
    expect(res.body.data).not.toHaveProperty('seguridad'); // ya no se le trata como Super Admin
  });

  it('si la BD falla, la ruta pública responde igualmente (como visitante)', async () => {
    mockPool.query.mockRejectedValue(new Error('caída'));
    const res = await request(app).get('/api/configuracion').set(auth(5));
    expect(res.statusCode).toBe(200);
  });
});
