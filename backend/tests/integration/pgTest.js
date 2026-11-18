/**
 * pgTest.js — Postgres REAL y descartable para los tests de integración.
 *
 * Levanta un Postgres embebido (paquete embedded-postgres, sin Docker ni instalación) en un
 * directorio temporal, aplica init.sql y database/migrations igual que scripts/migrate.js, y
 * expone un Pool de `pg`. Al terminar, detiene el servidor y borra los datos.
 *
 * Nunca toca la base de Supabase: usa su propio puerto, usuario y directorio.
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import net from 'net';
import pg from 'pg';
import EmbeddedPostgres from 'embedded-postgres';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.join(__dirname, '..', '..');

/** Busca un puerto libre (evita choques con otro Postgres o con una ejecución previa interrumpida). */
const puertoLibre = () => new Promise((resolve, reject) => {
  const srv = net.createServer();
  srv.once('error', reject);
  srv.listen(0, '127.0.0.1', () => {
    const { port } = srv.address();
    srv.close(() => resolve(port));
  });
});

export const iniciarBdPrueba = async ({ puerto, sinEsquema = false } = {}) => {
  puerto = puerto || await puertoLibre();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'eventra-pg-'));
  const servidor = new EmbeddedPostgres({
    databaseDir: dir,
    user: 'eventra_test',
    password: 'eventra_test',
    port: puerto,
    persistent: false,
    onLog: () => {},
    onError: () => {},
    initdbFlags: ['--encoding=UTF8', '--locale-provider=icu', '--icu-locale=en-US', '--locale=C'],
  });

  await servidor.initialise();
  await servidor.start();
  await servidor.createDatabase('eventra_test');

  const pool = new pg.Pool({
    host: 'localhost',
    port: puerto,
    user: 'eventra_test',
    password: 'eventra_test',
    database: 'eventra_test',
    max: 5,
  });

  // Esquema base + migraciones (mismo orden que scripts/migrate.js)
  let migraciones = [];
  if (!sinEsquema) {
    await pool.query(fs.readFileSync(path.join(RAIZ, 'database', 'init.sql'), 'utf8'));
    migraciones = fs.readdirSync(path.join(RAIZ, 'database', 'migrations')).filter((f) => /^\d{3}_.+\.sql$/.test(f)).sort();
    for (const archivo of migraciones) {
      await pool.query(fs.readFileSync(path.join(RAIZ, 'database', 'migrations', archivo), 'utf8'));
    }

  }

  const detener = async () => {
    await pool.end().catch(() => {});
    await servidor.stop().catch(() => {});
    fs.rmSync(dir, { recursive: true, force: true });
  };

  return { pool, detener, migraciones, puerto };
};
