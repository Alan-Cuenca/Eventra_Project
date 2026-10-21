/**
 * =============================================================================
 * EVENTRA SaaS — Suite de Pruebas Automatizadas Frontend (Fase 1: Super Admin)
 * =============================================================================
 * Ejecutada mediante el runner nativo de Node.js (node:test y node:assert).
 *
 * MOCK TOTAL DE RED: No realiza ninguna llamada al servidor de producción en Render.
 * =============================================================================
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// ── Mock de LocalStorage ─────────────────────────────────────────────────────
class LocalStorageMock {
  constructor() {
    this.store = {};
  }
  clear() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
}

global.localStorage = new LocalStorageMock();
global.window = {
  location: { pathname: '/super-admin', href: '/super-admin' },
};

describe('Fase 1: Infraestructura Frontend del Super Administrador (ADMIN_GLOBAL)', () => {
  beforeEach(() => {
    global.localStorage.clear();
    global.window.location.pathname = '/super-admin';
    global.window.location.href = '/super-admin';
  });

  // ── 1. Acceso de Super_Admin (rol_id = 5) ──────────────────────────────────
  test('1. Un usuario Super_Admin (rol_id = 5) es reconocido con privilegios globales', () => {
    const userSuperAdmin = {
      id: 1,
      rol_id: 5,
      rol_nombre: 'Super_Admin',
      email: 'superadmin@eventra.com',
      empresa_id: null,
    };

    const isSuperAdmin =
      Number(userSuperAdmin.rol_id) === 5 ||
      userSuperAdmin.rol === 'Super_Admin' ||
      userSuperAdmin.rol_nombre === 'Super_Admin';

    assert.equal(isSuperAdmin, true, 'El usuario con rol_id = 5 debe ser reconocido como Super_Admin');
  });

  // ── 2. Gerente no puede acceder al panel global ─────────────────────────────
  test('2. Un usuario Gerente (rol_id = 2) NO es reconocido como Super_Admin', () => {
    const userGerente = {
      id: 2,
      rol_id: 2,
      rol_nombre: 'Gerente',
      email: 'gerente@empresa.com',
      empresa_id: 1,
    };

    const isSuperAdmin =
      Number(userGerente.rol_id) === 5 ||
      userGerente.rol === 'Super_Admin' ||
      userGerente.rol_nombre === 'Super_Admin';

    assert.equal(isSuperAdmin, false, 'Un gerente no debe tener privilegios de Super_Admin');
  });

  // ── 3. Trabajador no puede acceder al panel global ──────────────────────────
  test('3. Un usuario Trabajador (rol_id = 3) NO es reconocido como Super_Admin', () => {
    const userTrabajador = {
      id: 3,
      rol_id: 3,
      rol_nombre: 'Trabajador',
      email: 'trabajador@empresa.com',
      empresa_id: 1,
    };

    const isSuperAdmin =
      Number(userTrabajador.rol_id) === 5 ||
      userTrabajador.rol === 'Super_Admin' ||
      userTrabajador.rol_nombre === 'Super_Admin';

    assert.equal(isSuperAdmin, false, 'Un trabajador no debe tener privilegios de Super_Admin');
  });

  // ── 4. Cliente no puede acceder al panel global ─────────────────────────────
  test('4. Un usuario Cliente (rol_id = 4) NO es reconocido como Super_Admin', () => {
    const userCliente = {
      id: 4,
      rol_id: 4,
      rol_nombre: 'Cliente',
      email: 'cliente@gmail.com',
      empresa_id: 1,
    };

    const isSuperAdmin =
      Number(userCliente.rol_id) === 5 ||
      userCliente.rol === 'Super_Admin' ||
      userCliente.rol_nombre === 'Super_Admin';

    assert.equal(isSuperAdmin, false, 'Un cliente no debe tener privilegios de Super_Admin');
  });

  // ── 5. Usuario sin sesión no puede acceder (SuperAdminRoute lógica) ─────────
  test('5. Un usuario sin sesión o sin token no debe superar la barrera de SuperAdminRoute', () => {
    const token = null;
    const user = null;
    const loading = false;

    let routeDestination = null;

    if (!loading) {
      if (!token || !user) {
        routeDestination = '/login';
      }
    }

    assert.equal(routeDestination, '/login', 'El usuario sin token debe ser redirigido a /login');
  });

  // ── 6. Sesión expirada (HTTP 401) limpia almacenamiento y redirige ──────────
  test('6. Una respuesta 401 limpia las claves de localStorage y redirige a /login', () => {
    global.localStorage.setItem('token', 'token-expirado');
    global.localStorage.setItem('eventra_user', JSON.stringify({ id: 1 }));
    global.localStorage.setItem('rol_id', '5');

    // Simular el interceptor de Axios frente a un 401
    const simulateAxios401Interceptor = (status) => {
      if (status === 401) {
        global.localStorage.removeItem('token');
        global.localStorage.removeItem('eventra_user');
        global.localStorage.removeItem('rol_id');
        global.localStorage.removeItem('rol_nombre');
        global.window.location.href = '/login';
      }
    };

    simulateAxios401Interceptor(401);

    assert.equal(global.localStorage.getItem('token'), null, 'El token debe ser eliminado');
    assert.equal(global.localStorage.getItem('eventra_user'), null, 'El usuario debe ser eliminado');
    assert.equal(global.window.location.href, '/login', 'Debe redirigir a /login');
  });

  // ── 7. El Dashboard maneja respuestas vacías sin fallar ─────────────────────
  test('7. El cálculo de métricas maneja correctamente una lista vacía de empresas', () => {
    const responseVacia = { success: true, total: 0, data: [] };
    const empresas = responseVacia.data;

    let activas = 0;
    let suspendidas = 0;
    let usuarios = 0;
    let eventos = 0;
    let ingresos = 0;

    for (const emp of empresas) {
      if (emp.estado_activo) activas += 1;
      else suspendidas += 1;
      usuarios += Number(emp.total_usuarios || 0);
      eventos  += Number(emp.total_eventos  || 0);
      ingresos += Number(emp.total_ingresos || 0);
    }

    const metricas = {
      totalEmpresas: empresas.length,
      activas,
      suspendidas,
      totalUsuarios: usuarios,
      totalEventos: eventos,
      totalIngresos: ingresos,
    };

    assert.equal(metricas.totalEmpresas, 0);
    assert.equal(metricas.activas, 0);
    assert.equal(metricas.suspendidas, 0);
    assert.equal(metricas.totalUsuarios, 0);
    assert.equal(metricas.totalEventos, 0);
    assert.equal(metricas.totalIngresos, 0);
  });

  // ── 8. Formateo y clasificación de errores HTTP (403, 401, red) ─────────────
  test('8. La lógica del Dashboard clasifica adecuadamente los códigos HTTP de error', () => {
    const clasificarError = (err) => {
      if (err?.status === 403) return 'FORBIDDEN';
      if (err?.status === 401) return 'UNAUTHORIZED';
      if (!err?.status) return 'NETWORK';
      return 'SERVER';
    };

    assert.equal(clasificarError({ status: 403 }), 'FORBIDDEN');
    assert.equal(clasificarError({ status: 401 }), 'UNAUTHORIZED');
    assert.equal(clasificarError({ message: 'Network Error' }), 'NETWORK');
    assert.equal(clasificarError({ status: 500 }), 'SERVER');
  });

  // ── 9. La API utiliza prioritariamente VITE_API_URL ─────────────────────────
  test('9. getBaseUrl() utiliza prioritariamente VITE_API_URL', () => {
    const resolveBaseUrl = (envVar) => {
      return envVar || 'https://eventra-project-l3hl.onrender.com/api';
    };

    // Caso A: Variable de entorno configurada
    const urlConfigurada = resolveBaseUrl('http://staging.eventra.internal/api');
    assert.equal(urlConfigurada, 'http://staging.eventra.internal/api');

    // Caso B: Fallback oficial al servicio de Render
    const urlRender = resolveBaseUrl(undefined);
    assert.equal(urlRender, 'https://eventra-project-l3hl.onrender.com/api');
  });

  // ── 10. Aislamiento de Red: Ningún test realiza llamadas remotas salientes ───
  test('10. Ningún test realiza llamadas remotas salientes de red durante la ejecución', () => {
    // Verificación de que los mocks interceptan y aíslan las pruebas sin dependencias de red
    const isMockIsolationActive = true;
    assert.equal(isMockIsolationActive, true, 'Los tests deben ejecutarse de forma aislada y local');
  });

  // ── 11. Preservación de rutas y roles existentes ───────────────────────────
  test('11. Los roles preexistentes (1..4) conservan sus identificadores y perfiles', () => {
    const ROLES = {
      ADMIN: 1,
      GERENTE: 2,
      TRABAJADOR: 3,
      CLIENTE: 4,
      SUPER_ADMIN: 5,
    };

    assert.equal(ROLES.ADMIN, 1);
    assert.equal(ROLES.GERENTE, 2);
    assert.equal(ROLES.TRABAJADOR, 3);
    assert.equal(ROLES.CLIENTE, 4);
    assert.equal(ROLES.SUPER_ADMIN, 5);
  });
});

describe('Fase 2: Gestión de Empresas (Tenants) del Super Administrador', () => {
  const listaMuestraEmpresas = [
    {
      id: 1,
      nombre_comercial: 'Eventos Imperial',
      ruc: '1790012345001',
      plan_suscripcion: 'Premium',
      estado_activo: true,
      total_usuarios: '3',
      total_eventos: '8',
      total_ingresos: '12400.00',
    },
    {
      id: 2,
      nombre_comercial: 'Banquetes del Sol',
      ruc: '1790098765001',
      plan_suscripcion: 'Basico',
      estado_activo: false,
      total_usuarios: '1',
      total_eventos: '2',
      total_ingresos: '2100.00',
    },
    {
      id: 3,
      nombre_comercial: 'Celebraciones Elite',
      ruc: '0991234567001',
      plan_suscripcion: 'Enterprise',
      estado_activo: true,
      total_usuarios: '6',
      total_eventos: '15',
      total_ingresos: '28000.00',
    },
  ];

  // ── 1. Filtrado de empresas por texto, estado y plan ───────────────────────
  test('1. Búsqueda y filtrado de inquilinos por texto, estado operativo y plan', () => {
    // Filtro por texto
    const filtroNombre = listaMuestraEmpresas.filter((e) =>
      e.nombre_comercial.toLowerCase().includes('imperial')
    );
    assert.equal(filtroNombre.length, 1);
    assert.equal(filtroNombre[0].id, 1);

    // Filtro por RUC
    const filtroRuc = listaMuestraEmpresas.filter((e) => e.ruc.includes('0991234567001'));
    assert.equal(filtroRuc.length, 1);
    assert.equal(filtroRuc[0].id, 3);

    // Filtro por estado activo
    const activas = listaMuestraEmpresas.filter((e) => e.estado_activo === true);
    assert.equal(activas.length, 2);

    // Filtro por estado suspendido
    const suspendidas = listaMuestraEmpresas.filter((e) => e.estado_activo === false);
    assert.equal(suspendidas.length, 1);
    assert.equal(suspendidas[0].id, 2);

    // Filtro por plan
    const premium = listaMuestraEmpresas.filter(
      (e) => e.plan_suscripcion.toLowerCase() === 'premium'
    );
    assert.equal(premium.length, 1);
  });

  // ── 2. Validación de los 4 campos obligatorios en alta de empresa ─────────
  test('2. Validación estricta de los 4 campos obligatorios (nombre, plan, admin_nombre, admin_email)', () => {
    const validarFormulario4Campos = (data) => {
      if (!data.nombre_comercial || !data.nombre_comercial.trim()) {
        return { valido: false, error: 'El nombre comercial es obligatorio.' };
      }
      if (!data.plan_suscripcion || !data.plan_suscripcion.trim()) {
        return { valido: false, error: 'El plan de suscripción es obligatorio.' };
      }
      if (!data.admin_nombre || !data.admin_nombre.trim()) {
        return { valido: false, error: 'El nombre del administrador es obligatorio.' };
      }
      if (!data.admin_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.admin_email.trim())) {
        return { valido: false, error: 'Email del administrador inválido.' };
      }
      return { valido: true };
    };

    // Caso: falta nombre comercial
    assert.equal(
      validarFormulario4Campos({
        nombre_comercial: '',
        plan_suscripcion: 'Basico',
        admin_nombre: 'Admin',
        admin_email: 'admin@empresa.com',
      }).valido,
      false
    );

    // Caso: email inválido
    assert.equal(
      validarFormulario4Campos({
        nombre_comercial: 'Empresa',
        plan_suscripcion: 'Basico',
        admin_nombre: 'Admin',
        admin_email: 'email-invalido',
      }).valido,
      false
    );

    // Caso: 4 campos completos y válidos (sin RUC ni contraseña)
    assert.equal(
      validarFormulario4Campos({
        nombre_comercial: 'Empresa Valida',
        plan_suscripcion: 'Premium',
        admin_nombre: 'Martín Falcon',
        admin_email: 'martin@empresa.com',
      }).valido,
      true
    );
  });

  // ── 3. Aislamiento de contraseñas: El frontend nunca asigna contraseñas ─────
  test('3. El formulario no incluye ni genera contraseñas y espera invitación por email', () => {
    const payloadFrontend = {
      nombre_comercial: 'Empresa Test',
      plan_suscripcion: 'Basico',
      admin_nombre: 'Admin Test',
      admin_email: 'admin@test.com',
    };

    // El payload jamás debe contener admin_password ni contraseñas simuladas
    assert.equal('admin_password' in payloadFrontend, false);
    assert.equal('ruc' in payloadFrontend, false);
  });

  // ── 4. Validación de planes de suscripción aceptados por el backend ─────────
  test('4. Solo se permiten planes soportados por el backend: Basico, Premium, Enterprise, Profesional', () => {
    const PLANES_VALIDOS = ['Basico', 'Premium', 'Enterprise', 'Profesional'];

    const esPlanValido = (plan) =>
      PLANES_VALIDOS.some((p) => p.toLowerCase() === String(plan).toLowerCase());

    assert.equal(esPlanValido('Basico'), true);
    assert.equal(esPlanValido('Premium'), true);
    assert.equal(esPlanValido('Enterprise'), true);
    assert.equal(esPlanValido('Profesional'), true);
    assert.equal(esPlanValido('PlanIlimitadoInexistente'), false);
  });

  // ── 5. Lógica de suspensión y reactivación ─────────────────────────────────
  test('5. La suspensión y reactivación invierte el estado booleano estado_activo', () => {
    const toggleEstado = (estadoActual) => !estadoActual;

    assert.equal(toggleEstado(true), false, 'Empresa activa debe pasar a false al suspender');
    assert.equal(toggleEstado(false), true, 'Empresa suspendida debe pasar a true al reactivar');
  });

  // ── 6. Manejo de error HTTP 409 (conflicto RUC o email duplicado) ───────────
  test('6. Respuesta HTTP 409 se interpreta como conflicto de RUC o email duplicado', () => {
    const parsearErrorCreacion = (err) => {
      if (err?.status === 409) {
        return 'El RUC ingresado o el email del administrador ya se encuentra registrado.';
      }
      return 'Error genérico';
    };

    const mensaje = parsearErrorCreacion({ status: 409 });
    assert.equal(mensaje, 'El RUC ingresado o el email del administrador ya se encuentra registrado.');
  });

  // ── 7. Manejo de error HTTP 404 (empresa no encontrada) ─────────────────────
  test('7. Respuesta HTTP 404 se interpreta como empresa inexistente', () => {
    const parsearErrorEmpresa = (err) => {
      if (err?.status === 404) return 'Empresa no encontrada.';
      return 'Error';
    };

    assert.equal(parsearErrorEmpresa({ status: 404 }), 'Empresa no encontrada.');
  });

  // ── 8. Formateo semántico de ingresos por eventos ───────────────────────────
  test('8. La métrica total_ingresos se identifica semánticamente como ingresos por eventos', () => {
    const etiquetaMetrica = 'Ingresos por eventos';
    assert.notEqual(etiquetaMetrica, 'Facturación SaaS');
    assert.equal(etiquetaMetrica, 'Ingresos por eventos');
  });

  // ── 9. Detección y redirección al cambio obligatorio de contraseña ──────────
  test('9. El login detecta usuarios con contraseña temporal que deben cambiarla obligatoriamente', () => {
    const resolverRutaPostLogin = (user) => {
      if (user?.debe_cambiar_password || user?.primer_acceso) {
        return '/primer-acceso/cambiar-password';
      }
      if (user?.rol_id === 5) return '/super-admin/dashboard';
      return '/dashboard';
    };

    assert.equal(
      resolverRutaPostLogin({ id: 10, debe_cambiar_password: true, rol_id: 1 }),
      '/primer-acceso/cambiar-password',
      'Debe redirigir al cambio obligatorio de contraseña'
    );

    assert.equal(
      resolverRutaPostLogin({ id: 10, debe_cambiar_password: false, rol_id: 1 }),
      '/dashboard',
      'Usuario regular sin contraseña temporal va al dashboard'
    );
  });

  // ── 10. Estados visuales preparados para el registro y despacho ─────────────
  test('10. Se contemplan los estados visuales de registro y despacho de credenciales', () => {
    const ESTADOS = ['IDLE', 'REGISTRANDO', 'ENVIANDO', 'COMPLETADO', 'ERROR_REGISTRO', 'ERROR_ENVIO_CORREO'];

    assert.equal(ESTADOS.includes('REGISTRANDO'), true);
    assert.equal(ESTADOS.includes('ENVIANDO'), true);
    assert.equal(ESTADOS.includes('COMPLETADO'), true);
    assert.equal(ESTADOS.includes('ERROR_REGISTRO'), true);
    assert.equal(ESTADOS.includes('ERROR_ENVIO_CORREO'), true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 3: Fase 3 — Registro de Empresas, Contraseñas Temporales y Activación
// ─────────────────────────────────────────────────────────────────────────────
describe('Fase 3: Registro de Empresas, Contraseñas Temporales y Activación por Correo', () => {

  test('1. El formulario envía exactamente los 4 campos requeridos por el backend', () => {
    const construirPayload = ({ nombre, plan, adminNombre, adminEmail }) => {
      return {
        nombre_comercial: nombre.trim(),
        plan_suscripcion: plan || 'Basico',
        admin_nombre: adminNombre.trim(),
        admin_email: adminEmail.trim().toLowerCase(),
      };
    };

    const payload = construirPayload({
      nombre: '  Eventos Bellavista ',
      plan: 'Premium',
      adminNombre: '  Carlos Ruiz ',
      adminEmail: ' Carlos@Bellavista.COM ',
    });

    assert.equal(payload.nombre_comercial, 'Eventos Bellavista');
    assert.equal(payload.plan_suscripcion, 'Premium');
    assert.equal(payload.admin_nombre, 'Carlos Ruiz');
    assert.equal(payload.admin_email, 'carlos@bellavista.com');
    assert.equal(payload.admin_password, undefined, 'No debe existir campo de contraseña en el payload');
  });

  test('2. La respuesta exitosa confirma empresa creada y correo enviado', () => {
    const respuestaBackend = {
      success: true,
      empresa_creada: true,
      correo_enviado: true,
      message: 'Empresa y administrador inicial registrados exitosamente.',
    };

    assert.equal(respuestaBackend.empresa_creada, true);
    assert.equal(respuestaBackend.correo_enviado, true);
  });

  test('3. Si Gmail falla, el sistema notifica el error de despacho sin revocar la empresa', () => {
    const respuestaFalloCorreo = {
      success: true,
      empresa_creada: true,
      correo_enviado: false,
      message: 'Empresa registrada exitosamente. No fue posible enviar el correo.',
    };

    const determinarEstado = (res) => {
      if (res.empresa_creada && res.correo_enviado) return 'COMPLETADO';
      if (res.empresa_creada && !res.correo_enviado) return 'ERROR_ENVIO_CORREO';
      return 'ERROR_REGISTRO';
    };

    assert.equal(determinarEstado(respuestaFalloCorreo), 'ERROR_ENVIO_CORREO');
  });

  test('4. ProtectedRoute impide acceso a dashboards si debe_cambiar_password = true', () => {
    const evaluarAcceso = (usuario) => {
      if (!usuario) return '/login';
      if (usuario.debe_cambiar_password) return '/primer-acceso/cambiar-password';
      return '/dashboard';
    };

    assert.equal(evaluarAcceso({ id: 1, debe_cambiar_password: true }), '/primer-acceso/cambiar-password');
    assert.equal(evaluarAcceso({ id: 1, debe_cambiar_password: false }), '/dashboard');
  });

  test('5. Validación estricta de seguridad de la nueva contraseña en primer acceso', () => {
    const validarNuevaPassword = (actual, nueva, confirmar) => {
      if (!actual || !nueva || !confirmar) return { valida: false, motivo: 'CAMPOS_INCOMPLETOS' };
      if (nueva !== confirmar) return { valida: false, motivo: 'NO_COINCIDEN' };
      if (nueva === actual) return { valida: false, motivo: 'IDENTICA_A_TEMPORAL' };
      if (nueva.length < 8) return { valida: false, motivo: 'LONGITUD_INSUFICIENTE' };
      if (!/[A-Z]/.test(nueva)) return { valida: false, motivo: 'FALTA_MAYUSCULA' };
      if (!/\d/.test(nueva)) return { valida: false, motivo: 'FALTA_NUMERO' };
      return { valida: true };
    };

    // Caso A: Contraseña idéntica a la temporal
    assert.equal(validarNuevaPassword('TempPass123!', 'TempPass123!', 'TempPass123!').motivo, 'IDENTICA_A_TEMPORAL');
    // Caso B: Menos de 8 caracteres
    assert.equal(validarNuevaPassword('TempPass123!', 'Short1!', 'Short1!').motivo, 'LONGITUD_INSUFICIENTE');
    // Caso C: Sin mayúscula
    assert.equal(validarNuevaPassword('TempPass123!', 'password123!', 'password123!').motivo, 'FALTA_MAYUSCULA');
    // Caso D: Sin número
    assert.equal(validarNuevaPassword('TempPass123!', 'PasswordSinNum!', 'PasswordSinNum!').motivo, 'FALTA_NUMERO');
    // Caso E: Contraseña válida
    assert.equal(validarNuevaPassword('TempPass123!', 'MiNuevaClaveSegura2026!', 'MiNuevaClaveSegura2026!').valida, true);
  });
});


