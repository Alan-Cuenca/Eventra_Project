/**
 * validaciones_reglas.test.js
 * Validaciones de entrada, ids UUID, reglas de reservas/cotizaciones/eventos, configuración pública
 * y modo mantenimiento.
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
const v = await import('../src/utils/validaciones.js');
const { esUuid } = await import('../src/middlewares/validarParams.js');
const mantenimiento = await import('../src/middlewares/configuracionPlataforma.js');

const token = (rol_id, id = 'u-1') => jwt.sign({ id, empresa_id: 1, rol_id, email: 'x@test.com' }, process.env.JWT_SECRET, { expiresIn: '1h' });
const auth = (rol, id) => ({ Authorization: `Bearer ${token(rol, id)}` });
const ID = '44444444-4444-4444-4444-444444444444';

beforeEach(() => {
  mockPool.query.mockReset();
  mockPool.query.mockImplementation(async () => ({ rows: [], rowCount: 0 }));
});

describe('utils/validaciones', () => {
  it('validarPassword: política única (8+, mayúscula y número)', () => {
    expect(v.validarPassword('Abcdef12')).toBeNull();
    expect(v.validarPassword('abcdef12')).toMatch(/mayúscula/);
    expect(v.validarPassword('Abcdefgh')).toMatch(/número/);
    expect(v.validarPassword('Ab1')).toMatch(/8 caracteres/);
    expect(v.validarPassword('A1' + 'a'.repeat(80))).toMatch(/72/);
    expect(v.validarPassword(undefined)).toMatch(/obligatoria/);
  });

  it('validarMonto: positivo y dentro de DECIMAL(10,2)', () => {
    expect(v.validarMonto(100)).toBeNull();
    expect(v.validarMonto('50.5')).toBeNull();
    expect(v.validarMonto(0)).toMatch(/mayor a cero/);
    expect(v.validarMonto(0, { permitirCero: true })).toBeNull();
    expect(v.validarMonto(-5)).toBeTruthy();
    expect(v.validarMonto('abc')).toMatch(/número/);
    expect(v.validarMonto(1e12)).toMatch(/máximo/);
  });

  it('validarFecha: rechaza fechas inexistentes', () => {
    expect(v.validarFecha('2027-02-28')).toBeNull();
    expect(v.validarFecha('2027-02-31')).toMatch(/válida/);
    expect(v.validarFecha('15/03/2027')).toMatch(/AAAA-MM-DD/);
    expect(v.validarFecha(undefined)).toBeTruthy();
  });

  it('validarHora y validarEmailOpcional', () => {
    expect(v.validarHora('19:30')).toBeNull();
    expect(v.validarHora('25:00')).toBeTruthy();
    expect(v.validarEmailOpcional('')).toBeNull();
    expect(v.validarEmailOpcional('a@b.co')).toBeNull();
    expect(v.validarEmailOpcional('no-es-correo')).toMatch(/formato/);
  });

  it('esUuid acepta UUID y rechaza otros valores', () => {
    expect(esUuid(ID)).toBe(true);
    expect(esUuid('abc')).toBe(false);
    expect(esUuid("1' OR '1'='1")).toBe(false);
  });
});

describe('Ids de ruta inválidos responden 400 (no 500)', () => {
  it.each([
    ['get', '/api/clientes/abc'],
    ['put', '/api/servicios/abc'],
    ['delete', '/api/paquetes/abc'],
    ['get', '/api/proveedores/abc'],
    ['put', '/api/pagos/abc/estado'],
    ['get', '/api/pagos/evento/abc'],
    ['put', '/api/solicitudes/abc/estado'],
    ['delete', '/api/usuarios/abc'],
    ['put', '/api/empresas/abc/plan'],
  ])('%s %s', async (metodo, url) => {
    const res = await request(app)[metodo](url).set(auth(5)).send({});
    expect(res.statusCode).toBe(400);
    expect(mockPool.query).not.toHaveBeenCalled();
  });
});

describe('Validaciones en endpoints', () => {
  it('POST /api/clientes: 400 con email inválido', async () => {
    mockPool.query.mockImplementation(async () => ({ rows: [{ count: '0', plan_suscripcion: 'Premium' }], rowCount: 1 }));
    const res = await request(app).post('/api/clientes').set(auth(2)).send({ nombres: 'Ana', apellidos: 'Ruiz', email: 'sin-arroba' });
    expect(res.statusCode).toBe(400);
  });

  it('POST /api/usuarios: 400 con contraseña débil', async () => {
    mockPool.query.mockImplementation(async (sql) => {
      if (/FROM empresas WHERE id/.test(sql)) return { rows: [{ plan_suscripcion: 'Premium', mensajes_chatbot_mes: 0 }], rowCount: 1 };
      if (/COUNT\(\*\)/.test(sql)) return { rows: [{ count: '0' }], rowCount: 1 };
      return { rows: [], rowCount: 0 };
    });
    const res = await request(app).post('/api/usuarios').set(auth(1)).send({ nombre_completo: 'Ana', email: 'ana@test.com', password: 'debil', rol_id: 3 });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/contraseña/i);
  });

  it('POST /api/pagos: 400 con concepto fuera del catálogo', async () => {
    const res = await request(app).post('/api/pagos').set(auth(1))
      .field('evento_id', ID).field('monto', '100').field('concepto', 'Inventado').field('metodo_pago', 'Efectivo');
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/concepto/i);
  });

  it('POST /api/pagos: 400 con monto fuera de rango', async () => {
    const res = await request(app).post('/api/pagos').set(auth(1))
      .field('evento_id', ID).field('monto', '1e15').field('concepto', 'Anticipo').field('metodo_pago', 'Efectivo');
    expect(res.statusCode).toBe(400);
  });

  it('POST /api/servicios: 400 con precio absurdo', async () => {
    mockPool.query.mockImplementation(async () => ({ rows: [{ count: '0', plan_suscripcion: 'Premium' }], rowCount: 1 }));
    const res = await request(app).post('/api/servicios').set(auth(1)).send({ nombre: 'DJ', precio_base: 1e15 });
    expect(res.statusCode).toBe(400);
  });
});

describe('Reservas — reglas de negocio', () => {
  const body = { cotizacion_id: ID, salon_o_lugar: 'Salón A', fecha_evento: '2099-03-10', hora_inicio: '10:00', hora_fin: '12:00' };
  const conCotizacion = (fila) => mockPool.query.mockImplementation(async (sql) => {
    if (/FROM cotizaciones c WHERE c.id/.test(sql)) return { rows: [{ id: ID, ...fila }], rowCount: 1 };
    if (/COUNT\(\*\) AS total/.test(sql)) return { rows: [{ total: '0' }], rowCount: 1 };
    if (/INSERT INTO reservas/.test(sql)) return { rows: [{ id: 'r1' }], rowCount: 1 };
    return { rows: [], rowCount: 0 };
  });

  it('409 si la cotización no está Aprobada', async () => {
    conCotizacion({ estado: 'Pendiente', tiene_reserva: false });
    const res = await request(app).post('/api/reservas').set(auth(2)).send(body);
    expect(res.statusCode).toBe(409);
    expect(res.body.message).toMatch(/Aprobada/);
  });

  it('409 si la cotización ya tiene una reserva activa', async () => {
    conCotizacion({ estado: 'Aprobada', tiene_reserva: true });
    const res = await request(app).post('/api/reservas').set(auth(2)).send(body);
    expect(res.statusCode).toBe(409);
    expect(res.body.message).toMatch(/ya tiene una reserva/);
  });

  it('201 con cotización Aprobada y sin reserva previa', async () => {
    conCotizacion({ estado: 'Aprobada', tiene_reserva: false });
    expect((await request(app).post('/api/reservas').set(auth(2)).send(body)).statusCode).toBe(201);
  });

  it('400 con fecha en el pasado, fecha inexistente u hora inválida', async () => {
    conCotizacion({ estado: 'Aprobada', tiene_reserva: false });
    expect((await request(app).post('/api/reservas').set(auth(2)).send({ ...body, fecha_evento: '2020-01-01' })).statusCode).toBe(400);
    expect((await request(app).post('/api/reservas').set(auth(2)).send({ ...body, fecha_evento: '2099-02-31' })).statusCode).toBe(400);
    expect((await request(app).post('/api/reservas').set(auth(2)).send({ ...body, hora_inicio: '99:99' })).statusCode).toBe(400);
  });

  it('cancelar una reserva cancela también su evento', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: ID }], rowCount: 1 });
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });
    const res = await request(app).delete(`/api/reservas/${ID}`).set(auth(1));
    expect(res.statusCode).toBe(200);
    const [sql, params] = mockPool.query.mock.calls[1];
    expect(sql).toMatch(/UPDATE eventos SET estado_progreso = 'Cancelado'/);
    expect(sql).toMatch(/NOT IN \('Finalizado', 'Cancelado'\)/);
    expect(params).toEqual([ID, 1]);
  });
});

describe('Cotizaciones — servicios elegidos', () => {
  const ok = (servicios) => mockPool.query.mockImplementation(async (sql) => {
    if (/FROM clientes WHERE id/.test(sql)) return { rows: [{ id: 'c1' }], rowCount: 1 };
    if (/FROM paquetes WHERE id/.test(sql)) return { rows: [{ id: 'p1', precio_total: '1000.00' }], rowCount: 1 };
    if (/FROM servicios WHERE id = ANY/.test(sql)) return { rows: servicios, rowCount: servicios.length };
    if (/INSERT INTO cotizaciones/.test(sql)) return { rows: [{ id: ID }], rowCount: 1 };
    return { rows: [], rowCount: 1 };
  });
  const S1 = '55555555-5555-5555-5555-555555555555';
  const S2 = '66666666-6666-6666-6666-666666666666';

  it('el total lo calcula el servidor: paquete + servicios, ignorando el total del cliente', async () => {
    ok([{ id: S1, precio_base: '400.00' }, { id: S2, precio_base: '250.50' }]);
    const res = await request(app).post('/api/cotizaciones').set(auth(1))
      .send({ cliente_id: 'c1', paquete_id: 'p1', servicios_ids: [S1, S2], fecha_estimada_evento: '2099-01-01', total_calculado: 1, tipo_evento: 'Boda', num_invitados: 120 });
    expect(res.statusCode).toBe(201);
    const insert = mockPool.query.mock.calls.find(([sql]) => /INSERT INTO cotizaciones/.test(sql));
    expect(insert[1][4]).toBeCloseTo(1650.5);
    expect(insert[1][5]).toBe('Boda');
    expect(insert[1][6]).toBe(120);
    const filas = mockPool.query.mock.calls.filter(([sql]) => /INSERT INTO cotizacion_servicios/.test(sql));
    expect(filas).toHaveLength(2);
  });

  it('404 si algún servicio no pertenece a la empresa', async () => {
    ok([{ id: S1, precio_base: '400.00' }]);
    const res = await request(app).post('/api/cotizaciones').set(auth(1))
      .send({ cliente_id: 'c1', servicios_ids: [S1, S2], fecha_estimada_evento: '2099-01-01' });
    expect(res.statusCode).toBe(404);
  });

  it('a la carta (sin paquete) acepta solo servicios', async () => {
    ok([{ id: S1, precio_base: '400.00' }]);
    const res = await request(app).post('/api/cotizaciones').set(auth(1))
      .send({ cliente_id: 'c1', servicios_ids: [S1], fecha_estimada_evento: '2099-01-01' });
    expect(res.statusCode).toBe(201);
    const insert = mockPool.query.mock.calls.find(([sql]) => /INSERT INTO cotizaciones/.test(sql));
    expect(insert[1][4]).toBe(400);
  });

  it('400 con fecha inexistente y con invitados inválidos', async () => {
    ok([]);
    const base = { cliente_id: 'c1', paquete_id: 'p1' };
    expect((await request(app).post('/api/cotizaciones').set(auth(1)).send({ ...base, fecha_estimada_evento: '2099-02-31' })).statusCode).toBe(400);
    expect((await request(app).post('/api/cotizaciones').set(auth(1)).send({ ...base, fecha_estimada_evento: '2099-01-01', num_invitados: -3 })).statusCode).toBe(400);
  });
});

describe('Eventos — transiciones de estado por rol', () => {
  it('el Trabajador no puede cancelar: el UPDATE solo aplica a Dirección o a estados abiertos', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })          // UPDATE condicionado: 0 filas
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }], rowCount: 1 }); // el evento existe
    const res = await request(app).patch(`/api/eventos/${ID}/estado`).set(auth(3)).send({ estado_progreso: 'Cancelado' });
    expect(res.statusCode).toBe(403);
    const [sql, params] = mockPool.query.mock.calls[0];
    expect(sql).toMatch(/\$4::boolean OR/);
    expect(params[3]).toBe(false);
  });

  it('el Gerente sí puede cancelar (parámetro esDireccion = true)', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: ID, estado_progreso: 'Cancelado' }], rowCount: 1 });
    const res = await request(app).patch(`/api/eventos/${ID}/estado`).set(auth(2)).send({ estado_progreso: 'Cancelado' });
    expect(res.statusCode).toBe(200);
    expect(mockPool.query.mock.calls[0][1][3]).toBe(true);
  });

  it('404 cuando el evento no existe (también para el Trabajador)', async () => {
    const res = await request(app).patch(`/api/eventos/${ID}/estado`).set(auth(3)).send({ estado_progreso: 'En Progreso' });
    expect(res.statusCode).toBe(404);
  });
});

describe('Configuración global', () => {
  const guardada = { plataforma: { modo_mantenimiento: false }, seguridad: { expiracion_jwt_horas: 8 } };

  it('el público recibe planes y transferencia, pero NO la sección de seguridad', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ valor: guardada }], rowCount: 1 });
    const res = await request(app).get('/api/configuracion');
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty('planes');
    expect(res.body.data).toHaveProperty('transferencia');
    expect(res.body.data).not.toHaveProperty('seguridad');
  });

  it('el Super Admin recibe la configuración completa', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ valor: guardada }], rowCount: 1 });
    const res = await request(app).get('/api/configuracion').set(auth(5));
    expect(res.body.data).toHaveProperty('seguridad');
  });
});

describe('Modo mantenimiento y registro público', () => {
  const llamar = async (mw, req) => {
    let resultado = { siguio: false };
    await mw(req, { status(c) { resultado.codigo = c; return this; }, json(b) { resultado.cuerpo = b; return this; } }, () => { resultado.siguio = true; });
    return resultado;
  };
  const conConfig = (plataforma) => {
    mantenimiento.invalidarCachePlataforma();
    mockPool.query.mockResolvedValue({ rows: [{ valor: { plataforma } }], rowCount: 1 });
  };

  beforeEach(() => { process.env.NODE_ENV = 'production'; mantenimiento.invalidarCachePlataforma(); });
  afterEach(() => { process.env.NODE_ENV = 'test'; mantenimiento.invalidarCachePlataforma(); });

  it('en mantenimiento responde 503 a usuarios normales', async () => {
    conConfig({ modo_mantenimiento: true });
    const r = await llamar(mantenimiento.modoMantenimiento, { originalUrl: '/api/clientes', headers: { authorization: `Bearer ${token(2)}` } });
    expect(r.codigo).toBe(503);
    expect(r.siguio).toBe(false);
  });

  it('en mantenimiento el Super Admin, el login y la salud siguen funcionando', async () => {
    conConfig({ modo_mantenimiento: true });
    expect((await llamar(mantenimiento.modoMantenimiento, { originalUrl: '/api/clientes', headers: { authorization: `Bearer ${token(5)}` } })).siguio).toBe(true);
    expect((await llamar(mantenimiento.modoMantenimiento, { originalUrl: '/api/auth/login', headers: {} })).siguio).toBe(true);
    expect((await llamar(mantenimiento.modoMantenimiento, { originalUrl: '/api/health', headers: {} })).siguio).toBe(true);
  });

  it('sin mantenimiento no bloquea nada', async () => {
    conConfig({ modo_mantenimiento: false });
    expect((await llamar(mantenimiento.modoMantenimiento, { originalUrl: '/api/clientes', headers: {} })).siguio).toBe(true);
  });

  it('si la BD falla, la plataforma sigue disponible (falla abierta)', async () => {
    mantenimiento.invalidarCachePlataforma();
    mockPool.query.mockRejectedValue(new Error('db caída'));
    expect((await llamar(mantenimiento.modoMantenimiento, { originalUrl: '/api/clientes', headers: {} })).siguio).toBe(true);
  });

  it('registro público desactivado responde 403', async () => {
    conConfig({ registro_publico_activo: false });
    const r = await llamar(mantenimiento.requerirRegistroPublico, {});
    expect(r.codigo).toBe(403);
  });

  it('registro público activo deja pasar', async () => {
    conConfig({ registro_publico_activo: true });
    expect((await llamar(mantenimiento.requerirRegistroPublico, {})).siguio).toBe(true);
  });
});
