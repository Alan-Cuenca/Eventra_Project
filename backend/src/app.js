import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

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

// Exporta la instancia Express para que los tests (supertest) puedan
// importarla directamente sin levantar el servidor en un puerto real.
export default app;

// Solo levanta el servidor cuando el archivo se ejecuta directamente,
// nunca cuando es importado por los tests.
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
