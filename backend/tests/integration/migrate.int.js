/**
 * migrate.int.js — El runner scripts/migrate.js contra un Postgres real y vacío.
 */
import path from 'path';
import { execFile } from 'child_process';
import { fileURLToPath } from 'url';
import { jest } from '@jest/globals';
import { iniciarBdPrueba } from './pgTest.js';

jest.setTimeout(180_000);

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

// BD vacía (sin init.sql ni migraciones): el runner debe levantarla desde cero
const bd = await iniciarBdPrueba({ sinEsquema: true });
afterAll(async () => { await bd.detener(); });

const correrRunner = () => new Promise((resolve) => {
  execFile(process.execPath, ['scripts/migrate.js'], {
    cwd: RAIZ,
    env: {
      ...process.env,
      DB_HOST: 'localhost', DB_PORT: String(bd.puerto), DB_USER: 'eventra_test', DB_PASSWORD: 'eventra_test',
      DB_NAME: 'eventra_test', DB_SSL: 'false', NODE_ENV: 'production',
    },
  }, (error, stdout, stderr) => resolve({ codigo: error ? error.code : 0, stdout, stderr }));
});

describe('scripts/migrate.js', () => {
  it('en una BD vacía aplica init.sql como línea base y todas las migraciones', async () => {
    const r = await correrRunner();
    expect(r.codigo).toBe(0);
    expect(r.stdout).toMatch(/BD vacía/);
    expect(r.stdout).toMatch(/Listo: \d+ migración/);

    const filas = await bd.pool.query('SELECT nombre FROM schema_migrations ORDER BY nombre');
    const nombres = filas.rows.map((x) => x.nombre);
    expect(nombres[0]).toBe('000_init.sql');
    expect(nombres.length).toBeGreaterThanOrEqual(12);
  });

  it('una segunda ejecución no repite nada (idempotente)', async () => {
    const antes = (await bd.pool.query('SELECT count(*)::int AS n FROM schema_migrations')).rows[0].n;
    const r = await correrRunner();
    expect(r.codigo).toBe(0);
    expect(r.stdout).toMatch(/ya está al día/);
    const despues = (await bd.pool.query('SELECT count(*)::int AS n FROM schema_migrations')).rows[0].n;
    expect(despues).toBe(antes);
  });

  it('si una migración falla, hace ROLLBACK y termina con código 1', async () => {
    const fs = await import('fs');
    const archivo = path.join(RAIZ, 'database', 'migrations', '999_rota_para_test.sql');
    fs.writeFileSync(archivo, 'CREATE TABLE tabla_a_medias (id int);\nSELECT * FROM tabla_que_no_existe;\n');
    try {
      const r = await correrRunner();
      expect(r.codigo).toBe(1);
      expect(r.stderr).toMatch(/Falló la migración 999_rota_para_test.sql/);
      // Todo o nada: la primera sentencia no quedó aplicada
      const t = await bd.pool.query("SELECT to_regclass('tabla_a_medias') AS t");
      expect(t.rows[0].t).toBeNull();
      const reg = await bd.pool.query("SELECT 1 FROM schema_migrations WHERE nombre = '999_rota_para_test.sql'");
      expect(reg.rowCount).toBe(0);
    } finally {
      fs.rmSync(archivo, { force: true });
    }
  });
});
