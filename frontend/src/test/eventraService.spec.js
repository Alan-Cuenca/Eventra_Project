import { describe, it, expect, vi, beforeEach } from 'vitest';

const api = { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() };
vi.mock('../services/api', () => ({ api }));

const { eventraService } = await import('../services/eventraService');

beforeEach(() => {
  Object.values(api).forEach((f) => f.mockReset());
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('eventraService — sin datos simulados', () => {
  it.each([
    ['getEventos', '/eventos'],
    ['getServicios', '/servicios'],
    ['getPaquetes', '/paquetes'],
    ['getClientes', '/clientes'],
    ['getReservas', '/reservas'],
    ['getSolicitudes', '/solicitudes'],
  ])('%s propaga el error del backend en vez de devolver datos de demostración', async (metodo, ruta) => {
    api.get.mockRejectedValue(new Error('Ocurrió un problema en el servidor.'));
    await expect(eventraService[metodo]()).rejects.toThrow(/problema en el servidor/);
    expect(api.get).toHaveBeenCalledWith(ruta);
  });

  it('getEventos devuelve [] real cuando el tenant no tiene eventos (no inventa eventos)', async () => {
    api.get.mockResolvedValue({ success: true, data: [] });
    expect(await eventraService.getEventos()).toEqual([]);
  });

  it('getEvento falla si la respuesta no trae un evento', async () => {
    api.get.mockResolvedValue({ success: true, data: null });
    await expect(eventraService.getEvento('x')).rejects.toThrow(/no encontrado/i);
  });

  it('getUsuarios devuelve [] (sin colaboradores inventados) cuando el rol no puede listar', async () => {
    api.get.mockRejectedValue(new Error('No tienes permisos'));
    expect(await eventraService.getUsuarios()).toEqual([]);
  });

  it('getUsuarios mapea solo usuarios reales', async () => {
    api.get.mockResolvedValue({ data: [{ id: 'u1', nombre_completo: 'Ana Ruiz', email: 'a@b.com', rol_id: 3 }] });
    expect(await eventraService.getUsuarios()).toEqual([{ id: 'u1', nombre_completo: 'Ana Ruiz', email: 'a@b.com', rol_id: 3 }]);
  });
});

describe('eventraService — contratos con el backend', () => {
  it('updateEstadoActividad usa PATCH /actividades/:id/estado', async () => {
    api.patch.mockResolvedValue({ data: { id: 1, estado: 'Completada' } });
    await eventraService.updateEstadoActividad(1, 'Completada');
    expect(api.patch).toHaveBeenCalledWith('/actividades/1/estado', { estado: 'Completada' });
  });

  it('updateEstadoCotizacion usa PATCH /cotizaciones/:id/estado', async () => {
    api.patch.mockResolvedValue({ data: {} });
    await eventraService.updateEstadoCotizacion('c1', 'Aprobada');
    expect(api.patch).toHaveBeenCalledWith('/cotizaciones/c1/estado', { estado: 'Aprobada' });
  });

  it('updateEstadoEvento envía estado_progreso (campo real del backend)', async () => {
    api.patch.mockResolvedValue({ data: {} });
    await eventraService.updateEstadoEvento('e1', 'En Progreso');
    expect(api.patch).toHaveBeenCalledWith('/eventos/e1/estado', { estado_progreso: 'En Progreso' });
  });

  it('updateEstadoEvento no oculta errores con un éxito falso', async () => {
    api.patch.mockRejectedValue(new Error('Estado inválido'));
    await expect(eventraService.updateEstadoEvento('e1', 'X')).rejects.toThrow('Estado inválido');
  });

  it('createReserva envía el contrato real (cotizacion_id, salon_o_lugar, fecha_evento, horas)', async () => {
    api.post.mockResolvedValue({ data: { id: 'r1' } });
    const cuerpo = { cotizacion_id: 'c', salon_o_lugar: 'S', fecha_evento: '2027-01-01', hora_inicio: '10:00', hora_fin: '12:00' };
    await eventraService.createReserva(cuerpo);
    expect(api.post).toHaveBeenCalledWith('/reservas', cuerpo);
  });

  it('createCotizacion no oculta el error del servidor', async () => {
    api.post.mockRejectedValue(new Error('El cliente no existe'));
    await expect(eventraService.createCotizacion({ cliente_id: 'x' })).rejects.toThrow('El cliente no existe');
  });
});
