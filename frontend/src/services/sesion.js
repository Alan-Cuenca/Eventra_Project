/**
 * EVENTRA - Sesión por pestaña.
 *
 * Problema que resuelve: localStorage es compartido por todas las pestañas del mismo
 * navegador. Si en una pestaña se entraba como Super Admin y en otra como Administrador,
 * la segunda sobrescribía el token y la primera seguía mostrando la consola del Super Admin
 * pero enviaba el token del Administrador ("no tienes permiso"), o heredaba su estado
 * (contraseña temporal pendiente, empresa suspendida, cierre de sesión...).
 *
 * Regla: cada pestaña trabaja con su propia copia de la sesión en sessionStorage.
 * localStorage guarda solo la ÚLTIMA sesión iniciada, para que una pestaña nueva
 * arranque con ella (comportamiento habitual al abrir otra pestaña).
 */
export const CLAVES_SESION = ['token', 'eventra_user', 'rol_id', 'rol_nombre'];
// Marca de "esta pestaña cerró sesión": evita que vuelva a adoptar la sesión de otra pestaña.
const MARCA_CERRADA = 'eventra_sesion_cerrada';

const seguro = (fn, porDefecto = null) => {
  try { return fn(); } catch { return porDefecto; }
};

/** Si la pestaña aún no tiene sesión propia, adopta la última sesión iniciada en el navegador. */
const adoptarSiHaceFalta = () => seguro(() => {
  if (sessionStorage.getItem('token') || sessionStorage.getItem(MARCA_CERRADA)) return;
  const token = localStorage.getItem('token');
  if (!token) return;
  CLAVES_SESION.forEach((clave) => {
    const valor = localStorage.getItem(clave);
    if (valor !== null) sessionStorage.setItem(clave, valor);
  });
});

/** Lee una clave de la sesión de ESTA pestaña. */
export const leerSesion = (clave) => {
  adoptarSiHaceFalta();
  return seguro(() => sessionStorage.getItem(clave));
};

export const obtenerToken = () => leerSesion('token');

/** Guarda la sesión recién iniciada en esta pestaña y la deja como "última" del navegador. */
export const guardarSesion = ({ token, user, rolId, rolNombre }) => seguro(() => {
  const valores = {
    token,
    eventra_user: user ? JSON.stringify(user) : null,
    rol_id: rolId !== undefined && rolId !== null ? String(rolId) : null,
    rol_nombre: rolNombre || null,
  };
  sessionStorage.removeItem(MARCA_CERRADA);
  CLAVES_SESION.forEach((clave) => {
    const valor = valores[clave];
    if (valor === null || valor === undefined) {
      sessionStorage.removeItem(clave);
      localStorage.removeItem(clave);
    } else {
      sessionStorage.setItem(clave, valor);
      localStorage.setItem(clave, valor);
    }
  });
});

/**
 * Cierra la sesión de ESTA pestaña. La sesión guardada en localStorage solo se borra si es
 * la misma de esta pestaña: así cerrar la sesión del Administrador no cierra la del Super Admin.
 */
export const cerrarSesionLocal = () => seguro(() => {
  const propio = sessionStorage.getItem('token') || null;
  const ultimo = localStorage.getItem('token');
  CLAVES_SESION.forEach((clave) => sessionStorage.removeItem(clave));
  sessionStorage.setItem(MARCA_CERRADA, '1');
  if (propio && propio === ultimo) {
    CLAVES_SESION.forEach((clave) => localStorage.removeItem(clave));
  }
});
