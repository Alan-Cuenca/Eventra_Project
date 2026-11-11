/**
 * flujo_cliente.cy.js — EVENTRA SaaS E2E Test Suite
 * =============================================================================
 * Scope: Cliente — Pruebas End-to-End de UI y Navegación del Cliente
 * 
 * Flujo Completo:
 * 1. Acceso y validación del Portal Público de la Empresa (/portal/:slug).
 * 2. Cotizador Dinámico Stepper (Paso 1: Datos, Paso 2: Paquete, Paso 3: Servicios, Paso 4: Resumen).
 * 3. Verificación del cálculo dinámico de precios en tiempo real.
 * =============================================================================
 */

describe('Flujo E2E del Cliente y Cotizador Dinámico', () => {

  const MOCK_SLUG = 'banquetes-elite';

  beforeEach(() => {
    // Configurar sesión de prueba en localStorage para rutas autenticadas
    cy.window().then((win) => {
      win.localStorage.setItem('token', 'fake-jwt-token-cliente-test');
      win.localStorage.setItem('user', JSON.stringify({
        id: 'usr-cliente-test-01',
        nombres: 'Cliente',
        apellidos: 'Demo',
        email: 'cliente.demo@eventra.com',
        rol_id: 4,
        empresa_id: 1,
        rol_nombre: 'Cliente',
      }));
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 1: Navegación y Validación del Portal Público (/portal/:slug)
  // ───────────────────────────────────────────────────────────────────────────
  it('1. Debe navegar al portal público de la empresa y renderizar su identidad de marca', () => {
    // Interceptar consulta de resolución del portal público
    cy.intercept('GET', '**/api/auth/portal/*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          id: 1,
          nombre_comercial: 'Banquetes Elite Guayaquil',
          slug: MOCK_SLUG,
          logo_url: null,
          color_primario: '#4D7182',
          estado_activo: true,
        },
      },
    }).as('getPortalInfo');

    // Navegar al portal público
    cy.visit(`/portal/${MOCK_SLUG}`);

    // Validar redirección / carga de la pantalla de bienvenida / registro de clientes del portal
    cy.url().should('include', `/portal/${MOCK_SLUG}`);
    cy.contains(/Banquetes Elite|Registro|Portal/i, { timeout: 6000 }).should('be.visible');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 2: Flujo Completo del Cotizador Dinámico y Cálculo de Precios en Pantalla
  // ───────────────────────────────────────────────────────────────────────────
  it('2. Debe completar los pasos del Cotizador Dinámico y calcular el precio en vivo', () => {
    // Interceptar peticiones del cotizador
    cy.intercept('GET', '**/api/paquetes', {
      statusCode: 200,
      body: {
        success: true,
        data: [
          {
            id: 'paq-oro',
            nombre: 'Paquete Oro Todo Incluido',
            precio_total: 2500.00,
            servicios_incluidos: ['Catering', 'Fotografía'],
            descuento: '15% OFF',
          },
        ],
      },
    }).as('getPaquetes');

    cy.intercept('GET', '**/api/servicios', {
      statusCode: 200,
      body: {
        success: true,
        data: [
          {
            id: 'srv-dj',
            nombre: 'DJ & Iluminación Robótica',
            categoria: 'Música & Show',
            precio_base: 400.00,
          },
          {
            id: 'srv-pastel',
            nombre: 'Pastel Nupcial Artesanal',
            categoria: 'Bebidas & Gastronomía',
            precio_base: 250.00,
          },
        ],
      },
    }).as('getServicios');

    cy.intercept('POST', '**/api/cotizaciones', {
      statusCode: 201,
      body: {
        success: true,
        data: {
          id: 'cot-generada-e2e',
          total_calculado: 3150.00,
          estado: 'Pendiente',
        },
      },
    }).as('postCotizacion');

    // Navegar a la vista del Cotizador Dinámico
    cy.visit('/cotizador');

    // ── PASO 1: Datos del Cliente y Evento ──
    cy.contains('Cotizador Dinámico').should('be.visible');
    cy.get('#cotizador-nombre').clear().type('Cliente Demo');
    cy.get('#cotizador-email').clear().type('cliente.demo@eventra.com');
    cy.get('#cotizador-telefono').clear().type('0991234567');
    cy.get('#cotizador-tipo-evento').select('Matrimonio');
    cy.get('#cotizador-fecha').type('2027-11-20');
    cy.get('#cotizador-invitados').clear().type('150');

    // Avanzar a Paso 2
    cy.get('#cotizador-next-btn').click();

    // ── PASO 2: Selección de Paquete Base ──
    cy.contains('Selección de Paquete Base').should('be.visible');
    
    // Seleccionar el primer paquete disponible
    cy.get('input[type="radio"][name="paquete_id"]').not('#paquete-ninguno').first().check({ force: true });

    // Verificar que el Total Estimado en el sidebar cambie de $0 a un valor superior
    cy.get('[data-cy="precio-total"]').should('not.contain', '$0');

    // Avanzar a Paso 3
    cy.get('#cotizador-next-btn').click();

    // ── PASO 3: Selección de Servicios Adicionales ──
    cy.contains('Servicios Adicionales').should('be.visible');

    // Seleccionar un servicio complementario (checkbox)
    cy.get('input[type="checkbox"]').first().check({ force: true });

    // Verificar que el widget "Precio en Vivo" y "Total Estimado" recalculen el precio sumando los adicionales
    cy.get('[data-cy="precio-total"]').should('be.visible').and('not.contain', '$0');

    // Avanzar a Paso 4
    cy.get('#cotizador-next-btn').click();

    // ── PASO 4: Resumen y Confirmación ──
    cy.contains(/Resumen y Confirmación|TOTAL ESTIMADO/i).should('be.visible');
    cy.get('#cotizador-submit-btn').should('be.visible').click();

    // ── Confirmación de Éxito ──
    cy.contains('¡Cotización generada!', { timeout: 8000 }).should('be.visible');
    cy.contains(/Total estimado:/i).should('be.visible');
  });

});

