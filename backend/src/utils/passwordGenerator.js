/**
 * passwordGenerator.js
 * =============================================================================
 * Utilidad criptográficamente segura para la generación de contraseñas temporales
 * en EVENTRA SaaS.
 *
 * Directrices:
 *  - Uso exclusivo del módulo nativo 'crypto' (crypto.randomInt) para alta entropía.
 *  - Prohibido el uso de Math.random().
 *  - Caracteres ambiguos (0, O, 1, l, I) excluidos para legibilidad humana.
 *  - Garantía de al menos 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial.
 *  - Longitud estándar: 12 caracteres.
 * =============================================================================
 */

import crypto from 'crypto';

const MAYUSCULAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';  // Sin I, O
const MINUSCULAS = 'abcdefghijkmnopqrstuvwxyz';  // Sin l
const NUMEROS    = '23456789';                  // Sin 0, 1
const SIMBOLOS   = '!@#$%&*';

const TODOS_LOS_CARACTERES = MAYUSCULAS + MINUSCULAS + NUMEROS + SIMBOLOS;

/**
 * Genera una contraseña temporal segura con alta entropía.
 * @param {number} [longitud=12] - Longitud deseada (mínimo 10)
 * @returns {string} Contraseña temporal generada en memoria
 */
export const generarPasswordTemporal = (longitud = 12) => {
  const tamano = Math.max(10, longitud);

  // 1. Asegurar al menos un carácter de cada grupo obligatorio
  const obligatorio = [
    MAYUSCULAS[crypto.randomInt(0, MAYUSCULAS.length)],
    MINUSCULAS[crypto.randomInt(0, MINUSCULAS.length)],
    NUMEROS[crypto.randomInt(0, NUMEROS.length)],
    SIMBOLOS[crypto.randomInt(0, SIMBOLOS.length)],
  ];

  // 2. Rellenar los caracteres restantes con el conjunto completo
  const caracteresRestantes = [];
  const cantidadRestante = tamano - obligatorio.length;
  for (let i = 0; i < cantidadRestante; i++) {
    caracteresRestantes.push(TODOS_LOS_CARACTERES[crypto.randomInt(0, TODOS_LOS_CARACTERES.length)]);
  }

  // 3. Mezclar el arreglo usando Fisher-Yates con crypto.randomInt
  const resultado = [...obligatorio, ...caracteresRestantes];
  for (let i = resultado.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [resultado[i], resultado[j]] = [resultado[j], resultado[i]];
  }

  return resultado.join('');
};
