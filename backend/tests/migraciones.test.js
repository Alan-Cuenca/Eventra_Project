/**
 * migraciones.test.js
 * Reglas de calidad de database/migrations (el runner no se ejecuta aquí: requiere una BD real).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'database', 'migrations');
const archivos = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();

describe('Migraciones versionadas', () => {
  it('existen migraciones y siguen el formato NNN_descripcion.sql', () => {
    expect(archivos.length).toBeGreaterThan(0);
    archivos.forEach((f) => expect(f).toMatch(/^\d{3}_[a-z0-9_]+\.sql$/));
  });

  it('la numeración es consecutiva, sin huecos ni duplicados', () => {
    const numeros = archivos.map((f) => Number(f.slice(0, 3)));
    numeros.forEach((n, i) => expect(n).toBe(i + 1));
  });

  it('cada migración es idempotente (IF [NOT] EXISTS o UPDATE acotado) y no es destructiva', () => {
    archivos.forEach((f) => {
      const sql = fs.readFileSync(path.join(dir, f), 'utf8');
      const idempotente = /IF NOT EXISTS|IF EXISTS|^\s*UPDATE\b[\s\S]*\bWHERE\b/im.test(sql);
      expect(idempotente).toBe(true);
      expect(sql).not.toMatch(/\bDROP\s+TABLE\b|\bTRUNCATE\b|\bDELETE\s+FROM\b/i);
    });
  });

  it('el runner y los scripts npm existen', () => {
    const base = path.join(dir, '..', '..');
    expect(fs.existsSync(path.join(base, 'scripts', 'migrate.js'))).toBe(true);
    const pkg = JSON.parse(fs.readFileSync(path.join(base, 'package.json'), 'utf8'));
    expect(pkg.scripts.migrate).toBe('node scripts/migrate.js');
    expect(pkg.scripts['start:prod']).toMatch(/migrate\.js && node src\/app\.js/);
  });
});
