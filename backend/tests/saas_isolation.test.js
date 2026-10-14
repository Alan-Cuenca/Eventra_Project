/**
 * saas_isolation.test.js
 * ====================================================================
 * Pruebas de Arquitectura SaaS Multi-Tenant y Seguridad Super_Admin
 * ====================================================================
 */

import request from 'supertest';
import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';

process.env.JWT_SECRET = 'test_secret_eventra_jest';
process.env.NODE_ENV   = 'test';
process.env.PORT       = '0';

const TEST_SECRET = 'test_secret_eventra_jest';

// Mock de la base de datos
jest.unstable_mockModule('../src/config/db.js', () => ({
  default: {
    query: jest.fn(),
    connect: jest.fn(),
  },
}));

// Mock de OpenAI
jest.unstable_mockModule('openai', () => ({
  default: class {
    chat = { completions: { create: jest.fn() } };
  },
}));

const { default: app }  = await import('../src/app.js');
const { default: pool } = await import('../src/config/db.js');

// Tokens de prueba
const TOKEN_SUPER_ADMIN = jwt.sign(
  { id: 'uuid-super-admin', rol_id: 5, rol: 'Super_Admin', email: 'superadmin@eventra.com' },
  TEST_SECRET,
  { expiresIn: '1h' }
);

const TOKEN_ADMIN_TENANT_1 = jwt.sign(
  { id: 'uuid-admin-t1', empresa_id: 1, rol_id: 1, rol: 'Administrador', email: 'admin1@tenant1.com' },
  TEST_SECRET,
  { expiresIn: '1h' }
);

const TOKEN_WORKER_TENANT_1 = jwt.sign(
  { id: 'uuid-worker-t1', empresa_id: 1, rol_id: 3, rol: 'Trabajador', email: 'worker1@tenant1.com' },
  TEST_SECRET,
  { expiresIn: '1h' }
);

describe('SaaS Multi-Tenant — Aislamiento y Módulo Super_Admin', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // SUITE 1: Rutas de /api/empresas protegidas con authorizeSuperAdmin
  // ───────────────────────────────────────────────────────────────────────────
  describe('Protección de rutas de gestión global de empresas (/api/empresas)', () => {

    it('401 — Rechaza acceso sin token', async () => {
      const res = await request(app).get('/api/empresas');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('403 — Rechaza acceso a un Administrador de Tenant (rol_id 1)', async () => {
      const res = await request(app)
        .get('/api/empresas')
        .set('Authorization', `Bearer ${TOKEN_ADMIN_TENANT_1}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Super Admin/i);
    });

    it('200 — Permite listar empresas a Super_Admin (rol_id 5)', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            nombre_comercial: 'Eventos Sol S.A.',
            ruc: '1790011223001',
            plan_suscripcion: 'Premium',
            estado_activo: true,
            total_usuarios: '4',
            total_eventos: '12',
          },
        ],
        rowCount: 1,
      });

      const res = await request(app)
        .get('/api/empresas')
        .set('Authorization', `Bearer ${TOKEN_SUPER_ADMIN}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].nombre_comercial).toBe('Eventos Sol S.A.');
    });

    it('201 — Super_Admin puede crear una nueva empresa SaaS', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({   // INSERT empresa
            rows: [{
              id: 2,
              nombre_comercial: 'Recepciones Luna',
              ruc: '1799998888001',
              plan_suscripcion: 'Basico',
              estado_activo: true,
            }],
            rowCount: 1,
          })
          .mockResolvedValueOnce({   // INSERT admin inicial
            rows: [{
              id: 'uuid-admin-luna',
              empresa_id: 2,
              rol_id: 1,
              nombre_completo: 'Admin Luna',
              email: 'admin@luna.com',
            }],
            rowCount: 1,
          })
          .mockResolvedValueOnce({}), // COMMIT
        release: jest.fn(),
      };

      pool.connect.mockResolvedValueOnce(mockClient);

      const res = await request(app)
        .post('/api/empresas')
        .set('Authorization', `Bearer ${TOKEN_SUPER_ADMIN}`)
        .send({
          nombre_comercial: 'Recepciones Luna',
          ruc: '1799998888001',
          plan_suscripcion: 'Basico',
          admin_nombre: 'Admin Luna',
          admin_email: 'admin@luna.com',
          admin_password: 'Password123!',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.empresa.nombre_comercial).toBe('Recepciones Luna');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('200 — Super_Admin puede actualizar plan de suscripción', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          nombre_comercial: 'Eventos Sol S.A.',
          plan_suscripcion: 'Enterprise',
          estado_activo: true,
        }],
        rowCount: 1,
      });

      const res = await request(app)
        .put('/api/empresas/1/plan')
        .set('Authorization', `Bearer ${TOKEN_SUPER_ADMIN}`)
        .send({ plan_suscripcion: 'Enterprise' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.plan_suscripcion).toBe('Enterprise');
    });

    it('200 — Super_Admin puede suspender una empresa SaaS', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          nombre_comercial: 'Eventos Sol S.A.',
          estado_activo: false,
        }],
        rowCount: 1,
      });

      const res = await request(app)
        .put('/api/empresas/1/suspender')
        .set('Authorization', `Bearer ${TOKEN_SUPER_ADMIN}`)
        .send({ estado_activo: false });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/suspendida/i);
      expect(res.body.data.estado_activo).toBe(false);
    });

  });

  // ───────────────────────────────────────────────────────────────────────────
  // SUITE 2: Aislamiento estricto por empresa_id en controladores de inquilino
  // ───────────────────────────────────────────────────────────────────────────
  describe('Aislamiento por empresa_id en usuarios y recursos', () => {

    it('Aislamiento: GET /api/usuarios filtra obligatoriamente por req.user.empresa_id', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [
          { id: 'uuid-u1', empresa_id: 1, nombre_completo: 'Trabajador T1', email: 't1@tenant1.com' },
        ],
        rowCount: 1,
      });

      const res = await request(app)
        .get('/api/usuarios')
        .set('Authorization', `Bearer ${TOKEN_ADMIN_TENANT_1}`);

      expect(res.statusCode).toBe(200);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE u.empresa_id = $1'),
        [1] // ID 1 extraído estrictamente del token JWT
      );
    });

    it('Aislamiento: POST /api/usuarios no permite crear usuarios con rol Super_Admin (5)', async () => {
      const res = await request(app)
        .post('/api/usuarios')
        .set('Authorization', `Bearer ${TOKEN_ADMIN_TENANT_1}`)
        .send({
          nombre_completo: 'Hacker',
          email: 'hacker@empresa.com',
          password: 'Password123',
          rol_id: 5, // Intento de escalar privilegios
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Super_Admin/i);
    });

    it('Bloqueo: loginUser bloquea inicio de sesión si la empresa está suspendida', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 'uuid-user-suspendido',
          empresa_id: 99,
          rol_id: 2,
          nombre_completo: 'Gerente Empresa Suspendida',
          email: 'gerente@suspendida.com',
          password_hash: '$2b$10$FakeHashForPasswordCheckOnly12345678901234567890123456',
          estado_activo: true,
          empresa_activa: false, // Empresa suspendida por Super Admin
        }],
        rowCount: 1,
      });

      // bcrypt.compare mockeado vía import o prueba directa
      const bcrypt = await import('bcrypt');
      jest.spyOn(bcrypt.default, 'compare').mockResolvedValueOnce(true);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'gerente@suspendida.com', password: 'password123' });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/suspendida|inactiva/i);
    });

  });

});
