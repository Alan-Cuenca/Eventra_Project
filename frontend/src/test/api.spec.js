import { describe, it, expect, beforeEach, vi } from 'vitest';
import apiClient, { api } from '../services/api';

/** Sustituye el adaptador HTTP de axios por uno controlado (sin red). */
const simular = (fn) => {
  apiClient.defaults.adapter = async (config) => {
    const r = await fn(config);
    if (r.status >= 400) {
      const error = new Error(`status ${r.status}`);
      error.config = config;
      error.response = { status: r.status, data: r.data, config };
      throw error;
    }
    return { data: r.data, status: r.status, statusText: 'OK', headers: {}, config };
  };
};

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('api.js — interceptor de request', () => {
  it('adjunta el JWT guardado en localStorage', async () => {
    localStorage.setItem('token', 'abc.def.ghi');
    let visto;
    simular((config) => { visto = config.headers; return { status: 200, data: { ok: true } }; });
    await api.get('/ping');
    expect(visto.Authorization).toBe('Bearer abc.def.ghi');
  });

  it('no envía Authorization si no hay token', async () => {
    let visto;
    simular((config) => { visto = config.headers; return { status: 200, data: {} }; });
    await api.get('/ping');
    expect(visto.Authorization).toBeUndefined();
  });

  it('expone patch (usado para estados de actividad, cotización y evento)', async () => {
    let metodo;
    simular((config) => { metodo = config.method; return { status: 200, data: {} }; });
    await api.patch('/actividades/1/estado', { estado: 'Completada' });
    expect(metodo).toBe('patch');
  });

  it('el interceptor de respuesta devuelve directamente el body', async () => {
    simular(() => ({ status: 200, data: { success: true, data: [1, 2] } }));
    expect(await api.get('/x')).toEqual({ success: true, data: [1, 2] });
  });
});

describe('api.js — errores', () => {
  it('prioriza el mensaje del backend y conserva status', async () => {
    simular(() => ({ status: 409, data: { message: 'El salón ya está reservado.' } }));
    await expect(api.post('/reservas', {})).rejects.toMatchObject({ message: 'El salón ya está reservado.', status: 409 });
  });

  it.each([
    [403, /No tienes permisos/],
    [404, /No se encontró/],
    [500, /problema en el servidor/],
  ])('sin mensaje del backend, el %s muestra un texto amigable', async (status, patron) => {
    simular(() => ({ status, data: {} }));
    await expect(api.get('/x')).rejects.toThrow(patron);
  });

  it('un 403 PLAN_LIMIT_EXCEEDED emite el evento de límite de plan', async () => {
    const oyente = vi.fn();
    window.addEventListener('eventra:plan-limit-exceeded', oyente);
    simular(() => ({ status: 403, data: { error: 'PLAN_LIMIT_EXCEEDED', message: 'Límite alcanzado', data: { recurso: 'clientes' } } }));
    await expect(api.post('/clientes', {})).rejects.toMatchObject({ isPlanLimit: true });
    expect(oyente).toHaveBeenCalledTimes(1);
    window.removeEventListener('eventra:plan-limit-exceeded', oyente);
  });

  it('un 403 normal cuyo mensaje contiene "planificación" NO es límite de plan', async () => {
    const oyente = vi.fn();
    window.addEventListener('eventra:plan-limit-exceeded', oyente);
    simular(() => ({ status: 403, data: { message: 'No puedes editar eventos en planificación' } }));
    await expect(api.put('/eventos/1', {})).rejects.toMatchObject({ isPlanLimit: false });
    expect(oyente).not.toHaveBeenCalled();
    window.removeEventListener('eventra:plan-limit-exceeded', oyente);
  });
});

describe('api.js — 401', () => {
  it('limpia la sesión ante un 401 en una ruta protegida', async () => {
    localStorage.setItem('token', 't');
    localStorage.setItem('eventra_user', '{}');
    localStorage.setItem('rol_id', '1');
    simular(() => ({ status: 401, data: { message: 'Token inválido o expirado.' } }));
    await expect(api.get('/clientes')).rejects.toMatchObject({ status: 401 });
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('eventra_user')).toBeNull();
  });

  it.each([
    '/auth/login',
    '/auth/recuperar-password',
    '/auth/restablecer-password',
    '/auth/cambiar-password-obligatorio',
  ])('un 401 en %s NO cierra la sesión ni redirige', async (ruta) => {
    localStorage.setItem('token', 'sigue-aqui');
    simular(() => ({ status: 401, data: { message: 'Credenciales inválidas.' } }));
    await expect(api.post(ruta, {})).rejects.toMatchObject({ message: 'Credenciales inválidas.' });
    expect(localStorage.getItem('token')).toBe('sigue-aqui');
  });
});
