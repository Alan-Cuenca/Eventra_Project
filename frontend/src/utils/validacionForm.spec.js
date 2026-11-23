import { describe, it, expect } from 'vitest';
import { validarFormulario, ESQUEMAS, esCedulaValida, hoyIso, marcarCampos, resumenErrores } from './validacionForm';

const enDias = (dias) => {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

describe('validacionForm — cotizador (paso 1)', () => {
  const base = { cliente_id: 'c1', tipo_evento: 'Matrimonio', fecha_estimada: enDias(30), num_invitados: '120' };

  it('acepta datos completos y válidos', () => {
    expect(validarFormulario(base, ESQUEMAS.cotizacionDatos)).toEqual({});
  });

  it('marca cada campo faltante o inválido', () => {
    const errores = validarFormulario({ cliente_id: '', tipo_evento: 'Fiesta', fecha_estimada: enDias(-1), num_invitados: '0' }, ESQUEMAS.cotizacionDatos);
    expect(Object.keys(errores).sort()).toEqual(['cliente_id', 'fecha_estimada', 'num_invitados', 'tipo_evento']);
    expect(errores.fecha_estimada).toMatch(/pasado/);
  });

  it('hoy es una fecha válida; más de 5 años no', () => {
    expect(validarFormulario({ ...base, fecha_estimada: hoyIso() }, ESQUEMAS.cotizacionDatos)).toEqual({});
    expect(validarFormulario({ ...base, fecha_estimada: enDias(366 * 6) }, ESQUEMAS.cotizacionDatos).fecha_estimada).toMatch(/5 años/);
  });

  it('invitados deben ser enteros entre 1 y 10000', () => {
    expect(validarFormulario({ ...base, num_invitados: '12.5' }, ESQUEMAS.cotizacionDatos).num_invitados).toMatch(/entero/);
    expect(validarFormulario({ ...base, num_invitados: '20000' }, ESQUEMAS.cotizacionDatos).num_invitados).toMatch(/10000/);
  });
});

describe('validacionForm — otros formularios', () => {
  it('cliente: letras en nombres, correo y teléfono con formato', () => {
    const errores = validarFormulario({ nombres: 'Ana3', apellidos: 'López', email: 'ana@', telefono: 'abc' }, ESQUEMAS.cliente);
    expect(Object.keys(errores).sort()).toEqual(['email', 'nombres', 'telefono']);
    expect(resumenErrores(errores)).toMatch(/letras/);
  });

  it('registro: cédula válida y mayor de edad', () => {
    expect(esCedulaValida('1712345675')).toBe(true);
    const errores = validarFormulario({ nombre_completo: 'Ana Pérez', cedula: '1712345670', fecha_nacimiento: enDias(-365 * 5) }, ESQUEMAS.completarRegistro);
    expect(Object.keys(errores).sort()).toEqual(['cedula', 'fecha_nacimiento']);
  });

  it('servicio: precio mayor a cero', () => {
    expect(validarFormulario({ nombre: 'DJ', precio_base: '0' }, ESQUEMAS.servicio).precio_base).toMatch(/mayor a cero/);
  });
});

describe('marcarCampos', () => {
  it('marca los campos con error y los limpia al escribir', () => {
    const form = document.createElement('form');
    form.innerHTML = '<input name="nombres"><input name="email">';
    document.body.appendChild(form);
    marcarCampos(form, { email: 'Correo inválido' });

    const email = form.querySelector('[name="email"]');
    expect(email.getAttribute('aria-invalid')).toBe('true');
    expect(document.activeElement).toBe(email);
    expect(form.querySelector('[name="nombres"]').getAttribute('aria-invalid')).toBeNull();

    email.dispatchEvent(new Event('input'));
    expect(email.getAttribute('aria-invalid')).toBeNull();
    form.remove();
  });
});
