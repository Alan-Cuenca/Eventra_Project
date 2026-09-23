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
// ── Módulo Catálogo (Servicios y Paquetes) ───────────────────────────────────
import { ServiciosList } from '../pages/catalogo/ServiciosList';
import { ServicioForm }  from '../pages/catalogo/ServicioForm';
import { PaquetesList }  from '../pages/catalogo/PaquetesList';
import { PaqueteForm }   from '../pages/catalogo/PaqueteForm';


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

          {/* ── Módulos de Gestión — Solo Admin y Gerente ─────────────────── */}
          <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.GERENTE]} />}>
            {/* Clientes */}
            <Route path="/clientes"              element={<ClientsPage />} />
            <Route path="/clientes/nuevo"        element={<ClienteForm />} />
            <Route path="/clientes/editar/:id"   element={<ClienteForm />} />
            
            {/* Catálogo: Servicios */}
            <Route path="/servicios"             element={<ServiciosList />} />
            <Route path="/servicios/nuevo"       element={<ServicioForm />} />
            <Route path="/servicios/editar/:id"  element={<ServicioForm />} />

            {/* Catálogo: Paquetes */}
            <Route path="/paquetes"              element={<PaquetesList />} />
            <Route path="/paquetes/nuevo"        element={<PaqueteForm />} />
            <Route path="/paquetes/editar/:id"   element={<PaqueteForm />} />
          </Route>

        </Route>
      </Route>

      {/* ── Fallback ─────────────────────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};
