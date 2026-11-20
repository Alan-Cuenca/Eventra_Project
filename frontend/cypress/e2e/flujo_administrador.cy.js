/**
 * flujo_administrador.cy.js — EVENTRA E2E: flujo funcional del Administrador (rol 1)
 * =============================================================================
 * Cotización -> aprobar -> reserva (409 por choque de horario y reintento) ->
 * cancelar y reactivar la reserva (409 si el salón fue ocupado mientras tanto).
 * Los permisos de rutas por rol se prueban en guardas_por_rol.cy.js.
 * =============================================================================
 */
const COT_ID = 'c0000000-0000-4000-8000-0000000000a1';
const RES_ID = 'r0000000-0000-4000-8000-0000000000a1';

const cotizacion = (estado) => ({
  id: COT_ID, cliente_nombres: 'Ana', cliente_apellidos: 'Pérez', paquete_nombre: 'Paquete Oro',
  fecha_estimada_evento: '2027-02-14', total_calculado: '2500.00', estado,
});

const reserva = (estado) => ({
  id: RES_ID, salon_o_lugar: 'Salón Cristal', salon: 'Salón Cristal', fecha_evento: '2027-02-14',
  hora_inicio: '19:00:00', hora_fin: '02:00:00', estado, cliente_nombre: 'Ana Pérez',
});

describe('Flujo E2E del Administrador', () => {
  beforeEach(() => {
    cy.apiVacia();
  });

  it('1. Aprueba una cotización pendiente y luego puede completarla', () => {
    cy.intercept('GET', '**/api/cotizaciones', { success: true, data: [cotizacion('Pendiente')] });
    cy.intercept('PATCH', `**/api/cotizaciones/${COT_ID}/estado`, {
      success: true, data: { id: COT_ID, estado: 'Aprobada', total_calculado: '2500.00' },
    }).as('patchEstado');

    cy.visitarComo(1, '/cotizaciones');
    cy.contains('tr', 'Ana Pérez').within(() => {
      cy.contains('Pendiente').should('be.visible');
      cy.contains('button', 'Aprobar').click();
    });

    cy.wait('@patchEstado').its('request.body').should('deep.equal', { estado: 'Aprobada' });
    cy.contains('tr', 'Ana Pérez').within(() => {
      cy.contains('Aprobada').should('be.visible');
      cy.contains('button', 'Aprobar').should('not.exist');
      cy.contains('button', 'Completar').should('be.visible');
    });
  });

  // Vista desactualizada: otro usuario rechazó la cotización mientras esta pantalla seguía abierta
  it('2. Muestra el mensaje del backend si la transición ya no es válida (409)', () => {
    cy.intercept('GET', '**/api/cotizaciones', { success: true, data: [cotizacion('Aprobada')] });
    cy.intercept('PATCH', `**/api/cotizaciones/${COT_ID}/estado`, {
      statusCode: 409, body: { success: false, message: 'No se puede pasar una cotización de "Rechazada" a "Completada".' },
    });

    cy.visitarComo(1, '/cotizaciones');
    cy.contains('button', 'Completar').click();
    cy.contains('No se puede pasar una cotización de "Rechazada" a "Completada".').should('be.visible');
    cy.contains('tr', 'Ana Pérez').contains('Aprobada').should('be.visible');
  });

  it('3. Agenda una reserva: 409 por choque de horario y éxito al cambiar el bloque', () => {
    cy.intercept('GET', '**/api/cotizaciones', {
      success: true,
      data: [cotizacion('Aprobada'), { ...cotizacion('Pendiente'), id: 'c0000000-0000-4000-8000-0000000000a2', cliente_nombres: 'Luis' }],
    });
    let intentos = 0;
    cy.intercept('POST', '**/api/reservas', (req) => {
      intentos += 1;
      if (intentos === 1) {
        req.reply({ statusCode: 409, body: { success: false, message: 'Conflicto: El salón "Salón Cristal" ya se encuentra reservado.' } });
      } else {
        req.reply({ statusCode: 201, body: { success: true, data: { id: RES_ID, estado: 'Confirmada' } } });
      }
    }).as('postReserva');

    cy.visitarComo(1, '/reservas/nueva');
    cy.contains('h1', 'Agendar Nueva Reserva').should('be.visible');
    // Solo se ofrecen cotizaciones aprobadas
    cy.get('select[name="cotizacion_id"] option').should('have.length', 2);
    cy.get('select[name="cotizacion_id"]').select(COT_ID);
    cy.get('input[name="salon"]').type('Salón Cristal');
    cy.get('input[name="fecha"]').type('2027-02-14');
    cy.get('select[name="horario"]').select('19:00 - 02:00');
    cy.contains('button', 'Guardar y Agendar Reserva').click();

    cy.wait('@postReserva').its('request.body').should('deep.include', {
      cotizacion_id: COT_ID, salon_o_lugar: 'Salón Cristal', fecha_evento: '2027-02-14', hora_inicio: '19:00', hora_fin: '02:00',
    });
    cy.contains('ya está reservado en esa fecha y horario').should('be.visible');

    // Un horario personalizado limpia el aviso y permite reintentar
    cy.get('select[name="horario"]').select('custom');
    cy.contains('ya está reservado en esa fecha y horario').should('not.exist');
    cy.get('input[name="hora_inicio_custom"]').clear().type('12:00');
    cy.get('input[name="hora_fin_custom"]').clear().type('17:00');
    cy.contains('button', 'Guardar y Agendar Reserva').click();
    cy.wait('@postReserva').its('request.body').should('deep.include', { hora_inicio: '12:00', hora_fin: '17:00' });
    cy.contains('¡Reserva Confirmada!').should('be.visible');
    cy.location('pathname', { timeout: 6000 }).should('eq', '/reservas');
  });

  it('4. Cancela una reserva y, al reactivarla, informa si el salón ya fue ocupado', () => {
    cy.intercept('GET', '**/api/reservas', { success: true, data: [reserva('Confirmada')] });
    cy.intercept('DELETE', `**/api/reservas/${RES_ID}`, { success: true, message: 'Reserva cancelada.' }).as('cancelar');
    cy.intercept('PUT', `**/api/reservas/${RES_ID}`, {
      statusCode: 409, body: { success: false, message: 'Conflicto: El salón "Salón Cristal" ya se encuentra reservado en esa fecha y horario.' },
    }).as('reactivar');

    cy.visitarComo(1, '/reservas');
    cy.on('window:confirm', (texto) => {
      expect(texto).to.contain('Cancelar esta reserva');
      return true;
    });
    cy.contains('tr', 'Salón Cristal').contains('button', 'Cancelar').click();
    cy.wait('@cancelar');
    cy.contains('tr', 'Salón Cristal').within(() => {
      cy.contains('Cancelada').should('be.visible');
      cy.contains('button', 'Reactivar').click();
    });

    cy.wait('@reactivar').its('request.body').should('deep.equal', { estado: 'Confirmada' });
    cy.contains('ya se encuentra reservado en esa fecha y horario').should('be.visible');
    cy.contains('tr', 'Salón Cristal').contains('Cancelada').should('be.visible');
  });

  it('5. Si no confirma, la reserva no se cancela', () => {
    cy.intercept('GET', '**/api/reservas', { success: true, data: [reserva('Confirmada')] });
    cy.intercept('DELETE', `**/api/reservas/${RES_ID}`, cy.spy().as('deleteSpy'));
    cy.visitarComo(1, '/reservas');
    cy.on('window:confirm', () => false);
    cy.contains('tr', 'Salón Cristal').contains('button', 'Cancelar').click();
    cy.get('@deleteSpy').should('not.have.been.called');
    cy.contains('tr', 'Salón Cristal').contains('Confirmada').should('be.visible');
  });
});
