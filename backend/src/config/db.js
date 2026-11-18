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
  max: 5,
  idleTimeoutMillis: 5000,
  connectionTimeoutMillis: 10000,
  // Supabase exige SSL. La verificación estricta del certificado se activa con
  // DB_SSL_REJECT_UNAUTHORIZED=true (requiere el CA de Supabase en NODE_EXTRA_CA_CERTS).
  ssl: {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true'
  }
});

// Un cliente inactivo que se cierra (reinicio del pooler de Supabase) no debe tumbar el servidor:
// pg descarta ese cliente y la siguiente consulta abre una conexión nueva.
pool.on('error', (err) => {
  console.error('[db] Error en un cliente inactivo del pool (se descarta y continúa):', err.message);
});

// El esquema se gestiona con migraciones versionadas: ver scripts/migrate.js y database/migrations/.

export default pool;
