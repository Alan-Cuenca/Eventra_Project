/**
 * auth.test.js — EVENTRA SaaS Backend Test Suite
 * =============================================================================
 * Pruebas de Autenticación, Seguridad JWT, Control de Credenciales y Onboarding
 * Scope: Jorge (Backend Developer y Arquitectura de Servicios)
 * =============================================================================
 */

import request from 'supertest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';

process.env.JWT_SECRET = 'test_secret_eventra_jest';
process.env.NODE_ENV   = 'test';
process.env.PORT       = '0';

const TEST_SECRET = 'test_secret_eventra_jest';

// ─── Mocks de Infraestructura ────────────────────────────────────────────────
let mockQueryHandler = null;

jest.unstable_mockModule('../src/config/db.js', () => ({
  default: {
    query: jest.fn(async (sql, params) => {
      if (mockQueryHandler) {
        return mockQueryHandler(sql, params);
      }
      return { rows: [], rowCount: 0 };
    }),
    connect: jest.fn(),
  },
}));

jest.unstable_mockModule('openai', () => ({
  default: class {
    chat = { completions: { create: jest.fn() } };
  },
}));

const { default: app }  = await import('../src/app.js');
const { default: pool } = await import('../src/config/db.js');

// ─── Tokens de sesión de prueba ──────────────────────────────────────────────
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

describe('Módulo de Autenticación y Seguridad JWT — EVENTRA', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    mockQueryHandler = null;
  });

  // ───────────────────────────────────────────────────────────────────────────
  // SUITE 1: Inicio de Sesión (POST /api/auth/login)
  // ───────────────────────────────────────────────────────────────────────────
  describe('POST /api/auth/login — Verificación de Credenciales y Generación de JWT', () => {

    it('400 — rechaza el inicio de sesión si falta el email o el password', async () => {
      const resSinPassword = await request(app)
        .post('/api/auth/login')
        .send({ email: 'usuario@eventra.com' });

      expect(resSinPassword.statusCode).toBe(400);
      expect(resSinPassword.body.success).toBe(false);
      expect(resSinPassword.body.message).toMatch(/obligatorios/i);

      const resSinEmail = await request(app)
        .post('/api/auth/login')
        .send({ password: 'Password123' });

      expect(resSinEmail.statusCode).toBe(400);
      expect(resSinEmail.body.success).toBe(false);
    });

    it('404 — rechaza con 404 si el usuario no existe en la base de datos', async () => {
      mockQueryHandler = async () => ({ rows: [], rowCount: 0 });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'inexistente@eventra.com', password: 'Password123!' });

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/no encontrado/i);
    });

    it('401 — rechaza con 401 si las credenciales son incorrectas (contraseña inválida)', async () => {
      const passwordCorrecto = 'PasswordValido2026!';
      const hashReal = await bcrypt.hash(passwordCorrecto, 10);

      mockQueryHandler = async (sql) => {
        if (typeof sql === 'string' && sql.includes('FROM usuarios u')) {
          return {
            rows: [{
              id: 'uuid-user-1',
              empresa_id: 1,
              rol_id: 2,
              nombre_completo: 'Gerente Operativo',
              email: 'gerente@eventra.com',
              password_hash: hashReal,
              estado_activo: true,
              rol_nombre: 'Gerente',
              empresa_nombre: 'Banquetes Reales',
              plan_suscripcion: 'Premium',
              empresa_activa: true,
            }],
            rowCount: 1,
          };
        }
        return { rows: [], rowCount: 0 };
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'gerente@eventra.com', password: 'ContraseniaErronea' });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/credenciales inválidas/i);
    });

    it('403 — rechaza con 403 si el usuario tiene estado inactivo (cuenta suspendida)', async () => {
      const password = 'PasswordActivo123';
      const hashReal = await bcrypt.hash(password, 10);

      mockQueryHandler = async () => ({
        rows: [{
          id: 'uuid-user-desactivado',
          empresa_id: 1,
          rol_id: 3,
          nombre_completo: 'Empleado Suspendido',
          email: 'suspendido@eventra.com',
          password_hash: hashReal,
          estado_activo: false, // inactivo
          rol_nombre: 'Trabajador',
          empresa_activa: true,
        }],
        rowCount: 1,
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'suspendido@eventra.com', password });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/desactivada/i);
    });

    it('200 — autentica exitosamente y genera un JWT firmado con id, empresa_id y rol_id', async () => {
      const passwordCorrecto = 'EventraSeguro2026!';
      const hashReal = await bcrypt.hash(passwordCorrecto, 10);

      mockQueryHandler = async (sql) => {
        if (typeof sql === 'string' && sql.includes('FROM usuarios u')) {
          return {
            rows: [{
              id: 'uuid-admin-real',
              empresa_id: 1,
              rol_id: 1,
              nombre_completo: 'Alan Puruncajas',
              email: 'apuruncajas1832@uta.edu.ec',
              password_hash: hashReal,
              estado_activo: true,
              debe_cambiar_password: false,
              rol_nombre: 'Administrador',
              empresa_nombre: 'Eventra Luxury Corp',
              plan_suscripcion: 'Premium',
              empresa_activa: true,
            }],
            rowCount: 1,
          };
        }
        return { rows: [], rowCount: 0 };
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'apuruncajas1832@uta.edu.ec', password: passwordCorrecto });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('token');
      expect(typeof res.body.token).toBe('string');

      // Validar que no exponga el hash de la contraseña
      expect(res.body.data).not.toHaveProperty('password_hash');
      expect(res.body.data.email).toBe('apuruncajas1832@uta.edu.ec');

      // Verificar que el JWT contenga la información requerida de tenant y rol
      const decoded = jwt.verify(res.body.token, TEST_SECRET);
      expect(decoded).toHaveProperty('id', 'uuid-admin-real');
      expect(decoded).toHaveProperty('empresa_id', 1);
      expect(decoded).toHaveProperty('rol_id', 1);
      expect(decoded).toHaveProperty('email', 'apuruncajas1832@uta.edu.ec');
    });

  });

  // ───────────────────────────────────────────────────────────────────────────
  // SUITE 2: Inspección y Barrera de Sesión (GET /api/auth/me)
  // ───────────────────────────────────────────────────────────────────────────
  describe('GET /api/auth/me — Validación del Interceptor JWT', () => {

    it('401 — rechaza peticiones sin el encabezado Authorization', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/token/i);
    });

    it('401 — rechaza tokens con firma inválida o malformados', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer token_invalido_firma_falsa');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/inválido|expirado/i);
    });

    it('200 — autoriza la solicitud y devuelve el perfil del usuario autenticado', async () => {
      mockQueryHandler = async (sql) => {
        if (typeof sql === 'string' && sql.includes('FROM usuarios')) {
          return {
            rows: [{
              id: 'uuid-admin-test',
              empresa_id: 1,
              rol_id: 1,
              nombre_completo: 'Administrador Demo',
              email: 'admin@eventra.com',
              rol_nombre: 'Administrador',
              plan_suscripcion: 'Premium',
            }],
            rowCount: 1,
          };
        }
        return { rows: [], rowCount: 0 };
      };

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${TOKEN_ADMIN}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('admin@eventra.com');
      expect(res.body.data.empresa_id).toBe(1);
    });

  });

  // ───────────────────────────────────────────────────────────────────────────
  // SUITE 3: Control de Invitaciones y Onboarding de Empleados
  // ───────────────────────────────────────────────────────────────────────────
  describe('POST /api/auth/invitar — Flujo de Invitaciones Multi-Tenant', () => {

    it('401 — rechaza la invitación si no se provee token', async () => {
      const res = await request(app)
        .post('/api/auth/invitar')
        .send({ email: 'nuevo@empresa.com', rol_id: 3 });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('403 — rechaza la invitación si el usuario no tiene rol Administrador (rol_id = 1)', async () => {
      const res = await request(app)
        .post('/api/auth/invitar')
        .set('Authorization', `Bearer ${TOKEN_TRABAJADOR}`)
        .send({ email: 'nuevo@empresa.com', rol_id: 3 });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('400 — rechaza si falta el email o el rol_id en el payload', async () => {
      mockQueryHandler = async (sql) => {
        const queryStr = typeof sql === 'string' ? sql : sql?.text || '';
        if (queryStr.includes('FROM empresas')) {
          return { rows: [{ plan_suscripcion: 'Premium', mensajes_chatbot_mes: 0 }], rowCount: 1 };
        }
        if (queryStr.includes('COUNT(*)')) {
          return { rows: [{ count: '1' }], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      };

      const res = await request(app)
        .post('/api/auth/invitar')
        .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
        .send({ rol_id: 3 });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('409 — rechaza si el correo ya pertenece a un usuario registrado', async () => {
      mockQueryHandler = async (sql) => {
        const queryStr = typeof sql === 'string' ? sql : sql?.text || '';
        if (queryStr.includes('FROM empresas')) {
          return { rows: [{ plan_suscripcion: 'Premium', mensajes_chatbot_mes: 0 }], rowCount: 1 };
        }
        if (queryStr.includes('COUNT(*)')) {
          return { rows: [{ count: '1' }], rowCount: 1 };
        }
        if (queryStr.includes('SELECT id FROM usuarios WHERE email')) {
          return { rows: [{ id: 'uuid-existente' }], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      };

      const res = await request(app)
        .post('/api/auth/invitar')
        .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
        .send({ email: 'existente@empresa.com', rol_id: 3 });

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/registrado/i);
    });

    it('200 — genera la invitación y devuelve el token de registro', async () => {
      mockQueryHandler = async (sql) => {
        const queryStr = typeof sql === 'string' ? sql : sql?.text || '';
        if (queryStr.includes('FROM empresas') && queryStr.includes('nombre_comercial')) {
          return { rows: [{ nombre_comercial: 'Banquetería Elite' }], rowCount: 1 };
        }
        if (queryStr.includes('FROM empresas')) {
          return { rows: [{ plan_suscripcion: 'Premium', mensajes_chatbot_mes: 0 }], rowCount: 1 };
        }
        if (queryStr.includes('COUNT(*)')) {
          return { rows: [{ count: '1' }], rowCount: 1 };
        }
        if (queryStr.includes('SELECT id FROM usuarios WHERE email')) {
          return { rows: [], rowCount: 0 }; // no existe
        }
        return { rows: [], rowCount: 0 };
      };

      const res = await request(app)
        .post('/api/auth/invitar')
        .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
        .send({ email: 'colaborador@empresa.com', rol_id: 3 });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token_invitacion');
      expect(res.body.data).toHaveProperty('enlace_registro');
    });

  });

  // ───────────────────────────────────────────────────────────────────────────
  // SUITE 4: Completar Registro
  // ───────────────────────────────────────────────────────────────────────────
  describe('POST /api/auth/completar-registro — Alta con Token Temporal', () => {

    const tokenValido = jwt.sign(
      { email: 'colaborador@empresa.com', rol_id: 3, empresa_id: 1, tipo: 'invitacion' },
      TEST_SECRET,
      { expiresIn: '48h' }
    );

    it('400 — rechaza si faltan campos obligatorios', async () => {
      const res = await request(app)
        .post('/api/auth/completar-registro')
        .send({ nombre_completo: 'Jorge Sailema' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('201 — completa el registro con éxito e inserta en la base de datos', async () => {
      mockQueryHandler = async (sql) => {
        const queryStr = typeof sql === 'string' ? sql : sql?.text || '';
        if (queryStr.includes('SELECT id FROM usuarios WHERE email')) {
          return { rows: [], rowCount: 0 };
        }
        if (queryStr.includes('INSERT INTO usuarios')) {
          return {
            rows: [{
              id: 'uuid-nuevo-empleado',
              empresa_id: 1,
              rol_id: 3,
              nombre_completo: 'Jorge Sailema',
              email: 'colaborador@empresa.com',
              cedula: '1804567890',
              fecha_nacimiento: '1995-08-20',
              estado_activo: true,
              fecha_creacion: new Date().toISOString(),
            }],
            rowCount: 1,
          };
        }
        return { rows: [], rowCount: 0 };
      };

      const res = await request(app)
        .post('/api/auth/completar-registro')
        .send({
          token: tokenValido,
          nombre_completo: 'Jorge Sailema',
          cedula: '1804567890',
          fecha_nacimiento: '1995-08-20',
          password: 'PasswordSeguro2026!',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.email).toBe('colaborador@empresa.com');
      expect(res.body.data).not.toHaveProperty('password_hash');
    });

  });

});
