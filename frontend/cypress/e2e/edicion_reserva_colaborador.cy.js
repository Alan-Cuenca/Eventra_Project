/**
 * edicion_reserva_colaborador.cy.js — Editar reserva (mismo formulario, GET + PUT)
 * y editar nombre/correo de un colaborador.
 */
const RES_ID = 'r0000000-0000-4000-8000-0000000000e1';
const USR_ID = 'u0000000-0000-4000-8000-0000000000e1';

const reserva = {
  id: RES_ID, salon_o_lugar: 'Salón Cristal', salon: 'Salón Cristal', fecha_evento: '2027-02-14T05:00:00.000Z', fecha_iso: '2027-02-14',
  hora_inicio: '19:00:00', hora_fin: '02:00:00', estado: 'Confirmada', cotizacion_id: 'c1', cotizacion_total: '2500.00', cliente_nombre: 'Ana Pérez',
};

describe('Editar reserva', () => {
  beforeEach(() => {
    cy.apiVacia();
  });

  it('desde la lista abre el formulario precargado y guarda con PUT', () => {
    cy.intercept('GET', '**/api/reservas', { success: true, data: [reserva] });
    cy.intercept('GET', `**/api/reservas/${RES_ID}`, { success: true, data: reserva }).as('getReserva');
    cy.intercept('PUT', `**/api/reservas/${RES_ID}`, { success: true, data: { id: RES_ID } }).as('putReserva');
    cy.intercept('POST', '**/api/reservas', cy.spy().as('postSpy'));

    cy.visitarComo(1, '/reservas');
    cy.contains('tr', 'Salón Cristal').contains('a', 'Editar').click();
    cy.location('pathname').should('eq', `/reservas/editar/${RES_ID}`);
    cy.wait('@getReserva');

    cy.contains('h1', 'Editar Reserva').should('be.visible');
    cy.get('input[name="cotizacion_vinculada"]').should('be.disabled').and('have.value', 'Ana Pérez · $2500.00');
    cy.get('input[name="salon"]').should('have.value', 'Salón Cristal');
    cy.get('input[name="fecha"]').should('have.value', '2027-02-14');
    cy.get('select[name="horario"]').should('have.value', '19:00 - 02:00');

    cy.get('input[name="salon"]').clear().type('Terraza Jardín');
    cy.get('select[name="horario"]').select('15:00 - 21:00');
    cy.contains('button', 'Guardar Cambios').click();

    cy.wait('@putReserva').its('request.body').should('deep.equal', {
      salon_o_lugar: 'Terraza Jardín', fecha_evento: '2027-02-14', hora_inicio: '15:00', hora_fin: '21:00',
    });
    cy.get('@postSpy').should('not.have.been.called');
    cy.contains('¡Reserva Actualizada!').should('be.visible');
    cy.location('pathname', { timeout: 6000 }).should('eq', '/reservas');
  });

  it('un horario no predefinido se precarga como personalizado', () => {
    cy.intercept('GET', `**/api/reservas/${RES_ID}`, { success: true, data: { ...reserva, hora_inicio: '11:30:00', hora_fin: '14:00:00' } });
    cy.visitarComo(2, `/reservas/editar/${RES_ID}`);
    cy.get('select[name="horario"]').should('have.value', 'custom');
    cy.get('input[name="hora_inicio_custom"]').should('have.value', '11:30');
    cy.get('input[name="hora_fin_custom"]').should('have.value', '14:00');
  });

  it('muestra el conflicto (409) sin salir del formulario', () => {
    cy.intercept('GET', `**/api/reservas/${RES_ID}`, { success: true, data: reserva });
    cy.intercept('PUT', `**/api/reservas/${RES_ID}`, { statusCode: 409, body: { success: false, message: 'Conflicto' } });
    cy.visitarComo(1, `/reservas/editar/${RES_ID}`);
    cy.get('select[name="horario"]').select('20:00 - 03:00');
    cy.contains('button', 'Guardar Cambios').click();
    cy.contains('ya está reservado en esa fecha y horario').should('be.visible');
    cy.location('pathname').should('eq', `/reservas/editar/${RES_ID}`);
  });

  it('avisa si la reserva no existe y no permite guardar', () => {
    cy.intercept('GET', `**/api/reservas/${RES_ID}`, { statusCode: 404, body: { success: false, message: 'Reserva no encontrada.' } });
    cy.visitarComo(1, `/reservas/editar/${RES_ID}`);
    cy.contains('No se encontró la reserva').should('be.visible');
    cy.contains('button', 'Guardar Cambios').should('be.disabled');
  });

  it('una reserva cancelada no muestra el botón Editar', () => {
    cy.intercept('GET', '**/api/reservas', { success: true, data: [{ ...reserva, estado: 'Cancelada' }] });
    cy.visitarComo(1, '/reservas');
    cy.contains('tr', 'Salón Cristal').within(() => {
      cy.contains('button', 'Reactivar').should('be.visible');
      cy.contains('a', 'Editar').should('not.exist');
    });
  });

  it('el Trabajador no puede abrir la edición', () => {
    cy.visitarComo(3, `/reservas/editar/${RES_ID}`);
    cy.location('pathname').should('eq', '/dashboard');
  });
});

describe('Editar colaborador', () => {
  const colaborador = { id: USR_ID, nombre_completo: 'Tomás Trabajador', email: 'tomas@empresa.com', rol_id: 3, estado_activo: true };

  beforeEach(() => {
    cy.apiVacia();
    cy.intercept('GET', '**/api/usuarios', { success: true, data: [colaborador] });
  });

  it('cambia nombre y correo con PUT y actualiza la tabla', () => {
    cy.intercept('PUT', `**/api/usuarios/${USR_ID}`, { success: true, data: {} }).as('putUsuario');
    cy.visitarComo(1, '/colaboradores');
    cy.contains('tr', 'Tomás Trabajador').contains('button', 'Editar').click();

    cy.get('[role="dialog"]').within(() => {
      cy.get('input[name="nombre_completo"]').should('have.value', 'Tomás Trabajador').clear().type('Tomás Pérez');
      cy.get('input[name="email"]').should('have.value', 'tomas@empresa.com').clear().type('Tomas.Perez@Empresa.com');
      cy.contains('button', 'Guardar cambios').click();
    });

    cy.wait('@putUsuario').its('request.body').should('deep.equal', { nombre_completo: 'Tomás Pérez', email: 'tomas.perez@empresa.com' });
    cy.get('[role="dialog"]').should('not.exist');
    cy.contains('tr', 'Tomás Pérez').should('contain', 'tomas.perez@empresa.com');
  });

  it('valida en el formulario y muestra el error del backend (409) sin cerrar', () => {
    cy.intercept('PUT', `**/api/usuarios/${USR_ID}`, {
      statusCode: 409, body: { success: false, message: 'Ya existe otro usuario con ese email.' },
    }).as('putUsuario');
    cy.visitarComo(1, '/colaboradores');
    cy.contains('tr', 'Tomás Trabajador').contains('button', 'Editar').click();

    cy.get('[role="dialog"]').within(() => {
      cy.get('input[name="nombre_completo"]').clear();
      cy.contains('button', 'Guardar cambios').click();
      cy.contains('El nombre no puede quedar vacío.').should('be.visible');

      cy.get('input[name="nombre_completo"]').type('Tomás');
      cy.get('input[name="email"]').clear().type('no-es-correo');
      cy.contains('button', 'Guardar cambios').click();
      cy.contains('Ingresa un correo electrónico válido.').should('be.visible');

      cy.get('input[name="email"]').clear().type('repetido@empresa.com');
      cy.contains('button', 'Guardar cambios').click();
    });
    cy.wait('@putUsuario');
    cy.get('[role="dialog"]').should('contain', 'Ya existe otro usuario con ese email.');
    cy.contains('tr', 'Tomás Trabajador').should('contain', 'tomas@empresa.com');
  });
});
