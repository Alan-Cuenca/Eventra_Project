/**
 * precios_y_portal.cy.js — Regresiones encontradas probando el sitio desplegado.
 * - Precios y límites salen de GET /api/configuracion (no hay cifras fijas ni "ilimitado").
 * - Pago anual: el monto a transferir es 12 × precio mensual con descuento.
 * - Portal del cliente: sin eventos no se inventa uno (antes mostraba fecha, estado y 150 invitados ficticios).
 */
const PLANES = {
  basico_precio: 59, basico_max_eventos: 25, basico_max_usuarios: 4, basico_max_clientes: 60, basico_max_servicios: 20, basico_max_chatbot: 350,
  premium_precio: 129, premium_max_eventos: 150, premium_max_usuarios: 12, premium_max_clientes: 250, premium_max_servicios: 50, premium_max_chatbot: 2000,
};

const sinPromesasFalsas = () => {
  cy.get('body').invoke('text').should((t) => {
    expect(t).not.to.match(/ilimitad/i);
    expect(t).not.to.match(/sin límites/i);
  });
};

describe('Precios desde la configuración', () => {
  beforeEach(() => {
    cy.apiVacia();
    cy.intercept('GET', '**/api/configuracion', { success: true, data: { planes: PLANES, transferencia: {}, plataforma: {} } }).as('config');
  });

  it('/precios muestra precios y límites configurados', () => {
    cy.visit('/precios');
    cy.wait('@config');
    cy.contains('$59').should('be.visible');
    cy.contains('$129').should('be.visible');
    cy.contains('Hasta 25 eventos').should('exist');
    cy.contains('Hasta 150 eventos').should('exist');
    cy.contains('2.000 mensajes').should('exist');
    sinPromesasFalsas();

    cy.contains('Facturación Anual').click();
    cy.contains('$47').should('be.visible');   // 59 × 0,8
    cy.contains('$103').should('be.visible');  // 129 × 0,8
  });

  it('la sección de planes del inicio usa los mismos precios', () => {
    cy.visit('/');
    cy.wait('@config');
    cy.contains('Inversión clara para escalar tu empresa.').scrollIntoView();
    cy.contains('$59').should('exist');
    cy.contains('$129').should('exist');
    sinPromesasFalsas();
  });

  it('/planes/pago anual pide transferir 12 meses', () => {
    cy.visit('/planes/pago?plan=Premium&ciclo=annual');
    cy.wait('@config');
    cy.contains('$1236.00 USD').should('be.visible'); // 103 × 12
    cy.contains('12 × $103/mes').should('be.visible');
    cy.contains('Hasta 150 eventos activos').should('exist');
  });
});

describe('Portal del cliente', () => {
  beforeEach(() => {
    cy.apiVacia();
  });

  it('sin eventos muestra un estado vacío y no un evento inventado', () => {
    cy.intercept('GET', '**/api/eventos', { success: true, data: [] });
    cy.visitarComo(4, '/portal-cliente');
    cy.get('[data-cy="portal-sin-eventos"]').should('be.visible');
    cy.contains('Abonar a este Evento').should('not.exist');
    cy.contains('150 Comensales').should('not.exist');
    cy.contains(/Noviembre de 2026/).should('not.exist');
  });

  it('con evento muestra solo sus datos reales', () => {
    cy.intercept('GET', '**/api/eventos', {
      success: true,
      data: [{ id: 'e1', titulo: 'Boda Carla & Diego', estado_progreso: 'Planificación', fecha: '2027-03-20T12:00:00Z', salon: 'Salón Cristal', monto_total: 3200 }],
    });
    cy.visitarComo(4, '/portal-cliente');
    cy.contains('Boda Carla & Diego').should('be.visible');
    cy.contains('Planificación').should('be.visible');
    cy.contains('Salón Cristal').should('be.visible');
    cy.contains('Comensales').should('not.exist');
    cy.contains('a', 'Abonar a este Evento').should('be.visible');
  });
});
