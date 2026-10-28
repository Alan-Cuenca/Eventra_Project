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

// En entornos reales (Render / producción), asegura que las columnas requeridas existan en Supabase
if (process.env.NODE_ENV !== 'test') {
  pool.query('ALTER TABLE empresas ADD COLUMN IF NOT EXISTS slug VARCHAR(100);').catch((err) => {
    console.warn('[db] Auto-verificación de columna slug en Supabase:', err.message);
  });
  pool.query('ALTER TABLE empresas ADD COLUMN IF NOT EXISTS mensajes_chatbot_mes INTEGER DEFAULT 0;').catch((err) => {
    console.warn('[db] Auto-verificación de columna mensajes_chatbot_mes en Supabase:', err.message);
  });
}

export default pool;
