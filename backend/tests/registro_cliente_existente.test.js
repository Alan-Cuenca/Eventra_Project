/**
 * registro_cliente_existente.test.js
 * Si la empresa ya registró a la persona como cliente, el registro público no crea otra
 * ficha ni la vincula sin verificar el correo: responde 409 CLIENTE_YA_REGISTRADO y la
 * empresa le envía el acceso por invitación (POST /auth/invitar con rol 4).
 */
import request from 'supertest';
import { jest } from '@jest/globals';

process.env.JWT_SECRET = 'test_secret_registro_cliente';
process.env.NODE_ENV = 'test';
process.env.PORT = '0';

let clienteExiste = true;
const consultas = [];
const mockClient = {
  query: jest.fn(async (sql) => {
    consultas.push(sql);
    if (/FROM empresas/.test(sql)) return { rows: [{ id: 16, nombre_comercial: 'Helados la catedral', slug: 'helados-la-catedral', plan_suscripcion: 'Premium', estado_activo: true }], rowCount: 1 };
    if (/FROM usuarios WHERE email/.test(sql)) return { rows: [], rowCount: 0 };
    if (/FROM clientes WHERE empresa_id = \$1 AND LOWER\(email\)/.test(sql)) return clienteExiste ? { rows: [{}], rowCount: 1 } : { rows: [], rowCount: 0 };
    if (/INSERT INTO usuarios/.test(sql)) return { rows: [{ id: 'u1', email: 'ana@correo.com' }], rowCount: 1 };
    if (/INSERT INTO clientes/.test(sql)) return { rows: [{ id: 'c1' }], rowCount: 1 };
    return { rows: [], rowCount: 0 };
  }),
  release: jest.fn(),
};
const mockPool = {
  query: jest.fn(async (sql) => {
    if (/FROM empresas WHERE/.test(sql)) return { rows: [{ id: 16, plan_suscripcion: 'Premium', mensajes_chatbot_mes: 0 }], rowCount: 1 };
    return { rows: [{ count: '0' }], rowCount: 1 };
  }),
  connect: jest.fn(async () => mockClient),
};
jest.unstable_mockModule('../src/config/db.js', () => ({ default: mockPool }));
jest.unstable_mockModule('../src/config/supabase.js', () => ({ supabase: null }));
jest.unstable_mockModule('openai', () => ({ default: class { chat = { completions: { create: jest.fn() } }; } }));

const { default: app } = await import('../src/app.js');

const registrar = () => request(app).post('/api/clientes/registro-publico').send({
  empresa_slug: 'helados-la-catedral', nombres: 'Ana', apellidos: 'Pérez', email: 'Ana@Correo.com', password: 'ClaveSegura2026!', telefono: '0990000000',
});

beforeEach(() => { jest.clearAllMocks(); consultas.length = 0; });

describe('Registro público de un cliente que la empresa ya tenía', () => {
  it('409 CLIENTE_YA_REGISTRADO con instrucciones, sin crear usuario ni ficha', async () => {
    clienteExiste = true;
    const res = await registrar();
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('CLIENTE_YA_REGISTRADO');
    expect(res.body.message).toMatch(/Helados la catedral ya te tiene registrado como cliente/);
    expect(consultas.some((q) => /INSERT INTO/.test(q))).toBe(false);
    expect(mockClient.release).toHaveBeenCalled();
  });

  it('un cliente nuevo se registra normalmente', async () => {
    clienteExiste = false;
    const res = await registrar();
    expect(res.status).toBe(201);
    expect(consultas.some((q) => /INSERT INTO usuarios/.test(q))).toBe(true);
  });
});
