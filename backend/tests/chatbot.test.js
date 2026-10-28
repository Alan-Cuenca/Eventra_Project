/**
 * chatbot.test.js
 * ====================================================================
 * Pruebas: EVARA AI Chatbot Multi-Tenant
 * ====================================================================
 */

import request from 'supertest';
import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';

process.env.JWT_SECRET = 'test_secret_eventra_chatbot';
process.env.NODE_ENV   = 'test';
process.env.PORT       = '0';

const TEST_SECRET = 'test_secret_eventra_chatbot';

// Mock de la base de datos PostgreSQL
jest.unstable_mockModule('../src/config/db.js', () => ({
  default: {
    query: jest.fn(),
    connect: jest.fn(),
  },
}));

// Mock de OpenAI
const mockCreate = jest.fn();
jest.unstable_mockModule('openai', () => ({
  default: class {
    chat = {
      completions: {
        create: mockCreate,
      },
    };
  },
}));

const { default: app }  = await import('../src/app.js');
const { default: pool } = await import('../src/config/db.js');

const TOKEN_CLIENTE_EMPRESA_1 = jwt.sign(
  { id: 'usr-cliente-1', empresa_id: 1, rol_id: 4, rol: 'Cliente', email: 'cliente@empresa1.com' },
  TEST_SECRET,
  { expiresIn: '1h' }
);

describe('EVARA AI — Asistente Conversacional Multi-Tenant', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe rechazar con 400 si el mensaje está vacío', async () => {
    const res = await request(app)
      .post('/api/chatbot')
      .set('Authorization', `Bearer ${TOKEN_CLIENTE_EMPRESA_1}`)
      .send({ mensaje: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('debe consultar el catálogo SQL dinámico de la empresa y retornar 200', async () => {
    // 1. Mock consulta paquetes
    pool.query.mockResolvedValueOnce({
      rowCount: 1,
      rows: [
        {
          nombre: 'Boda Diamante',
          descripcion: 'Paquete de gala para 150 invitados',
          precio_total: 2500.00,
          servicios_incluidos: 'Catering, Fotografía, Iluminación',
        },
      ],
    });

    // 2. Mock consulta servicios
    pool.query.mockResolvedValueOnce({
      rowCount: 1,
      rows: [
        {
          nombre: 'Barra Libre Premium',
          descripcion: 'Coctelería de autor',
          precio_base: 450.00,
        },
      ],
    });

    // Mock respuesta OpenAI
    mockCreate.mockResolvedValueOnce({
      model: 'gpt-4o-mini',
      usage: { total_tokens: 150 },
      choices: [
        {
          message: {
            content: '¡Hola! En base a nuestro catálogo, el paquete Boda Diamante ($2500.00) incluye catering y fotografía.',
          },
        },
      ],
    });

    const res = await request(app)
      .post('/api/chatbot')
      .set('Authorization', `Bearer ${TOKEN_CLIENTE_EMPRESA_1}`)
      .send({ mensaje: '¿Qué paquetes tienen para bodas?' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.respuesta).toBeTruthy();
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('FROM paquetes p'),
      [1]
    );
  });

  it('debe resolver la empresa mediante slug si la consulta es pública sin token', async () => {
    // 1. SELECT id FROM empresas WHERE slug = $1
    pool.query.mockResolvedValueOnce({
      rowCount: 1,
      rows: [{ id: 2 }],
    });

    // 2. Paquetes
    pool.query.mockResolvedValueOnce({
      rowCount: 0,
      rows: [],
    });

    // 3. Servicios
    pool.query.mockResolvedValueOnce({
      rowCount: 0,
      rows: [],
    });

    const res = await request(app)
      .post('/api/chatbot')
      .send({ mensaje: 'Hola, buenas tardes', slug: 'recepciones-norte' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.respuesta).toContain('EVARA');
  });
});

