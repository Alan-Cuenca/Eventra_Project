import pool from './db.js';

/**
 * =============================================================================
 * Migraciones idempotentes ejecutadas al iniciar el servidor
 * =============================================================================
 * Garantiza que las columnas requeridas por nuevas funcionalidades existan en
 * instancias de base de datos ya desplegadas (Supabase) sin tener que volver a
 * ejecutar init.sql manualmente. Todas las sentencias usan IF NOT EXISTS.
 * =============================================================================
 */
const MIGRACIONES = [
  `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS debe_cambiar_password BOOLEAN DEFAULT false`,
];

export const ejecutarMigraciones = async () => {
  for (const sql of MIGRACIONES) {
    try {
      await pool.query(sql);
    } catch (error) {
      console.error('[schemaMigrations] No se pudo aplicar la migración:', sql, '-', error.message);
    }
  }
};

export default ejecutarMigraciones;
