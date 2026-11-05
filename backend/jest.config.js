/**
 * jest.config.js — EVENTRA SaaS Backend Test Suite
 * =============================================================================
 * Configuración oficial de Jest para Node.js con módulos ES nativos (ESM),
 * soporte para supertest, entorno aislado de pruebas y detección de handles.
 * =============================================================================
 */
export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: ['**/tests/**/*.test.js'],
  moduleFileExtensions: ['js', 'json'],
  testTimeout: 10000,
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
};

