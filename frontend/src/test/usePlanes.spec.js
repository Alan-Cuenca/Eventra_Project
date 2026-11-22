import { describe, it, expect } from 'vitest';
import { construirPlanes, precioSegunCiclo, PLANES_POR_DEFECTO, DESCUENTO_ANUAL } from '../hooks/usePlanes';

describe('construirPlanes', () => {
  it('sin configuración usa los mismos valores por defecto que el backend', () => {
    const { Basico, Premium } = construirPlanes();
    expect(Basico).toMatchObject({ precioMensual: 49, eventos: 20, usuarios: 3, clientes: 50, chatbot: 300 });
    expect(Premium).toMatchObject({ precioMensual: 99, eventos: 100, usuarios: 10, clientes: 200, chatbot: 1500 });
    expect(PLANES_POR_DEFECTO.basico_precio).toBe(49);
  });

  it('aplica los valores configurados por el Super Admin', () => {
    const { Basico, Premium } = construirPlanes({ basico_precio: 59, basico_max_eventos: 30, premium_max_usuarios: 25 });
    expect(Basico.precioMensual).toBe(59);
    expect(Basico.eventos).toBe(30);
    expect(Premium.usuarios).toBe(25);
    expect(Premium.precioMensual).toBe(99);
  });

  it('ignora valores inválidos y vuelve al defecto', () => {
    const { Basico } = construirPlanes({ basico_precio: 'gratis', basico_max_eventos: -5 });
    expect(Basico.precioMensual).toBe(49);
    expect(Basico.eventos).toBe(20);
  });

  it('precio anual = mensual con descuento, redondeado (49 → 39, 99 → 79)', () => {
    const { Basico, Premium } = construirPlanes();
    expect(DESCUENTO_ANUAL).toBe(0.2);
    expect(precioSegunCiclo(Basico, true)).toBe(39);
    expect(precioSegunCiclo(Premium, true)).toBe(79);
    expect(precioSegunCiclo(Premium, false)).toBe(99);
  });
});
