import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import clienteRoutes from './routes/clienteRoutes.js';

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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
