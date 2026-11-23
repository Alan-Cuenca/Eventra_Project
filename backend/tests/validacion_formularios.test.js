/**
 * validacion_formularios.test.js
 * Validación común de formularios (validarCuerpo + esquemas) y reglas de negocio
 * de cotizaciones y pagos.
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
const { validarObjeto, esCedulaValida, hoyEcuador } = await import('../src/middlewares/validarCuerpo.js');
const { esquemas } = await import('../src/middlewares/esquemas.js');

const token = (rol_id) => jwt.sign({ id: 'u-1', empresa_id: 1, rol_id, email: 'cli@test.com' }, process.env.JWT_SECRET, { expiresIn: '1h' });
const enDias = (dias) => {
  const [y, m, d] = hoyEcuador().split('-').map(Number);
  const f = new Date(Date.UTC(y, m - 1, d + dias));
  return f.toISOString().slice(0, 10);
};

beforeEach(() => {
  mockPool.query.mockReset();
  mockPool.query.mockImplementation(async () => ({ rows: [], rowCount: 0 }));
});

describe('validarObjeto — reglas comunes', () => {
  it('cliente: exige nombres y apellidos con letras, valida correo y teléfono', () => {
    const { errores } = validarObjeto({ nombres: '1234', apellidos: '', email: 'mal', telefono: '12' }, esquemas.cliente);
    expect(Object.keys(errores).sort()).toEqual(['apellidos', 'email', 'nombres', 'telefono']);
  });

  it('cliente válido se normaliza (espacios y correo en minúsculas)', () => {
    const { errores, normalizado } = validarObjeto({ nombres: '  María   Fernanda ', apellidos: 'López', email: 'MARIA@Example.com', telefono: '099 123 4567' }, esquemas.cliente);
    expect(errores).toEqual({});
    expect(normalizado).toMatchObject({ nombres: 'María Fernanda', email: 'maria@example.com' });
  });

  it('en una edición solo valida lo que llega, pero no permite vaciar un campo obligatorio', () => {
    expect(validarObjeto({ telefono: '0991234567' }, esquemas.cliente, { parcial: true }).errores).toEqual({});
    expect(validarObjeto({ nombres: '  ' }, esquemas.cliente, { parcial: true }).errores.nombres).toMatch(/no puede quedar vacío/);
  });

  it('cédula ecuatoriana con dígito verificador', () => {
    expect(esCedulaValida('1712345675')).toBe(true);
    expect(esCedulaValida('1712345670')).toBe(false);
    expect(esCedulaValida('9912345675')).toBe(false);
    expect(esCedulaValida('17123')).toBe(false);
  });

  it('registro: mayor de edad y fecha de nacimiento no futura', () => {
    const menor = validarObjeto({ nombre_completo: 'Ana Pérez', cedula: '1712345675', fecha_nacimiento: enDias(-365 * 10) }, esquemas.completarRegistro);
    expect(menor.errores.fecha_nacimiento).toMatch(/mayor de 18/);
    const futura = validarObjeto({ nombre_completo: 'Ana Pérez', cedula: '1712345675', fecha_nacimiento: enDias(3) }, esquemas.completarRegistro);
    expect(futura.errores.fecha_nacimiento).toMatch(/futuro/);
  });

  it('paquete: precio mayor a cero y al menos un servicio', () => {
    const { errores } = validarObjeto({ nombre: 'Boda', precio_total: 0, servicios_ids: [] }, esquemas.paquete);
    expect(errores.precio_total).toBeDefined();
    expect(errores.servicios_ids).toMatch(/al menos 1/);
  });
});

describe('POST /api/cotizaciones — controles', () => {
  const enviar = (body) => request(app).post('/api/cotizaciones').set('Authorization', `Bearer ${token(1)}`).send(body);

  it('400 con fecha del evento en el pasado', async () => {
    const res = await enviar({ cliente_id: 'c1', paquete_id: 'p1', fecha_estimada_evento: enDias(-1), tipo_evento: 'Matrimonio' });
    expect(res.status).toBe(400);
    expect(res.body.errores.fecha_estimada_evento).toMatch(/pasado/);
    expect(mockPool.query).not.toHaveBeenCalled();
  });

  it('400 con tipo de evento fuera de la lista o invitados inválidos', async () => {
    const res = await enviar({ cliente_id: 'c1', paquete_id: 'p1', fecha_estimada_evento: enDias(30), tipo_evento: 'Fiesta loca', num_invitados: -5 });
    expect(res.status).toBe(400);
    expect(Object.keys(res.body.errores).sort()).toEqual(['num_invitados', 'tipo_evento']);
  });

  it('400 si la cotización quedaría en $0', async () => {
    mockPool.query.mockImplementation(async (sql) => {
      if (/FROM clientes WHERE id/.test(sql)) return { rows: [{ id: 'c1', estado_activo: true }], rowCount: 1 };
      return { rows: [], rowCount: 0 };
    });
    const res = await enviar({ cliente_id: 'c1', fecha_estimada_evento: enDias(30), total_calculado: 0 });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/mayor a \$0/);
  });

  it('400 si el cliente o el paquete están desactivados', async () => {
    mockPool.query.mockImplementation(async (sql) => {
      if (/FROM clientes WHERE id/.test(sql)) return { rows: [{ id: 'c1', estado_activo: false }], rowCount: 1 };
      return { rows: [], rowCount: 0 };
    });
    expect((await enviar({ cliente_id: 'c1', paquete_id: 'p1', fecha_estimada_evento: enDias(30) })).body.message).toMatch(/cliente está desactivado/);

    mockPool.query.mockImplementation(async (sql) => {
      if (/FROM clientes WHERE id/.test(sql)) return { rows: [{ id: 'c1', estado_activo: true }], rowCount: 1 };
      if (/FROM paquetes WHERE id/.test(sql)) return { rows: [{ id: 'p1', precio_total: '100', estado_activo: false }], rowCount: 1 };
      return { rows: [], rowCount: 0 };
    });
    expect((await enviar({ cliente_id: 'c1', paquete_id: 'p1', fecha_estimada_evento: enDias(30) })).body.message).toMatch(/ya no está disponible/);
  });
});

describe('POST /api/pagos — saldo del evento', () => {
  const evento = (extra) => mockPool.query.mockImplementation(async (sql) => {
    if (/FROM eventos e/.test(sql)) return { rows: [{ id: 'e1', estado_progreso: 'En Planificación', total_calculado: '4900.00', comprometido: '2450.00', ...extra }], rowCount: 1 };
    if (/INSERT INTO pagos/.test(sql)) return { rows: [{ id: 'pg1' }], rowCount: 1 };
    return { rows: [], rowCount: 0 };
  });
  const pagar = (monto) => request(app).post('/api/pagos').set('Authorization', `Bearer ${token(1)}`)
    .send({ evento_id: 'e1', monto, concepto: 'Abono', metodo_pago: 'Efectivo' });

  it('400 si el monto supera el saldo pendiente (incluye pagos en revisión)', async () => {
    evento();
    const res = await pagar(2500);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('MONTO_SUPERA_SALDO');
    expect(res.body.message).toMatch(/2450\.00/);
  });

  it('400 si el evento está cancelado', async () => {
    evento({ estado_progreso: 'Cancelado' });
    expect((await pagar(100)).body.message).toMatch(/cancelado/);
  });

  it('400 con concepto inválido o monto negativo antes de consultar la base', async () => {
    const res = await request(app).post('/api/pagos').set('Authorization', `Bearer ${token(1)}`)
      .send({ evento_id: 'e1', monto: -10, concepto: 'Propina', metodo_pago: 'Efectivo' });
    expect(res.status).toBe(400);
    expect(Object.keys(res.body.errores).sort()).toEqual(['concepto', 'monto']);
    expect(mockPool.query.mock.calls.some(([sql]) => /FROM eventos e/.test(sql))).toBe(false);
  });
});
