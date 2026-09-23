/**
 * EVENTRA - Mock Data & Estructuras de Datos
 * Basado en las especificaciones del Project Charter y la base de datos de PostgreSQL
 */

export const ROLES = {
  ADMIN: 1,
  GERENTE: 2,
  TRABAJADOR: 3,
  CLIENTE: 4,
};

export const ROLES_CONFIG = {
  1: { id: 1, nombre: 'Administrador', badgeColor: 'badge-danger', desc: 'Acceso total y configuración global SaaS' },
  2: { id: 2, nombre: 'Gerente', badgeColor: 'badge-primary', desc: 'Gestión de eventos, finanzas y aprobación de cambios' },
  3: { id: 3, nombre: 'Trabajador', badgeColor: 'badge-warning', desc: 'Operaciones y seguimiento de actividades asignadas' },
  4: { id: 4, nombre: 'Cliente', badgeColor: 'badge-info', desc: 'Cotización, reservas y seguimiento de su evento' },
};

export const DEMO_USERS = [
  {
    id: 'usr-admin-01',
    nombre_completo: 'Martín Falcon (Admin)',
    email: 'admin@eventra.com',
    password: 'password123',
    rol_id: ROLES.ADMIN,
    empresa_id: 1,
    empresa_nombre: 'EVENTRA Cloud System',
    estado_activo: true,
  },
  {
    id: 'usr-gerente-02',
    nombre_completo: 'Alan Puruncajas (Gerente)',
    email: 'gerente@royalrecepciones.com',
    password: 'password123',
    rol_id: ROLES.GERENTE,
    empresa_id: 1,
    empresa_nombre: 'Recepciones & Eventos Imperial',
    estado_activo: true,
  },
  {
    id: 'usr-trabajador-03',
    nombre_completo: 'Jorge Sailema (Coordinador)',
    email: 'jorge@royalrecepciones.com',
    password: 'password123',
    rol_id: ROLES.TRABAJADOR,
    empresa_id: 1,
    empresa_nombre: 'Recepciones & Eventos Imperial',
    estado_activo: true,
  },
  {
    id: 'usr-cliente-04',
    nombre_completo: 'Pablo Vayas (Cliente)',
    email: 'pablo.cliente@gmail.com',
    password: 'password123',
    rol_id: ROLES.CLIENTE,
    empresa_id: 1,
    empresa_nombre: 'Recepciones & Eventos Imperial',
    estado_activo: true,
  },
];

export const MOCK_EMPRESAS = [
  { id: 1, nombre_comercial: 'Recepciones & Eventos Imperial', ruc: '1890123456001', plan: 'Plan Premium' },
  { id: 2, nombre_comercial: 'Salones Bellavista & Catering', ruc: '1890987654001', plan: 'Plan Básico' },
];

export const MOCK_SERVICIOS = [
  {
    id: 1,
    categoria: 'Espacio y Salón',
    nombre: 'Salón Imperial Platinum',
    descripcion: 'Capacidad para 300 invitados, climatización, suite para anfitriones y estacionamiento privado.',
    precio_base: 1200,
    unidad: 'evento',
    popular: true,
  },
  {
    id: 2,
    categoria: 'Gastronomía y Catering',
    nombre: 'Banquete Gourmet 3 Tiempos',
    descripcion: 'Entrada fría/caliente, plato fuerte internacional, postre artesanal y bebidas ilimitadas.',
    precio_base: 24,
    unidad: 'por persona',
    popular: true,
  },
  {
    id: 3,
    categoria: 'Audio y Visual',
    nombre: 'DJ Profesional, Iluminación Robótica y Efectos',
    descripcion: 'Cabina LED, 6 horas de animación, cabezas móviles robóticas, humo bajo y pirotecnia fría.',
    precio_base: 650,
    unidad: 'evento',
    popular: false,
  },
  {
    id: 4,
    categoria: 'Fotografía y Recuerdos',
    nombre: 'Cobertura Audiovisual Cinemática 4K',
    descripcion: '2 fotógrafos, dron para tomas aéreas, video teaser para redes y álbum fotográfico de lujo.',
    precio_base: 550,
    unidad: 'evento',
    popular: true,
  },
  {
    id: 5,
    categoria: 'Ambientación y Flores',
    nombre: 'Decoración Floral Temática & Backing',
    descripcion: 'Arreglos de flores naturales en mesas, arco ceremonial y letras gigantes luminosas.',
    precio_base: 450,
    unidad: 'evento',
    popular: false,
  },
];

export const MOCK_PAQUETES = [
  {
    id: 'pack-boda-deluxe',
    nombre: 'Paquete Boda de Ensueño (Todo Incluido)',
    servicios_incluidos: ['Salón Imperial Platinum', 'Banquete Gourmet (100 pers)', 'DJ & Luces', 'Fotografía 4K', 'Decoración'],
    precio_total: 4800,
    descuento: '15% de ahorro incluido',
    recomendado: true,
  },
  {
    id: 'pack-quince-chic',
    nombre: 'Paquete Quinceañera Glamour',
    servicios_incluidos: ['Salón Imperial', 'Banquete Gourmet (80 pers)', 'DJ & Pista Iluminada', 'Fotografía 4K'],
    precio_total: 3900,
    descuento: '10% de ahorro incluido',
    recomendado: false,
  },
  {
    id: 'pack-empresarial',
    nombre: 'Convención & Gala Corporativa',
    servicios_incluidos: ['Salón Imperial', 'Coffee break + Almuerzo (50 pers)', 'Audio, Proyectores & Micrófonos'],
    precio_total: 2200,
    descuento: 'Precio corporativo',
    recomendado: false,
  },
];

export const MOCK_EVENTOS = [
  {
    id: 'EVT-2026-001',
    tipo: 'Matrimonio',
    titulo: 'Boda Alejandra & Carlos',
    cliente_nombre: 'Carlos Mendoza',
    cliente_email: 'carlos.mendoza@email.com',
    cliente_telefono: '+593 99 123 4567',
    fecha: '2026-10-24',
    invitados: 120,
    estado: 'Confirmado',
    progreso_porcentaje: 65,
    monto_total: 4850.00,
    anticipo_pagado: 2500.00,
    saldo_pendiente: 2350.00,
    paquete: 'Paquete Boda de Ensueño',
    responsable: 'Jorge Sailema',
  },
  {
    id: 'EVT-2026-002',
    tipo: 'Quinceañera',
    titulo: 'Mis XV Años - Valentina',
    cliente_nombre: 'Pablo Vayas',
    cliente_email: 'pablo.cliente@gmail.com',
    cliente_telefono: '+593 98 765 4321',
    fecha: '2026-11-14',
    invitados: 90,
    estado: 'En preparación',
    progreso_porcentaje: 40,
    monto_total: 3900.00,
    anticipo_pagado: 1950.00,
    saldo_pendiente: 1950.00,
    paquete: 'Paquete Quinceañera Glamour',
    responsable: 'Jorge Sailema',
  },
  {
    id: 'EVT-2026-003',
    tipo: 'Corporativo',
    titulo: 'Cena de Fin de Año - TechCorp',
    cliente_nombre: 'Mariana Silva',
    cliente_email: 'mariana.s@techcorp.ec',
    cliente_telefono: '+593 95 334 8899',
    fecha: '2026-12-18',
    invitados: 60,
    estado: 'Cotización',
    progreso_porcentaje: 15,
    monto_total: 2200.00,
    anticipo_pagado: 0.00,
    saldo_pendiente: 2200.00,
    paquete: 'Convención & Gala Corporativa',
    responsable: 'Alan Puruncajas',
  },
];

export const MOCK_SOLICITUDES_CAMBIO = [
  {
    id: 'SOL-01',
    evento_id: 'EVT-2026-002',
    evento_titulo: 'Mis XV Años - Valentina',
    cliente: 'Pablo Vayas',
    fecha_solicitud: '2026-09-12',
    descripcion: 'Solicita aumentar 15 comensales adicionales al banquete gourmet y extender 1 hora extra de DJ.',
    impacto_costo: '+ $420.00',
    estado: 'Pendiente Aprobación Gerente',
  },
  {
    id: 'SOL-02',
    evento_id: 'EVT-2026-001',
    evento_titulo: 'Boda Alejandra & Carlos',
    cliente: 'Carlos Mendoza',
    fecha_solicitud: '2026-09-08',
    descripcion: 'Cambio de color en mantelería de Marfil a Azul Medianoche y adición de pista de baile acrílica.',
    impacto_costo: '+ $180.00',
    estado: 'Aprobado',
  },
];

export const MOCK_METRICAS_SAAS = {
  empresa: 'Recepciones & Eventos Imperial',
  plan: 'Plan Premium',
  clientes_activos: 34,
  limite_clientes: 200,
  servicios_activos: 18,
  limite_servicios: 50,
  usuarios_internos: 4,
  limite_usuarios: 10,
  mensajes_chatbot_mes: 480,
  limite_chatbot: 1500,
  ingresos_mes: 16400.00,
  eventos_mes: 8,
};

export const MOCK_RESERVAS = [
  {
    id: 'RES-001',
    evento_titulo: 'Boda Alejandra & Carlos',
    cliente_nombre: 'Carlos Mendoza',
    fecha: '2026-10-24',
    horario: '18:00 - 02:00',
    salon: 'Salón Imperial Platinum',
    estado: 'Confirmada',
  },
  {
    id: 'RES-002',
    evento_titulo: 'Mis XV Años - Valentina',
    cliente_nombre: 'Pablo Vayas',
    fecha: '2026-11-14',
    horario: '19:00 - 01:00',
    salon: 'Salón Imperial',
    estado: 'Confirmada',
  },
];

