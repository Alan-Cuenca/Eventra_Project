/**
 * cotizaciones_estado.test.js
 * Estados de cotización (PATCH /:id/estado), detalle (GET /:id) y cálculo del total en servidor.
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

const token = (rol_id) => jwt.sign({ id: 'u-1', empresa_id: 1, rol_id, email: 'x@test.com' }, process.env.JWT_SECRET, { expiresIn: '1h' });
const ID = '11111111-1111-1111-1111-111111111111';

beforeEach(() => {
  mockPool.query.mockReset();
  mockPool.query.mockImplementation(async () => ({ rows: [], rowCount: 0 }));
});

describe('PATCH /api/cotizaciones/:id/estado', () => {
  it('401 sin token', async () => {
    const res = await request(app).patch(`/api/cotizaciones/${ID}/estado`).send({ estado: 'Aprobada' });
    expect(res.statusCode).toBe(401);
  });

  it('403 para Trabajador y Cliente (solo Administrador y Gerente)', async () => {
    for (const rol of [3, 4]) {
      const res = await request(app).patch(`/api/cotizaciones/${ID}/estado`).set('Authorization', `Bearer ${token(rol)}`).send({ estado: 'Aprobada' });
      expect(res.statusCode).toBe(403);
    }
  });

  it('400 con estado inválido', async () => {
    const res = await request(app).patch(`/api/cotizaciones/${ID}/estado`).set('Authorization', `Bearer ${token(1)}`).send({ estado: 'Inventado' });
    expect(res.statusCode).toBe(400);
  });

  it('404 si la cotización no existe en la empresa', async () => {
    const res = await request(app).patch(`/api/cotizaciones/${ID}/estado`).set('Authorization', `Bearer ${token(1)}`).send({ estado: 'Aprobada' });
    expect(res.statusCode).toBe(404);
  });

  it('409 en una transición no permitida (Rechazada -> Aprobada)', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ estado: 'Rechazada' }], rowCount: 1 });
    const res = await request(app).patch(`/api/cotizaciones/${ID}/estado`).set('Authorization', `Bearer ${token(2)}`).send({ estado: 'Aprobada' });
    expect(res.statusCode).toBe(409);
    expect(res.body.message).toMatch(/Rechazada/);
  });

  it('200 en Pendiente -> Aprobada y filtra el UPDATE por empresa_id', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ estado: 'Pendiente' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ id: ID, estado: 'Aprobada', total_calculado: '100.00' }], rowCount: 1 });
    const res = await request(app).patch(`/api/cotizaciones/${ID}/estado`).set('Authorization', `Bearer ${token(1)}`).send({ estado: 'Aprobada' });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.estado).toBe('Aprobada');
    const [sql, params] = mockPool.query.mock.calls[1];
    expect(sql).toMatch(/UPDATE cotizaciones/);
    expect(params).toEqual(['Aprobada', ID, 1]);
  });

  it('400 con identificador que no es UUID (22P02)', async () => {
    mockPool.query.mockRejectedValueOnce({ code: '22P02', message: 'invalid input syntax for type uuid' });
    const res = await request(app).patch('/api/cotizaciones/abc/estado').set('Authorization', `Bearer ${token(1)}`).send({ estado: 'Aprobada' });
    expect(res.statusCode).toBe(400);
  });
});

describe('GET /api/cotizaciones/:id', () => {
  it('404 si no existe', async () => {
    const res = await request(app).get(`/api/cotizaciones/${ID}`).set('Authorization', `Bearer ${token(1)}`);
    expect(res.statusCode).toBe(404);
  });

  it('el rol Cliente consulta solo con su email (filtro de aislamiento)', async () => {
    await request(app).get(`/api/cotizaciones/${ID}`).set('Authorization', `Bearer ${token(4)}`);
    const [, params] = mockPool.query.mock.calls[0];
    expect(params).toEqual([ID, 1, 'x@test.com']);
  });

  it('el personal interno consulta sin filtro de email', async () => {
    await request(app).get(`/api/cotizaciones/${ID}`).set('Authorization', `Bearer ${token(2)}`);
    const [, params] = mockPool.query.mock.calls[0];
    expect(params).toEqual([ID, 1, null]);
  });
});

describe('POST /api/cotizaciones — total calculado en servidor', () => {
  const montarHandler = (precioPaquete) => {
    mockPool.query.mockImplementation(async (sql) => {
      if (/FROM clientes WHERE id/.test(sql)) return { rows: [{ id: 'c1' }], rowCount: 1 };
      if (/FROM paquetes WHERE id/.test(sql)) return { rows: [{ id: 'p1', precio_total: precioPaquete }], rowCount: 1 };
      if (/INSERT INTO cotizaciones/.test(sql)) return { rows: [{ id: ID }], rowCount: 1 };
      return { rows: [], rowCount: 0 };
    });
  };

  it('nunca guarda un total menor al precio del paquete', async () => {
    montarHandler('3000.00');
    const res = await request(app).post('/api/cotizaciones').set('Authorization', `Bearer ${token(1)}`)
      .send({ cliente_id: 'c1', paquete_id: 'p1', fecha_estimada_evento: '2027-01-01', total_calculado: 100 });
    expect(res.statusCode).toBe(201);
    const insert = mockPool.query.mock.calls.find(([sql]) => /INSERT INTO cotizaciones/.test(sql));
    expect(insert[1][4]).toBe(3000);
  });

  it('con paquete no exige total_calculado', async () => {
    montarHandler('1500.00');
    const res = await request(app).post('/api/cotizaciones').set('Authorization', `Bearer ${token(3)}`)
      .send({ cliente_id: 'c1', paquete_id: 'p1', fecha_estimada_evento: '2027-01-01' });
    expect(res.statusCode).toBe(201);
    const insert = mockPool.query.mock.calls.find(([sql]) => /INSERT INTO cotizaciones/.test(sql));
    expect(insert[1][4]).toBe(1500);
  });

  it('400 sin paquete y sin total', async () => {
    montarHandler('0');
    const res = await request(app).post('/api/cotizaciones').set('Authorization', `Bearer ${token(1)}`)
      .send({ cliente_id: 'c1', fecha_estimada_evento: '2027-01-01' });
    expect(res.statusCode).toBe(400);
  });

  it('403 para el rol Cliente', async () => {
    const res = await request(app).post('/api/cotizaciones').set('Authorization', `Bearer ${token(4)}`)
      .send({ cliente_id: 'c1', paquete_id: 'p1', fecha_estimada_evento: '2027-01-01' });
    expect(res.statusCode).toBe(403);
  });
});
