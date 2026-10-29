import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// En entornos reales (Render / producción), asegura que las tablas y columnas requeridas existan en Supabase
if (process.env.NODE_ENV !== 'test') {
  pool.query('ALTER TABLE empresas ADD COLUMN IF NOT EXISTS slug VARCHAR(100);').catch((err) => {
    console.warn('[db] Auto-verificación de columna slug en Supabase:', err.message);
  });
  pool.query('ALTER TABLE empresas ADD COLUMN IF NOT EXISTS mensajes_chatbot_mes INTEGER DEFAULT 0;').catch((err) => {
    console.warn('[db] Auto-verificación de columna mensajes_chatbot_mes en Supabase:', err.message);
  });
  pool.query('ALTER TABLE empresas ADD COLUMN IF NOT EXISTS logo_url TEXT;').catch(() => {});
  pool.query('ALTER TABLE empresas ALTER COLUMN logo_url TYPE TEXT;').catch(() => {});
  pool.query("ALTER TABLE empresas ADD COLUMN IF NOT EXISTS paleta_colores VARCHAR(50) DEFAULT 'sofisticacion_sutil';").catch(() => {});
  pool.query('ALTER TABLE empresas ADD COLUMN IF NOT EXISTS marca_agua_activa BOOLEAN DEFAULT true;').catch(() => {});
  pool.query('ALTER TABLE empresas ADD COLUMN IF NOT EXISTS portal_titulo VARCHAR(150);').catch(() => {});
  pool.query('ALTER TABLE empresas ADD COLUMN IF NOT EXISTS portal_descripcion TEXT;').catch(() => {});
  pool.query(`
    UPDATE empresas
    SET logo_url = '/logo_Helados_Catedral.jpg'
    WHERE (nombre_comercial ILIKE '%Catedral%' OR slug ILIKE '%catedral%' OR portal_titulo ILIKE '%Catedral%' OR id = 1)
      AND (logo_url IS NULL OR logo_url = '');
  `).catch(() => {});
  pool.query(`
    CREATE TABLE IF NOT EXISTS solicitudes_modificacion (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
      evento_id UUID NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
      cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
      descripcion_cambio TEXT NOT NULL,
      estado VARCHAR(50) DEFAULT 'Pendiente',
      fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `).catch((err) => {
    console.warn('[db] Auto-verificación de tabla solicitudes_modificacion en Supabase:', err.message);
  });
}

export default pool;
