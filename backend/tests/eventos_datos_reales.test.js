/**
 * eventos_datos_reales.test.js — Los eventos no inventan tipo ni invitados.
 * Antes se deducían del título (ej. "boda" → 120 invitados); ahora salen de la cotización.
 */
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';

process.env.JWT_SECRET = 'test_secret_eventos_reales';
process.env.NODE_ENV = 'test';
process.env.PORT = '0';

const mockPool = { query: jest.fn(async () => ({ rows: [], rowCount: 0 })), connect: jest.fn() };
jest.unstable_mockModule('../src/config/db.js', () => ({ default: mockPool }));
jest.unstable_mockModule('../src/config/supabase.js', () => ({ supabase: null }));
jest.unstable_mockModule('openai', () => ({ default: class { chat = { completions: { create: jest.fn() } }; } }));

const { default: app } = await import('../src/app.js');
const TOKEN = jwt.sign({ id: 'a', rol_id: 1, empresa_id: 1, email: 'a@e.com' }, process.env.JWT_SECRET, { expiresIn: '1h' });

beforeEach(() => jest.clearAllMocks());

describe('Tipo e invitados de eventos', () => {
  it.each([
    ['listado', '/api/eventos'],
    ['detalle', '/api/eventos/3f2b8c1e-9a4d-4e6f-8b2a-1c3d5e7f9a0b'],
  ])('%s: usa tipo_evento y num_invitados de la cotización', async (_, ruta) => {
    await request(app).get(ruta).set('Authorization', `Bearer ${TOKEN}`);
    const sql = mockPool.query.mock.calls[0][0];
    expect(sql).toMatch(/c\.tipo_evento AS tipo/);
    expect(sql).toMatch(/c\.num_invitados AS invitados/);
    expect(sql).not.toMatch(/ILIKE '%boda%'/);
    expect(sql).not.toMatch(/THEN 120/);
  });
});
