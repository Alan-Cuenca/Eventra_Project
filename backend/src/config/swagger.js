import swaggerJsdoc from 'swagger-jsdoc';

/**
 * Configuración de swagger-jsdoc para EVENTRA API.
 *
 * swagger-jsdoc escanea los archivos de rutas buscando comentarios
 * en formato OpenAPI 3.0 (bloques @openapi o @swagger dentro de JSDoc)
 * y los compila en un objeto swaggerSpec listo para swagger-ui-express.
 */
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title:       'API EVENTRA SaaS',
      version:     '1.0.0',
      description: 'Documentación de los endpoints del sistema de gestión de eventos. ' +
                   'La mayoría de rutas requieren un Bearer Token JWT en el header Authorization.',
      contact: {
        name:  'Equipo EVENTRA',
        email: 'soporte@eventra.com',
      },
      license: {
        name: 'ISC',
      },
    },
    servers: [
      {
        url:         'http://localhost:3000',
        description: 'Servidor de desarrollo local',
      },
    ],
    // ── Esquema de seguridad global ──────────────────────────────────────────
    // Permite a Swagger UI enviar el JWT en el header Authorization: Bearer <token>
    components: {
      securitySchemes: {
        bearerAuth: {
          type:         'http',
          scheme:       'bearer',
          bearerFormat: 'JWT',
          description:  'Ingresa el token JWT obtenido en /api/auth/login',
        },
      },
      schemas: {
        // ── Respuesta de error genérica ──────────────────────────────────────
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string',  example: 'Mensaje de error descriptivo.' },
          },
        },
      },
    },
    // Aplicar seguridad Bearer por defecto a todas las rutas
    security: [{ bearerAuth: [] }],
  },

  // Archivos donde swagger-jsdoc buscará los comentarios @openapi
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
