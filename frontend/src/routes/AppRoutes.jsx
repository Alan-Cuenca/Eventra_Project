import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { DashboardLayout } from '../layouts/DashboardLayout';

// ── Autenticación ────────────────────────────────────────────────────────────
import { Login } from '../pages/auth/Login';
import { Registro } from '../pages/auth/Registro';

// ── Portal del Cliente (rol_id = 4) ─────────────────────────────────────────
import { PortalClientePage } from '../pages/clients/PortalClientePage';

// ── Panel de Gestión Interna (rol_id = 1,2,3) ────────────────────────────────
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { EventsPage } from '../pages/events/EventsPage';
import { QuotesPage } from '../pages/quotes/QuotesPage';
import { ServicesPage } from '../pages/services/ServicesPage';
import { ClientsPage } from '../pages/clients/ClientsPage';
import { ROLES } from '../services/mockData';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* ── Rutas Públicas ──────────────────────────────────────────────── */}
      <Route path="/login"    element={<Login />} />
      <Route path="/registro" element={<Registro />} />

      {/* ── Portal Cliente (protegido — exclusivo rol 4) ─────────────────── */}
      {/* Cualquier usuario autenticado puede acceder; el Login ya garantiza  */}
      {/* que solo los Clientes son enviados aquí.                            */}
      <Route element={<ProtectedRoute />}>
        <Route path="/portal-cliente" element={<PortalClientePage />} />
      </Route>

      {/* ── Panel Interno (Dashboard) — roles 1, 2, 3 ───────────────────── */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/eventos"   element={<EventsPage />} />
          <Route path="/cotizador" element={<QuotesPage />} />
          <Route path="/servicios" element={<ServicesPage />} />

          {/* Solo Admin y Gerente */}
          <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.GERENTE]} />}>
            <Route path="/clientes" element={<ClientsPage />} />
          </Route>
        </Route>
      </Route>

      {/* ── Redirección por defecto ──────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};
