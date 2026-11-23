/**
 * esquemas.js — Reglas de validación de cada formulario del sistema (ver validarCuerpo.js).
 * Una sola fuente de verdad para el servidor; el frontend replica estas reglas en
 * src/utils/validacionForm.js para marcar los campos antes de enviar.
 */
export const TIPOS_EVENTO = ['Matrimonio', 'Quinceañera', 'Cumpleaños', 'Corporativo', 'Bautizo', 'Grado', 'Otro'];
export const CONCEPTOS_PAGO = ['Anticipo', 'Abono', 'Liquidación'];

const nombre = (etiqueta, { requerido = true, max = 100 } = {}) => ({ tipo: 'texto', patron: 'nombre', min: 2, max, requerido, etiqueta });
const texto = (etiqueta, { requerido = false, min = 1, max = 1000 } = {}) => ({ tipo: 'texto', min, max, requerido, etiqueta });
const id = (etiqueta, requerido = true) => ({ tipo: 'id', requerido, etiqueta });

export const esquemas = {
  cliente: {
    nombres: nombre('nombres'),
    apellidos: nombre('apellidos'),
    email: { tipo: 'email', etiqueta: 'correo electrónico' },
    telefono: { tipo: 'telefono', etiqueta: 'teléfono' },
    estado_activo: { tipo: 'booleano', etiqueta: 'estado' },
  },
  servicio: {
    nombre: texto('nombre', { requerido: true, min: 2, max: 100 }),
    descripcion: texto('descripción', { max: 1000 }),
    precio_base: { tipo: 'monto', requerido: true, etiqueta: 'precio' },
    estado_activo: { tipo: 'booleano', etiqueta: 'estado' },
  },
  paquete: {
    nombre: texto('nombre', { requerido: true, min: 2, max: 100 }),
    descripcion: texto('descripción', { max: 1000 }),
    precio_total: { tipo: 'monto', requerido: true, etiqueta: 'precio total' },
    servicios_ids: { tipo: 'ids', min: 1, max: 50, etiqueta: 'servicios incluidos' },
    estado_activo: { tipo: 'booleano', etiqueta: 'estado' },
  },
  proveedor: {
    nombre_empresa_o_contacto: texto('nombre o empresa', { requerido: true, min: 2, max: 150 }),
    especialidad: texto('especialidad', { max: 100 }),
    telefono: { tipo: 'telefono', etiqueta: 'teléfono' },
    email: { tipo: 'email', etiqueta: 'correo electrónico' },
    estado_activo: { tipo: 'booleano', etiqueta: 'estado' },
  },
  cotizacion: {
    cliente_id: id('cliente'),
    paquete_id: id('paquete', false),
    fecha_estimada_evento: { tipo: 'fecha', requerido: true, noPasada: true, maxAnios: 5, etiqueta: 'fecha estimada del evento' },
    tipo_evento: { tipo: 'enum', valores: TIPOS_EVENTO, etiqueta: 'tipo de evento' },
    num_invitados: { tipo: 'entero', min: 1, max: 10000, etiqueta: 'número de invitados' },
    servicios_ids: { tipo: 'ids', max: 50, etiqueta: 'servicios' },
    total_calculado: { tipo: 'monto', permitirCero: true, etiqueta: 'total' },
  },
  evento: {
    reserva_id: id('reserva'),
    titulo: texto('nombre del evento', { requerido: true, min: 3, max: 150 }),
    descripcion: texto('descripción', { max: 2000 }),
  },
  actividad: {
    evento_id: id('evento'),
    responsable_id: id('responsable', false),
    titulo: texto('descripción de la tarea', { requerido: true, min: 3, max: 255 }),
    descripcion: texto('detalle', { max: 2000 }),
    fecha_vencimiento: { tipo: 'fecha', noPasada: true, maxAnios: 5, etiqueta: 'fecha límite' },
  },
  // En la edición no se exige fecha futura: una tarea vencida debe poder corregirse
  actividadEdicion: {
    responsable_id: id('responsable', false),
    titulo: texto('descripción de la tarea', { requerido: true, min: 3, max: 255 }),
    descripcion: texto('detalle', { max: 2000 }),
    fecha_vencimiento: { tipo: 'fecha', maxAnios: 5, etiqueta: 'fecha límite' },
  },
  pago: {
    evento_id: id('evento'),
    monto: { tipo: 'monto', requerido: true, etiqueta: 'monto' },
    concepto: { tipo: 'enum', requerido: true, valores: CONCEPTOS_PAGO, etiqueta: 'concepto' },
  },
  solicitud: {
    evento_id: id('evento', false),
    descripcion: texto('detalle de la solicitud', { min: 10, max: 1000 }),
    descripcion_cambio: texto('detalle de la solicitud', { min: 10, max: 1000 }),
  },
  invitacion: {
    email: { tipo: 'email', requerido: true, etiqueta: 'correo electrónico' },
  },
  usuario: {
    nombre_completo: nombre('nombre completo', { requerido: false, max: 150 }),
    email: { tipo: 'email', etiqueta: 'correo electrónico' },
    estado_activo: { tipo: 'booleano', etiqueta: 'estado' },
  },
  completarRegistro: {
    nombre_completo: nombre('nombre completo', { max: 150 }),
    cedula: { tipo: 'cedula', requerido: true, etiqueta: 'cédula' },
    fecha_nacimiento: { tipo: 'fecha', requerido: true, noFutura: true, edadMinima: 18, etiqueta: 'fecha de nacimiento' },
  },
  registroCliente: {
    nombres: nombre('nombres', { requerido: false }),
    apellidos: nombre('apellidos', { requerido: false }),
    nombre_completo: nombre('nombre completo', { requerido: false, max: 150 }),
    email: { tipo: 'email', requerido: true, etiqueta: 'correo electrónico' },
    telefono: { tipo: 'telefono', etiqueta: 'teléfono' },
    cedula: { tipo: 'cedula', etiqueta: 'cédula' },
  },
  empresa: {
    nombre_comercial: texto('nombre comercial', { requerido: true, min: 2, max: 150 }),
    ruc: { tipo: 'ruc', etiqueta: 'RUC' },
    admin_nombre: nombre('nombre del administrador', { max: 150 }),
    admin_email: { tipo: 'email', requerido: true, etiqueta: 'correo del administrador' },
  },
};
