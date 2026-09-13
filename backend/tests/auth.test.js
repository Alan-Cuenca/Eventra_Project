/**
 * auth.test.js  (v2 — Suite completa de integración)
 * ====================================================
 * Pruebas de Autenticación, Registro y Seguridad RBAC — EVENTRA
 *
 * Estrategia:
 *   - jest.unstable_mockModule intercepta pool.query antes de cargar la app.
 *   - Se generan JWTs reales firmados con process.env.JWT_SECRET para tests
 *     que necesitan un token válido (ej. GET /me).
 *
 * Cobertura (Matriz de Riesgos — R-AUTH):
 *   ✓ POST /api/auth/register — campos faltantes          → 400
 *   ✓ POST /api/auth/register — email duplicado           → 400
 *   ✓ POST /api/auth/register — registro exitoso          → 201 + datos usuario
 *   ✓ POST /api/auth/login    — campos faltantes          → 400
 *   ✓ POST /api/auth/login    — usuario no encontrado     → 404
 *   ✓ POST /api/auth/login    — password incorrecto       → 401
 *   ✓ POST /api/auth/login    — credenciales correctas    → 200 + token JWT
 *   ✓ GET  /api/auth/me       — sin token                 → 401
 *   ✓ GET  /api/auth/me       — token malformado          → 401
 */

import request  from 'supertest';
import bcrypt   from 'bcrypt';
import jwt      from 'jsonwebtoken';
import { jest } from '@jest/globals';

// ─── Mock de la BD ───────────────────────────────────────────────────────────
jest.unstable_mockModule('../src/config/db.js', () => ({
  default: { query: jest.fn() },
}));

// ─── Mock del SDK de OpenAI (evita errores si no hay API_KEY) ────────────────
jest.unstable_mockModule('openai', () => ({
  default: class {
    chat = { completions: { create: jest.fn() } };
  },
}));

const { default: app }  = await import('../src/app.js');
const { default: pool } = await import('../src/config/db.js');

// JWT_SECRET de pruebas (no real)
const TEST_SECRET = process.env.JWT_SECRET || 'test_secret_eventra';

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 1: Registro de usuarios
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/auth/register', () => {

  beforeEach(() => jest.clearAllMocks());

  // ── Validación de campos obligatorios ────────────────────────────────────
  it('400 — rechaza registro si faltan campos obligatorios', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ empresa_id: 1, rol_id: 3 }); // sin email ni password

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/obligatorio/i);
  });

  // ── Email ya registrado (verificación previa en el controlador) ──────────
  it('400 — rechaza registro si el email ya está registrado', async () => {
    // Primera query: SELECT para verificar email existente → retorna fila
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 'uuid-existente' }],
      rowCount: 1,
    });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        empresa_id:      1,
        rol_id:          3,
        nombre_completo: 'Usuario Duplicado',
        email:           'duplicado@eventra.com',
        password:        'password123',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/email/i);
  });

  // ── Registro exitoso ─────────────────────────────────────────────────────
  it('201 — registra un nuevo usuario correctamente', async () => {
    // Mock 1: SELECT email → no existe
    pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    // Mock 2: INSERT → retorna usuario creado
    const fakeUser = {
      id:              'uuid-nuevo',
      empresa_id:      1,
      rol_id:          3,
      nombre_completo: 'Nuevo Usuario',
      email:           'nuevo@eventra.com',
      estado_activo:   true,
      fecha_creacion:  new Date().toISOString(),
    };
    pool.query.mockResolvedValueOnce({ rows: [fakeUser], rowCount: 1 });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        empresa_id:      1,
        rol_id:          3,
        nombre_completo: 'Nuevo Usuario',
        email:           'nuevo@eventra.com',
        password:        'segura123',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data).toHaveProperty('email', 'nuevo@eventra.com');
    // El hash de contraseña NUNCA debe aparecer en la respuesta
    expect(res.body.data).not.toHaveProperty('password_hash');
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 2: Login de usuarios
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/auth/login', () => {

  beforeEach(() => jest.clearAllMocks());

  // ── Campos obligatorios ──────────────────────────────────────────────────
  it('400 — rechaza login si falta email o password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'solo@email.com' }); // sin password

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // ── Usuario no encontrado ────────────────────────────────────────────────
  it('404 — retorna 404 si el usuario no existe en la BD', async () => {
    pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'noexiste@eventra.com', password: 'cualquiera' });

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  // ── Password incorrecto ──────────────────────────────────────────────────
  it('401 — retorna 401 si el password es incorrecto', async () => {
    // Genera un hash real de una contraseña distinta a la que se enviará
    const hashReal = await bcrypt.hash('password_correcto', 10);

    pool.query.mockResolvedValueOnce({
      rows: [{
        id:             'uuid-user',
        empresa_id:     1,
        rol_id:         2,
        nombre_completo:'Gerente Test',
        email:          'gerente@eventra.com',
        password_hash:  hashReal,
        estado_activo:  true,
      }],
      rowCount: 1,
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'gerente@eventra.com', password: 'password_INCORRECTO' });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/credenciales/i);
  });

  // ── Login exitoso → token JWT ────────────────────────────────────────────
  it('200 — retorna 200 y un token JWT válido con credenciales correctas', async () => {
    const passwordCorrecto = 'eventra2026';
    const hashReal = await bcrypt.hash(passwordCorrecto, 10);

    pool.query.mockResolvedValueOnce({
      rows: [{
        id:             'uuid-admin',
        empresa_id:     1,
        rol_id:         1,
        nombre_completo:'Admin Test',
        email:          'admin@eventra.com',
        password_hash:  hashReal,
        estado_activo:  true,
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

    // Verifica que el token sea un JWT real decodificable
    const decoded = jwt.decode(res.body.token);
    expect(decoded).toHaveProperty('empresa_id', 1);
    expect(decoded).toHaveProperty('rol_id', 1);

    // El hash de password NUNCA debe aparecer en la respuesta
    expect(res.body.data).not.toHaveProperty('password_hash');
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 3: Protección JWT — GET /api/auth/me (RBAC baseline)
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
    // Crea un JWT real firmado con el mismo secreto que usa la app
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
