/**
 * auth.test.js
 * =============================================================
 * Pruebas de Autenticación, Invitación por Email y Completar Registro — EVENTRA
 * =============================================================
 */

import request  from 'supertest';
import bcrypt   from 'bcrypt';
import jwt      from 'jsonwebtoken';
import { jest } from '@jest/globals';

// ─── Variables de entorno para el entorno de test ────────────────────────────
process.env.JWT_SECRET = 'test_secret_eventra_jest';
process.env.NODE_ENV   = 'test';
process.env.PORT       = '0';

const TEST_SECRET = 'test_secret_eventra_jest';

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

const TOKEN_ADMIN = jwt.sign(
  { id: 'uuid-admin-test', empresa_id: 1, rol_id: 1, email: 'admin@eventra.com' },
  TEST_SECRET,
  { expiresIn: '1h' }
);

const TOKEN_TRABAJADOR = jwt.sign(
  { id: 'uuid-worker-test', empresa_id: 1, rol_id: 3, email: 'worker@eventra.com' },
  TEST_SECRET,
  { expiresIn: '1h' }
);

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 1: Flujo de Invitación de Usuarios por Email (Admin)
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/auth/invitar — Invitación por Correo Electrónico', () => {

  beforeEach(() => jest.clearAllMocks());

  it('401 — rechaza la petición si no se envía token de autenticación', async () => {
    const res = await request(app)
      .post('/api/auth/invitar')
      .send({ email: 'nuevo@empresa.com', rol_id: 3 });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('403 — rechaza la invitación si el usuario no tiene rol de Administrador (1)', async () => {
    const res = await request(app)
      .post('/api/auth/invitar')
      .set('Authorization', `Bearer ${TOKEN_TRABAJADOR}`)
      .send({ email: 'nuevo@empresa.com', rol_id: 3 });

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('400 — rechaza si falta el email o el rol_id en el payload', async () => {
    const res = await request(app)
      .post('/api/auth/invitar')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({ rol_id: 3 }); // sin email

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/obligatorio/i);
  });

  it('409 — rechaza si el correo electrónico ya está registrado', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 'uuid-existente' }], rowCount: 1 });

    const res = await request(app)
      .post('/api/auth/invitar')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({ email: 'existente@empresa.com', rol_id: 3 });

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/registrado/i);
  });

  it('200 — genera y envía la invitación por correo correctamente', async () => {
    // 1. SELECT email → no existe
    pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    // 2. SELECT nombre_comercial de empresa
    pool.query.mockResolvedValueOnce({ rows: [{ nombre_comercial: 'Eventos Sol' }], rowCount: 1 });

    const res = await request(app)
      .post('/api/auth/invitar')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({ email: 'colaborador@empresa.com', rol_id: 3 });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/invitación enviada/i);
    expect(res.body.data).toHaveProperty('token_invitacion');
    expect(res.body.data).toHaveProperty('enlace_registro');

    // Verificar que el token generado contenga email, rol_id y empresa_id
    const decoded = jwt.verify(res.body.data.token_invitacion, TEST_SECRET);
    expect(decoded).toHaveProperty('email', 'colaborador@empresa.com');
    expect(decoded).toHaveProperty('rol_id', 3);
    expect(decoded).toHaveProperty('empresa_id', 1);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 2: Completar Registro (Empleado Onboarding)
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/auth/completar-registro — Onboarding de Usuario', () => {

  beforeEach(() => jest.clearAllMocks());

  const tokenValido = jwt.sign(
    { email: 'empleado@empresa.com', rol_id: 3, empresa_id: 1, tipo: 'invitacion' },
    TEST_SECRET,
    { expiresIn: '48h' }
  );

  it('400 — rechaza si faltan campos obligatorios (token, nombre o password)', async () => {
    const res = await request(app)
      .post('/api/auth/completar-registro')
      .send({ nombre_completo: 'Carlos Ruiz' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('400 — rechaza si el token de invitación es inválido o ha expirado', async () => {
    const res = await request(app)
      .post('/api/auth/completar-registro')
      .send({
        token: 'token_falso_invalido_xyz',
        nombre_completo: 'Carlos Ruiz',
        password: 'Password123!',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/inválido|expirado/i);
  });

  it('409 — rechaza si el email de la invitación ya fue registrado', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 'uuid-ya-registrado' }], rowCount: 1 });

    const res = await request(app)
      .post('/api/auth/completar-registro')
      .send({
        token: tokenValido,
        nombre_completo: 'Carlos Ruiz',
        cedula: '1723456789',
        fecha_nacimiento: '1995-04-10',
        password: 'PasswordSeguro123',
      });

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/registrado|utilizada/i);
  });

  it('201 — completa el registro con datos personales y crea el usuario', async () => {
    // 1. SELECT email → no existe
    pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    // 2. INSERT usuario
    pool.query.mockResolvedValueOnce({
      rows: [{
        id: 'uuid-nuevo-empleado',
        empresa_id: 1,
        rol_id: 3,
        nombre_completo: 'Carlos Ruiz',
        email: 'empleado@empresa.com',
        cedula: '1723456789',
        fecha_nacimiento: '1995-04-10',
        estado_activo: true,
        fecha_creacion: new Date().toISOString(),
      }],
      rowCount: 1,
    });

    const res = await request(app)
      .post('/api/auth/completar-registro')
      .send({
        token: tokenValido,
        nombre_completo: 'Carlos Ruiz',
        cedula: '1723456789',
        fecha_nacimiento: '1995-04-10',
        password: 'PasswordSeguro123',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data).toHaveProperty('cedula', '1723456789');
    expect(res.body.data).toHaveProperty('email', 'empleado@empresa.com');
    expect(res.body.data).not.toHaveProperty('password_hash');
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 3: Bloqueo de autoregistro público
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/auth/register — Bloqueo de autoregistro', () => {

  it('403 — rechaza autoregistro público informando que se requiere invitación', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'libre@eventra.com', password: '123' });

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/deshabilitado|invitación/i);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 4: Login de usuarios
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/auth/login', () => {

  beforeEach(() => jest.clearAllMocks());

  it('400 — rechaza login si falta email o password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'solo@email.com' });

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
// SUITE 5: Protección JWT — GET /api/auth/me
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
