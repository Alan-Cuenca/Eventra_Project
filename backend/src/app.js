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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
