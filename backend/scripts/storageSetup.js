/**
 * storageSetup.js — Preparación única de Supabase Storage (ejecutar a mano una vez).
 *
 * Uso:
 *   node scripts/storageSetup.js            -> muestra lo que haría (simulación)
 *   node scripts/storageSetup.js --aplicar  -> aplica los cambios
 *
 * Requiere SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY, y la conexión a la BD.
 *
 * Pasos:
 *  1. Crea el bucket PÚBLICO de logos (SUPABASE_BUCKET_LOGOS, por defecto "logos") si no existe.
 *  2. Copia al bucket de logos los logotipos de empresas que hoy apuntan al bucket
 *     de comprobantes y actualiza empresas.logo_url.
 *  3. Marca el bucket de comprobantes como PRIVADO. Desde ese momento solo se
 *     accede a los comprobantes con URLs firmadas generadas por el backend.
 *
 * Es idempotente: se puede volver a ejecutar sin efectos duplicados.
 */
import dotenv from 'dotenv';
dotenv.config();
import pool from '../src/config/db.js';
import { supabase } from '../src/config/supabase.js';
import { BUCKET_COMPROBANTES, BUCKET_LOGOS, extraerRutaComprobante } from '../src/services/storageService.js';

const APLICAR = process.argv.includes('--aplicar');
const log = (msg) => console.log(`[storage-setup]${APLICAR ? '' : ' (simulación)'} ${msg}`);

const asegurarBucketLogos = async () => {
  const { data } = await supabase.storage.getBucket(BUCKET_LOGOS);
  if (data) {
    if (!data.public) {
      log(`El bucket "${BUCKET_LOGOS}" existe pero es privado: se marcará como público.`);
      if (APLICAR) {
        const { error } = await supabase.storage.updateBucket(BUCKET_LOGOS, { public: true });
        if (error) throw new Error(`No se pudo hacer público "${BUCKET_LOGOS}": ${error.message}`);
      }
    } else {
      log(`El bucket "${BUCKET_LOGOS}" ya existe y es público.`);
    }
    return;
  }
  log(`Se creará el bucket público "${BUCKET_LOGOS}".`);
  if (APLICAR) {
    const { error } = await supabase.storage.createBucket(BUCKET_LOGOS, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/gif'],
    });
    if (error) throw new Error(`No se pudo crear "${BUCKET_LOGOS}": ${error.message}`);
  }
};

const moverLogos = async () => {
  const { rows } = await pool.query(
    `SELECT id, logo_url FROM empresas WHERE logo_url LIKE $1`,
    [`%/storage/v1/object/public/${BUCKET_COMPROBANTES}/%`]
  );
  log(`${rows.length} logotipo(s) en el bucket de comprobantes.`);

  for (const { id, logo_url: url } of rows) {
    const origen = extraerRutaComprobante(url);
    const destino = origen.replace(/^logos\//, '');
    log(`empresa ${id}: ${BUCKET_COMPROBANTES}/${origen} -> ${BUCKET_LOGOS}/${destino}`);
    if (!APLICAR) continue;

    const { data: blob, error: errDescarga } = await supabase.storage.from(BUCKET_COMPROBANTES).download(origen);
    if (errDescarga) {
      console.warn(`[storage-setup] empresa ${id}: no se pudo descargar (${errDescarga.message}); se omite.`);
      continue;
    }
    const buffer = Buffer.from(await blob.arrayBuffer());
    const { error: errSubida } = await supabase.storage
      .from(BUCKET_LOGOS)
      .upload(destino, buffer, { contentType: blob.type || 'image/png', upsert: true });
    if (errSubida) {
      console.warn(`[storage-setup] empresa ${id}: no se pudo subir (${errSubida.message}); se omite.`);
      continue;
    }
    const nuevaUrl = supabase.storage.from(BUCKET_LOGOS).getPublicUrl(destino).data.publicUrl;
    await pool.query('UPDATE empresas SET logo_url = $1 WHERE id = $2', [nuevaUrl, id]);
  }
};

const privatizarComprobantes = async () => {
  const { data, error } = await supabase.storage.getBucket(BUCKET_COMPROBANTES);
  if (error || !data) throw new Error(`No existe el bucket "${BUCKET_COMPROBANTES}": ${error?.message || ''}`);
  if (!data.public) {
    log(`El bucket "${BUCKET_COMPROBANTES}" ya es privado.`);
    return;
  }
  log(`El bucket "${BUCKET_COMPROBANTES}" pasará a ser PRIVADO.`);
  if (APLICAR) {
    const { error: errUpd } = await supabase.storage.updateBucket(BUCKET_COMPROBANTES, { public: false });
    if (errUpd) throw new Error(`No se pudo privatizar "${BUCKET_COMPROBANTES}": ${errUpd.message}`);
  }
};

const main = async () => {
  if (!supabase || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Define SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY antes de ejecutar este script.');
  }
  await asegurarBucketLogos();
  await moverLogos();
  await privatizarComprobantes();
  log(APLICAR ? 'Listo.' : 'Nada se modificó. Ejecuta con --aplicar para aplicar los cambios.');
};

main()
  .catch((err) => {
    console.error('[storage-setup] ERROR:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
