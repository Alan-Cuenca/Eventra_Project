/**
 * EVENTRA — Constantes de roles (coinciden con la tabla roles del backend).
 */
export const ROLES = {
  ADMIN: 1,
  GERENTE: 2,
  TRABAJADOR: 3,
  CLIENTE: 4,
  SUPER_ADMIN: 5,
};

export const ROLES_CONFIG = {
  1: { id: 1, nombre: 'Administrador', badgeColor: 'badge-danger', desc: 'Acceso total y configuración de la empresa' },
  2: { id: 2, nombre: 'Gerente', badgeColor: 'badge-primary', desc: 'Gestión de eventos, finanzas y aprobación de cambios' },
  3: { id: 3, nombre: 'Trabajador', badgeColor: 'badge-warning', desc: 'Operaciones y seguimiento de actividades asignadas' },
  4: { id: 4, nombre: 'Cliente', badgeColor: 'badge-info', desc: 'Cotización, reservas y seguimiento de su evento' },
  5: { id: 5, nombre: 'Super Admin', badgeColor: 'badge-purple', desc: 'Administración Global de la plataforma SaaS y gestión de inquilinos' },
};
