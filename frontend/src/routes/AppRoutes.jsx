import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { DashboardLayout } from '../layouts/DashboardLayout';

// ── Autenticación ────────────────────────────────────────────────────────────
import { Login }    from '../pages/auth/Login';
import { Registro } from '../pages/auth/Registro';

// ── Portal del Cliente (rol_id = 4) ─────────────────────────────────────────
import { PortalClientePage } from '../pages/clients/PortalClientePage';

// ── Panel de Gestión Interna (rol_id = 1, 2, 3) ──────────────────────────────
import { DashboardPage }  from '../pages/dashboard/DashboardPage';
import { EventsPage }     from '../pages/events/EventsPage';
import { QuotesPage }     from '../pages/quotes/QuotesPage';
import { ServicesPage }   from '../pages/services/ServicesPage';

// ── Módulo CRM — Clientes ─────────────────────────────────────────────────────
import { ClientsPage }   from '../pages/clients/ClientsPage';
import { ClienteForm }   from '../pages/clients/ClienteForm';

import { ROLES } from '../services/mockData';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* ── Rutas Públicas ──────────────────────────────────────────────── */}
      <Route path="/login"    element={<Login />} />
      <Route path="/registro" element={<Registro />} />

      {/* ── Portal Cliente exclusivo (rol 4) ─────────────────────────────── */}
      <Route element={<ProtectedRoute />}>
        <Route path="/portal-cliente" element={<PortalClientePage />} />
      </Route>

      {/* ── Panel Interno — roles 1, 2, 3 ───────────────────────────────── */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/eventos"   element={<EventsPage />} />
          <Route path="/cotizador" element={<QuotesPage />} />
          <Route path="/servicios" element={<ServicesPage />} />

          {/* ── Módulo CRM — Solo Admin y Gerente ─────────────────────────── */}
          <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.GERENTE]} />}>
            {/* Lista principal */}
            <Route path="/clientes"              element={<ClientsPage />} />
            {/* Formulario: crear nuevo cliente */}
            <Route path="/clientes/nuevo"        element={<ClienteForm />} />
            {/* Formulario: editar cliente existente */}
            <Route path="/clientes/editar/:id"   element={<ClienteForm />} />
          </Route>
        </Route>
      </Route>

      {/* ── Fallback ─────────────────────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};
