/**
 * reportes.test.js
 * ====================================================================
 * Pruebas Unitarias y de Integración: Módulo de Reportes Corporativos
 * ====================================================================
 */

import request from 'supertest';
import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';

process.env.JWT_SECRET = 'test_secret_eventra_reportes';
process.env.NODE_ENV   = 'test';
process.env.PORT       = '0';

const TEST_SECRET = 'test_secret_eventra_reportes';

// Mock de la base de datos PostgreSQL
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

// Tokens para pruebas
const TOKEN_ADMIN = jwt.sign(
  { id: 'usr-admin-1', empresa_id: 1, rol_id: 1, rol: 'Administrador', email: 'admin@catedral.com', nombre_completo: 'Alan Puruncajas' },
  TEST_SECRET,
  { expiresIn: '1h' }
);

const TOKEN_GERENTE = jwt.sign(
  { id: 'usr-gerente-1', empresa_id: 1, rol_id: 2, rol: 'Gerente', email: 'gerente@catedral.com', nombre_completo: 'Jorge Sailema' },
  TEST_SECRET,
  { expiresIn: '1h' }
);

const TOKEN_SUPER_ADMIN = jwt.sign(
  { id: 'usr-super-1', empresa_id: null, rol_id: 5, rol: 'Super_Admin', email: 'super@eventra.com' },
  TEST_SECRET,
  { expiresIn: '1h' }
);

const TOKEN_CLIENTE = jwt.sign(
  { id: 'usr-cliente-1', empresa_id: 1, rol_id: 4, rol: 'Cliente', email: 'cliente@catedral.com' },
  TEST_SECRET,
  { expiresIn: '1h' }
);

describe('Módulo de Dashboards Analíticos y Reportes Corporativos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/reportes/resumen', () => {
    it('rechaza solicitudes sin token con 401', async () => {
      const res = await request(app).get('/api/reportes/resumen');
      expect(res.status).toBe(401);
    });

    it('rechaza a Super_Admin (5) por privacidad multi-tenant con 403', async () => {
      const res = await request(app)
        .get('/api/reportes/resumen')
        .set('Authorization', `Bearer ${TOKEN_SUPER_ADMIN}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('rechaza a roles no autorizados (Cliente) con 403', async () => {
      const res = await request(app)
        .get('/api/reportes/resumen')
        .set('Authorization', `Bearer ${TOKEN_CLIENTE}`);

      expect(res.status).toBe(403);
    });

    it('retorna reporte consolidado para Administrador con membrete y datos reales', async () => {
      // 1. Empresa
      pool.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{
          id: 1,
          nombre_comercial: 'Helados La Catedral Eventos',
          ruc: '1890123456001',
          slug: 'helados-catedral',
          plan_suscripcion: 'Premium',
          logo_url: '/logo_Helados_Catedral.jpg',
        }],
      });

      // 2. Ingresos Tendencia
      pool.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{
          periodo: '2026-10',
          mes_etiqueta: 'Oct 2026',
          total_ingresos: '4500.00',
          deuna: '2000.00',
          transferencia: '1500.00',
          efectivo: '1000.00',
          total_transacciones: 3,
        }],
      });

      // 3. Ingresos Metodo
      pool.query.mockResolvedValueOnce({
        rowCount: 3,
        rows: [
          { metodo_pago: 'Deuna', total: '2000.00', transacciones: 1 },
          { metodo_pago: 'Transferencia', total: '1500.00', transacciones: 1 },
          { metodo_pago: 'Efectivo', total: '1000.00', transacciones: 1 },
        ],
      });

      // 4. Transacciones
      pool.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{
          id: 'p-1',
          monto: '1500.00',
          concepto: 'Abono',
          metodo_pago: 'Deuna',
          fecha: '2026-10-20',
          estado: 'Aprobado',
          evento_titulo: 'Boda Valentina',
          cliente_nombre: 'Valentina Pérez',
        }],
      });

      // 5. Eventos por Estado
      pool.query.mockResolvedValueOnce({
        rowCount: 2,
        rows: [
          { estado_progreso: 'En Planificación', total: 4 },
          { estado_progreso: 'En Progreso', total: 2 },
        ],
      });

      // 6. Listado Eventos
      pool.query.mockResolvedValueOnce({
        rowCount: 2,
        rows: [
          { id: 'e-1', titulo: 'Boda Valentina', estado_progreso: 'En Planificación', fecha_evento: '2026-11-15', cliente_nombre: 'Valentina Pérez', costo_total: '5000.00' },
          { id: 'e-2', titulo: 'Aniversario Catedral', estado_progreso: 'En Progreso', fecha_evento: '2026-12-01', cliente_nombre: 'Juan Vayas', costo_total: '3500.00' },
        ],
      });

      // 7. Saldos Pendientes
      pool.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{
          evento_id: 'e-1',
          evento_titulo: 'Boda Valentina',
          estado_progreso: 'En Planificación',
          fecha_evento: '2026-11-15',
          cliente_nombre: 'Valentina Pérez',
          costo_total: '5000.00',
          total_abonado: '1500.00',
          saldo_pendiente: '3500.00',
          estado_pago: 'Abonado Parcial',
        }],
      });

      const res = await request(app)
        .get('/api/reportes/resumen')
        .set('Authorization', `Bearer ${TOKEN_ADMIN}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.membrete.nombre_comercial).toBe('Helados La Catedral Eventos');
      expect(res.body.membrete.ruc).toBe('1890123456001');
      expect(res.body.kpis.total_recaudado).toBe(1500);
      expect(res.body.kpis.total_saldos_pendientes).toBe(3500);
      expect(res.body.reporte_ingresos.tendencia_mensual).toHaveLength(1);
      expect(res.body.reporte_eventos.listado).toHaveLength(2);
      expect(res.body.reporte_saldos.listado).toHaveLength(1);
    });
  });
});
