/**
 * predeployCheck.js — Verificación de solo lectura antes del primer deploy con migraciones.
 *
 * Uso:  npm run check:predeploy   (desde backend/, con la conexión a la BD de producción)
 *
 * No modifica nada. Revisa:
 *  1. Migraciones pendientes (tabla schema_migrations).
 *  2. Reservas activas duplicadas (mismo salón sin distinguir mayúsculas/espacios,
 *     fecha y hora) que harían fallar la migración 005 y detendrían el deploy.
 *  3. Variables de entorno necesarias en producción.
 *
 * Termina con código 1 si encuentra algo que bloquearía el deploy.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();
import pool from '../src/config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, '..', 'database', 'migrations');

const VARIABLES = [
  ['JWT_SECRET', true],
  ['SUPABASE_URL', true],
  ['SUPABASE_SERVICE_ROLE_KEY', true],
  ['FRONTEND_URL', true],
  ['CORS_ORIGINS', true], // vacío = CORS abierto
  ['GEMINI_API_KEY', false],
  ['BREVO_API_KEY', false],
  ['SMTP_USER', false],
];

let bloqueos = 0;
const ok = (m) => console.log(`  OK    ${m}`);
const aviso = (m) => console.log(`  AVISO ${m}`);
const error = (m) => { bloqueos += 1; console.log(`  ERROR ${m}`); };

const revisarMigraciones = async () => {
  console.log('\n1. Migraciones');
  const existe = (await pool.query("SELECT to_regclass('public.schema_migrations') AS t")).rows[0].t;
  const aplicadas = existe
    ? new Set((await pool.query('SELECT nombre FROM schema_migrations')).rows.map((r) => r.nombre))
    : new Set();
  const pendientes = fs.readdirSync(MIGRATIONS_DIR).filter((f) => /^\d{3}_.+\.sql$/.test(f) && !aplicadas.has(f)).sort();
  if (pendientes.length === 0) ok('No hay migraciones pendientes.');
  else aviso(`Pendientes (se aplicarán en el deploy): ${pendientes.join(', ')}`);
  return pendientes;
};

const revisarDuplicadosReservas = async (pendientes) => {
  console.log('\n2. Reservas duplicadas (migración 005)');
  if (!pendientes.includes('005_reservas_indice_parcial.sql')) {
    ok('La 005 ya está aplicada; no hace falta revisar.');
    return;
  }
  const { rows } = await pool.query(`
    SELECT empresa_id, LOWER(TRIM(salon_o_lugar)) AS salon, fecha_evento, hora_inicio,
           COUNT(*) AS cantidad, ARRAY_AGG(id::text) AS ids
      FROM reservas
     WHERE estado <> 'Cancelada'
     GROUP BY 1, 2, 3, 4
    HAVING COUNT(*) > 1`);
  if (rows.length === 0) {
    ok('Sin duplicados: la migración 005 puede aplicarse.');
    return;
  }
  error(`${rows.length} grupo(s) de reservas activas duplicadas. Cancela o corrige una de cada grupo antes del deploy:`);
  for (const r of rows) {
    console.log(`        empresa ${r.empresa_id} · "${r.salon}" · ${r.fecha_evento?.toISOString?.().slice(0, 10) || r.fecha_evento} ${r.hora_inicio} · ids: ${r.ids.join(', ')}`);
  }
};

const revisarVariables = () => {
  console.log('\n3. Variables de entorno');
  for (const [nombre, obligatoria] of VARIABLES) {
    if (process.env[nombre]) ok(nombre);
    else if (obligatoria) error(`${nombre} no está definida.`);
    else aviso(`${nombre} no está definida (opcional).`);
  }
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    aviso('JWT_SECRET tiene menos de 32 caracteres.');
  }
};

const main = async () => {
  console.log('EVENTRA — verificación previa al deploy (solo lectura)');
  const pendientes = await revisarMigraciones();
  await revisarDuplicadosReservas(pendientes);
  revisarVariables();
  console.log(bloqueos === 0 ? '\nResultado: listo para desplegar.' : `\nResultado: ${bloqueos} problema(s) bloqueante(s).`);
  process.exitCode = bloqueos === 0 ? 0 : 1;
};

main()
  .catch((err) => {
    console.error('\n[predeploy] No se pudo completar la verificación:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
