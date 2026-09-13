/**
 * auth.test.js
 * ============
 * Suite de pruebas de Autenticación y Seguridad (RBAC) — EVENTRA
 *
 * Estrategia de aislamiento:
 *   - Se mockea el módulo `../src/config/db.js` para evitar conexiones
 *     reales a PostgreSQL durante las pruebas de CI/CD.
 *   - Supertest levanta la app Express en un puerto efímero (sin bind real),
 *     lo que permite pruebas HTTP completas sin conflictos de puerto.
 *
 * Cobertura (Matriz de Riesgos — Mitigación R-AUTH):
 *   ✓ POST /api/auth/register — email duplicado → 400
 *   ✓ POST /api/auth/register — campos faltantes → 400
 *   ✓ POST /api/auth/login   — credenciales inválidas → 401
 *   ✓ GET  /api/auth/me      — sin token → 401 (RBAC baseline)
 */

import request from 'supertest';
import { jest } from '@jest/globals';

// ─── Mock de la base de datos ────────────────────────────────────────────────
// Intercepta TODOS los imports de `../src/config/db.js` antes de que la app
// los resuelva, devolviendo un pool falso que no abre conexiones reales.
jest.unstable_mockModule('../src/config/db.js', () => ({
  default: {
    query: jest.fn(),
  },
}));

// La app se importa DESPUÉS del mock para que reciba el pool simulado
const { default: app } = await import('../src/app.js');
const { default: pool }  = await import('../src/config/db.js');

// ─── Suite: Registro de usuarios ─────────────────────────────────────────────
describe('POST /api/auth/register', () => {

  beforeEach(() => {
    // Limpia el historial de llamadas entre tests
    jest.clearAllMocks();
  });

  it('debe retornar 400 si faltan campos obligatorios', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        // email y password ausentes intencionalmente
        empresa_id: 1,
        rol_id: 3,
        nombre_completo: 'Test User',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('debe retornar 400 (o 409) si el email ya está registrado (duplicado)', async () => {
    // Simula la violación de restricción UNIQUE de PostgreSQL (código 23505)
    pool.query.mockRejectedValueOnce({ code: '23505' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        empresa_id:      1,
        rol_id:          3,
        nombre_completo: 'Usuario Duplicado',
        email:           'duplicado@eventra.com',
        password:        'password123',
      });

    // El controlador puede devolver 409 (Conflict) o 400 según la impl.
    expect([400, 409]).toContain(res.statusCode);
    expect(res.body.success).toBe(false);
  });

});

// ─── Suite: Login de usuarios ─────────────────────────────────────────────────
describe('POST /api/auth/login', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe retornar 400 si faltan email o password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'solo@email.com' }); // sin password

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('debe retornar 401 si el usuario no existe en la BD', async () => {
    // Simula que la BD no encontró ningún usuario con ese email
    pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'noexiste@eventra.com', password: 'cualquiera' });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

});

// ─── Suite: Protección RBAC — Ruta /me ───────────────────────────────────────
describe('GET /api/auth/me — Protección JWT', () => {

  it('debe retornar 401 si no se envía token de autorización', async () => {
    const res = await request(app)
      .get('/api/auth/me');
    // Sin header Authorization: Bearer <token> el middleware debe denegar
    expect(res.statusCode).toBe(401);
  });

  it('debe retornar 401 si el token es inválido o está malformado', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer token_invalido_xyz');

    expect(res.statusCode).toBe(401);
  });

});
