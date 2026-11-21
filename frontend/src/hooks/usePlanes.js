/**
 * usePlanes — precios y límites de los planes desde GET /api/configuracion.
 *
 * Los define el Super Admin en Configuración SaaS y el backend los aplica
 * (planLimitsMiddleware). Todas las pantallas que muestran precios o límites
 * deben usar este hook para no prometer algo distinto de lo que se cobra o aplica.
 *
 * Mientras carga (o si la API falla) se usan los mismos valores por defecto del
 * backend (configuracionController.DEFAULT_CONFIG).
 */
import { useEffect, useState } from 'react';
import { eventraService } from '../services/eventraService';

export const PLANES_POR_DEFECTO = {
  basico_nombre: 'Plan Básico (Boutique)',
  basico_precio: 49,
  basico_max_eventos: 20,
  basico_max_usuarios: 3,
  basico_max_clientes: 50,
  basico_max_servicios: 20,
  basico_max_chatbot: 300,
  premium_nombre: 'Plan Premium (Corporativo + IA)',
  premium_precio: 99,
  premium_max_eventos: 100,
  premium_max_usuarios: 10,
  premium_max_clientes: 200,
  premium_max_servicios: 50,
  premium_max_chatbot: 1500,
};

/** Descuento del pago anual sobre el precio mensual (precio mensual equivalente). */
export const DESCUENTO_ANUAL = 0.2;

const numero = (valor, porDefecto) => {
  const n = Number(valor);
  return Number.isFinite(n) && n > 0 ? n : porDefecto;
};

/** Normaliza la sección `planes` de la configuración a una estructura cómoda por plan. */
export const construirPlanes = (planes = {}) => {
  const p = { ...PLANES_POR_DEFECTO, ...(planes || {}) };
  const plan = (clave) => {
    const mensual = numero(p[`${clave}_precio`], PLANES_POR_DEFECTO[`${clave}_precio`]);
    return {
      nombre: p[`${clave}_nombre`] || PLANES_POR_DEFECTO[`${clave}_nombre`],
      precioMensual: mensual,
      precioAnualMensual: Math.round(mensual * (1 - DESCUENTO_ANUAL)),
      eventos: numero(p[`${clave}_max_eventos`], PLANES_POR_DEFECTO[`${clave}_max_eventos`]),
      usuarios: numero(p[`${clave}_max_usuarios`], PLANES_POR_DEFECTO[`${clave}_max_usuarios`]),
      clientes: numero(p[`${clave}_max_clientes`], PLANES_POR_DEFECTO[`${clave}_max_clientes`]),
      servicios: numero(p[`${clave}_max_servicios`], PLANES_POR_DEFECTO[`${clave}_max_servicios`]),
      chatbot: numero(p[`${clave}_max_chatbot`], PLANES_POR_DEFECTO[`${clave}_max_chatbot`]),
    };
  };
  return { Basico: plan('basico'), Premium: plan('premium') };
};

/** Precio a mostrar según el ciclo de facturación. */
export const precioSegunCiclo = (plan, anual) => (anual ? plan.precioAnualMensual : plan.precioMensual);

/** Formatea un número con separador de miles en español (ej. 1.500). */
export const fmt = (n) => Number(n).toLocaleString('es-EC');

let cache = null;
let pendiente = null;

const cargar = () => {
  if (cache) return Promise.resolve(cache);
  if (!pendiente) {
    pendiente = eventraService.getConfiguracionGlobal()
      .then((cfg) => {
        cache = construirPlanes(cfg?.planes);
        return cache;
      })
      .catch(() => construirPlanes())
      .finally(() => { pendiente = null; });
  }
  return pendiente;
};

/** Solo para pruebas: olvida la configuración cargada. */
export const limpiarCachePlanes = () => { cache = null; pendiente = null; };

export const usePlanes = () => {
  const [planes, setPlanes] = useState(() => cache || construirPlanes());
  const [cargando, setCargando] = useState(!cache);

  useEffect(() => {
    let activo = true;
    cargar().then((p) => {
      if (activo) {
        setPlanes(p);
        setCargando(false);
      }
    });
    return () => { activo = false; };
  }, []);

  return { planes, cargando };
};

export default usePlanes;
