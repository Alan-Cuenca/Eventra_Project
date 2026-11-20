/**
 * flujo_trabajador.cy.js — EVENTRA E2E: flujo funcional del Trabajador (rol 3)
 * =============================================================================
 * - Inicia sesión por la pantalla real y llega al dashboard interno.
 * - Completa SUS actividades (la petición va filtrada por responsable_id).
 * - Un error del backend se muestra como aviso amigable sin alterar el progreso.
 * - No ve acciones de gestión: crear/eliminar actividades, aprobar cotizaciones,
 *   cancelar reservas.
 * Los permisos de rutas por rol se prueban en guardas_por_rol.cy.js.
 * =============================================================================
 */
const TRABAJADOR_ID = 'usr-e2e-3'; // id que crea cy.visitarComo(3, ...)

const actividad = (id, descripcion, estado) => ({ id, evento_titulo: 'Boda Pérez', descripcion, estado });

describe('Flujo E2E del Trabajador', () => {
  beforeEach(() => {
    cy.apiVacia();
  });

  it('1. Inicia sesión por la pantalla de login y llega al dashboard interno', () => {
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 200,
      body: {
        success: true,
        token: 'jwt-e2e-login-trabajador',
        data: { id: TRABAJADOR_ID, rol_id: 3, rol_nombre: 'Trabajador', nombre_completo: 'Tomás Trabajador', email: 'tomas@e2e.test', empresa_id: 1, empresa_slug: 'empresa-e2e' },
      },
    }).as('login');

    cy.visit('/login');
    cy.get('#login-email').type('tomas@e2e.test');
    cy.get('#login-password').type('ClaveSegura2026!', { log: false });
    cy.get('#login-submit-btn').click();

    cy.wait('@login').its('request.body').should('deep.equal', { email: 'tomas@e2e.test', password: 'ClaveSegura2026!' });
    cy.location('pathname').should('eq', '/dashboard');
    cy.window().its('localStorage').invoke('getItem', 'token').should('eq', 'jwt-e2e-login-trabajador');
  });

  it('2. Completa una actividad propia y el progreso se actualiza', () => {
    cy.intercept('GET', '**/api/actividades*', (req) => {
      expect(req.query.responsable_id, 'solo pide sus propias actividades').to.eq(TRABAJADOR_ID);
      req.reply({
        success: true,
        data: [actividad('a1', 'Montar centros de mesa', 'Pendiente'), actividad('a2', 'Probar sonido', 'Completada')],
      });
    }).as('getActividades');
    cy.intercept('PATCH', '**/api/actividades/a1/estado', { success: true, data: { id: 'a1', estado: 'Completada' } })
      .as('patchActividad');

    cy.visitarComo(3, '/actividades');
    cy.wait('@getActividades');
    cy.contains('h1', 'Mis Actividades Asignadas').should('be.visible');
    cy.contains('1 de 2 Tareas').should('be.visible');

    cy.contains('Montar centros de mesa')
      .parents('.group')
      .find('button[aria-label="Marcar como completada"]')
      .click();

    cy.wait('@patchActividad').its('request.body').should('deep.equal', { estado: 'Completada' });
    cy.contains('Tarea completada con éxito').should('be.visible');
    cy.contains('2 de 2 Tareas').should('be.visible');
  });

  it('3. Si el backend rechaza el cambio, avisa y no altera el progreso', () => {
    cy.intercept('GET', '**/api/actividades*', { success: true, data: [actividad('a1', 'Montar centros de mesa', 'Pendiente')] });
    cy.intercept('PATCH', '**/api/actividades/a1/estado', {
      statusCode: 403, body: { success: false, message: 'Solo puedes actualizar tus propias actividades.' },
    });

    cy.visitarComo(3, '/actividades');
    cy.get('button[aria-label="Marcar como completada"]').click();
    cy.contains(/Error al actualizar el estado/).should('be.visible');
    cy.contains('0 de 1 Tareas').should('be.visible');
    cy.get('button[aria-label="Marcar como completada"]').should('exist');
  });

  it('4. No ve botones para crear ni eliminar actividades', () => {
    cy.intercept('GET', '**/api/actividades*', { success: true, data: [actividad('a1', 'Montar centros de mesa', 'Pendiente')] });
    cy.visitarComo(3, '/actividades');
    cy.contains('Montar centros de mesa').should('be.visible');
    cy.contains('button', /nueva actividad|crear|eliminar|borrar/i).should('not.exist');
  });

  it('5. En cotizaciones y reservas no ve acciones de gestión', () => {
    cy.intercept('GET', '**/api/cotizaciones', {
      success: true,
      data: [{ id: 'c0000000-0000-4000-8000-000000000001', cliente_nombres: 'Ana', cliente_apellidos: 'Pérez', fecha_estimada_evento: '2027-02-14', total_calculado: '1500.00', estado: 'Pendiente' }],
    });
    cy.visitarComo(3, '/cotizaciones');
    cy.contains('td', 'Ana Pérez').should('be.visible');
    cy.contains('button', 'Aprobar').should('not.exist');
    cy.contains('button', 'Rechazar').should('not.exist');

    cy.intercept('GET', '**/api/reservas', {
      success: true,
      data: [{ id: 'r0000000-0000-4000-8000-000000000001', salon_o_lugar: 'Salón Cristal', salon: 'Salón Cristal', fecha_evento: '2027-02-14', hora_inicio: '19:00:00', hora_fin: '02:00:00', estado: 'Confirmada' }],
    });
    cy.visitarComo(3, '/reservas');
    cy.contains('Salón Cristal').should('be.visible');
    cy.contains('button', /^Cancelar$/).should('not.exist');
    cy.contains('button', 'Reactivar').should('not.exist');
  });
});
