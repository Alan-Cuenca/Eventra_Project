/**
 * reglas_negocio.test.js
 * Reservas (solapamiento, PUT), eventos (cancelación lógica), actividades (responsable del tenant),
 * usuarios (rol_id, email normalizado, cupo del plan).
 */
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';

process.env.JWT_SECRET = 'test_secret_eventra_jest';
process.env.NODE_ENV = 'test';
process.env.PORT = '0';

const mockPool = { query: jest.fn(async () => ({ rows: [], rowCount: 0 })), connect: jest.fn() };
jest.unstable_mockModule('../src/config/db.js', () => ({ default: mockPool }));

const { default: app } = await import('../src/app.js');

const token = (rol_id, id = 'u-1') => jwt.sign({ id, empresa_id: 1, rol_id, email: 'x@test.com' }, process.env.JWT_SECRET, { expiresIn: '1h' });
const auth = (rol, id) => ({ Authorization: `Bearer ${token(rol, id)}` });
const ID = '33333333-3333-3333-3333-333333333333';

beforeEach(() => {
  mockPool.query.mockReset();
  mockPool.query.mockImplementation(async () => ({ rows: [], rowCount: 0 }));
});

describe('Reservas — solapamiento horario', () => {
  const body = { cotizacion_id: ID, salon_o_lugar: 'Salón Imperial', fecha_evento: '2027-03-10', hora_inicio: '10:00', hora_fin: '12:00' };

  const handler = (totalSolapes) => async (sql) => {
    if (/FROM cotizaciones WHERE id/.test(sql)) return { rows: [{ id: ID }], rowCount: 1 };
    if (/COUNT\(\*\) AS total/.test(sql)) return { rows: [{ total: String(totalSolapes) }], rowCount: 1 };
    if (/INSERT INTO reservas/.test(sql)) return { rows: [{ id: 'r1' }], rowCount: 1 };
    return { rows: [], rowCount: 0 };
  };

  it('400 si hora_inicio y hora_fin son iguales', async () => {
    mockPool.query.mockImplementation(handler(0));
    const res = await request(app).post('/api/reservas').set(auth(2)).send({ ...body, hora_fin: '10:00' });
    expect(res.statusCode).toBe(400);
  });

  it('409 cuando existe una reserva activa que se solapa', async () => {
    mockPool.query.mockImplementation(handler(1));
    const res = await request(app).post('/api/reservas').set(auth(2)).send(body);
    expect(res.statusCode).toBe(409);
  });

  it('201 sin solapamientos y envía los parámetros del bloque al SQL', async () => {
    mockPool.query.mockImplementation(handler(0));
    const res = await request(app).post('/api/reservas').set(auth(1)).send(body);
    expect(res.statusCode).toBe(201);
    const solape = mockPool.query.mock.calls.find(([sql]) => /COUNT\(\*\) AS total/.test(sql));
    expect(solape[1]).toEqual([1, 'Salón Imperial', '2027-03-10', '10:00', '12:00', null]);
  });

  it('el SQL de solapamiento ignora canceladas, compara salón sin mayúsculas y usa hora_inicio para el fin del bloque nuevo', async () => {
    mockPool.query.mockImplementation(handler(0));
    await request(app).post('/api/reservas').set(auth(1)).send(body);
    const [sql] = mockPool.query.mock.calls.find(([s]) => /COUNT\(\*\) AS total/.test(s));
    expect(sql).toMatch(/estado <> 'Cancelada'/);
    expect(sql).toMatch(/LOWER\(TRIM\(salon_o_lugar\)\) = LOWER\(TRIM\(\$2\)\)/);
    // El fin del bloque nuevo se calcula sumando la duración al INICIO ($4), no al fin ($5)
    expect(sql).toMatch(/\(\(\$3::date \+ \$4::time\) \+ CASE/);
    expect(sql).not.toMatch(/\(\(\$3::date \+ \$5::time\) \+ CASE/);
  });

  it('PUT: 409 si el cambio choca con otra reserva (excluye la propia)', async () => {
    mockPool.query.mockImplementation(async (sql) => {
      if (/FROM reservas WHERE id/.test(sql)) {
        return { rows: [{ salon_o_lugar: 'A', fecha_evento: '2027-03-10', hora_inicio: '10:00:00', hora_fin: '12:00:00', estado: 'Confirmada' }], rowCount: 1 };
      }
      if (/COUNT\(\*\) AS total/.test(sql)) return { rows: [{ total: '1' }], rowCount: 1 };
      return { rows: [], rowCount: 0 };
    });
    const res = await request(app).put(`/api/reservas/${ID}`).set(auth(1)).send({ hora_inicio: '11:00' });
    expect(res.statusCode).toBe(409);
    const solape = mockPool.query.mock.calls.find(([sql]) => /COUNT\(\*\) AS total/.test(sql));
    expect(solape[1][5]).toBe(ID);
  });

  it('PUT: cancelar no revisa colisiones', async () => {
    mockPool.query.mockImplementation(async (sql) => {
      if (/FROM reservas WHERE id/.test(sql)) {
        return { rows: [{ salon_o_lugar: 'A', fecha_evento: '2027-03-10', hora_inicio: '10:00:00', hora_fin: '12:00:00', estado: 'Confirmada' }], rowCount: 1 };
      }
      if (/UPDATE reservas/.test(sql)) return { rows: [{ id: ID, estado: 'Cancelada' }], rowCount: 1 };
      return { rows: [], rowCount: 0 };
    });
    const res = await request(app).put(`/api/reservas/${ID}`).set(auth(1)).send({ estado: 'Cancelada' });
    expect(res.statusCode).toBe(200);
    expect(mockPool.query.mock.calls.some(([sql]) => /COUNT\(\*\) AS total/.test(sql))).toBe(false);
  });

  it('PUT: 400 con un estado desconocido', async () => {
    const res = await request(app).put(`/api/reservas/${ID}`).set(auth(1)).send({ estado: 'Borrada' });
    expect(res.statusCode).toBe(400);
  });
});

describe('Eventos — cancelación lógica', () => {
  it('DELETE cancela el evento y no borra pagos ni actividades', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: ID }], rowCount: 1 });
    const res = await request(app).delete(`/api/eventos/${ID}`).set(auth(1));
    expect(res.statusCode).toBe(200);
    const [sql] = mockPool.query.mock.calls[0];
    expect(sql).toMatch(/UPDATE eventos SET estado_progreso = 'Cancelado'/);
    expect(sql).not.toMatch(/DELETE FROM/);
  });

  it('403 para el Trabajador', async () => {
    const res = await request(app).delete(`/api/eventos/${ID}`).set(auth(3));
    expect(res.statusCode).toBe(403);
  });

  it('400 con identificador inválido', async () => {
    mockPool.query.mockRejectedValueOnce({ code: '22P02', message: 'uuid' });
    const res = await request(app).delete('/api/eventos/xyz').set(auth(1));
    expect(res.statusCode).toBe(400);
  });
});

describe('Actividades — responsable y estado', () => {
  it('PUT: 404 si el responsable no pertenece a la empresa', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    const res = await request(app).put(`/api/actividades/${ID}`).set(auth(2)).send({ responsable_id: ID });
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toMatch(/responsable/i);
  });

  it('PATCH estado: el Trabajador solo actualiza actividades asignadas a él', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: ID, estado: 'Completada' }], rowCount: 1 });
    await request(app).patch(`/api/actividades/${ID}/estado`).set(auth(3, 'trabajador-9')).send({ estado: 'Completada' });
    const [sql, params] = mockPool.query.mock.calls[0];
    expect(sql).toMatch(/responsable_id = \$4/);
    expect(params[3]).toBe('trabajador-9');
  });

  it('PATCH estado: el Administrador no se limita por responsable', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: ID }], rowCount: 1 });
    await request(app).patch(`/api/actividades/${ID}/estado`).set(auth(1)).send({ estado: 'Completada' });
    expect(mockPool.query.mock.calls[0][1][3]).toBeNull();
  });
});

describe('Usuarios', () => {
  it('GET: permitido a Administrador y Gerente, no al Trabajador', async () => {
    expect((await request(app).get('/api/usuarios').set(auth(1))).statusCode).toBe(200);
    expect((await request(app).get('/api/usuarios').set(auth(2))).statusCode).toBe(200);
    expect((await request(app).get('/api/usuarios').set(auth(3))).statusCode).toBe(403);
  });

  it('POST: 400 con rol_id fuera de 1-4 y 403 con Super_Admin', async () => {
    const base = { nombre_completo: 'Ana', email: 'ana@test.com', password: 'Password1' };
    mockPool.query.mockImplementation(async (sql) => {
      if (/FROM empresas WHERE id/.test(sql)) return { rows: [{ plan_suscripcion: 'Premium', mensajes_chatbot_mes: 0 }], rowCount: 1 };
      if (/COUNT\(\*\)/.test(sql)) return { rows: [{ count: '0' }], rowCount: 1 };
      return { rows: [], rowCount: 0 };
    });
    expect((await request(app).post('/api/usuarios').set(auth(1)).send({ ...base, rol_id: 9 })).statusCode).toBe(400);
    expect((await request(app).post('/api/usuarios').set(auth(1)).send({ ...base, rol_id: 5 })).statusCode).toBe(403);
  });

  it('PUT: un administrador no puede cambiarse el rol ni desactivarse', async () => {
    const yo = 'admin-1';
    const r1 = await request(app).put(`/api/usuarios/${yo}`).set(auth(1, yo)).send({ rol_id: 3 });
    const r2 = await request(app).put(`/api/usuarios/${yo}`).set(auth(1, yo)).send({ estado_activo: false });
    expect(r1.statusCode).toBe(400);
    expect(r2.statusCode).toBe(400);
  });

  it('PUT: reactivar a un colaborador sin cupo en el plan devuelve 403 PLAN_LIMIT_EXCEEDED', async () => {
    mockPool.query.mockImplementation(async (sql) => {
      if (/SELECT estado_activo, rol_id FROM usuarios/.test(sql)) return { rows: [{ estado_activo: false, rol_id: 3 }], rowCount: 1 };
      if (/SELECT plan_suscripcion FROM empresas/.test(sql)) return { rows: [{ plan_suscripcion: 'Basico' }], rowCount: 1 };
      if (/COUNT\(\*\) FROM usuarios/.test(sql)) return { rows: [{ count: '3' }], rowCount: 1 };
      return { rows: [], rowCount: 0 };
    });
    const res = await request(app).put(`/api/usuarios/${ID}`).set(auth(1, 'admin-1')).send({ estado_activo: true });
    expect(res.statusCode).toBe(403);
    expect(res.body.error).toBe('PLAN_LIMIT_EXCEEDED');
  });
});
