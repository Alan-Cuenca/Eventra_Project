import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { EventsPage } from '../pages/events/EventsPage';
import { QuotesPage } from '../pages/quotes/QuotesPage';
import { ServicesPage } from '../pages/services/ServicesPage';
import { ClientsPage } from '../pages/clients/ClientsPage';
import { ROLES } from '../services/mockData';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Rutas Públicas */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Rutas Protegidas dentro de DashboardLayout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/eventos" element={<EventsPage />} />
          <Route path="/cotizador" element={<QuotesPage />} />
          <Route path="/servicios" element={<ServicesPage />} />
          
          {/* Rutas exclusivas para Admin y Gerente */}
          <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.GERENTE]} />}>
            <Route path="/clientes" element={<ClientsPage />} />
          </Route>
        </Route>
      </Route>

      {/* Redirección por defecto */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
