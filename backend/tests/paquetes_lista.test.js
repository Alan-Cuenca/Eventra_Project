/**
 * paquetes_lista.test.js
 * GET /api/paquetes devuelve los servicios incluidos de cada paquete (el cotizador los muestra).
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

const token = (rol_id, empresa_id = 7) => jwt.sign({ id: 'u-1', empresa_id, rol_id, email: 'x@test.com' }, process.env.JWT_SECRET, { expiresIn: '1h' });

beforeEach(() => {
  mockPool.query.mockReset();
  mockPool.query.mockImplementation(async () => ({ rows: [], rowCount: 0 }));
});

describe('GET /api/paquetes', () => {
  it('incluye servicios_incluidos y filtra por la empresa del token', async () => {
    mockPool.query.mockImplementation(async (sql) => {
      if (/FROM paquetes p/.test(sql)) {
        return {
          rows: [
            { id: 'p1', nombre: 'Boda Clásica', precio_total: '3800.00', estado_activo: true, servicios_incluidos: ['Alquiler del salón', 'Banquete'] },
            { id: 'p2', nombre: 'Sin servicios', precio_total: '100.00', estado_activo: true, servicios_incluidos: [] },
          ],
          rowCount: 2,
        };
      }
      return { rows: [], rowCount: 0 };
    });

    const res = await request(app).get('/api/paquetes').set('Authorization', `Bearer ${token(1)}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data[0].servicios_incluidos).toEqual(['Alquiler del salón', 'Banquete']);
    expect(res.body.data[1].servicios_incluidos).toEqual([]);

    const [sql, params] = mockPool.query.mock.calls.find(([q]) => /FROM paquetes p/.test(q));
    expect(sql).toMatch(/LEFT JOIN paquete_servicios/);
    expect(sql).toMatch(/servicios_incluidos/);
    expect(params).toEqual([7]);
  });
});
