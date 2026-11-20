/**
 * seguridad_suscripciones.test.js
 * Seguridad transversal (helmet, errores, login sin enumeración, rate limit, tokens de invitación)
 * y suscripciones (plan normalizado, solicitud pública de plan).
 */
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';

process.env.JWT_SECRET = 'test_secret_eventra_jest';
process.env.NODE_ENV = 'test';
process.env.PORT = '0';

const mockPool = { query: jest.fn(async () => ({ rows: [], rowCount: 0 })), connect: jest.fn() };
jest.unstable_mockModule('../src/config/db.js', () => ({ default: mockPool }));

// Supabase simulado: el resultado de la subida se controla por prueba
let resultadoSubida = { error: null };
jest.unstable_mockModule('../src/config/supabase.js', () => ({
  supabase: {
    storage: {
      from: () => ({
        upload: async () => resultadoSubida,
      }),
    },
  },
}));

const { default: app } = await import('../src/app.js');
const { normalizarPlan } = await import('../src/middlewares/planLimitsMiddleware.js');
const { crearRateLimit } = await import('../src/middlewares/rateLimit.js');

const token = (rol_id, extra = {}) => jwt.sign({ id: 'u-1', empresa_id: 1, rol_id, email: 'x@test.com', ...extra }, process.env.JWT_SECRET, { expiresIn: '1h' });
const auth = (rol) => ({ Authorization: `Bearer ${token(rol)}` });

beforeEach(() => {
  mockPool.query.mockReset();
  mockPool.query.mockImplementation(async () => ({ rows: [], rowCount: 0 }));
  resultadoSubida = { error: null };
});

describe('Seguridad transversal', () => {
  it('helmet agrega cabeceras de seguridad', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('JSON malformado responde 400 en JSON (sin stack trace ni HTML)', async () => {
    const res = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{"email": ');
    expect(res.statusCode).toBe(400);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.body.success).toBe(false);
    expect(JSON.stringify(res.body)).not.toMatch(/at \w+|node_modules/);
  });

  it('login: usuario inexistente y contraseña mala devuelven la misma respuesta (401)', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'nadie@test.com', password: 'Password1' });
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/Credenciales inválidas/);
  });

  it('login: 400 si email o password no son texto', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: { $ne: 1 }, password: 'x' });
    expect(res.statusCode).toBe(400);
  });

  it('completar-registro rechaza un JWT que no es de tipo invitación', async () => {
    const jwtAjeno = jwt.sign({ email: 'a@test.com', rol_id: 3, empresa_id: 1 }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const res = await request(app).post('/api/auth/completar-registro')
      .send({ token: jwtAjeno, nombre_completo: 'Ana Pérez', password: 'Password1', cedula: '1234567890' });
    expect(res.statusCode).toBe(400);
  });

  it('el limitador devuelve 429 al superar el máximo y Retry-After', () => {
    const previo = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const limitar = crearRateLimit({ ventanaMs: 60_000, max: 2 });
      const res = () => {
        const r = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; } };
        return r;
      };
      const req = { headers: {}, ip: '9.9.9.9' };
      const resultados = [];
      for (let i = 0; i < 3; i += 1) {
        const r = res();
        let pasó = false;
        limitar(req, r, () => { pasó = true; });
        resultados.push({ pasó, code: r.code, retry: r.headers['Retry-After'] });
      }
      expect(resultados[0].pasó).toBe(true);
      expect(resultados[1].pasó).toBe(true);
      expect(resultados[2]).toMatchObject({ pasó: false, code: 429 });
      expect(Number(resultados[2].retry)).toBeGreaterThan(0);
    } finally {
      process.env.NODE_ENV = previo;
    }
  });

  it('el chatbot rechaza mensajes de más de 1000 caracteres', async () => {
    mockPool.query.mockImplementation(async (sql) => {
      if (/FROM empresas/.test(sql)) return { rows: [{ id: 1, plan_suscripcion: 'Premium', mensajes_chatbot_mes: 0 }], rowCount: 1 };
      return { rows: [], rowCount: 0 };
    });
    const res = await request(app).post('/api/chatbot').send({ mensaje: 'a'.repeat(1001) });
    expect(res.statusCode).toBe(400);
  });
});

describe('normalizarPlan', () => {
  it.each([
    ['Premium', 'Premium'],
    ['premium', 'Premium'],
    ['Plan Premium (Corporativo + IA)', 'Premium'],
    ['Enterprise', 'Premium'],
    ['Profesional', 'Premium'],
    ['Basico', 'Basico'],
    ['Básico', 'Basico'],
    ['', 'Basico'],
    [null, 'Basico'],
    ['cualquier cosa', 'Basico'],
  ])('%s -> %s', (entrada, esperado) => {
    expect(normalizarPlan(entrada)).toBe(esperado);
  });
});

describe('Suscripciones — plan normalizado', () => {
  it('POST /pagar guarda el plan normalizado, no el texto libre', async () => {
    mockPool.query.mockImplementation(async (sql) => {
      if (/FROM empresas WHERE id/.test(sql)) return { rows: [{ id: 1, nombre_comercial: 'X', plan_suscripcion: 'Basico' }], rowCount: 1 };
      if (/INSERT INTO suscripciones_pagos/.test(sql)) return { rows: [{ id: 'a0000000-0000-0000-0000-0000000000c1' }], rowCount: 1 };
      return { rows: [], rowCount: 0 };
    });
    const res = await request(app).post('/api/suscripciones/pagar').set(auth(1)).send({ plan_nombre: 'plan PREMIUM corporativo', monto: 99 });
    expect(res.statusCode).toBe(201);
    const insert = mockPool.query.mock.calls.find(([sql]) => /INSERT INTO suscripciones_pagos/.test(sql));
    expect(insert[1][1]).toBe('Premium');
  });

  it('aprobar un pago normaliza el plan, reinicia el chatbot y NO reactiva la empresa', async () => {
    mockPool.query.mockImplementation(async (sql) => {
      if (/FROM suscripciones_pagos WHERE id/.test(sql)) return { rows: [{ id: 'a0000000-0000-0000-0000-0000000000c1', empresa_id: 7, plan_nombre: 'Enterprise', monto: '99', estado: 'En Revisión' }], rowCount: 1 };
      if (/UPDATE suscripciones_pagos/.test(sql)) return { rows: [{ id: 'a0000000-0000-0000-0000-0000000000c1', estado: 'Aprobado' }], rowCount: 1 };
      return { rows: [], rowCount: 0 };
    });
    const res = await request(app).put('/api/suscripciones/a0000000-0000-0000-0000-0000000000c1/estado').set(auth(5)).send({ estado: 'Aprobado' });
    expect(res.statusCode).toBe(200);
    const upd = mockPool.query.mock.calls.find(([sql]) => /UPDATE empresas/.test(sql));
    expect(upd[0]).not.toMatch(/estado_activo/);
    expect(upd[0]).toMatch(/chatbot_mes_ref/);
    expect(upd[1]).toEqual(['Premium', 7]);
  });

  it('PUT estado: 400 con id inválido (22P02)', async () => {
    mockPool.query.mockRejectedValueOnce({ code: '22P02', message: 'uuid' });
    const res = await request(app).put('/api/suscripciones/xyz/estado').set(auth(5)).send({ estado: 'Aprobado' });
    expect(res.statusCode).toBe(400);
  });

  it('actualizar el plan de una empresa (Super Admin) guarda el plan normalizado', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 1, plan_suscripcion: 'Premium' }], rowCount: 1 });
    const res = await request(app).put('/api/empresas/1/plan').set(auth(5)).send({ plan_suscripcion: 'Enterprise' });
    expect(res.statusCode).toBe(200);
    expect(mockPool.query.mock.calls[0][1][0]).toBe('Premium');
  });
});

describe('Solicitud pública de plan (landing)', () => {
  const pdf = Buffer.from('%PDF-1.4 test');
  const enviar = (campos = {}, archivo = true) => {
    let r = request(app).post('/api/suscripciones/solicitud-publica');
    const datos = { plan_nombre: 'Premium', correo_contacto: 'dueno@empresa.com', nombre_empresa: 'Eventos SA', ...campos };
    Object.entries(datos).forEach(([k, v]) => { r = r.field(k, v); });
    if (archivo) r = r.attach('comprobante', pdf, { filename: 'c.pdf', contentType: 'application/pdf' });
    return r;
  };

  it('400 con plan inválido', async () => {
    expect((await enviar({ plan_nombre: 'Gratis' })).statusCode).toBe(400);
  });
  it('400 con correo inválido', async () => {
    expect((await enviar({ correo_contacto: 'no-es-correo' })).statusCode).toBe(400);
  });
  it('400 sin comprobante', async () => {
    expect((await enviar({}, false)).statusCode).toBe(400);
  });
  it('400 si el archivo no es PDF', async () => {
    const res = await request(app).post('/api/suscripciones/solicitud-publica')
      .field('plan_nombre', 'Premium').field('correo_contacto', 'a@b.com').field('nombre_empresa', 'X')
      .attach('comprobante', Buffer.from('x'), { filename: 'c.png', contentType: 'image/png' });
    expect(res.statusCode).toBe(400);
  });
  it('201 y guarda la ruta privada del comprobante (no una URL pública)', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'sol-1', estado: 'Pendiente' }], rowCount: 1 });
    const res = await enviar();
    expect(res.statusCode).toBe(201);
    const [sql, params] = mockPool.query.mock.calls[0];
    expect(sql).toMatch(/INSERT INTO solicitudes_registro_plan/);
    expect(params.slice(0, 4)).toEqual(['Premium', 'mensual', 'dueno@empresa.com', 'Eventos SA']);
    expect(params[4]).toMatch(/^solicitudes-planes\/\d+_[a-z0-9]+\.pdf$/);
  });
  it('502 si falla la subida al almacenamiento', async () => {
    resultadoSubida = { error: { message: 'bucket not found' } };
    expect((await enviar()).statusCode).toBe(502);
  });

  it('GET solicitudes-publicas: solo Super Admin', async () => {
    expect((await request(app).get('/api/suscripciones/solicitudes-publicas').set(auth(1))).statusCode).toBe(403);
    expect((await request(app).get('/api/suscripciones/solicitudes-publicas').set(auth(5))).statusCode).toBe(200);
  });

  it('PATCH estado de solicitud: valida el valor y existencia', async () => {
    expect((await request(app).patch('/api/suscripciones/solicitudes-publicas/a0000000-0000-0000-0000-0000000000c2/estado').set(auth(5)).send({ estado: 'X' })).statusCode).toBe(400);
    expect((await request(app).patch('/api/suscripciones/solicitudes-publicas/a0000000-0000-0000-0000-0000000000c2/estado').set(auth(5)).send({ estado: 'Atendida' })).statusCode).toBe(404);
  });
});
