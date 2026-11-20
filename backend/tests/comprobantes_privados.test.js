/**
 * comprobantes_privados.test.js — Comprobantes en bucket privado y URLs firmadas
 * =============================================================================
 * - En la BD se guarda la ruta del objeto, nunca una URL pública.
 * - Al listar, el backend firma las rutas (y las URLs públicas antiguas) con
 *   una URL temporal; si no puede firmar, devuelve null.
 * - Los logos van a un bucket público aparte.
 * =============================================================================
 */
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';

process.env.JWT_SECRET = 'test_secret_comprobantes_privados';
process.env.NODE_ENV = 'test';
process.env.PORT = '0';

let mockQueryHandler = null;
const mockPool = {
  query: jest.fn(async (sql, params) => (mockQueryHandler ? mockQueryHandler(sql, params) : { rows: [], rowCount: 0 })),
  connect: jest.fn(),
};
jest.unstable_mockModule('../src/config/db.js', () => ({ default: mockPool }));

const mockCreateSignedUrls = jest.fn();
const mockUpload = jest.fn();
const mockFrom = jest.fn(() => ({
  upload: mockUpload,
  createSignedUrls: mockCreateSignedUrls,
  getPublicUrl: (ruta) => ({ data: { publicUrl: `https://x.supabase.co/storage/v1/object/public/logos/${ruta}` } }),
}));
jest.unstable_mockModule('../src/config/supabase.js', () => ({ supabase: { storage: { from: mockFrom } } }));
jest.unstable_mockModule('openai', () => ({ default: class { chat = { completions: { create: jest.fn() } }; } }));

const { default: app } = await import('../src/app.js');
const { extraerRutaComprobante, firmarComprobantes, subirComprobante, subirLogoPublico, StorageNoDisponibleError } =
  await import('../src/services/storageService.js');

const tk = (rol_id, empresa_id = 1) => jwt.sign({ id: `u${rol_id}`, rol_id, empresa_id, email: `r${rol_id}@e.com` },
  process.env.JWT_SECRET, { expiresIn: '1h' });
const EVENTO = '3f2b8c1e-9a4d-4e6f-8b2a-1c3d5e7f9a0b';

const firmarOk = async (paths) => ({
  data: paths.map((path) => ({ path, signedUrl: `https://x.supabase.co/storage/v1/object/sign/comprobantes/${path}?token=t`, error: null })),
  error: null,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockQueryHandler = null;
  mockCreateSignedUrls.mockImplementation(firmarOk);
  mockUpload.mockResolvedValue({ data: {}, error: null });
});

describe('storageService — rutas y firma', () => {
  it('extrae la ruta de URLs públicas o firmadas antiguas y acepta rutas nuevas', () => {
    expect(extraerRutaComprobante('https://x.supabase.co/storage/v1/object/public/comprobantes/12/a%20b.pdf')).toBe('12/a b.pdf');
    expect(extraerRutaComprobante('https://x.supabase.co/storage/v1/object/sign/comprobantes/12/c.pdf?token=1')).toBe('12/c.pdf');
    expect(extraerRutaComprobante('suscripciones/3/x.pdf')).toBe('suscripciones/3/x.pdf');
  });

  it('ignora Data URLs, URLs externas, rutas locales y vacíos', () => {
    expect(extraerRutaComprobante('data:application/pdf;base64,AAA')).toBeNull();
    expect(extraerRutaComprobante('https://otro.com/recibo.png')).toBeNull();
    expect(extraerRutaComprobante('/logo.png')).toBeNull();
    expect(extraerRutaComprobante(null)).toBeNull();
  });

  it('firma rutas y URLs públicas en una sola llamada, sin tocar Data URLs', async () => {
    const filas = await firmarComprobantes([
      { comprobante_url: '1/a.png' },
      { comprobante_url: 'https://x.supabase.co/storage/v1/object/public/comprobantes/1/b.png' },
      { comprobante_url: '1/a.png' },
      { comprobante_url: 'data:image/png;base64,AAA' },
      { comprobante_url: null },
    ]);
    expect(mockCreateSignedUrls).toHaveBeenCalledTimes(1);
    expect(mockCreateSignedUrls).toHaveBeenCalledWith(['1/a.png', '1/b.png'], expect.any(Number));
    expect(filas[0].comprobante_url).toContain('/object/sign/comprobantes/1/a.png');
    expect(filas[1].comprobante_url).toContain('/object/sign/comprobantes/1/b.png');
    expect(filas[3].comprobante_url).toBe('data:image/png;base64,AAA');
    expect(filas[4].comprobante_url).toBeNull();
  });

  it('si Supabase no puede firmar, el campo queda en null (nunca la URL pública)', async () => {
    mockCreateSignedUrls.mockResolvedValueOnce({ data: null, error: { message: 'bucket no existe' } });
    const [fila] = await firmarComprobantes([
      { comprobante_url: 'https://x.supabase.co/storage/v1/object/public/comprobantes/1/b.png' },
    ]);
    expect(fila.comprobante_url).toBeNull();
  });

  it('subirComprobante guarda en el bucket privado y devuelve la ruta, sin upsert', async () => {
    const ruta = await subirComprobante('7', { buffer: Buffer.from('x'), mimetype: 'image/png', originalname: 'recibo.PNG' });
    expect(ruta).toMatch(/^7\/\d+_[a-z0-9]+\.png$/);
    expect(mockFrom).toHaveBeenCalledWith('comprobantes');
    expect(mockUpload.mock.calls[0][2]).toEqual({ contentType: 'image/png', upsert: false });
  });

  it('subirComprobante limpia extensiones raras y lanza 502 si la subida falla', async () => {
    const ruta = await subirComprobante('7', { buffer: Buffer.from('x'), mimetype: 'application/pdf', originalname: 'a.p/../df<script>' });
    expect(ruta).toMatch(/^7\/\d+_[a-z0-9]+\.[a-z0-9]{1,5}$/);

    mockUpload.mockResolvedValueOnce({ data: null, error: { message: 'boom' } });
    const err = await subirComprobante('7', { buffer: Buffer.from('x'), mimetype: 'image/png' }).catch((e) => e);
    expect(err).toBeInstanceOf(StorageNoDisponibleError);
    expect(err.httpStatus).toBe(502);
  });

  it('subirLogoPublico usa el bucket público "logos" y devuelve null si falla', async () => {
    const url = await subirLogoPublico(4, { buffer: Buffer.from('x'), mimetype: 'image/png', originalname: 'logo.png' });
    expect(mockFrom).toHaveBeenCalledWith('logos');
    expect(url).toMatch(/\/object\/public\/logos\/4\/logo_\d+_[a-z0-9]+\.png$/);

    mockUpload.mockResolvedValueOnce({ data: null, error: { message: 'boom' } });
    expect(await subirLogoPublico(4, { buffer: Buffer.from('x'), mimetype: 'image/png' })).toBeNull();
  });
});

describe('Endpoints que devuelven comprobantes firmados', () => {
  it('GET /api/pagos firma los comprobantes del listado', async () => {
    mockQueryHandler = async () => ({
      rows: [{ id: 'p1', comprobante_url: '1/123_abc.png' }, { id: 'p2', comprobante_url: null }],
      rowCount: 2,
    });
    const res = await request(app).get('/api/pagos').set('Authorization', `Bearer ${tk(1)}`);
    expect(res.status).toBe(200);
    expect(res.body.data[0].comprobante_url).toContain('/object/sign/comprobantes/1/123_abc.png');
    expect(res.body.data[1].comprobante_url).toBeNull();
  });

  it('GET /api/pagos/evento/:id firma los comprobantes del evento', async () => {
    mockQueryHandler = async (sql) => (/SUM\(monto\)/.test(sql)
      ? { rows: [{ total_pagado: 0, cantidad_pagos: 0 }], rowCount: 1 }
      : { rows: [{ id: 'p1', comprobante_url: 'https://x.supabase.co/storage/v1/object/public/comprobantes/1/viejo.pdf' }], rowCount: 1 });
    const res = await request(app).get(`/api/pagos/evento/${EVENTO}`).set('Authorization', `Bearer ${tk(1)}`);
    expect(res.status).toBe(200);
    expect(res.body.data[0].comprobante_url).toContain('/object/sign/comprobantes/1/viejo.pdf');
  });

  it('GET /api/suscripciones/solicitudes-publicas firma el PDF para el Super Admin', async () => {
    mockQueryHandler = async () => ({ rows: [{ id: 's1', comprobante_url: 'solicitudes-planes/1_x.pdf' }], rowCount: 1 });
    const res = await request(app).get('/api/suscripciones/solicitudes-publicas').set('Authorization', `Bearer ${tk(5, null)}`);
    expect(res.status).toBe(200);
    expect(res.body.data[0].comprobante_url).toContain('/object/sign/comprobantes/solicitudes-planes/1_x.pdf');
  });

  it('GET /api/suscripciones firma los comprobantes de suscripción del Administrador', async () => {
    mockQueryHandler = async () => ({ rows: [{ id: 'sp1', comprobante_url: 'suscripciones/1/9_z.pdf' }], rowCount: 1 });
    const res = await request(app).get('/api/suscripciones').set('Authorization', `Bearer ${tk(1)}`);
    expect(res.status).toBe(200);
    expect(res.body.data[0].comprobante_url).toContain('/object/sign/comprobantes/suscripciones/1/9_z.pdf');
  });

  it('POST /api/suscripciones/pagar guarda la ruta privada del PDF', async () => {
    mockQueryHandler = async (sql, params) => {
      if (/FROM empresas/.test(sql)) return { rows: [{ id: 1, nombre_comercial: 'E', plan_suscripcion: 'Basico' }], rowCount: 1 };
      if (/INSERT INTO suscripciones_pagos/.test(sql)) return { rows: [{ id: 'sp1', comprobante_url: params[3] }], rowCount: 1 };
      return { rows: [], rowCount: 0 };
    };
    const res = await request(app)
      .post('/api/suscripciones/pagar')
      .set('Authorization', `Bearer ${tk(1)}`)
      .field('plan_nombre', 'Premium')
      .attach('comprobante', Buffer.from('%PDF-1.4'), { filename: 'pago.pdf', contentType: 'application/pdf' });
    expect(res.status).toBe(201);
    const insert = mockPool.query.mock.calls.find(([sql]) => /INSERT INTO suscripciones_pagos/.test(sql))[1];
    expect(insert[3]).toMatch(/^suscripciones\/1\/\d+_[a-z0-9]+\.pdf$/);
    expect(res.body.data.comprobante_url).toContain('/object/sign/comprobantes/suscripciones/1/');
  });
});
