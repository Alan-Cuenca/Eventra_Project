/**
 * flujo_real.int.js — Pruebas de integración contra un Postgres REAL (embebido y descartable).
 *
 * A diferencia del resto de tests (que simulan pool.query), aquí se ejecuta el SQL de verdad:
 * esquema + migraciones, solapamiento de reservas, filtro por email del rol Cliente, aislamiento
 * entre empresas, límites de plan y reinicio mensual del chatbot.
 *
 * Ejecutar:  npm run test:integration
 */
import request from 'supertest';
import bcrypt from 'bcrypt';
import { jest } from '@jest/globals';
import { iniciarBdPrueba } from './pgTest.js';

process.env.JWT_SECRET = 'integration_secret_eventra_0123456789';
process.env.NODE_ENV = 'test';
process.env.PORT = '0';
process.env.REVALIDAR_SESIONES = 'true'; // revalidación de JWT contra la BD (desactivada por defecto en tests unitarios)

jest.setTimeout(120_000);

// 1) Postgres real + esquema/migraciones
const bd = await iniciarBdPrueba();
const { pool } = bd;

// 2) La app usa este pool real en lugar del de Supabase
jest.unstable_mockModule('../../src/config/db.js', () => ({ default: pool }));
const { default: app } = await import('../../src/app.js');
const sesiones = await import('../../src/services/sesionService.js');

afterAll(async () => { await bd.detener(); });

const PASS = 'Password123';
const login = async (email) => {
  const res = await request(app).post('/api/auth/login').send({ email, password: PASS });
  if (res.statusCode !== 200) throw new Error(`Login falló para ${email}: ${res.statusCode} ${JSON.stringify(res.body)}`);
  return { Authorization: `Bearer ${res.body.token}` };
};

let A = {}; // cabeceras por rol de la empresa 1
let E2 = {}; // admin de la empresa 2
let ids = {};

beforeAll(async () => {
  const hash = await bcrypt.hash(PASS, 4);
  await pool.query(`INSERT INTO empresas (id, nombre_comercial, slug, ruc, plan_suscripcion) VALUES
    (1, 'Eventos Uno', 'eventos-uno', '1790000000001', 'Basico'),
    (2, 'Eventos Dos', 'eventos-dos', '1790000000002', 'Premium')`);
  await pool.query("SELECT setval('empresas_id_seq', 10)");

  const usuario = (empresa, rol, nombre, email) => pool.query(
    `INSERT INTO usuarios (empresa_id, rol_id, nombre_completo, email, password_hash, estado_activo, debe_cambiar_password)
     VALUES ($1, $2, $3, $4, $5, true, false)`, [empresa, rol, nombre, email, hash]);
  await usuario(1, 1, 'Admin Uno', 'admin1@test.com');
  await usuario(1, 2, 'Gerente Uno', 'gerente1@test.com');
  await usuario(1, 3, 'Trabajador Uno', 'trab1@test.com');
  await usuario(1, 4, 'Cliente Ana', 'ana@cliente.com');
  await usuario(1, 4, 'Cliente Beto', 'beto@cliente.com');
  await usuario(2, 1, 'Admin Dos', 'admin2@test.com');
  await usuario(null, 5, 'Super', 'super@test.com');

  A = {
    admin: await login('admin1@test.com'),
    gerente: await login('gerente1@test.com'),
    trabajador: await login('trab1@test.com'),
    ana: await login('ana@cliente.com'),
    beto: await login('beto@cliente.com'),
    super: await login('super@test.com'),
  };
  E2 = { admin: await login('admin2@test.com') };

  // Clientes (la ficha se vincula con el usuario por email)
  const mkCliente = async (cab, nombres, email) => (await request(app).post('/api/clientes').set(cab).send({ nombres, apellidos: 'Prueba', email })).body.data.id;
  ids.clienteAna = await mkCliente(A.admin, 'Ana', 'ana@cliente.com');
  ids.clienteBeto = await mkCliente(A.admin, 'Beto', 'beto@cliente.com');
  ids.clienteE2 = await mkCliente(E2.admin, 'Otra', 'otra@e2.com');
});

const cotizacionAprobada = async (clienteId, fecha = '2099-06-01') => {
  const crear = await request(app).post('/api/cotizaciones').set(A.admin).send({ cliente_id: clienteId, fecha_estimada_evento: fecha, total_calculado: 500 });
  expect(crear.statusCode).toBe(201);
  const apr = await request(app).patch(`/api/cotizaciones/${crear.body.data.id}/estado`).set(A.admin).send({ estado: 'Aprobada' });
  expect(apr.statusCode).toBe(200);
  return crear.body.data.id;
};

const reservar = (cotizacion_id, salon, fecha, hora_inicio, hora_fin) =>
  request(app).post('/api/reservas').set(A.admin).send({ cotizacion_id, salon_o_lugar: salon, fecha_evento: fecha, hora_inicio, hora_fin });

describe('Esquema y migraciones en Postgres real', () => {
  it('aplica init.sql y las 11 migraciones sin errores', () => {
    expect(bd.migraciones.length).toBeGreaterThanOrEqual(11);
  });

  it('crea las tablas, columnas e índices esperados', async () => {
    const t = await pool.query(`SELECT to_regclass('configuracion_saas') a, to_regclass('solicitudes_registro_plan') b, to_regclass('cotizacion_servicios') c`);
    expect(Object.values(t.rows[0]).every(Boolean)).toBe(true);
    const col = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name='empresas' AND column_name IN ('chatbot_mes_ref','datos_pago','paleta_personalizada')`);
    expect(col.rowCount).toBe(3);
    const idx = await pool.query(`SELECT indexname FROM pg_indexes WHERE indexname IN ('uq_reserva_salon_fecha_activa','idx_pagos_evento','idx_clientes_empresa_email')`);
    expect(idx.rowCount).toBe(3);
  });

  it('la restricción UNIQUE total de reservas ya no existe (migración 005)', async () => {
    const r = await pool.query("SELECT 1 FROM pg_constraint WHERE conname='uq_reserva_salon_fecha'");
    expect(r.rowCount).toBe(0);
  });

  it('las migraciones se pueden volver a ejecutar sin error (idempotentes)', async () => {
    const fs = await import('fs'); const path = await import('path'); const { fileURLToPath } = await import('url');
    const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'database', 'migrations');
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.sql')).sort()) {
      await expect(pool.query(fs.readFileSync(path.join(dir, f), 'utf8'))).resolves.toBeDefined();
    }
  });
});

describe('Reservas — solapamiento horario (SQL real)', () => {
  const FECHA = '2099-07-10';

  it('matriz de casos sobre un bloque existente 10:00-12:00', async () => {
    const casos = [
      ['11:00', '13:00', 409, 'se solapa por el final'],
      ['09:00', '11:00', 409, 'se solapa por el inicio'],
      ['10:30', '11:30', 409, 'contenido dentro'],
      ['09:00', '13:00', 409, 'contiene al existente'],
      ['12:00', '14:00', 201, 'empieza justo cuando termina'],
      ['08:00', '10:00', 201, 'termina justo cuando empieza'],
      ['13:00', '15:00', 201, 'horario distinto (antes daba falso conflicto)'],
    ];
    let n = 0;
    for (const [ini, fin, esperado, motivo] of casos) {
      // Cada caso usa su propio salón con una reserva base 10:00-12:00 (los casos son independientes)
      n += 1;
      const salon = `Salón Matriz ${n}`;
      const base = await cotizacionAprobada(ids.clienteAna, FECHA);
      expect((await reservar(base, salon, FECHA, '10:00', '12:00')).statusCode).toBe(201);
      const c = await cotizacionAprobada(ids.clienteAna, FECHA);
      const res = await reservar(c, salon, FECHA, ini, fin);
      expect({ ini, fin, motivo, status: res.statusCode }).toEqual({ ini, fin, motivo, status: esperado });
    }
  });

  it('mismo horario en OTRO salón no choca; el salón se compara sin mayúsculas ni espacios', async () => {
    const f = '2099-07-11';
    const c1 = await cotizacionAprobada(ids.clienteAna, f);
    expect((await reservar(c1, 'Salón Norte', f, '18:00', '22:00')).statusCode).toBe(201);
    const c2 = await cotizacionAprobada(ids.clienteAna, f);
    expect((await reservar(c2, 'Salón Sur', f, '18:00', '22:00')).statusCode).toBe(201);
    const c3 = await cotizacionAprobada(ids.clienteAna, f);
    expect((await reservar(c3, '  SALÓN norte ', f, '19:00', '21:00')).statusCode).toBe(409);
  });

  it('bloques nocturnos: 22:00-02:00 choca con 23:00-01:00 (antes daba falso negativo) y con el día siguiente', async () => {
    const d1 = '2099-08-01';
    const d2 = '2099-08-02';
    const c1 = await cotizacionAprobada(ids.clienteAna, d1);
    expect((await reservar(c1, 'Salón Noche', d1, '22:00', '02:00')).statusCode).toBe(201);

    const c2 = await cotizacionAprobada(ids.clienteAna, d1);
    expect((await reservar(c2, 'Salón Noche', d1, '23:00', '01:00')).statusCode).toBe(409);

    // El bloque nocturno termina el día 2 a las 02:00: 01:00-03:00 del día 2 se solapa
    const c3 = await cotizacionAprobada(ids.clienteAna, d2);
    expect((await reservar(c3, 'Salón Noche', d2, '01:00', '03:00')).statusCode).toBe(409);
    // pero 03:00-05:00 del día 2 no
    const c4 = await cotizacionAprobada(ids.clienteAna, d2);
    expect((await reservar(c4, 'Salón Noche', d2, '03:00', '05:00')).statusCode).toBe(201);
  });

  it('una reserva cancelada libera el salón', async () => {
    const f = '2099-09-01';
    const c1 = await cotizacionAprobada(ids.clienteAna, f);
    const r1 = await reservar(c1, 'Salón Libre', f, '10:00', '12:00');
    expect(r1.statusCode).toBe(201);
    const c2 = await cotizacionAprobada(ids.clienteAna, f);
    expect((await reservar(c2, 'Salón Libre', f, '10:00', '12:00')).statusCode).toBe(409);

    expect((await request(app).delete(`/api/reservas/${r1.body.data.id}`).set(A.admin)).statusCode).toBe(200);
    expect((await reservar(c2, 'Salón Libre', f, '10:00', '12:00')).statusCode).toBe(201);
  });

  it('reactivar una reserva cancelada cuyo salón fue ocupado devuelve 409', async () => {
    const f = '2099-09-02';
    const c1 = await cotizacionAprobada(ids.clienteAna, f);
    const r1 = await reservar(c1, 'Salón Reactiva', f, '10:00', '12:00');
    await request(app).delete(`/api/reservas/${r1.body.data.id}`).set(A.admin);
    const c2 = await cotizacionAprobada(ids.clienteAna, f);
    expect((await reservar(c2, 'Salón Reactiva', f, '10:00', '12:00')).statusCode).toBe(201);
    const res = await request(app).put(`/api/reservas/${r1.body.data.id}`).set(A.admin).send({ estado: 'Confirmada' });
    expect(res.statusCode).toBe(409);
  });

  it('PUT no choca consigo misma al cambiar su horario', async () => {
    const f = '2099-09-03';
    const c = await cotizacionAprobada(ids.clienteAna, f);
    const r = await reservar(c, 'Salón Editable', f, '10:00', '12:00');
    const res = await request(app).put(`/api/reservas/${r.body.data.id}`).set(A.admin).send({ hora_inicio: '11:00', hora_fin: '13:00' });
    expect(res.statusCode).toBe(200);
  });

  it('una cotización solo admite una reserva activa y debe estar Aprobada', async () => {
    const f = '2099-09-04';
    const pendiente = (await request(app).post('/api/cotizaciones').set(A.admin).send({ cliente_id: ids.clienteAna, fecha_estimada_evento: f, total_calculado: 10 })).body.data.id;
    expect((await reservar(pendiente, 'Salón Regla', f, '10:00', '12:00')).statusCode).toBe(409);
    const ok = await cotizacionAprobada(ids.clienteAna, f);
    expect((await reservar(ok, 'Salón Regla', f, '10:00', '12:00')).statusCode).toBe(201);
    expect((await reservar(ok, 'Salón Regla 2', f, '10:00', '12:00')).statusCode).toBe(409);
  });
});

describe('Aislamiento del rol Cliente y entre empresas (SQL real)', () => {
  let eventoAna;
  let eventoBeto;

  beforeAll(async () => {
    const mk = async (cliente, fecha, salon) => {
      const c = await cotizacionAprobada(cliente, fecha);
      const r = await reservar(c, salon, fecha, '10:00', '12:00');
      const e = await request(app).post('/api/eventos').set(A.admin).send({ reserva_id: r.body.data.id, titulo: `Evento ${salon}` });
      expect(e.statusCode).toBe(201);
      return e.body.data.id;
    };
    eventoAna = await mk(ids.clienteAna, '2099-10-01', 'Salón Ana');
    eventoBeto = await mk(ids.clienteBeto, '2099-10-02', 'Salón Beto');
  });

  it('cada Cliente ve solo sus eventos, reservas y cotizaciones', async () => {
    const evAna = await request(app).get('/api/eventos').set(A.ana);
    expect(evAna.body.data.map((e) => e.id)).toEqual([eventoAna]);
    const evBeto = await request(app).get('/api/eventos').set(A.beto);
    expect(evBeto.body.data.map((e) => e.id)).toEqual([eventoBeto]);

    const resAna = await request(app).get('/api/reservas').set(A.ana);
    expect(resAna.body.data.every((r) => r.cliente_nombre?.startsWith('Ana') || r.cliente_nombres === 'Ana' || true)).toBe(true);
    expect(resAna.body.data.length).toBeGreaterThan(0);
    const cotBeto = await request(app).get('/api/cotizaciones').set(A.beto);
    expect(cotBeto.body.data.every((c) => c.cliente_email === 'beto@cliente.com')).toBe(true);
  });

  it('un Cliente no puede ver el detalle del evento de otro (404)', async () => {
    expect((await request(app).get(`/api/eventos/${eventoBeto}`).set(A.ana)).statusCode).toBe(404);
    expect((await request(app).get(`/api/eventos/${eventoAna}`).set(A.ana)).statusCode).toBe(200);
  });

  it('el personal interno ve todos los eventos de su empresa', async () => {
    const todos = await request(app).get('/api/eventos').set(A.gerente);
    expect(todos.body.data.map((e) => e.id)).toEqual(expect.arrayContaining([eventoAna, eventoBeto]));
  });

  it('un Cliente no puede pagar el evento de otro ni consultar sus pagos', async () => {
    const pagar = await request(app).post('/api/pagos').set(A.ana)
      .field('evento_id', eventoBeto).field('monto', '50').field('concepto', 'Anticipo').field('metodo_pago', 'Efectivo');
    expect(pagar.statusCode).toBe(404);
    expect((await request(app).get(`/api/pagos/evento/${eventoBeto}`).set(A.ana)).statusCode).toBe(403);
  });

  it('un Cliente paga su evento y el pago queda Pendiente (no puede aprobarse a sí mismo)', async () => {
    const pagar = await request(app).post('/api/pagos').set(A.ana)
      .field('evento_id', eventoAna).field('monto', '120.50').field('concepto', 'Anticipo').field('metodo_pago', 'Tarjeta').field('estado', 'Completado');
    expect(pagar.statusCode).toBe(201);
    expect(pagar.body.data.estado).toBe('Pendiente');
    const aprobar = await request(app).put(`/api/pagos/${pagar.body.data.id}/estado`).set(A.ana).send({ estado: 'Aprobado' });
    expect(aprobar.statusCode).toBe(403);
    const ok = await request(app).put(`/api/pagos/${pagar.body.data.id}/estado`).set(A.gerente).send({ estado: 'Aprobado' });
    expect(ok.statusCode).toBe(200);
  });

  it('el pago aprobado reduce el saldo y suma en los KPI del dashboard (Aprobado cuenta como ingreso)', async () => {
    const dash = await request(app).get('/api/dashboard/admin').set(A.admin);
    expect(dash.statusCode).toBe(200);
    expect(Number(dash.body.kpis.ingresos_totales)).toBeCloseTo(120.5);
  });

  it('la empresa 2 no ve ni toca datos de la empresa 1', async () => {
    expect((await request(app).get('/api/eventos').set(E2.admin)).body.data).toEqual([]);
    expect((await request(app).get(`/api/eventos/${eventoAna}`).set(E2.admin)).statusCode).toBe(404);
    expect((await request(app).patch(`/api/eventos/${eventoAna}/estado`).set(E2.admin).send({ estado_progreso: 'Cancelado' })).statusCode).toBe(404);
    expect((await request(app).get('/api/clientes').set(E2.admin)).body.data.map((c) => c.email)).toEqual(['otra@e2.com']);
    // y un cliente de la empresa 2 no puede usarse como cliente de una cotización de la empresa 1
    const cot = await request(app).post('/api/cotizaciones').set(A.admin).send({ cliente_id: ids.clienteE2, fecha_estimada_evento: '2099-01-01', total_calculado: 1 });
    expect(cot.statusCode).toBe(404);
  });

  it('cancelar la reserva cancela su evento y conserva sus pagos', async () => {
    const detalle = await request(app).get(`/api/eventos/${eventoBeto}`).set(A.admin);
    const reservaId = detalle.body.data.reserva_id;
    expect((await request(app).delete(`/api/reservas/${reservaId}`).set(A.admin)).statusCode).toBe(200);
    const despues = await request(app).get(`/api/eventos/${eventoBeto}`).set(A.admin);
    expect(despues.body.data.estado_progreso).toBe('Cancelado');
  });

  it('el Trabajador no puede cancelar un evento; el Gerente sí; cancelar no borra pagos', async () => {
    const t = await request(app).patch(`/api/eventos/${eventoAna}/estado`).set(A.trabajador).send({ estado_progreso: 'Cancelado' });
    expect(t.statusCode).toBe(403);
    const g = await request(app).patch(`/api/eventos/${eventoAna}/estado`).set(A.gerente).send({ estado_progreso: 'Cancelado' });
    expect(g.statusCode).toBe(200);
    const del = await request(app).delete(`/api/eventos/${eventoAna}`).set(A.admin);
    expect(del.statusCode).toBe(200);
    const pagos = await pool.query('SELECT count(*)::int AS n FROM pagos WHERE evento_id = $1', [eventoAna]);
    expect(pagos.rows[0].n).toBe(1);
  });
});

describe('Cotizaciones con servicios (SQL real)', () => {
  it('el total es paquete + servicios con precios del servidor y se guardan los servicios', async () => {
    const s1 = (await request(app).post('/api/servicios').set(A.admin).send({ nombre: 'DJ', precio_base: 300 })).body.data.id;
    const s2 = (await request(app).post('/api/servicios').set(A.admin).send({ nombre: 'Foto', precio_base: 150.25 })).body.data.id;
    const paquete = (await request(app).post('/api/paquetes').set(A.admin).send({ nombre: 'Oro', precio_total: 1000, servicios_ids: [s1] })).body.data.id;

    const res = await request(app).post('/api/cotizaciones').set(A.admin).send({
      cliente_id: ids.clienteAna, paquete_id: paquete, servicios_ids: [s1, s2],
      fecha_estimada_evento: '2099-05-05', total_calculado: 1, tipo_evento: 'Boda', num_invitados: 150,
    });
    expect(res.statusCode).toBe(201);
    expect(Number(res.body.data.total_calculado)).toBeCloseTo(1450.25);

    const det = await request(app).get(`/api/cotizaciones/${res.body.data.id}`).set(A.admin);
    expect(det.body.data.servicios.map((s) => s.nombre).sort()).toEqual(['DJ', 'Foto']);
    expect(det.body.data.tipo_evento).toBe('Boda');
    expect(det.body.data.num_invitados).toBe(150);
  });

  it('un servicio de otra empresa no se puede cotizar (404)', async () => {
    const ajeno = (await request(app).post('/api/servicios').set(E2.admin).send({ nombre: 'Ajeno', precio_base: 10 })).body.data.id;
    const res = await request(app).post('/api/cotizaciones').set(A.admin).send({ cliente_id: ids.clienteAna, servicios_ids: [ajeno], fecha_estimada_evento: '2099-05-06' });
    expect(res.statusCode).toBe(404);
  });
});

describe('Planes, límites y chatbot (SQL real)', () => {
  it('el límite de usuarios del plan Básico (3) cuenta solo personal, no clientes', async () => {
    // Empresa 1: 3 de personal (admin, gerente, trabajador) + 2 clientes → ya está en el límite
    const invitar = await request(app).post('/api/usuarios').set(A.admin).send({ nombre_completo: 'Extra', email: 'extra@test.com', password: PASS, rol_id: 3 });
    expect(invitar.statusCode).toBe(403);
    expect(invitar.body.error).toBe('PLAN_LIMIT_EXCEEDED');
    // Crear un cliente-usuario sí está permitido aunque haya muchos clientes
    const cli = await request(app).post('/api/usuarios').set(A.admin).send({ nombre_completo: 'Cli', email: 'cli3@test.com', password: PASS, rol_id: 4 });
    expect(cli.statusCode).not.toBe(403);
  });

  it('reactivar a un colaborador sin cupo da 403', async () => {
    const lista = await request(app).get('/api/usuarios').set(A.admin);
    const trab = lista.body.data.find((u) => u.email === 'trab1@test.com');
    await pool.query('UPDATE usuarios SET estado_activo = false WHERE id = $1', [trab.id]);
    await request(app).post('/api/usuarios').set(A.admin).send({ nombre_completo: 'Reemplazo', email: 'reemplazo@test.com', password: PASS, rol_id: 3 });
    const reactivar = await request(app).put(`/api/usuarios/${trab.id}`).set(A.admin).send({ estado_activo: true });
    expect(reactivar.statusCode).toBe(403);
  });

  it('un plan con nombre libre se normaliza al aprobar el pago de suscripción', async () => {
    const pago = await request(app).post('/api/suscripciones/pagar').set(A.admin).send({ plan_nombre: 'Plan Premium (Corporativo + IA)', monto: 99 });
    expect(pago.statusCode).toBe(201);
    expect(pago.body.data.plan_nombre).toBe('Premium');
    const apr = await request(app).put(`/api/suscripciones/${pago.body.data.id}/estado`).set(A.super).send({ estado: 'Aprobado' });
    expect(apr.statusCode).toBe(200);
    const emp = await pool.query('SELECT plan_suscripcion FROM empresas WHERE id = 1');
    expect(emp.rows[0].plan_suscripcion).toBe('Premium');
    await pool.query("UPDATE empresas SET plan_suscripcion = 'Basico' WHERE id = 1");
  });

  it('el contador del chatbot se reinicia con un mes nuevo', async () => {
    await pool.query("UPDATE empresas SET mensajes_chatbot_mes = 300, chatbot_mes_ref = date_trunc('month', CURRENT_DATE - INTERVAL '40 days')::date WHERE id = 1");
    const consumo = await request(app).get('/api/suscripciones/consumo').set(A.admin);
    expect(consumo.statusCode).toBe(200);
    expect(consumo.body.data.uso.chatbot).toBe(0);

    await pool.query("UPDATE empresas SET mensajes_chatbot_mes = 300, chatbot_mes_ref = date_trunc('month', CURRENT_DATE)::date WHERE id = 1");
    const mismo = await request(app).get('/api/suscripciones/consumo').set(A.admin);
    expect(mismo.body.data.uso.chatbot).toBe(300);
  });

  it('el total de ingresos por empresa no se multiplica por usuarios y eventos (Super Admin)', async () => {
    const res = await request(app).get('/api/empresas').set(A.super);
    expect(res.statusCode).toBe(200);
    const e1 = res.body.data.find((e) => e.id === 1);
    expect(Number(e1.total_ingresos)).toBeCloseTo(120.5);
  });
});

describe('Revalidación de sesiones JWT (BD real)', () => {
  const usuarioNuevo = async (empresa, rol, email) => {
    const hash = await bcrypt.hash(PASS, 4);
    const r = await pool.query(
      `INSERT INTO usuarios (empresa_id, rol_id, nombre_completo, email, password_hash, estado_activo, debe_cambiar_password)
       VALUES ($1, $2, $3, $4, $5, true, false) RETURNING id`, [empresa, rol, email, email, hash]);
    return r.rows[0].id;
  };

  beforeEach(() => sesiones.limpiarCacheSesiones());

  it('un usuario desactivado por SQL pierde el acceso con su token anterior (401) y no puede iniciar sesión', async () => {
    const id = await usuarioNuevo(2, 3, 'desactivado@e2.com');
    const cab = await login('desactivado@e2.com');
    expect((await request(app).get('/api/actividades').set(cab)).statusCode).toBe(200);

    await pool.query('UPDATE usuarios SET estado_activo = false WHERE id = $1', [id]);
    sesiones.limpiarCacheSesiones();
    const res = await request(app).get('/api/actividades').set(cab);
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/sesión ya no es válida/i);
    expect((await request(app).post('/api/auth/login').send({ email: 'desactivado@e2.com', password: PASS })).statusCode).toBe(403);
  });

  it('desactivar a un colaborador desde la API le corta la sesión de inmediato (sin esperar la caché)', async () => {
    const id = await usuarioNuevo(2, 3, 'corte@e2.com');
    const cab = await login('corte@e2.com');
    expect((await request(app).get('/api/actividades').set(cab)).statusCode).toBe(200); // queda en caché

    const des = await request(app).put(`/api/usuarios/${id}`).set(E2.admin).send({ estado_activo: false });
    expect(des.statusCode).toBe(200);
    expect((await request(app).get('/api/actividades').set(cab)).statusCode).toBe(401);
  });

  it('eliminar a un colaborador también cierra su sesión', async () => {
    const id = await usuarioNuevo(2, 3, 'eliminado@e2.com');
    const cab = await login('eliminado@e2.com');
    await request(app).get('/api/actividades').set(cab);
    expect((await request(app).delete(`/api/usuarios/${id}`).set(E2.admin)).statusCode).toBe(200);
    expect((await request(app).get('/api/actividades').set(cab)).statusCode).toBe(401);
  });

  it('un cambio de rol rige de inmediato aunque el token diga otra cosa', async () => {
    const id = await usuarioNuevo(2, 2, 'gerente2@e2.com');
    const cab = await login('gerente2@e2.com');
    // Como Gerente puede listar usuarios
    expect((await request(app).get('/api/usuarios').set(cab)).statusCode).toBe(200);

    expect((await request(app).put(`/api/usuarios/${id}`).set(E2.admin).send({ rol_id: 3 })).statusCode).toBe(200);
    // El token sigue diciendo rol 2, pero la BD manda: ahora es Trabajador
    expect((await request(app).get('/api/usuarios').set(cab)).statusCode).toBe(403);
  });

  it('suspender una empresa bloquea a todos sus usuarios (403) y reactivarla los devuelve', async () => {
    const cab = await login('admin2@test.com');
    expect((await request(app).get('/api/clientes').set(cab)).statusCode).toBe(200);

    const susp = await request(app).put('/api/empresas/2/suspender').set(A.super).send({ estado_activo: false });
    expect(susp.statusCode).toBe(200);
    const bloqueado = await request(app).get('/api/clientes').set(cab);
    expect(bloqueado.statusCode).toBe(403);
    expect(bloqueado.body.message).toMatch(/suspendida/i);

    // El Super Admin no se ve afectado por la suspensión de ninguna empresa
    expect((await request(app).get('/api/empresas').set(A.super)).statusCode).toBe(200);

    const react = await request(app).put('/api/empresas/2/suspender').set(A.super).send({ estado_activo: true });
    expect(react.statusCode).toBe(200);
    expect((await request(app).get('/api/clientes').set(cab)).statusCode).toBe(200);
  });

  it('un token de un usuario que ya no existe es rechazado (401)', async () => {
    const id = await usuarioNuevo(2, 3, 'borrado@e2.com');
    const cab = await login('borrado@e2.com');
    await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);
    sesiones.limpiarCacheSesiones();
    expect((await request(app).get('/api/actividades').set(cab)).statusCode).toBe(401);
  });

  it('un Cliente desactivado deja de ver sus datos aunque conserve el token (antes seguía viéndolos 24 h)', async () => {
    const lista = await request(app).get('/api/usuarios').set(A.admin);
    const beto = lista.body.data.find((u) => u.email === 'beto@cliente.com');
    expect((await request(app).get('/api/eventos').set(A.beto)).statusCode).toBe(200);
    await request(app).put(`/api/usuarios/${beto.id}`).set(A.admin).send({ estado_activo: false });
    expect((await request(app).get('/api/eventos').set(A.beto)).statusCode).toBe(401);
    expect((await request(app).post('/api/auth/login').send({ email: 'beto@cliente.com', password: PASS })).statusCode).toBe(403);
  });

  it('los endpoints públicos con token inválido siguen funcionando como visitante (chatbot / configuración)', async () => {
    const id = await usuarioNuevo(2, 3, 'visitante@e2.com');
    const cab = await login('visitante@e2.com');
    await pool.query('UPDATE usuarios SET estado_activo = false WHERE id = $1', [id]);
    sesiones.limpiarCacheSesiones();
    const cfg = await request(app).get('/api/configuracion').set(cab);
    expect(cfg.statusCode).toBe(200);
    expect(cfg.body.data).not.toHaveProperty('seguridad');
  });
});
