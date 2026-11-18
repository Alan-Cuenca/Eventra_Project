import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { exigirEntornoValido } from './config/validarEntorno.js';
import { modoMantenimiento } from './middlewares/configuracionPlataforma.js';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';
import authRoutes from './routes/authRoutes.js';
import clienteRoutes from './routes/clienteRoutes.js';
import servicioRoutes from './routes/servicioRoutes.js';
import paqueteRoutes from './routes/paqueteRoutes.js';
import cotizacionRoutes from './routes/cotizacionRoutes.js';
import reservaRoutes from './routes/reservaRoutes.js';
import eventoRoutes from './routes/eventoRoutes.js';
import actividadRoutes from './routes/actividadRoutes.js';
import pagoRoutes from './routes/pagoRoutes.js';
import proveedorRoutes from './routes/proveedorRoutes.js';
import solicitudRoutes from './routes/solicitudRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import chatbotRoutes from './routes/chatbotRoutes.js';
import usuarioRoutes from './routes/usuarioRoutes.js';
import empresaRoutes from './routes/empresaRoutes.js';
import suscripcionRoutes from './routes/suscripcionRoutes.js';
import reporteRoutes from './routes/reporteRoutes.js';
import configuracionRoutes from './routes/configuracionRoutes.js';

dotenv.config();

const app = express();

// Detrás del proxy de Render: necesario para que req.ip sea la IP real del cliente
app.set('trust proxy', 1);

// Cabeceras de seguridad. La API solo sirve JSON, por lo que la CSP no aplica a /api-docs (Swagger)
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS: lista de orígenes permitidos en CORS_ORIGINS (separados por coma). Sin definir, queda abierto.
const origenesPermitidos = (process.env.CORS_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors(origenesPermitidos.length > 0
  ? { origin: (origin, cb) => (!origin || origenesPermitidos.includes(origin) ? cb(null, true) : cb(new Error('Origen no permitido por CORS'))) }
  : undefined));

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Modo mantenimiento (interruptor del Super Admin): 503 para todo menos Super Admin, auth y salud
app.use(modoMantenimiento);

// Express 5 deja req.body en undefined si no hay cuerpo parseable: se normaliza a {}
app.use((req, res, next) => {
  if (req.body === undefined) req.body = {};
  next();
});

// --- Documentación interactiva de la API (Swagger UI) ---
// Accesible en: http://localhost:3000/api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'EVENTRA API Docs',
  swaggerOptions: {
    persistAuthorization: true,   // Mantiene el Bearer Token entre recargas
    displayRequestDuration: true, // Muestra el tiempo de cada petición
  },
}));

app.get('/', (req, res) => {
  res.status(200).json({ 
      estado: 'OK', 
      mensaje: 'API de EVENTRA SaaS en línea y funcionando correctamente.' 
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'EVENTRA Backend API is running' });
});

// --- Rutas de autenticación ---
app.use('/api/auth', authRoutes);

// --- Rutas de clientes (protegidas con JWT) ---
app.use('/api/clientes', clienteRoutes);

// --- Rutas de servicios (JWT + RBAC: POST solo Admin y Gerente) ---
app.use('/api/servicios', servicioRoutes);

// --- Rutas de paquetes (JWT + RBAC: POST solo Admin y Gerente) ---
app.use('/api/paquetes', paqueteRoutes);

// --- Rutas de cotizaciones (JWT + RBAC: POST para Admin, Gerente y Trabajador) ---
app.use('/api/cotizaciones', cotizacionRoutes);

// --- Rutas de reservas (JWT + RBAC: POST para Admin, Gerente y Trabajador) ---
app.use('/api/reservas', reservaRoutes);

// --- Rutas de eventos (JWT + RBAC: POST y PATCH según rol) ---
app.use('/api/eventos', eventoRoutes);

// --- Rutas de actividades (JWT + RBAC: POST solo Admin y Gerente) ---
app.use('/api/actividades', actividadRoutes);

// --- Rutas de pagos (JWT + RBAC: POST solo Admin y Gerente; GET Admin/Gerente/Trabajador) ---
app.use('/api/pagos', pagoRoutes);

// --- Rutas de proveedores (JWT + RBAC: POST/PUT Admin y Gerente; GET Admin/Gerente/Trabajador) ---
app.use('/api/proveedores', proveedorRoutes);

// --- Rutas de solicitudes de modificación (JWT; PATCH estado solo Admin y Gerente) ---
app.use('/api/solicitudes', solicitudRoutes);

// --- Rutas del dashboard (JWT + RBAC: solo Admin y Gerente) ---
app.use('/api/dashboard', dashboardRoutes);

// --- Rutas del chatbot EVARA (JWT; catálogo dinámico por empresa, gpt-4o-mini) ---
app.use('/api/chatbot', chatbotRoutes);

// --- Rutas de usuarios internos (JWT + RBAC: solo Admin) ---
app.use('/api/usuarios', usuarioRoutes);

// --- Rutas de administración global de inquilinos (JWT + RBAC: solo Super_Admin) ---
app.use('/api/empresas', empresaRoutes);

// --- Rutas de suscripciones y facturación SaaS (JWT + RBAC: Admin y Super_Admin) ---
app.use('/api/suscripciones', suscripcionRoutes);

// --- Rutas de reportes corporativos y analítica (JWT + RBAC: Admin y Gerente) ---
app.use('/api/reportes', reporteRoutes);

// --- Rutas de configuración global SaaS (Planes, Límites y Transferencias) ---
app.use('/api/configuracion', configuracionRoutes);

// Manejador global para rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).json({
      estado: 'Error',
      mensaje: 'Ruta no encontrada. Por favor, verifica la URL.'
  });
});

// Manejador global de errores: nunca devuelve stack traces ni HTML al cliente
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || (err.type === 'entity.parse.failed' ? 400 : 500);
  if (status >= 500) console.error('[app] Error no controlado:', err.message);
  const mensajes = {
    400: err.type === 'entity.parse.failed' ? 'El cuerpo de la solicitud no es un JSON válido.' : (err.message || 'Solicitud inválida.'),
    403: 'Origen no permitido.',
    413: 'El archivo o los datos enviados son demasiado grandes.',
  };
  const mensaje = err.code === 'LIMIT_FILE_SIZE'
    ? 'El archivo supera el tamaño máximo permitido.'
    : (mensajes[status] || (status >= 500 ? 'Error interno del servidor.' : err.message));
  res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : status).json({ success: false, message: mensaje });
});

// Exporta la instancia Express para que los tests (supertest) puedan
// importarla directamente sin levantar el servidor en un puerto real.
export default app;

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Solo omitir listen en entorno de pruebas Jest (nunca en Render ni producción)
const isTestEnv = Boolean(process.env.JEST_WORKER_ID) || (process.env.NODE_ENV === 'test' && !process.env.RENDER);

if (!isTestEnv) {
  exigirEntornoValido();

  app.listen(PORT, HOST, () => {
    console.log(`Server is running on http://${HOST}:${PORT}`);
  });
}

