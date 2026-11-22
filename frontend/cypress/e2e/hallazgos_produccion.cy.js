/**
 * hallazgos_produccion.cy.js — Regresiones encontradas probando el sitio desplegado con sesión real.
 */
const COT_LIBRE = 'c0000000-0000-4000-8000-0000000000f1';
const COT_RESERVADA = 'c0000000-0000-4000-8000-0000000000f2';

describe('Formulario de reserva', () => {
  beforeEach(() => {
    cy.apiVacia();
    cy.intercept('GET', '**/api/cotizaciones', { success: true, data: [
      { id: COT_LIBRE, cliente_nombres: 'Libre', cliente_apellidos: 'Uno', fecha_estimada_evento: '2031-06-15', total_calculado: '500', estado: 'Aprobada' },
      { id: COT_RESERVADA, cliente_nombres: 'Reservada', cliente_apellidos: 'Dos', fecha_estimada_evento: '2031-06-15', total_calculado: '500', estado: 'Aprobada' },
    ] });
    cy.intercept('GET', '**/api/reservas', { success: true, data: [
      { id: 'r1', cotizacion_id: COT_RESERVADA, salon: 'Salón A', estado: 'Confirmada' },
    ] });
  });

  it('no ofrece cotizaciones que ya tienen una reserva activa', () => {
    cy.visitarComo(1, '/reservas/nueva');
    cy.get('select[name="cotizacion_id"] option').should('have.length', 2); // placeholder + libre
    cy.get('select[name="cotizacion_id"]').should('contain', 'Libre Uno').and('not.contain', 'Reservada Dos');
  });

  it('un 409 por cotización ya reservada muestra la causa real, no "salón ocupado"', () => {
    cy.intercept('POST', '**/api/reservas', { statusCode: 409, body: { success: false, message: 'Esta cotización ya tiene una reserva activa. Cancélala antes de crear otra.' } });
    cy.visitarComo(1, '/reservas/nueva');
    cy.get('select[name="cotizacion_id"]').select(COT_LIBRE);
    cy.get('input[name="salon"]').type('Salón B');
    cy.get('input[name="fecha"]').type('2031-06-15');
    cy.contains('button', 'Guardar y Agendar Reserva').click();
    cy.contains('Esta cotización ya tiene una reserva activa').should('be.visible');
    cy.contains('ya está reservado en esa fecha y horario').should('not.exist');
  });
});

describe('Acceso del cliente al portal', () => {
  const cliente = { id: 'c1000000-0000-4000-8000-000000000001', nombres: 'Ana', apellidos: 'Pérez', email: 'ana@correo.com', estado_activo: true };

  beforeEach(() => {
    cy.apiVacia();
    cy.intercept('GET', '**/api/clientes', { success: true, data: [cliente] });
  });

  it('el Administrador envía el acceso al portal desde la ficha del cliente', () => {
    cy.intercept('POST', '**/api/auth/invitar', { statusCode: 200, body: { success: true, correo_enviado: true, message: 'Invitación enviada exitosamente por correo electrónico.', data: { enlace_registro: 'https://x/completar-registro?token=t' } } }).as('invitar');
    cy.visitarComo(1, '/clientes');
    cy.contains('button', 'Enviar acceso al portal').click();
    cy.wait('@invitar').its('request.body').should('deep.equal', { email: 'ana@correo.com', rol_id: 4 });
    cy.get('[data-cy="acceso-portal-aviso"]').should('contain', 'Invitación enviada').and('not.contain', 'Enlace para compartir');
  });

  it('si el correo no se pudo enviar, muestra el enlace para compartirlo', () => {
    cy.intercept('POST', '**/api/auth/invitar', { statusCode: 200, body: { success: true, correo_enviado: false, message: 'La invitación se creó, pero no se pudo enviar el correo.', data: { enlace_registro: 'https://x/completar-registro?token=abc' } } });
    cy.visitarComo(1, '/clientes');
    cy.contains('button', 'Enviar acceso al portal').click();
    cy.get('[data-cy="acceso-portal-aviso"]').should('contain', 'completar-registro?token=abc');
  });

  it('el Gerente no ve el botón (la invitación es exclusiva del Administrador)', () => {
    cy.visitarComo(2, '/clientes');
    cy.contains('Ana').should('exist');
    cy.contains('button', 'Enviar acceso al portal').should('not.exist');
  });

  it('el registro público explica qué hacer si la empresa ya lo tenía como cliente', () => {
    cy.intercept('GET', '**/api/auth/portal/*', { success: true, data: { id: 1, nombre_comercial: 'Helados', slug: 'helados', estado_activo: true } });
    cy.intercept('POST', '**/api/clientes/registro-publico', { statusCode: 409, body: { success: false, error: 'CLIENTE_YA_REGISTRADO', message: 'Helados ya te tiene registrado como cliente. Pide a la empresa que te envíe el acceso al portal a tu correo.' } });
    cy.visit('/portal/helados/registro');
    cy.get('#reg-nombres').type('Ana');
    cy.get('#reg-apellidos').type('Pérez');
    cy.get('#reg-email').type('ana@correo.com');
    cy.get('#reg-telefono').type('0990000000');
    cy.get('#reg-password').type('ClaveSegura2026!');
    cy.get('#reg-confirm-password').type('ClaveSegura2026!');
    cy.get('#reg-submit-btn').click();
    cy.contains('Pide a la empresa que te envíe el acceso al portal').should('be.visible');
  });
});

describe('Indicador de conexión', () => {
  it('mientras comprueba no dice "Sin conexión"', () => {
    cy.apiVacia();
    cy.intercept('GET', '**/api/health', (req) => req.reply({ delay: 2500, body: { status: 'ok' } }));
    cy.visitarComo(1, '/dashboard');
    cy.contains('Conectando…').should('exist');
    cy.contains('Sin conexión').should('not.exist');
    cy.contains('En línea', { timeout: 6000 }).should('exist');
  });
});
