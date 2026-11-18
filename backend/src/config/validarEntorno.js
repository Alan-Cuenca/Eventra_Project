/**
 * validarEntorno.js — Verifica las variables imprescindibles antes de levantar el servidor.
 * Ante una configuración inválida el proceso termina con un mensaje claro (en vez de fallar
 * más tarde con errores confusos en cada petición).
 */
const REQUERIDAS = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'];

/** @returns {string[]} lista de problemas encontrados (vacía si todo está bien). */
export const validarEntorno = (env = process.env) => {
  const problemas = [];

  REQUERIDAS.forEach((nombre) => {
    if (!env[nombre]) problemas.push(`Falta la variable de entorno ${nombre}.`);
  });

  if (env.JWT_SECRET && env.JWT_SECRET.length < 16) {
    problemas.push('JWT_SECRET es demasiado corto: usa al menos 32 caracteres aleatorios.');
  }
  if (env.JWT_SECRET && /tu_super_secreto|changeme|secret$/i.test(env.JWT_SECRET)) {
    problemas.push('JWT_SECRET parece un valor de ejemplo: define un secreto real.');
  }

  return problemas;
};

/** Termina el proceso si hay problemas (solo se invoca al arrancar el servidor). */
export const exigirEntornoValido = () => {
  const problemas = validarEntorno();
  if (problemas.length === 0) return;
  console.error('[config] El entorno no es válido:\n - ' + problemas.join('\n - '));
  process.exit(1);
};
