/**
 * configuracion_guardado.test.js
 * Guardar la configuración global no debe perder datos:
 * - lo que no viene en el payload conserva el valor guardado (fusión por sección);
 * - si la BD falla al leer, el Super Admin recibe 503 (no los valores por defecto,
 *   que al guardarse desde la pantalla sobrescribirían la configuración real).
 */
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';

process.env.JWT_SECRET = 'test_secret_config_guardado';
process.env.NODE_ENV = 'test';
process.env.PORT = '0';

const GUARDADO = {
  plataforma: { correo_soporte: 'soporte@real.com' },
  transferencia: { titular: 'Titular Real', numero_cuenta: '2210101010' },
  planes: { premium_max_usuarios: 60, dias_gracia_facturacion: 5 },
};
let falloLectura = false;
const escrituras = [];
const mockPool = {
  query: jest.fn(async (sql, params) => {
    if (/SELECT valor FROM configuracion_saas/.test(sql)) {
      if (falloLectura) throw new Error('conexión perdida');
      return { rows: [{ valor: GUARDADO }], rowCount: 1 };
    }
    if (/INSERT INTO configuracion_saas/.test(sql)) { escrituras.push(JSON.parse(params[0])); return { rows: [], rowCount: 1 }; }
    return { rows: [], rowCount: 0 };
  }),
  connect: jest.fn(),
};
jest.unstable_mockModule('../src/config/db.js', () => ({ default: mockPool }));
jest.unstable_mockModule('../src/config/supabase.js', () => ({ supabase: null }));
jest.unstable_mockModule('openai', () => ({ default: class { chat = { completions: { create: jest.fn() } }; } }));

const { default: app } = await import('../src/app.js');
const SA = `Bearer ${jwt.sign({ id: 's', rol_id: 5, empresa_id: null, email: 's@e.com' }, process.env.JWT_SECRET, { expiresIn: '1h' })}`;

beforeEach(() => { falloLectura = false; escrituras.length = 0; });

describe('PUT /api/configuracion', () => {
  it('conserva los campos que no vienen en el payload', async () => {
    const res = await request(app).put('/api/configuracion').set('Authorization', SA)
      .send({ planes: { premium_max_usuarios: 80 }, transferencia: { titular: 'Nuevo Titular' } });
    expect(res.status).toBe(200);
    const guardado = escrituras[0];
    expect(guardado.planes).toEqual({ premium_max_usuarios: 80, dias_gracia_facturacion: 5 });
    expect(guardado.transferencia).toEqual({ titular: 'Nuevo Titular', numero_cuenta: '2210101010' });
    expect(guardado.plataforma).toEqual({ correo_soporte: 'soporte@real.com' });
  });
});

describe('GET /api/configuracion con la BD caída', () => {
  it('Super Admin: 503 para que la pantalla no permita guardar valores por defecto', async () => {
    falloLectura = true;
    const res = await request(app).get('/api/configuracion').set('Authorization', SA);
    expect(res.status).toBe(503);
  });

  it('público: sigue recibiendo los valores por defecto', async () => {
    falloLectura = true;
    const res = await request(app).get('/api/configuracion');
    expect(res.status).toBe(200);
    expect(res.body.data.planes.basico_precio).toBe(49);
  });
});
