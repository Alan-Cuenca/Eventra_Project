import dotenv from 'dotenv';
dotenv.config();
import pool from '../src/config/db.js';
import { DEFAULT_CONFIG } from '../src/controllers/configuracionController.js';

async function run() {
  // Configuración por defecto única (la misma que usa el backend); no pisa una existente
  const config = DEFAULT_CONFIG;

  await pool.query(
    `INSERT INTO configuracion_saas (clave, valor, updated_at)
     VALUES ('global', $1::jsonb, CURRENT_TIMESTAMP)
     ON CONFLICT (clave) DO NOTHING`,
    [JSON.stringify(config)]
  );

  const res = await pool.query("SELECT clave, valor, updated_at FROM configuracion_saas WHERE clave = 'global'");
  console.log('CONFIG IN POSTGRESQL SUPABASE:');
  console.log(JSON.stringify(res.rows[0].valor.planes, null, 2));

  await pool.end();
}

run().catch((err) => {
  console.error('Error seeding config:', err);
  process.exit(1);
});
