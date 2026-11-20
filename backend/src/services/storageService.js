/**
 * storageService.js — Acceso centralizado a Supabase Storage.
 *
 * - Comprobantes (pagos de eventos, suscripciones, solicitudes de la landing):
 *   bucket PRIVADO. En la BD se guarda solo la ruta del objeto; al listar, el
 *   backend genera una URL firmada de corta duración para el usuario autorizado.
 * - Logotipos de empresas: bucket PÚBLICO aparte (se muestran en portales públicos).
 */
import { supabase } from '../config/supabase.js';

export const BUCKET_COMPROBANTES = process.env.SUPABASE_BUCKET_COMPROBANTES || 'comprobantes';
export const BUCKET_LOGOS = process.env.SUPABASE_BUCKET_LOGOS || 'logos';
export const TTL_URL_FIRMADA_SEG = Number(process.env.COMPROBANTES_URL_TTL_SEG) || 900;

const MARCADOR_PUBLICO = `/storage/v1/object/public/${BUCKET_COMPROBANTES}/`;
const MARCADOR_FIRMADO = `/storage/v1/object/sign/${BUCKET_COMPROBANTES}/`;

/** Error de almacenamiento. `sinConfigurar` = no hay Supabase (503); si no, falló la subida (502). */
export class StorageNoDisponibleError extends Error {
  constructor(message, { sinConfigurar = false } = {}) {
    super(message);
    this.sinConfigurar = sinConfigurar;
    this.httpStatus = sinConfigurar ? 503 : 502;
  }
}

const nombreAleatorio = (ext) =>
  `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`;

export const extensionDe = (file, porDefecto = 'bin') => {
  const partes = String(file?.originalname || '').split('.');
  const ext = partes.length > 1 ? partes.pop().toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) : '';
  return ext || porDefecto;
};

/**
 * Sube un comprobante al bucket privado y devuelve la RUTA del objeto
 * (no una URL). Lanza StorageNoDisponibleError si no hay Supabase o falla la subida.
 *
 * @param {string} carpeta  ej. "12" o "suscripciones/12"
 * @param {{buffer: Buffer, mimetype: string, originalname?: string}} file
 */
export const subirComprobante = async (carpeta, file, extPorDefecto = 'bin') => {
  if (!supabase) throw new StorageNoDisponibleError('Supabase Storage no configurado.', { sinConfigurar: true });
  const ruta = `${carpeta}/${nombreAleatorio(extensionDe(file, extPorDefecto))}`;
  const { error } = await supabase.storage
    .from(BUCKET_COMPROBANTES)
    .upload(ruta, file.buffer, { contentType: file.mimetype, upsert: false });
  if (error) throw new StorageNoDisponibleError(error.message);
  return ruta;
};

/**
 * Sube un logotipo al bucket público y devuelve su URL pública.
 * Devuelve null si no hay Supabase o la subida falla (el llamador decide el respaldo).
 */
export const subirLogoPublico = async (empresaId, file) => {
  if (!supabase) return null;
  try {
    const ruta = `${empresaId}/logo_${nombreAleatorio(extensionDe(file, 'png'))}`;
    const { error } = await supabase.storage
      .from(BUCKET_LOGOS)
      .upload(ruta, file.buffer, { contentType: file.mimetype, upsert: true });
    if (error) {
      console.warn('[storageService] Falló la subida del logo:', error.message);
      return null;
    }
    return supabase.storage.from(BUCKET_LOGOS).getPublicUrl(ruta).data.publicUrl;
  } catch (err) {
    console.warn('[storageService] Excepción subiendo logo:', err.message);
    return null;
  }
};

/**
 * Devuelve la ruta del objeto dentro del bucket de comprobantes, o null si el
 * valor no apunta a ese bucket (Data URL, URL externa, vacío).
 * Acepta tanto rutas nuevas ("12/abc.pdf") como URLs públicas antiguas.
 */
export const extraerRutaComprobante = (valor) => {
  if (!valor || typeof valor !== 'string') return null;
  if (valor.startsWith('data:')) return null;
  for (const marcador of [MARCADOR_PUBLICO, MARCADOR_FIRMADO]) {
    const i = valor.indexOf(marcador);
    if (i !== -1) return decodeURIComponent(valor.slice(i + marcador.length).split('?')[0]);
  }
  if (/^https?:\/\//i.test(valor) || valor.startsWith('/')) return null;
  return valor;
};

/**
 * Reemplaza en cada fila el campo indicado por una URL firmada temporal.
 * - Data URLs y URLs externas se dejan como están.
 * - Si no se puede firmar, el campo queda en null (nunca se expone una URL pública).
 *
 * @template T
 * @param {T[]} filas
 * @param {string} [campo]
 * @returns {Promise<T[]>}
 */
export const firmarComprobantes = async (filas, campo = 'comprobante_url') => {
  if (!Array.isArray(filas) || filas.length === 0) return filas;

  const rutas = [...new Set(filas.map((f) => extraerRutaComprobante(f?.[campo])).filter(Boolean))];
  if (rutas.length === 0) return filas;

  const firmadas = new Map();
  if (supabase) {
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_COMPROBANTES)
        .createSignedUrls(rutas, TTL_URL_FIRMADA_SEG);
      if (error) throw error;
      for (const item of data || []) {
        if (item?.signedUrl && !item.error) firmadas.set(item.path, item.signedUrl);
      }
    } catch (err) {
      console.error('[storageService] No se pudieron firmar los comprobantes:', err.message);
    }
  }

  for (const fila of filas) {
    const ruta = extraerRutaComprobante(fila?.[campo]);
    if (ruta) fila[campo] = firmadas.get(ruta) || null;
  }
  return filas;
};
