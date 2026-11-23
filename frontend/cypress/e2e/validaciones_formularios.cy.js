/**
 * Validación de formularios antes de avanzar o enviar (sin backend real).
 */
const ayer = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
};
const enUnMes = () => {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
};

describe('Validación de formularios', () => {
  beforeEach(() => {
    cy.apiVacia();
  });

  it('el cotizador no avanza con datos incompletos o inválidos', () => {
    cy.intercept('GET', '**/api/clientes*', {
      statusCode: 200,
      body: { success: true, data: [{ id: 'c1', nombres: 'María', apellidos: 'López', email: 'maria@e2e.test', estado_activo: true }] },
    });
    cy.intercept('POST', '**/api/cotizaciones', cy.spy().as('postCotizacion'));
    cy.visitarComo(1, '/cotizador');

    cy.get('#cotizador-next-btn').click();
    ['cliente_id', 'tipo_evento', 'fecha_estimada', 'num_invitados'].forEach((campo) => {
      cy.get(`[data-cy="error-${campo}"]`).should('be.visible');
    });
    cy.contains(/Paso 1 de 4/i).should('exist');

    cy.get('#cotizador-nombre').select('c1');
    cy.get('#cotizador-tipo-evento').select('Matrimonio');
    cy.get('#cotizador-fecha').type(ayer());
    cy.get('#cotizador-invitados').type('0');
    cy.get('#cotizador-next-btn').click();
    cy.get('[data-cy="error-fecha_estimada"]').should('contain', 'pasado');
    cy.get('[data-cy="error-num_invitados"]').should('contain', 'al menos 1');
    cy.get('[data-cy="error-cliente_id"]').should('not.exist');

    cy.get('#cotizador-fecha').clear().type(enUnMes());
    cy.get('#cotizador-invitados').clear().type('120');
    cy.get('#cotizador-next-btn').click();
    cy.contains(/Paso 2 de 4/i).should('exist');

    // Sin paquete ni servicios no se llega al resumen (la cotización quedaría en $0)
    cy.get('#cotizador-next-btn').click();
    cy.get('#cotizador-next-btn').click();
    cy.get('[data-cy="error-seleccion"]').should('be.visible');
    cy.contains(/Paso 3 de 4/i).should('exist');
    cy.get('@postCotizacion').should('not.have.been.called');
  });

  it('el formulario de cliente marca los campos inválidos y no envía', () => {
    cy.intercept('POST', '**/api/clientes', cy.spy().as('postCliente'));
    cy.visitarComo(1, '/clientes/nuevo');

    cy.get('#page-nombres').type('María3');
    cy.get('#page-apellidos').type('López');
    cy.get('#page-email').type('maria@');
    cy.get('#page-telefono').type('12');
    cy.get('#cliente-form-page-submit').click();

    cy.contains(/solo puede contener letras/).should('be.visible');
    cy.get('[name="nombres"]').should('have.attr', 'aria-invalid', 'true');
    cy.get('[name="email"]').should('have.attr', 'aria-invalid', 'true');
    cy.get('[name="telefono"]').should('have.attr', 'aria-invalid', 'true');
    cy.get('[name="apellidos"]').should('not.have.attr', 'aria-invalid');
    cy.get('@postCliente').should('not.have.been.called');

    // Al corregir, la marca desaparece
    cy.get('#page-nombres').clear().type('María');
    cy.get('[name="nombres"]').should('not.have.attr', 'aria-invalid');
  });
});
