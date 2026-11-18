/**
 * jest.integration.config.js — Tests de integración con Postgres real (embebido).
 * Se ejecutan con `npm run test:integration` y no forman parte de `npm test` (son más lentos).
 */
export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: ['**/tests/integration/**/*.int.js'],
  moduleFileExtensions: ['js', 'json'],
  testTimeout: 120000,
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
};
