/**
 * passwordFlow.test.js — EVENTRA SaaS Backend Test Suite
 * =============================================================================
 * Cambio obligatorio de contraseña temporal y recuperación de contraseña.
 * =============================================================================
 */

import request from 'supertest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';

process.env.JWT_SECRET = 'test_secret_eventra_jest';
process.env.NODE_ENV   = 'test';
process.env.PORT       = '0';
process.env.FRONTEND_URL = 'http://localhost:5173';

const TEST_SECRET = 'test_secret_eventra_jest';

let mockQueryHandler = null;
const mockPool = {
  query: jest.fn(async (sql, params) => (mockQueryHandler ? mockQueryHandler(sql, params) : { rows: [], rowCount: 0 })),
  connect: jest.fn(),
};

jest.unstable_mockModule('../src/config/db.js', () => ({ default: mockPool }));

const mockSendPasswordResetEmail = jest.fn(async () => ({ success: true }));
const realEmailService = await import('../src/services/emailService.js');
jest.unstable_mockModule('../src/services/emailService.js', () => ({
  ...realEmailService,
  sendPasswordResetEmail: mockSendPasswordResetEmail,
}));

jest.unstable_mockModule('openai', () => ({
  default: class {
    chat = { completions: { create: jest.fn() } };
  },
}));

const { default: app } = await import('../src/app.js');

const PASSWORD_TEMPORAL = 'Temp#Pass2345';
const HASH_TEMPORAL = await bcrypt.hash(PASSWORD_TEMPORAL, 4);

const usuarioBase = (overrides = {}) => ({
  id: 'uuid-admin-nuevo',
  empresa_id: 7,
  rol_id: 1,
  nombre_completo: 'Admin Nuevo',
  email: 'admin.nuevo@empresa.com',
  password_hash: HASH_TEMPORAL,
  estado_activo: true,
  debe_cambiar_password: true,
  rol_nombre: 'Administrador',
  empresa_nombre: 'Empresa Nueva',
  empresa_slug: 'empresa-nueva',
  plan_suscripcion: 'Basico',
  empresa_activa: true,
  ...overrides,
});

const tokenPendiente = jwt.sign(
  { id: 'uuid-admin-nuevo', empresa_id: 7, rol_id: 1, email: 'admin.nuevo@empresa.com', debe_cambiar_password: true },
  TEST_SECRET,
  { expiresIn: '1h' }
);

describe('Flujo de contraseñas — EVENTRA', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQueryHandler = null;
  });

  describe('Login con contraseña temporal', () => {
    it('marca el JWT y la respuesta con debe_cambiar_password = true', async () => {
      mockQueryHandler = async (sql) =>
        sql.includes('FROM usuarios u') ? { rows: [usuarioBase()], rowCount: 1 } : { rows: [], rowCount: 0 };

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin.nuevo@empresa.com', password: PASSWORD_TEMPORAL });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.debe_cambiar_password).toBe(true);
      expect(jwt.verify(res.body.token, TEST_SECRET).debe_cambiar_password).toBe(true);
    });

    it('bloquea endpoints protegidos con 403 PASSWORD_CHANGE_REQUIRED', async () => {
      const res = await request(app)
        .get('/api/clientes')
        .set('Authorization', `Bearer ${tokenPendiente}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe('PASSWORD_CHANGE_REQUIRED');
    });

    it('permite /api/auth/me con cambio pendiente', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${tokenPendiente}`);

      expect(res.statusCode).toBe(200);
    });
  });

  describe('POST /api/auth/cambiar-password-obligatorio', () => {
    it('400 — rechaza contraseña temporal incorrecta (sin 401 para no cerrar sesión)', async () => {
      mockQueryHandler = async () => ({ rows: [usuarioBase()], rowCount: 1 });

      const res = await request(app)
        .post('/api/auth/cambiar-password-obligatorio')
        .set('Authorization', `Bearer ${tokenPendiente}`)
        .send({ password_temporal: 'Incorrecta123', password_nuevo: 'NuevaClave2026', password_confirmar: 'NuevaClave2026' });

      expect(res.statusCode).toBe(400);
    });

    it('400 — rechaza contraseñas débiles', async () => {
      const res = await request(app)
        .post('/api/auth/cambiar-password-obligatorio')
        .set('Authorization', `Bearer ${tokenPendiente}`)
        .send({ password_temporal: PASSWORD_TEMPORAL, password_nuevo: 'corta', password_confirmar: 'corta' });

      expect(res.statusCode).toBe(400);
    });

    it('400 — rechaza reutilizar la contraseña temporal', async () => {
      mockQueryHandler = async () => ({ rows: [usuarioBase({ password_hash: await bcrypt.hash('Temporal2026X', 4) })], rowCount: 1 });

      const res = await request(app)
        .post('/api/auth/cambiar-password-obligatorio')
        .set('Authorization', `Bearer ${tokenPendiente}`)
        .send({ password_temporal: 'Temporal2026X', password_nuevo: 'Temporal2026X', password_confirmar: 'Temporal2026X' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/diferente/i);
    });

    it('200 — actualiza la contraseña, limpia la marca y emite un JWT limpio', async () => {
      const queries = [];
      mockQueryHandler = async (sql, params) => {
        queries.push({ sql, params });
        if (sql.includes('FROM usuarios u')) return { rows: [usuarioBase()], rowCount: 1 };
        return { rows: [], rowCount: 1 };
      };

      const res = await request(app)
        .post('/api/auth/cambiar-password-obligatorio')
        .set('Authorization', `Bearer ${tokenPendiente}`)
        .send({ password_temporal: PASSWORD_TEMPORAL, password_nuevo: 'NuevaClave2026', password_confirmar: 'NuevaClave2026' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.debe_cambiar_password).toBe(false);
      expect(res.body.data).not.toHaveProperty('password_hash');
      expect(jwt.verify(res.body.token, TEST_SECRET).debe_cambiar_password).toBe(false);

      const update = queries.find((q) => q.sql.includes('UPDATE usuarios'));
      expect(update.sql).toMatch(/debe_cambiar_password = false/);
      expect(await bcrypt.compare('NuevaClave2026', update.params[0])).toBe(true);
    });
  });

  describe('POST /api/auth/recuperar-password', () => {
    it('400 — correo inválido', async () => {
      const res = await request(app).post('/api/auth/recuperar-password').send({ email: 'no-es-correo' });
      expect(res.statusCode).toBe(400);
    });

    it('200 genérico y sin correo si la cuenta no existe', async () => {
      mockQueryHandler = async () => ({ rows: [], rowCount: 0 });
      const res = await request(app).post('/api/auth/recuperar-password').send({ email: 'nadie@x.com' });

      expect(res.statusCode).toBe(200);
      expect(mockSendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('200 y envía enlace al portal de la empresa si la cuenta existe', async () => {
      mockQueryHandler = async () => ({ rows: [usuarioBase()], rowCount: 1 });
      const res = await request(app).post('/api/auth/recuperar-password').send({ email: 'admin.nuevo@empresa.com' });

      expect(res.statusCode).toBe(200);
      expect(mockSendPasswordResetEmail).toHaveBeenCalledTimes(1);
      const { enlaceReset } = mockSendPasswordResetEmail.mock.calls[0][0];
      expect(enlaceReset).toMatch(/^http:\/\/localhost:5173\/portal\/empresa-nueva\/restablecer-password\?token=/);
    });
  });

  describe('POST /api/auth/restablecer-password', () => {
    const tokenReset = (hash, overrides = {}) =>
      jwt.sign({ id: 'uuid-admin-nuevo', proposito: 'reset_password', ...overrides }, TEST_SECRET + hash, { expiresIn: '30m' });

    it('200 — restablece con token válido y devuelve la ruta de login del portal', async () => {
      const queries = [];
      mockQueryHandler = async (sql, params) => {
        queries.push({ sql, params });
        if (sql.includes('FROM usuarios u')) return { rows: [usuarioBase()], rowCount: 1 };
        return { rows: [], rowCount: 1 };
      };

      const res = await request(app)
        .post('/api/auth/restablecer-password')
        .send({ token: tokenReset(HASH_TEMPORAL), password_nuevo: 'NuevaClave2026', password_confirmar: 'NuevaClave2026' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.redirect).toBe('/portal/empresa-nueva/login');
      expect(queries.some((q) => q.sql.includes('UPDATE usuarios'))).toBe(true);
    });

    it('400 — el token queda inválido cuando la contraseña ya cambió (uso único)', async () => {
      mockQueryHandler = async () => ({ rows: [usuarioBase({ password_hash: 'hash-distinto' })], rowCount: 1 });

      const res = await request(app)
        .post('/api/auth/restablecer-password')
        .send({ token: tokenReset(HASH_TEMPORAL), password_nuevo: 'NuevaClave2026', password_confirmar: 'NuevaClave2026' });

      expect(res.statusCode).toBe(400);
    });

    it('400 — rechaza un JWT de sesión usado como token de recuperación', async () => {
      mockQueryHandler = async () => ({ rows: [usuarioBase()], rowCount: 1 });

      const res = await request(app)
        .post('/api/auth/restablecer-password')
        .send({ token: tokenPendiente, password_nuevo: 'NuevaClave2026', password_confirmar: 'NuevaClave2026' });

      expect(res.statusCode).toBe(400);
    });
  });
});
