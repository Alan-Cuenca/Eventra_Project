/**
 * guardas_por_rol.cy.js — Las rutas están protegidas según el rol (sin backend real).
 *
 * Roles: 1 Administrador, 2 Gerente, 3 Trabajador, 4 Cliente, 5 Super Admin.
 */
describe('Guardas de ruta por rol', () => {
  beforeEach(() => {
    cy.apiVacia();
  });

  it('sin sesión, una ruta privada redirige al login', () => {
    cy.visit('/dashboard');
    cy.url().should('match', /\/(login|portal\/.+\/login)$/);
  });

  const prohibidas = [
    // [rol, ruta prohibida, destino esperado]
    [3, '/colaboradores', '/dashboard'],
    [3, '/clientes', '/dashboard'],
    [3, '/reportes', '/dashboard'],
    [4, '/actividades', '/dashboard'],
    [4, '/reservas/nueva', '/dashboard'],
    [4, '/cotizador', '/dashboard'],
    [2, '/mi-suscripcion', '/dashboard'],
    [2, '/colaboradores', '/dashboard'],
    [1, '/portal-cliente', '/dashboard'],
    [5, '/dashboard', '/super-admin/dashboard'],
  ];
  prohibidas.forEach(([rol, ruta, destino]) => {
    it(`rol ${rol} no puede abrir ${ruta} y termina en ${destino}`, () => {
      cy.visitarComo(rol, ruta);
      cy.location('pathname').should('eq', destino);
    });
  });

  const permitidas = [
    [1, '/colaboradores'],
    [1, '/mi-suscripcion'],
    [2, '/reportes'],
    [2, '/clientes'],
    [3, '/actividades'],
    [3, '/cotizador'],
    [4, '/cotizaciones'],
    [4, '/portal-cliente'],
    [5, '/super-admin/empresas'],
  ];
  permitidas.forEach(([rol, ruta]) => {
    it(`rol ${rol} sí puede abrir ${ruta}`, () => {
      cy.visitarComo(rol, ruta);
      cy.location('pathname').should('eq', ruta);
    });
  });

  it('el menú lateral del Trabajador no muestra gestión de clientes ni reportes', () => {
    cy.visitarComo(3, '/dashboard');
    cy.contains('a', /Reportes/i).should('not.exist');
    cy.contains('a', /Colaboradores/i).should('not.exist');
  });

  it('el modo oscuro no existe: no hay selector de tema', () => {
    cy.visitarComo(1, '/dashboard');
    cy.contains(/Modo Oscuro|Dark/i).should('not.exist');
  });
});
