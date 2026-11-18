/**
 * aislamiento_cliente.test.js
 * El rol Cliente (4) solo ve y paga lo suyo (filtro por email) y no accede a rutas internas.
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

const EMAIL = 'cliente@correo.com';
const token = (rol_id, email = EMAIL) => jwt.sign({ id: 'u-1', empresa_id: 1, rol_id, email }, process.env.JWT_SECRET, { expiresIn: '1h' });
const auth = (rol) => ({ Authorization: `Bearer ${token(rol)}` });
const EV = '22222222-2222-2222-2222-222222222222';

beforeEach(() => {
  mockPool.query.mockReset();
  mockPool.query.mockImplementation(async () => ({ rows: [], rowCount: 0 }));
});

describe('Listados filtrados por email para el rol Cliente', () => {
  const casos = [
    ['reservas', '/api/reservas'],
    ['eventos', '/api/eventos'],
    ['cotizaciones', '/api/cotizaciones'],
  ];

  it.each(casos)('GET %s: el Cliente envía su email como filtro', async (_n, url) => {
    const res = await request(app).get(url).set(auth(4));
    expect(res.statusCode).toBe(200);
    const [sql, params] = mockPool.query.mock.calls[0];
    expect(sql).toMatch(/LOWER\(cl\.email\)/);
    expect(params).toEqual([1, EMAIL]);
  });

  it.each(casos)('GET %s: el personal interno no filtra por email', async (_n, url) => {
    await request(app).get(url).set(auth(2));
    const [, params] = mockPool.query.mock.calls[0];
    expect(params).toEqual([1, null]);
  });

  it('GET /api/eventos/:id aplica el filtro de email para el Cliente', async () => {
    await request(app).get(`/api/eventos/${EV}`).set(auth(4));
    const [, params] = mockPool.query.mock.calls[0];
    expect(params).toEqual([EV, 1, EMAIL]);
  });
});

describe('Rutas cerradas al Cliente (403)', () => {
  it.each([
    ['GET', '/api/clientes'],
    ['GET', '/api/actividades'],
    ['POST', '/api/clientes'],
    ['POST', '/api/reservas'],
    ['POST', '/api/eventos'],
    ['GET', '/api/pagos'],
    ['GET', '/api/usuarios'],
    ['GET', '/api/dashboard/admin'],
  ])('%s %s', async (metodo, url) => {
    const res = await request(app)[metodo.toLowerCase()](url).set(auth(4)).send({});
    expect(res.statusCode).toBe(403);
  });

  it('PATCH estado de actividad: 403 para el Cliente', async () => {
    const res = await request(app).patch(`/api/actividades/${EV}/estado`).set(auth(4)).send({ estado: 'Completada' });
    expect(res.statusCode).toBe(403);
  });
});

describe('Pagos del Cliente', () => {
  it('404 si el evento no es suyo (la consulta incluye su email)', async () => {
    const res = await request(app).post('/api/pagos').set(auth(4))
      .field('evento_id', EV).field('monto', '100').field('concepto', 'Anticipo').field('metodo_pago', 'Efectivo');
    expect(res.statusCode).toBe(404);
    const [sql, params] = mockPool.query.mock.calls[0];
    expect(sql).toMatch(/LOWER\(cl\.email\)/);
    expect(params).toEqual([EV, 1, EMAIL]);
  });

  it('GET /api/pagos/evento/:id responde 403 si el evento es de otro cliente', async () => {
    const res = await request(app).get(`/api/pagos/evento/${EV}`).set(auth(4));
    expect(res.statusCode).toBe(403);
  });

  it('GET /api/pagos/evento/:id permite el evento propio', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }], rowCount: 1 }) // propiedad
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })                 // pagos
      .mockResolvedValueOnce({ rows: [{ total_pagado: '0', cantidad_pagos: '0' }], rowCount: 1 });
    const res = await request(app).get(`/api/pagos/evento/${EV}`).set(auth(4));
    expect(res.statusCode).toBe(200);
  });

  it('un Cliente no puede fijar el estado del pago con un método genérico', async () => {
    mockPool.query.mockImplementation(async (sql) => {
      if (/FROM eventos e/.test(sql)) return { rows: [{ id: EV }], rowCount: 1 };
      if (/INSERT INTO pagos/.test(sql)) return { rows: [{ id: 'p1', estado: 'x' }], rowCount: 1 };
      return { rows: [], rowCount: 0 };
    });
    await request(app).post('/api/pagos').set(auth(4))
      .field('evento_id', EV).field('monto', '100').field('concepto', 'Anticipo').field('metodo_pago', 'Tarjeta').field('estado', 'Completado');
    const insert = mockPool.query.mock.calls.find(([sql]) => /INSERT INTO pagos/.test(sql));
    expect(insert[1]).toContain('Pendiente');
    expect(insert[1]).not.toContain('Completado');
  });

  it('rechaza comprobantes con tipo no permitido (400)', async () => {
    const res = await request(app).post('/api/pagos').set(auth(1))
      .field('evento_id', EV).field('monto', '100').field('concepto', 'Anticipo').field('metodo_pago', 'Transferencia')
      .attach('comprobante', Buffer.from('<svg/>'), { filename: 'x.svg', contentType: 'image/svg+xml' });
    expect(res.statusCode).toBe(400);
  });
});
