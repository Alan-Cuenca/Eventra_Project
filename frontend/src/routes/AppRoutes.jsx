import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { DashboardLayout } from '../layouts/DashboardLayout';

// ── Super Administrador (ADMIN_GLOBAL, rol_id = 5) ──────────────────────────
import { SuperAdminRoute } from '../components/super-admin/SuperAdminRoute';
import { SuperAdminLayout } from '../layouts/SuperAdminLayout';
import { GlobalDashboardPage } from '../pages/super-admin/GlobalDashboardPage';
import { EmpresasManagementPage } from '../pages/super-admin/EmpresasManagementPage';

// ── Autenticación ──────────────────────────────────────────────────────────
import { Login } from '../pages/auth/Login';
import { RegistroClientePortal } from '../pages/auth/RegistroClientePortal';
import { PortalRedirect } from '../pages/auth/PortalRedirect';
import { CompletarRegistro } from '../pages/auth/CompletarRegistro';
import { PrimerLoginCambioPassword } from '../pages/auth/PrimerLoginCambioPassword';
import { ColaboradoresPage } from '../pages/admin/ColaboradoresPage';

// ── Sitio Web Público SaaS EVENTRA (Multi-página) ─────────────────────────
import { PublicLayout } from '../pages/public/PublicLayout';
import { Home }         from '../pages/public/Home';
import { Features }     from '../pages/public/Features';
import { EvaraAI }      from '../pages/public/EvaraAI';
import { Pricing }      from '../pages/public/Pricing';


// ── Portal del Cliente (rol_id = 4) ─────────────────────────────────────────
import { PortalClientePage } from '../pages/clients/PortalClientePage';
import { SolicitudesCliente } from '../pages/portal/SolicitudesCliente';
import { GestorSolicitudes } from '../pages/admin/GestorSolicitudes';
import { ReportesPage } from '../pages/admin/ReportesPage';

// ── Panel de Gestión Interna ─────────────────────────────────────────────────
import { DashboardPage }  from '../pages/dashboard/DashboardPage';
import { EventsPage }     from '../pages/events/EventsPage';
import { EventDetailPage } from '../pages/events/EventDetailPage';
import { EventoForm }      from '../pages/events/EventoForm';

// ── Módulo Cotizaciones ───────────────────────────────────────────────────────
import { CotizacionesList } from '../pages/cotizaciones/CotizacionesList';
import { CotizacionForm }   from '../pages/cotizaciones/CotizacionForm';
import { CotizadorPage }    from '../pages/cotizaciones/CotizadorPage';

// ── Módulo Reservas ───────────────────────────────────────────────────────────
import { ReservasList } from '../pages/reservas/ReservasList';
import { ReservaForm }  from '../pages/reservas/ReservaForm';

// ── Catálogo ──────────────────────────────────────────────────────────────────
import { ServiciosList } from '../pages/catalogo/ServiciosList';
import { ServicioForm }  from '../pages/catalogo/ServicioForm';
import { PaquetesList }  from '../pages/catalogo/PaquetesList';
import { PaqueteForm }   from '../pages/catalogo/PaqueteForm';

// ── CRM Clientes ──────────────────────────────────────────────────────────────
import { ClientsPage }   from '../pages/clients/ClientsPage';
import { ClienteForm }   from '../pages/clients/ClienteForm';

// ── Proveedores ───────────────────────────────────────────────────────────────
import { ProveedoresList } from '../pages/proveedores/ProveedoresList';
import { ProveedorForm }   from '../pages/proveedores/ProveedorForm';

// ── Actividades ───────────────────────────────────────────────────────────────
import { MisActividades }  from '../pages/actividades/MisActividades';
import { ActividadesList } from '../pages/actividades/ActividadesList';

// ── Pagos ─────────────────────────────────────────────────────────────────────
import PagoProcesador from '../pages/pagos/PagoProcesador';
import PagosList from '../pages/pagos/PagosList';

// ── Suscripciones SaaS ────────────────────────────────────────────────────────
import MiSuscripcion from '../pages/admin/MiSuscripcion';
import FacturacionSuperAdmin from '../pages/superadmin/FacturacionSuperAdmin';

import { useAuth } from '../context/AuthContext';

import { ROLES } from '../services/mockData';

const ActividadesRouter = () => {
  const { isTrabajador } = useAuth();
  return isTrabajador ? <MisActividades /> : <ActividadesList />;
};

const SolicitudesRouter = () => {
  const { isCliente } = useAuth();
  return isCliente ? <SolicitudesCliente /> : <GestorSolicitudes />;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* ── Sitio Web Público Multi-Página (bajo PublicLayout) ───────────── */}
      <Route element={<PublicLayout />}>
        <Route path="/"                 element={<Home />} />
        <Route path="/funcionalidades"  element={<Features />} />
        <Route path="/evara-ai"         element={<EvaraAI />} />
        <Route path="/precios"          element={<Pricing />} />
      </Route>

      {/* ── Autenticación y Acceso (Aisladas, fuera de PublicLayout) ──────── */}
      <Route path="/login"                  element={<Login />} />
      <Route path="/registro"               element={<PortalRedirect />} />
      <Route path="/portal/:slug/registro"  element={<RegistroClientePortal />} />
      <Route path="/completar-registro"     element={<CompletarRegistro />} />
      <Route path="/primer-acceso/cambiar-password" element={<PrimerLoginCambioPassword />} />

      {/* ── Portal Cliente exclusivo (rol 4) ──────────────────────────────── */}
      <Route element={<ProtectedRoute />}>
        <Route path="/portal-cliente" element={<PortalClientePage />} />
        <Route path="/portal-cliente/solicitudes" element={<SolicitudesCliente />} />
      </Route>

      {/* ── Consola del Super Administrador (rol_id = 5 / ADMIN_GLOBAL) ──────── */}
      <Route element={<SuperAdminRoute />}>
        <Route element={<SuperAdminLayout />}>
          <Route path="/super-admin" element={<Navigate to="/super-admin/dashboard" replace />} />
          <Route path="/super-admin/dashboard" element={<GlobalDashboardPage />} />
          <Route path="/super-admin/empresas" element={<EmpresasManagementPage />} />
          <Route path="/super-admin/facturacion" element={<FacturacionSuperAdmin />} />
        </Route>
      </Route>

      {/* ── Panel Interno — roles 1, 2, 3 ─────────────────────────────────── */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Eventos */}
          <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.GERENTE]} />}>
            <Route path="/eventos/nuevo"      element={<EventoForm />} />
            <Route path="/eventos/editar/:id" element={<EventoForm />} />
          </Route>
          <Route path="/eventos"          element={<EventsPage />} />
          <Route path="/eventos/:id"      element={<EventDetailPage />} />

          {/* Actividades (Routing según rol) */}
          <Route path="/actividades"      element={<ActividadesRouter />} />

          {/* Cotizaciones */}
          <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.GERENTE, ROLES.TRABAJADOR, ROLES.CLIENTE]} />}>
            <Route path="/cotizaciones"       element={<CotizacionesList />} />
            <Route path="/cotizaciones/nueva" element={<CotizacionForm />} />
            <Route path="/cotizador"          element={<CotizadorPage />} />
          </Route>

          {/* Reservas */}
          <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.GERENTE, ROLES.TRABAJADOR, ROLES.CLIENTE]} />}>
            <Route path="/reservas"       element={<ReservasList />} />
            <Route path="/reservas/nueva" element={<ReservaForm />} />
          </Route>

          {/* Pagos */}
          <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.GERENTE, ROLES.TRABAJADOR, ROLES.CLIENTE]} />}>
            <Route path="/pagos/procesar" element={<PagoProcesador />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.GERENTE, ROLES.TRABAJADOR]} />}>
            <Route path="/pagos"          element={<PagosList />} />
          </Route>

          {/* Solicitudes de Modificación */}
          <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.GERENTE, ROLES.CLIENTE]} />}>
            <Route path="/solicitudes" element={<SolicitudesRouter />} />
          </Route>

          {/* Admin + Gerente únicamente */}
          <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.GERENTE]} />}>
            <Route path="/clientes"              element={<ClientsPage />} />
            <Route path="/clientes/nuevo"        element={<ClienteForm />} />
            <Route path="/clientes/editar/:id"   element={<ClienteForm />} />

            <Route path="/servicios"             element={<ServiciosList />} />
            <Route path="/servicios/nuevo"       element={<ServicioForm />} />
            <Route path="/servicios/editar/:id"  element={<ServicioForm />} />

            <Route path="/paquetes"              element={<PaquetesList />} />
            <Route path="/paquetes/nuevo"        element={<PaqueteForm />} />
            <Route path="/paquetes/editar/:id"   element={<PaqueteForm />} />

            <Route path="/proveedores"           element={<ProveedoresList />} />
            <Route path="/proveedores/nuevo"     element={<ProveedorForm />} />
            <Route path="/proveedores/editar/:id" element={<ProveedorForm />} />

            {/* Dashboards Analíticos y Reportes Corporativos */}
            <Route path="/reportes" element={<ReportesPage />} />
          </Route>

          {/* Admin únicamente (Gestión de Equipo, Colaboradores y Suscripción SaaS) */}
          <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
            <Route path="/colaboradores" element={<ColaboradoresPage />} />
            <Route path="/mi-suscripcion" element={<MiSuscripcion />} />
          </Route>
        </Route>
      </Route>

      {/* ── Fallback ──────────────────────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};
