/**
 * paymentGateway.js
 * -----------------------------------------------------------------------------
 * Capa desacoplada para métodos/pasarelas de pago (AGENTS.md §4.3).
 *
 * El controlador de pagos solo conoce esta interfaz. Hoy todos los métodos se
 * validan manualmente (comprobante subido y revisado por Administrador/Gerente).
 * Para integrar una pasarela real (Deuna API, Stripe, Kushki) basta con registrar
 * un proveedor con `procesar()` que devuelva el estado resultante; si la pasarela
 * falla, se degrada a revisión manual sin tumbar el registro del pago.
 *
 * Contrato de un proveedor:
 *   {
 *     nombre: string,
 *     requiereComprobante: boolean,
 *     estadoInicial: 'Pendiente' | 'En Revisión' | 'Aprobado',
 *     procesar?: async ({ monto, evento_id, empresa_id }) => ({ estado, referencia })
 *   }
 * -----------------------------------------------------------------------------
 */

const PROVEEDORES = {
  Efectivo: { nombre: 'Efectivo', requiereComprobante: false, estadoInicial: 'Pendiente' },
  Transferencia: { nombre: 'Transferencia', requiereComprobante: true, estadoInicial: 'En Revisión' },
  Deuna: { nombre: 'Deuna', requiereComprobante: true, estadoInicial: 'En Revisión' },
};

/** Proveedor por defecto para métodos sin integración (POS, tarjeta física, etc.). */
const PROVEEDOR_GENERICO = { nombre: 'Otro', requiereComprobante: false, estadoInicial: 'Pendiente' };

/**
 * Registra o reemplaza un proveedor (útil para integrar pasarelas sin tocar el controlador).
 * @param {string} metodo
 * @param {object} proveedor
 */
export const registrarProveedorPago = (metodo, proveedor) => {
  PROVEEDORES[metodo] = proveedor;
};

/** @returns {object} proveedor configurado para el método de pago. */
export const obtenerProveedorPago = (metodo) => PROVEEDORES[metodo] || PROVEEDOR_GENERICO;

/**
 * Ejecuta el cobro en la pasarela si el proveedor la implementa. Nunca lanza:
 * ante un fallo del proveedor devuelve el estado inicial para revisión manual.
 */
export const procesarPagoConProveedor = async (proveedor, datos) => {
  if (typeof proveedor.procesar !== 'function') {
    return { estado: proveedor.estadoInicial, referencia: null };
  }
  try {
    const r = await proveedor.procesar(datos);
    return { estado: r?.estado || proveedor.estadoInicial, referencia: r?.referencia || null };
  } catch (error) {
    console.error(`[paymentGateway] Falló el proveedor ${proveedor.nombre}; se pasa a revisión manual:`, error.message);
    return { estado: 'En Revisión', referencia: null };
  }
};
