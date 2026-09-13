/**
 * auth.test.js  (v3 — variables de entorno de test explícitas)
 * =============================================================
 * Pruebas de Autenticación, Registro y Seguridad RBAC — EVENTRA
 *
 * Fix aplicado: process.env.JWT_SECRET se define ANTES de importar la app
 * para que el middleware de autenticación y el controlador de login usen
 * el mismo secreto que los tokens firmados en los tests.
 */

import request  from 'supertest';
import bcrypt   from 'bcrypt';
import jwt      from 'jsonwebtoken';
import { jest } from '@jest/globals';

// ─── Variables de entorno para el entorno de test ────────────────────────────
// DEBE ir antes de los mocks y del import de la app para que dotenv no lo pise.
process.env.JWT_SECRET = 'test_secret_eventra_jest';
process.env.NODE_ENV   = 'test';
process.env.PORT       = '0'; // puerto 0 = efímero, evita conflictos

const TEST_SECRET = 'test_secret_eventra_jest'; // mismo valor que arriba

// ─── Mock de la BD ───────────────────────────────────────────────────────────
jest.unstable_mockModule('../src/config/db.js', () => ({
  default: { query: jest.fn() },
}));

// ─── Mock del SDK de OpenAI ──────────────────────────────────────────────────
jest.unstable_mockModule('openai', () => ({
  default: class {
    chat = { completions: { create: jest.fn() } };
  },
}));

const { default: app }  = await import('../src/app.js');
const { default: pool } = await import('../src/config/db.js');

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 1: Registro de usuarios
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/auth/register', () => {

  beforeEach(() => jest.clearAllMocks());

  it('400 — rechaza registro si faltan campos obligatorios', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ empresa_id: 1, rol_id: 3 }); // sin email ni password

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/obligatorio/i);
  });

  it('400 — rechaza registro si el email ya está registrado', async () => {
    // SELECT devuelve fila → email ya existe
    pool.query.mockResolvedValueOnce({ rows: [{ id: 'uuid-existente' }], rowCount: 1 });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        empresa_id: 1, rol_id: 3,
        nombre_completo: 'Duplicado',
        email: 'duplicado@eventra.com',
        password: 'password123',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/email/i);
  });

  it('201 — registra un nuevo usuario correctamente', async () => {
    // Mock 1: SELECT email → no existe
    pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    // Mock 2: INSERT → usuario creado
    pool.query.mockResolvedValueOnce({
      rows: [{
        id: 'uuid-nuevo', empresa_id: 1, rol_id: 3,
        nombre_completo: 'Nuevo Usuario',
        email: 'nuevo@eventra.com',
        estado_activo: true,
        fecha_creacion: new Date().toISOString(),
      }],
      rowCount: 1,
    });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        empresa_id: 1, rol_id: 3,
        nombre_completo: 'Nuevo Usuario',
        email: 'nuevo@eventra.com',
        password: 'segura123',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data).toHaveProperty('email', 'nuevo@eventra.com');
    expect(res.body.data).not.toHaveProperty('password_hash');
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 2: Login de usuarios
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/auth/login', () => {

  beforeEach(() => jest.clearAllMocks());

  it('400 — rechaza login si falta email o password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'solo@email.com' }); // sin password

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('404 — retorna 404 si el usuario no existe en la BD', async () => {
    pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'noexiste@eventra.com', password: 'cualquiera' });

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('401 — retorna 401 si el password es incorrecto', async () => {
    const hashReal = await bcrypt.hash('password_correcto', 10);

    pool.query.mockResolvedValueOnce({
      rows: [{
        id: 'uuid-user', empresa_id: 1, rol_id: 2,
        nombre_completo: 'Gerente Test',
        email: 'gerente@eventra.com',
        password_hash: hashReal,
        estado_activo: true,
      }],
      rowCount: 1,
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'gerente@eventra.com', password: 'INCORRECTO' });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/credenciales/i);
  });

  it('200 — retorna 200 y un token JWT válido con credenciales correctas', async () => {
    const passwordCorrecto = 'eventra2026';
    const hashReal = await bcrypt.hash(passwordCorrecto, 10);

    pool.query.mockResolvedValueOnce({
      rows: [{
        id: 'uuid-admin', empresa_id: 1, rol_id: 1,
        nombre_completo: 'Admin Test',
        email: 'admin@eventra.com',
        password_hash: hashReal,
        estado_activo: true,
      }],
      rowCount: 1,
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@eventra.com', password: passwordCorrecto });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('token');
    expect(typeof res.body.token).toBe('string');

    const decoded = jwt.verify(res.body.token, TEST_SECRET);
    expect(decoded).toHaveProperty('empresa_id', 1);
    expect(decoded).toHaveProperty('rol_id', 1);
    expect(res.body.data).not.toHaveProperty('password_hash');
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 3: Protección JWT — GET /api/auth/me
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/auth/me — Barrera JWT', () => {

  it('401 — rechaza petición sin header Authorization', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });

  it('401 — rechaza token malformado o con firma inválida', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer esto_no_es_un_jwt_valido');
    expect(res.statusCode).toBe(401);
  });

  it('200 — permite acceso con un JWT válido y retorna el payload', async () => {
    // Firma el token con el MISMO secreto que process.env.JWT_SECRET
    const tokenValido = jwt.sign(
      { id: 'uuid-test', empresa_id: 1, rol_id: 1 },
      TEST_SECRET,
      { expiresIn: '1h' }
    );

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${tokenValido}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('empresa_id', 1);
  });

});
