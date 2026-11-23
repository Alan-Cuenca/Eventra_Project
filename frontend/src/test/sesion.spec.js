import { describe, it, expect, beforeEach } from 'vitest';
import { guardarSesion, obtenerToken, leerSesion, cerrarSesionLocal } from '../services/sesion';

// jsdom tiene un único sessionStorage: "otra pestaña" se simula escribiendo en localStorage
// (lo que hace un login en otra pestaña) o vaciando sessionStorage (pestaña nueva).
const otraPestanaIniciaSesion = (token, rolId) => {
  localStorage.setItem('token', token);
  localStorage.setItem('rol_id', String(rolId));
};
const abrirPestanaNueva = () => sessionStorage.clear();

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe('sesión por pestaña', () => {
  it('un login en otra pestaña no cambia el token de esta pestaña', () => {
    guardarSesion({ token: 'token-superadmin', user: { rol_id: 5 }, rolId: 5, rolNombre: 'Super_Admin' });
    otraPestanaIniciaSesion('token-admin', 1);

    expect(obtenerToken()).toBe('token-superadmin');
    expect(leerSesion('rol_id')).toBe('5');
  });

  it('cerrar la sesión en esta pestaña no borra la última sesión de otra cuenta', () => {
    guardarSesion({ token: 'token-superadmin', user: { rol_id: 5 }, rolId: 5 });
    otraPestanaIniciaSesion('token-admin', 1);

    cerrarSesionLocal();

    expect(obtenerToken()).toBeNull();
    expect(localStorage.getItem('token')).toBe('token-admin');
  });

  it('cerrar la sesión de la misma cuenta también la borra del navegador', () => {
    guardarSesion({ token: 'token-admin', user: { rol_id: 1 }, rolId: 1 });
    cerrarSesionLocal();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('una pestaña nueva arranca con la última sesión iniciada', () => {
    guardarSesion({ token: 'token-admin', user: { rol_id: 1 }, rolId: 1 });
    abrirPestanaNueva();
    expect(obtenerToken()).toBe('token-admin');
    expect(JSON.parse(leerSesion('eventra_user'))).toEqual({ rol_id: 1 });
  });

  it('tras cerrar sesión, la pestaña no adopta la sesión de otra pestaña', () => {
    guardarSesion({ token: 'token-superadmin', user: { rol_id: 5 }, rolId: 5 });
    cerrarSesionLocal();
    otraPestanaIniciaSesion('token-admin', 1);
    expect(obtenerToken()).toBeNull();
  });

  it('un nuevo login en la pestaña vuelve a guardar la sesión', () => {
    cerrarSesionLocal();
    guardarSesion({ token: 'token-nuevo', user: { rol_id: 2 }, rolId: 2 });
    expect(obtenerToken()).toBe('token-nuevo');
  });
});
