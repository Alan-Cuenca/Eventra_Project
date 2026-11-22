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

describe('Configuración global del Super Admin', () => {
  const GUARDADA = {
    plataforma: { nombre_comercial: 'EVENTRA', correo_soporte: 'soporte@real.com' },
    transferencia: { titular: 'Titular Real', numero_cuenta: '2210101010', cedula: '1850116508', correo_notificacion: 'pagos@real.com' },
    planes: { basico_precio: 49, premium_precio: 99, premium_max_usuarios: 60, dias_gracia_facturacion: 5 },
    seguridad: { expiracion_jwt_horas: 8 },
  };

  it('no permite guardar hasta cargar la configuración real, y luego envía esos valores', () => {
    cy.apiVacia();
    cy.intercept('GET', '**/api/configuracion', (req) => req.reply({ delay: 2000, body: { success: true, data: GUARDADA } }));
    cy.intercept('PUT', '**/api/configuracion', (req) => req.reply({ success: true, data: req.body })).as('guardar');
    cy.visitarComo(5, '/super-admin/configuracion');
    cy.get('[data-cy="guardar-configuracion"]').should('be.disabled');
    cy.contains('button', 'Restaurar Predeterminados').should('be.disabled');
    cy.get('[data-cy="guardar-configuracion"]', { timeout: 6000 }).should('not.be.disabled').click();
    cy.wait('@guardar').its('request.body').then((body) => {
      expect(body.transferencia).to.include({ titular: 'Titular Real', numero_cuenta: '2210101010' });
      expect(body.planes).to.include({ premium_max_usuarios: 60, dias_gracia_facturacion: 5 });
      expect(body.plataforma.correo_soporte).to.eq('soporte@real.com');
    });
  });

  it('si no se puede cargar, avisa y mantiene el guardado deshabilitado', () => {
    cy.apiVacia();
    cy.intercept('GET', '**/api/configuracion', { statusCode: 503, body: { success: false, message: 'No se pudo leer' } });
    cy.visitarComo(5, '/super-admin/configuracion');
    cy.get('[data-cy="configuracion-estado-carga"]').should('contain', 'No se pudo cargar la configuración guardada');
    cy.get('[data-cy="guardar-configuracion"]').should('be.disabled');
  });

  it('restaurar predeterminados pide confirmación y conserva los datos bancarios', () => {
    cy.apiVacia();
    cy.intercept('GET', '**/api/configuracion', { success: true, data: GUARDADA });
    cy.intercept('PUT', '**/api/configuracion', (req) => req.reply({ success: true, data: req.body })).as('guardar');
    cy.visitarComo(5, '/super-admin/configuracion');
    cy.on('window:confirm', () => true);
    cy.contains('button', 'Restaurar Predeterminados').should('not.be.disabled').click();
    cy.wait('@guardar').its('request.body.transferencia').should('include', { titular: 'Titular Real', numero_cuenta: '2210101010' });
  });
});

describe('Empresa suspendida con la sesión abierta', () => {
  it('cierra la sesión y explica el motivo en el login', () => {
    cy.apiVacia();
    cy.intercept('GET', '**/api/clientes', { statusCode: 403, body: { success: false, error: 'EMPRESA_SUSPENDIDA', message: 'La empresa asociada a tu cuenta está suspendida. Contacta a soporte de EVENTRA.' } });
    cy.visitarComo(1, '/clientes');
    cy.location('pathname', { timeout: 8000 }).should('eq', '/login');
    cy.contains('La empresa asociada a tu cuenta está suspendida').should('be.visible');
    cy.window().its('localStorage.token').should('be.undefined');
  });
});

describe('Mi Suscripción: consumo real del plan', () => {
  it('muestra "—" mientras carga (no cifras inventadas al límite) y luego el uso real', () => {
    cy.apiVacia();
    cy.intercept('GET', '**/api/suscripciones/consumo', (req) => req.reply({ delay: 2000, body: { success: true, data: { plan: 'Premium', limites: { usuarios: 60, clientes: 200, chatbot: 1525 }, uso: { usuarios: 2, clientes: 0, chatbot: 0 } } } }));
    cy.visitarComo(1, '/mi-suscripcion');
    cy.get('[data-cy="consumo-plan"]').should('contain', '—').and('not.contain', '3 / 3').and('not.contain', '50 / 50');
    cy.get('[data-cy="consumo-plan"]', { timeout: 6000 }).should('contain', '2 / 60').and('contain', '0 / 200').and('contain', '0 / 1525');
  });

  it('los planes se eligen con botones y el comprobante indica el plan elegido', () => {
    cy.apiVacia();
    cy.visitarComo(1, '/mi-suscripcion');
    cy.get('[data-cy="plan-basico"]').click().should('have.attr', 'aria-pressed', 'true');
    cy.contains('Subir PDF del Comprobante de Pago (Básico').should('exist');
  });
});
