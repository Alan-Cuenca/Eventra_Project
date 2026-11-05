// ***********************************************************
// This support/e2e.js is processed and loaded automatically
// before your test files.
// ***********************************************************

// Ignorar excepciones no capturadas de librerías de terceros en el navegador durante tests E2E
Cypress.on('uncaught:exception', (err, runnable) => {
  return false;
});

