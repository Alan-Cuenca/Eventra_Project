/**
 * edicion_reserva_colaborador.test.js
 * =============================================================================
 * - GET /api/reservas/:id: precarga del formulario de edición (aislamiento y rol Cliente).
 * - PUT /api/reservas/:id: horas iguales → 400; choque → 409; edición válida → 200.
 * - PUT /api/usuarios/:id: editar nombre y correo de un colaborador.
 * =============================================================================
 */
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';

process.env.JWT_SECRET = 'test_secret_edicion';
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

const tk = (rol_id, extra = {}) => jwt.sign(
  { id: `u${rol_id}`, rol_id, empresa_id: 7, email: `r${rol_id}@e.com`, ...extra },
  process.env.JWT_SECRET, { expiresIn: '1h' },
);
const RES = '9f8e7d6c-5b4a-4c3d-9e2f-1a0b9c8d7e6f';
const USR = '1b2c3d4e-5f6a-4b7c-8d9e-0f1a2b3c4d5e';

const reservaActual = {
  salon_o_lugar: 'Salón Imperial', fecha_evento: '2027-05-10', hora_inicio: '19:00:00', hora_fin: '02:00:00', estado: 'Confirmada',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockQueryHandler = null;
});

describe('GET /api/reservas/:id', () => {
  it('devuelve la reserva con fecha_iso, filtrando por empresa del JWT', async () => {
    mockQueryHandler = async () => ({ rows: [{ id: RES, salon_o_lugar: 'Salón Imperial', fecha_iso: '2027-05-10', cotizacion_id: 'c1' }], rowCount: 1 });
    const res = await request(app).get(`/api/reservas/${RES}`).set('Authorization', `Bearer ${tk(1)}`);
    expect(res.status).toBe(200);
    expect(res.body.data.fecha_iso).toBe('2027-05-10');
    const [sql, params] = mockPool.query.mock.calls[0];
    expect(sql).toMatch(/TO_CHAR\(r\.fecha_evento, 'YYYY-MM-DD'\) AS fecha_iso/);
    expect(sql).toMatch(/WHERE r\.id = \$1 AND r\.empresa_id = \$2/);
    expect(params).toEqual([RES, 7, null]);
  });

  it('el Cliente solo puede ver la suya (se filtra por su email)', async () => {
    const res = await request(app).get(`/api/reservas/${RES}`).set('Authorization', `Bearer ${tk(4, { email: 'Ana@Correo.com' })}`);
    expect(res.status).toBe(404);
    expect(mockPool.query.mock.calls[0][1]).toEqual([RES, 7, 'Ana@Correo.com']);
  });

  it('404 si no existe y 400 si el id no es UUID', async () => {
    expect((await request(app).get(`/api/reservas/${RES}`).set('Authorization', `Bearer ${tk(1)}`)).status).toBe(404);
    expect((await request(app).get('/api/reservas/abc').set('Authorization', `Bearer ${tk(1)}`)).status).toBe(400);
  });

  it('el listado sigue funcionando con la consulta compartida', async () => {
    mockQueryHandler = async () => ({ rows: [{ id: RES }], rowCount: 1 });
    const res = await request(app).get('/api/reservas').set('Authorization', `Bearer ${tk(2)}`);
    expect(res.status).toBe(200);
    expect(mockPool.query.mock.calls[0][0]).toMatch(/ORDER BY r\.fecha_evento ASC, r\.hora_inicio ASC/);
  });
});

describe('PUT /api/reservas/:id — edición', () => {
  const manejador = (solapes = 0) => async (sql, params) => {
    if (/FROM reservas WHERE id = \$1 AND empresa_id = \$2/.test(sql)) return { rows: [reservaActual], rowCount: 1 };
    if (/COUNT\(\*\) AS total/.test(sql)) return { rows: [{ total: String(solapes) }], rowCount: 1 };
    if (/UPDATE reservas/.test(sql)) return { rows: [{ id: params[5], salon_o_lugar: params[0] }], rowCount: 1 };
    return { rows: [], rowCount: 0 };
  };
  const put = (body, rol = 1) => request(app).put(`/api/reservas/${RES}`).set('Authorization', `Bearer ${tk(rol)}`).send(body);

  it('200: cambia salón, fecha y horario verificando el choque contra los valores nuevos', async () => {
    mockQueryHandler = manejador(0);
    const res = await put({ salon_o_lugar: 'Terraza', fecha_evento: '2027-05-11', hora_inicio: '12:00', hora_fin: '17:00' });
    expect(res.status).toBe(200);
    const solape = mockPool.query.mock.calls.find(([sql]) => /COUNT\(\*\) AS total/.test(sql));
    expect(solape[1]).toEqual([7, 'Terraza', '2027-05-11', '12:00', '17:00', RES]);
  });

  it('400 si la hora de inicio y de fin quedan iguales (aunque solo se envíe una)', async () => {
    mockQueryHandler = manejador(0);
    expect((await put({ hora_inicio: '12:00', hora_fin: '12:00' })).status).toBe(400);
    const res = await put({ hora_inicio: '02:00' }); // hora_fin actual es 02:00:00
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/no pueden ser iguales/);
    expect(mockPool.query.mock.calls.some(([sql]) => /UPDATE reservas/.test(sql))).toBe(false);
  });

  it('409 si el nuevo horario choca con otra reserva', async () => {
    mockQueryHandler = manejador(1);
    const res = await put({ hora_inicio: '18:00', hora_fin: '23:00' });
    expect(res.status).toBe(409);
  });

  it('el Trabajador no puede editar (403)', async () => {
    expect((await put({ salon_o_lugar: 'Terraza' }, 3)).status).toBe(403);
  });
});

describe('PUT /api/usuarios/:id — nombre y correo del colaborador', () => {
  const put = (body) => request(app).put(`/api/usuarios/${USR}`).set('Authorization', `Bearer ${tk(1)}`).send(body);

  it('200: guarda nombre recortado y correo en minúsculas', async () => {
    mockQueryHandler = async (sql, params) => (/UPDATE usuarios/.test(sql)
      ? { rows: [{ id: USR, nombre_completo: params[1], email: params[2] }], rowCount: 1 }
      : { rows: [], rowCount: 0 });
    const res = await put({ nombre_completo: '  Tomás Pérez ', email: ' Tomas.Perez@Empresa.COM ' });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ nombre_completo: 'Tomás Pérez', email: 'tomas.perez@empresa.com' });
    const update = mockPool.query.mock.calls.find(([sql]) => /UPDATE usuarios/.test(sql));
    expect(update[1].slice(5)).toEqual([USR, 7]); // aislado por empresa del JWT
  });

  it('400 si el nombre queda vacío', async () => {
    const res = await put({ nombre_completo: '   ' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/no puede quedar vacío/);
    expect(mockPool.query).not.toHaveBeenCalled();
  });

  it('400 si el correo no es válido', async () => {
    expect((await put({ email: 'no-es-correo' })).status).toBe(400);
  });

  it('409 si el correo ya lo usa otro usuario', async () => {
    mockQueryHandler = async () => { const e = new Error('dup'); e.code = '23505'; throw e; };
    const res = await put({ email: 'otro@empresa.com' });
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/otro usuario con ese email/);
  });

  it('404 si el colaborador no es de la empresa', async () => {
    expect((await put({ nombre_completo: 'X' })).status).toBe(404);
  });
});
