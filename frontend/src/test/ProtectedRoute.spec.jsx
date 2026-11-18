import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// useAuth controlado por prueba
let sesion = {};
vi.mock('../context/AuthContext', () => ({ useAuth: () => sesion }));

const { ProtectedRoute } = await import('../routes/ProtectedRoute');

const montar = (rutaInicial, allowedRoles) =>
  render(
    <MemoryRouter initialEntries={[rutaInicial]}>
      <Routes>
        <Route path="/login" element={<div>PAGINA_LOGIN</div>} />
        <Route path="/dashboard" element={<div>PAGINA_DASHBOARD</div>} />
        <Route path="/super-admin/dashboard" element={<div>PAGINA_SUPERADMIN</div>} />
        <Route element={<ProtectedRoute allowedRoles={allowedRoles} />}>
          <Route path="/privada" element={<div>CONTENIDO_PRIVADO</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );

const usuario = (rol) => ({ user: { id: 'u1', rol_id: rol }, token: 't', loading: false, roleId: rol });

beforeEach(() => {
  sesion = {};
});

describe('ProtectedRoute', () => {
  it('muestra la pantalla de carga mientras se valida la sesión', () => {
    sesion = { user: null, token: null, loading: true, roleId: null };
    montar('/privada');
    expect(screen.getByText(/Cargando EVENTRA/i)).toBeInTheDocument();
    expect(screen.queryByText('CONTENIDO_PRIVADO')).not.toBeInTheDocument();
  });

  it('sin sesión redirige a /login', () => {
    sesion = { user: null, token: null, loading: false, roleId: null };
    montar('/privada');
    expect(screen.getByText('PAGINA_LOGIN')).toBeInTheDocument();
  });

  it('sin sesión pero con un portal recordado redirige al login del portal', () => {
    localStorage.setItem('last_tenant_slug', 'mi-empresa');
    sesion = { user: null, token: null, loading: false, roleId: null };
    render(
      <MemoryRouter initialEntries={['/privada']}>
        <Routes>
          <Route path="/portal/:slug/login" element={<div>LOGIN_DEL_PORTAL</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/privada" element={<div>CONTENIDO_PRIVADO</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('LOGIN_DEL_PORTAL')).toBeInTheDocument();
  });

  it('permite el paso cuando el rol está en allowedRoles', () => {
    sesion = usuario(2);
    montar('/privada', [1, 2]);
    expect(screen.getByText('CONTENIDO_PRIVADO')).toBeInTheDocument();
  });

  it('sin allowedRoles basta con estar autenticado', () => {
    sesion = usuario(4);
    montar('/privada');
    expect(screen.getByText('CONTENIDO_PRIVADO')).toBeInTheDocument();
  });

  it.each([3, 4])('el rol %s no accede a una ruta de Administrador/Gerente y vuelve al dashboard', (rol) => {
    sesion = usuario(rol);
    montar('/privada', [1, 2]);
    expect(screen.getByText('PAGINA_DASHBOARD')).toBeInTheDocument();
    expect(screen.queryByText('CONTENIDO_PRIVADO')).not.toBeInTheDocument();
  });

  it('el Super Admin fuera de su zona es enviado a su propio panel', () => {
    sesion = usuario(5);
    montar('/privada', [1, 2, 3, 4]);
    expect(screen.getByText('PAGINA_SUPERADMIN')).toBeInTheDocument();
  });
});
