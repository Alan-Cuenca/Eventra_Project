/**
 * =============================================================================
 * evaraGuiaSistema.js — Guía de módulos de EVENTRA para el personal interno
 * =============================================================================
 * EVARA atiende dos públicos:
 *   - Clientes / visitantes → asistente de ventas basado en el catálogo.
 *   - Personal (Administrador, Gerente, Trabajador) → guía de uso del sistema.
 *
 * Los módulos y su visibilidad por rol reflejan el Sidebar
 * (frontend/src/components/common/Sidebar.jsx). Si se agrega o mueve un
 * módulo allí, actualizar también esta lista.
 * =============================================================================
 */

export const ROLES = { ADMIN: 1, GERENTE: 2, TRABAJADOR: 3, CLIENTE: 4, SUPER_ADMIN: 5 };

const NOMBRE_ROL = {
  [ROLES.ADMIN]: 'Administrador',
  [ROLES.GERENTE]: 'Gerente',
  [ROLES.TRABAJADOR]: 'Trabajador',
};

export const MODULOS = [
  {
    ruta: '/dashboard',
    nombre: 'Métricas & KPIs',
    descripcion: 'Resumen de indicadores de eventos, ventas y pagos.',
    roles: [1, 2, 3],
    claves: ['dashboard', 'metrica', 'kpi', 'indicador', 'resumen', 'inicio'],
  },
  {
    ruta: '/eventos',
    nombre: 'Eventos Programados',
    descripcion: 'Crear, editar y dar seguimiento a los eventos.',
    roles: [1, 2, 3],
    claves: ['evento', 'eventos'],
  },
  {
    ruta: '/actividades',
    nombre: 'Checklist Operativo',
    descripcion: 'Tareas y actividades asignadas a cada evento.',
    roles: [1, 2, 3],
    claves: ['actividad', 'tarea', 'checklist', 'pendiente'],
  },
  {
    ruta: '/reservas',
    nombre: 'Reservas Anti-Colisión',
    descripcion: 'Reservar salones por fecha evitando choques de calendario.',
    roles: [1, 2, 3],
    claves: ['reserva', 'salon', 'salón', 'calendario', 'disponibilidad', 'fecha'],
  },
  {
    ruta: '/solicitudes',
    nombre: 'Solicitudes de Modificación',
    descripcion: 'Revisar y aprobar los cambios que piden los clientes.',
    roles: [1, 2],
    claves: ['solicitud', 'modificacion', 'modificación', 'cambio de evento'],
  },
  {
    ruta: '/cotizaciones',
    nombre: 'Lista de Cotizaciones',
    descripcion: 'Consultar las cotizaciones emitidas.',
    roles: [1, 2],
    claves: ['cotizaciones', 'lista de cotizaciones'],
  },
  {
    ruta: '/cotizador',
    nombre: 'Cotizador Dinámico',
    descripcion: 'Generar una cotización nueva para un cliente.',
    roles: [1, 2],
    claves: ['cotizar', 'cotizador', 'cotizacion', 'cotización', 'presupuesto'],
  },
  {
    ruta: '/pagos',
    nombre: 'Gestión de Pagos & Abonos',
    descripcion: 'Registrar y validar pagos, abonos y comprobantes.',
    roles: [1, 2, 3],
    claves: ['pago', 'abono', 'comprobante', 'cobro', 'deuna'],
  },
  {
    ruta: '/clientes',
    nombre: 'Directorio de Clientes',
    descripcion: 'Registrar y editar clientes.',
    roles: [1, 2],
    claves: ['cliente', 'clientes'],
  },
  {
    ruta: '/servicios',
    nombre: 'Catálogo de Servicios',
    descripcion: 'Crear y editar los servicios que ofrece la empresa (catering, música, etc.).',
    roles: [1, 2],
    claves: ['servicio', 'catalogo', 'catálogo', 'catering', 'musica', 'música'],
  },
  {
    ruta: '/paquetes',
    nombre: 'Paquetes de Gala',
    descripcion: 'Armar paquetes combinando servicios con un precio total.',
    roles: [1, 2],
    claves: ['paquete', 'paquetes'],
  },
  {
    ruta: '/proveedores',
    nombre: 'Proveedores & Aliados',
    descripcion: 'Gestionar proveedores externos.',
    roles: [1, 2],
    claves: ['proveedor', 'aliado'],
  },
  {
    ruta: '/reportes',
    nombre: 'Reportes y Analítica',
    descripcion: 'Reportes de ventas, eventos y pagos exportables.',
    roles: [1, 2],
    claves: ['reporte', 'analitica', 'analítica', 'estadistica', 'estadística', 'pdf'],
  },
  {
    ruta: '/colaboradores',
    nombre: 'Equipo y Colaboradores',
    descripcion: 'Invitar y administrar gerentes y trabajadores.',
    roles: [1],
    claves: ['colaborador', 'equipo', 'usuario', 'empleado', 'trabajador', 'gerente', 'invitar'],
  },
  {
    ruta: '/mi-suscripcion',
    nombre: 'Mi Suscripción SaaS',
    descripcion: 'Ver el plan contratado, límites y cambio de plan.',
    roles: [1],
    claves: ['suscripcion', 'suscripción', 'plan', 'limite', 'límite', 'factura'],
  },
  {
    ruta: '/configuracion-marca',
    nombre: 'Identidad y Marca Blanca',
    descripcion:
      'Subir el logotipo, generar el tema de colores con IA a partir del logo, elegir una paleta y personalizar el título y la descripción del portal de clientes.',
    roles: [1],
    claves: ['tema', 'color', 'colores', 'paleta', 'logo', 'logotipo', 'marca', 'branding', 'portal', 'personalizar', 'diseño'],
  },
];

const normalizar = (texto) =>
  String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

/** Rol numérico del usuario autenticado (o null si es visitante) */
export const obtenerRolId = (user) => {
  if (!user) return null;
  const id = Number(user.rol_id);
  if (Number.isInteger(id) && id > 0) return id;
  const nombre = normalizar(user.rol || user.rol_nombre);
  const encontrado = Object.entries({ administrador: 1, gerente: 2, trabajador: 3, cliente: 4, super_admin: 5 }).find(
    ([n]) => nombre === n
  );
  return encontrado ? encontrado[1] : null;
};

export const esPersonalInterno = (rolId) => [ROLES.ADMIN, ROLES.GERENTE, ROLES.TRABAJADOR].includes(rolId);

export const modulosDelRol = (rolId) => MODULOS.filter((m) => m.roles.includes(rolId));

/** Prompt de sistema para el personal interno */
export const construirPromptPersonal = (rolId, catalogo) => {
  const modulos = modulosDelRol(rolId)
    .map((m) => `- ${m.nombre} (${m.ruta}): ${m.descripcion}`)
    .join('\n');
  return `Eres EVARA, la asistente de EVENTRA (plataforma SaaS de gestión de eventos) y hablas con un miembro del personal de la empresa con rol ${NOMBRE_ROL[rolId]}.
Tu función es ayudarle a usar el sistema: explicar dónde está cada función y cómo realizar tareas, paso a paso.
Módulos a los que este usuario tiene acceso (menú lateral):
${modulos}
Reglas:
- Responde ÚNICAMENTE con base en estos módulos. No inventes pantallas, botones ni funciones que no estén en la lista.
- Indica siempre el nombre del módulo y su ruta entre paréntesis, ej. "Identidad y Marca Blanca (/configuracion-marca)".
- Si pide algo que su rol no tiene disponible, dile amablemente que debe solicitarlo a un Administrador.
- Si pregunta por paquetes o servicios de la empresa, usa este catálogo actual: ${JSON.stringify(catalogo)}. Si está vacío, sugiere crearlos en Catálogo de Servicios (/servicios) y Paquetes de Gala (/paquetes).
- Sé breve, claro y amable. Responde en español.`;
};

/** Respuesta sin IA para el personal: busca el módulo que coincide con la pregunta */
export const responderPersonalSinIA = (mensaje, rolId) => {
  const texto = normalizar(mensaje);
  const disponibles = modulosDelRol(rolId);
  // Coincidencia al inicio de palabra ("pago" ⊂ "pagos", pero "tema" ⊄ "sistema")
  const contiene = (clave) =>
    new RegExp(`(^|[^a-z0-9])${normalizar(clave).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(texto);
  const puntuar = (m) => m.claves.filter(contiene).length;

  const coincidencias = MODULOS.map((m) => ({ m, puntos: puntuar(m) }))
    .filter(({ puntos }) => puntos > 0)
    .sort((a, b) => b.puntos - a.puntos);

  if (coincidencias.length > 0) {
    const { m } = coincidencias[0];
    if (!m.roles.includes(rolId)) {
      return `Esa función está en ${m.nombre} (${m.ruta}), pero tu rol de ${NOMBRE_ROL[rolId]} no tiene acceso. Solicítalo a un Administrador de tu empresa.`;
    }
    return `Puedes hacerlo en ${m.nombre} (${m.ruta}), en el menú lateral. Ahí podrás: ${m.descripcion}`;
  }

  const lista = disponibles.map((m) => `• ${m.nombre} (${m.ruta})`).join('\n');
  return `Soy EVARA y te ayudo a usar EVENTRA. Con tu rol de ${NOMBRE_ROL[rolId]} tienes acceso a:\n${lista}\n\nCuéntame qué necesitas hacer y te indico dónde.`;
};
