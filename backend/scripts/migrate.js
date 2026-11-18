/**
 * migrate.js — Runner de migraciones versionadas para PostgreSQL (Supabase).
 *
 * Uso:  npm run migrate
 *
 * - Aplica en orden los archivos database/migrations/NNN_*.sql que aún no figuren
 *   en la tabla schema_migrations. Cada uno dentro de una transacción.
 * - Si la BD está vacía (no existe la tabla empresas) aplica antes database/init.sql.
 * - Usa un advisory lock para que dos instancias no migren a la vez.
 * - Si una migración falla: ROLLBACK, mensaje claro y exit code 1 (el deploy se detiene).
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import pool from '../src/config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, '..', 'database', 'migrations');
const INIT_SQL = path.join(__dirname, '..', 'database', 'init.sql');
const LOCK_ID = 727274; // clave arbitraria del advisory lock

const checksum = (sql) => crypto.createHash('sha256').update(sql).digest('hex');

const listarMigraciones = () =>
  fs.readdirSync(MIGRATIONS_DIR)
    .filter((f) => /^\d{3}_.+\.sql$/.test(f))
    .sort();

const aplicar = async (client, nombre, sql) => {
  await client.query('BEGIN');
  try {
    await client.query(sql);
    await client.query(
      'INSERT INTO schema_migrations (nombre, checksum) VALUES ($1, $2)',
      [nombre, checksum(sql)]
    );
    await client.query('COMMIT');
    console.log(`[migrate] aplicada: ${nombre}`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw new Error(`Falló la migración ${nombre}: ${error.message}`);
  }
};

const main = async () => {
  const client = await pool.connect();
  try {
    await client.query('SELECT pg_advisory_lock($1)', [LOCK_ID]);

    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        nombre      VARCHAR(255) PRIMARY KEY,
        checksum    CHAR(64)     NOT NULL,
        aplicada_en TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const aplicadas = new Map(
      (await client.query('SELECT nombre, checksum FROM schema_migrations')).rows
        .map((r) => [r.nombre, r.checksum])
    );

    // BD vacía: esquema base primero
    const hayEmpresas = (await client.query("SELECT to_regclass('public.empresas') AS t")).rows[0].t;
    if (!hayEmpresas && !aplicadas.has('000_init.sql')) {
      console.log('[migrate] BD vacía: aplicando database/init.sql como línea base...');
      await aplicar(client, '000_init.sql', fs.readFileSync(INIT_SQL, 'utf8'));
      aplicadas.set('000_init.sql', 'aplicada');
    }

    let pendientes = 0;
    for (const archivo of listarMigraciones()) {
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, archivo), 'utf8');
      if (aplicadas.has(archivo)) {
        if (aplicadas.get(archivo) !== checksum(sql)) {
          console.warn(`[migrate] AVISO: ${archivo} fue modificada después de aplicarse. Crea una migración nueva en su lugar.`);
        }
        continue;
      }
      await aplicar(client, archivo, sql);
      pendientes += 1;
    }

    console.log(pendientes === 0
      ? '[migrate] La base de datos ya está al día.'
      : `[migrate] Listo: ${pendientes} migración(es) aplicada(s).`);
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [LOCK_ID]).catch(() => {});
    client.release();
    await pool.end();
  }
};

main().catch((error) => {
  console.error(`[migrate] ERROR: ${error.message}`);
  process.exit(1);
});
