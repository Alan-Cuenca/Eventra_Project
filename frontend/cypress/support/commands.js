/**
 * Comandos E2E compartidos.
 * La app guarda la sesión en localStorage con estas claves: token, eventra_user, rol_id, rol_nombre.
 */
const NOMBRES_ROL = { 1: 'Administrador', 2: 'Gerente', 3: 'Trabajador', 4: 'Cliente', 5: 'Super_Admin' };

/** Visita una ruta con una sesión del rol indicado (sin tocar el backend real). */
Cypress.Commands.add('visitarComo', (rol, ruta) => {
  cy.visit(ruta, {
    onBeforeLoad(win) {
      win.localStorage.setItem('token', `jwt-e2e-rol-${rol}`);
      win.localStorage.setItem('eventra_user', JSON.stringify({
        id: `usr-e2e-${rol}`,
        nombre_completo: `Usuario ${NOMBRES_ROL[rol]}`,
        email: `rol${rol}@e2e.test`,
        rol_id: rol,
        rol_nombre: NOMBRES_ROL[rol],
        empresa_id: rol === 5 ? null : 1,
        empresa_slug: 'empresa-e2e',
      }));
      win.localStorage.setItem('rol_id', String(rol));
      win.localStorage.setItem('rol_nombre', NOMBRES_ROL[rol]);
    },
  });
});

/** Responde con listas vacías a cualquier llamada al backend, salvo las que cada test intercepte antes. */
Cypress.Commands.add('apiVacia', () => {
  cy.intercept('GET', '**/api/**', { statusCode: 200, body: { success: true, data: [], total: 0 } });
});
