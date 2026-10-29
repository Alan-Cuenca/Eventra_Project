import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';

// Variables de entorno para prueba
process.env.JWT_SECRET = 'test-branding-jwt-secret';
process.env.NODE_ENV = 'test';

// Mocks de base de datos
const mockEmpresa = {
  id: 1,
  nombre_comercial: 'Hacienda San José',
  slug: 'hacienda-san-jose',
  ruc: '1792345678001',
  plan_suscripcion: 'Premium',
  estado_activo: true,
  logo_url: '/logo_Helados_Catedral.jpg',
  paleta_colores: 'bosque_olivo',
  marca_agua_activa: true,
  portal_titulo: 'Bienvenido a Hacienda San José',
  portal_descripcion: 'El mejor lugar para tus recepciones campestres.',
};

const mockQuery = jest.fn();

jest.unstable_mockModule('../src/config/db.js', () => ({
  default: {
    query: mockQuery,
    on: jest.fn(),
  },
}));

jest.unstable_mockModule('../src/config/supabase.js', () => ({
  supabase: null,
}));

// Importar rutas después de los mocks
const empresaRoutes = (await import('../src/routes/empresaRoutes.js')).default;
const authRoutes = (await import('../src/routes/authRoutes.js')).default;

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/empresas', empresaRoutes);
app.use('/api/auth', authRoutes);

// Tokens de prueba
const adminToken = jwt.sign(
  { id: 'usr-admin-1', rol_id: 1, empresa_id: 1, email: 'admin@hacienda.com' },
  process.env.JWT_SECRET
);

const clienteToken = jwt.sign(
  { id: 'usr-cliente-1', rol_id: 4, empresa_id: 1, email: 'cliente@hacienda.com' },
  process.env.JWT_SECRET
);

const superAdminToken = jwt.sign(
  { id: 'usr-super-1', rol_id: 5, empresa_id: null, email: 'super@eventra.com' },
  process.env.JWT_SECRET
);

describe('Módulo de Marca Blanca y Branding (White-Label)', () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  describe('GET /api/empresas/mi-branding', () => {
    test('401 — Rechaza peticiones sin token', async () => {
      const res = await request(app).get('/api/empresas/mi-branding');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('200 — Retorna branding institucional por defecto para Super Admin sin empresa', async () => {
      const res = await request(app)
        .get('/api/empresas/mi-branding')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.nombre_comercial).toBe('EVENTRA');
      expect(res.body.data.paleta_colores).toBe('sofisticacion_sutil');
    });

    test('200 — Retorna branding configurado para empresa inquilina', async () => {
      mockQuery.mockResolvedValueOnce({
        rowCount: 1,
        rows: [mockEmpresa],
      });

      const res = await request(app)
        .get('/api/empresas/mi-branding')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.paleta_colores).toBe('bosque_olivo');
      expect(res.body.data.marca_agua_activa).toBe(true);
      expect(res.body.data.portal_titulo).toBe('Bienvenido a Hacienda San José');
    });
  });

  describe('PUT /api/empresas/mi-branding', () => {
    test('403 — Rechaza si un cliente intenta actualizar la marca', async () => {
      const res = await request(app)
        .put('/api/empresas/mi-branding')
        .set('Authorization', `Bearer ${clienteToken}`)
        .send({ paleta_colores: 'champagne_gala' });

      expect(res.status).toBe(403);
    });

    test('400 — Rechaza paleta de colores no válida', async () => {
      const res = await request(app)
        .put('/api/empresas/mi-branding')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ paleta_colores: 'color_neon_invalido' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Paleta no válida/i);
    });

    test('200 — Actualiza paleta y textos del portal para el administrador', async () => {
      const updatedData = {
        ...mockEmpresa,
        paleta_colores: 'champagne_gala',
        marca_agua_activa: false,
        portal_titulo: 'Boutique San José Bodas',
      };

      mockQuery.mockResolvedValueOnce({
        rowCount: 1,
        rows: [updatedData],
      });

      const res = await request(app)
        .put('/api/empresas/mi-branding')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          paleta_colores: 'champagne_gala',
          marca_agua_activa: false,
          portal_titulo: 'Boutique San José Bodas',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.paleta_colores).toBe('champagne_gala');
      expect(res.body.data.portal_titulo).toBe('Boutique San José Bodas');
    });

    test('200 — Permite subir logotipo y actualiza logo_url con fallback data URI', async () => {
      const updatedWithLogo = {
        ...mockEmpresa,
        logo_url: 'data:image/png;base64,ZmFrZWxvZ28=',
      };

      mockQuery.mockResolvedValueOnce({
        rowCount: 1,
        rows: [updatedWithLogo],
      });

      const res = await request(app)
        .put('/api/empresas/mi-branding')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('logo', Buffer.from('fakelogo'), 'logo.png');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.logo_url).toMatch(/^data:image\/png;base64,/);
    });
  });

  describe('GET /api/auth/portal/:slug', () => {
    test('200 — Retorna los datos de marca blanca para el portal público', async () => {
      mockQuery.mockResolvedValueOnce({
        rowCount: 1,
        rows: [mockEmpresa],
      });

      const res = await request(app).get('/api/auth/portal/hacienda-san-jose');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.paleta_colores).toBe('bosque_olivo');
      expect(res.body.data.portal_titulo).toBe('Bienvenido a Hacienda San José');
    });
  });
});
