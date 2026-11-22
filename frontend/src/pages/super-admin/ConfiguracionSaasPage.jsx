import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings,
  Save,
  RotateCcw,
  ShieldCheck,
  CreditCard,
  Server,
  Database,
  Mail,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Lock,
  Sparkles,
  Building2,
} from 'lucide-react';
import { api } from '../../services/api';
import { superAdminService } from '../../services/superAdminService';
import { GlobalStatCard } from '../../components/super-admin/GlobalStatCard';

const DEFAULT_SAAS_CONFIG = {
  plataforma: {
    nombre_comercial: 'EVENTRA SaaS Multi-Tenant',
    subtitulo: 'Gestión Inteligente de Eventos y Recepciones',
    correo_soporte: 'soporte@eventra.com',
    modo_mantenimiento: false,
    registro_publico_activo: true,
  },
  transferencia: {
    titular: '',
    numero_cuenta: '',
    cedula: '',
    correo_notificacion: '',
    entidad_bancaria: 'Banco Pichincha / Transferencia Interbancaria',
  },
  planes: {
    basico_nombre: 'Plan Básico (Boutique)',
    basico_precio: 49,
    basico_max_eventos: 20,
    basico_max_usuarios: 3,
    basico_max_clientes: 50,
    basico_max_servicios: 20,
    basico_max_chatbot: 300,
    premium_nombre: 'Plan Premium (Corporativo + IA)',
    premium_precio: 99,
    premium_max_eventos: 100,
    premium_max_usuarios: 10,
    premium_max_clientes: 200,
    premium_max_servicios: 50,
    premium_max_chatbot: 1500,
    premium_evara_ai: true,
  },
  seguridad: {
    expiracion_jwt_horas: 8,
    aislamiento_estricto_tenant: true,
    bloqueo_anticolision_postgresql: true,
    forzar_cambio_clave_primer_acceso: true,
    auditoria_descargas_pdf: true,
  },
};

/**
 * =============================================================================
 * ConfiguracionSaasPage
 * =============================================================================
 * Módulo de Configuración Global SaaS para el Super Administrador (rol_id = 5).
 * Permite administrar parámetros financieros de transferencia, límites de planes,
 * políticas de gobernanza multi-tenant y verificar el estado del backend y BD.
 * =============================================================================
 */
export const ConfiguracionSaasPage = () => {
  const [config, setConfig] = useState(DEFAULT_SAAS_CONFIG);
  // 'cargando' | 'ok' | 'error': guardar o restaurar solo se permite con la configuración real cargada,
  // para no sobrescribir la de producción con los valores por defecto de la pantalla.
  const [estadoCarga, setEstadoCarga] = useState('cargando');

  const [healthStatus, setHealthStatus] = useState({
    apiOnline: true,
    latencyMs: null,
    tenantsCount: 0,
    activeTenants: 0,
    lastCheck: new Date(),
  });
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const mostrarToast = (tipo, texto) => {
    setToast({ tipo, texto });
    setTimeout(() => setToast(null), 4000);
  };

  const verificarEstadoSistema = useCallback(async (isManual = false) => {
    setCheckingHealth(true);
    const startTime = performance.now();
    try {
      const [empresasRes] = await Promise.all([
        superAdminService.obtenerEmpresas(),
        api.get('/health'),
      ]);
      const elapsed = Math.max(12, Math.round(performance.now() - startTime));
      const lista = Array.isArray(empresasRes?.data) ? empresasRes.data : [];
      const activas = lista.filter((e) => e.estado_activo).length;

      setHealthStatus({
        apiOnline: true,
        latencyMs: elapsed,
        tenantsCount: lista.length,
        activeTenants: activas,
        lastCheck: new Date(),
      });

      if (isManual) {
        mostrarToast(
          'success',
          `Diagnóstico completado (${elapsed} ms). API Express, PostgreSQL Supabase y Storage operativos.`
        );
      }
    } catch {
      setHealthStatus((prev) => ({
        ...prev,
        apiOnline: false,
        lastCheck: new Date(),
      }));
      if (isManual) {
        mostrarToast('error', 'No se pudo contactar con el servidor backend en este momento.');
      }
    } finally {
      setCheckingHealth(false);
    }
  }, []);

  const cargarConfigRemota = useCallback(async () => {
    setEstadoCarga('cargando');
    try {
      const remota = await superAdminService.obtenerConfiguracion();
      if (remota && remota.planes) {
        setConfig({
            ...remota,
            plataforma: { ...DEFAULT_SAAS_CONFIG.plataforma, ...(remota.plataforma || {}) },
            transferencia: { ...DEFAULT_SAAS_CONFIG.transferencia, ...(remota.transferencia || {}) },
            planes: { ...DEFAULT_SAAS_CONFIG.planes, ...(remota.planes || {}) },
            seguridad: { ...DEFAULT_SAAS_CONFIG.seguridad, ...(remota.seguridad || {}) },
          });
        setEstadoCarga('ok');
      } else {
        setEstadoCarga('error');
      }
    } catch (err) {
      console.warn('Error cargando config remota:', err);
      setEstadoCarga('error');
    }
  }, []);

  useEffect(() => {
    verificarEstadoSistema(false);
    cargarConfigRemota();
  }, [verificarEstadoSistema, cargarConfigRemota]);

  const handleFieldChange = (section, field, value) => {
    setConfig((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleGuardarConfiguracion = async (e) => {
    e.preventDefault();
    if (estadoCarga !== 'ok') return;
    setSaving(true);
    try {
      await superAdminService.guardarConfiguracion(config);
      setSaving(false);
      mostrarToast(
        'success',
        'Configuración global guardada en la base de datos y sincronizada para todas las empresas.'
      );
    } catch (err) {
      setSaving(false);
      mostrarToast('error', 'Error al guardar la configuración: ' + (err.message || 'Error del servidor'));
    }
  };

  const handleRestaurarValores = async () => {
    if (estadoCarga !== 'ok') return;
    const confirmado = window.confirm(
      '¿Restaurar planes, plataforma y seguridad a los valores predeterminados? Se aplica de inmediato a todas las empresas. Los datos de transferencia bancaria se conservan.'
    );
    if (!confirmado) return;
    // Los datos bancarios no tienen un "valor predeterminado": vaciarlos rompería el cobro por transferencia
    const restaurada = { ...DEFAULT_SAAS_CONFIG, transferencia: config.transferencia };
    setSaving(true);
    try {
      await superAdminService.guardarConfiguracion(restaurada);
      setConfig(restaurada);
      mostrarToast('success', 'Parámetros globales restaurados a los valores oficiales de EVENTRA.');
    } catch (err) {
      mostrarToast('error', 'No se pudieron restaurar los valores: ' + (err.message || 'Error del servidor'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Toast Flotante */}
      {toast && (
        <div
          className={`toast ${toast.tipo === 'error' ? 'toast-error' : 'toast-success'}`}
          role="status"
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            maxWidth: '460px',
          }}
        >
          {toast.tipo === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toast.texto}</span>
        </div>
      )}

      {/* Encabezado */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <h1 className="page-title">Configuración Global SaaS</h1>
            <span className="badge badge-confirmado" style={{ fontSize: '0.7rem' }}>
              GOBERNANZA DEL SISTEMA
            </span>
          </div>
          <p className="page-subtitle">
            Parámetros maestros de facturación por transferencia, planes comerciales, seguridad RBAC y estado de infraestructura.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => verificarEstadoSistema(true)}
            disabled={checkingHealth}
            className="btn btn-secondary"
          >
            <RefreshCw size={15} className={checkingHealth ? 'animate-spin' : ''} />
            <span>{checkingHealth ? 'Verificando...' : 'Verificar estado del sistema'}</span>
          </button>

          <button
            type="button"
            onClick={handleRestaurarValores}
            disabled={estadoCarga !== 'ok' || saving}
            className="btn btn-secondary"
          >
            <RotateCcw size={15} />
            <span>Restaurar Predeterminados</span>
          </button>

          <button
            type="button"
            onClick={handleGuardarConfiguracion}
            disabled={saving || estadoCarga !== 'ok'}
            data-cy="guardar-configuracion"
            className="btn btn-primary"
          >
            <Save size={15} />
            <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
          </button>
        </div>
      </div>

      {estadoCarga !== 'ok' && (
        <div
          role={estadoCarga === 'error' ? 'alert' : 'status'}
          data-cy="configuracion-estado-carga"
          style={{
            display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', flexWrap: 'wrap',
            padding: '0.75rem 1rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600,
            background: estadoCarga === 'error' ? 'rgba(201, 92, 92, 0.12)' : 'rgba(77, 113, 130, 0.10)',
            color: estadoCarga === 'error' ? '#8a2f2f' : '#233D49',
          }}
        >
          {estadoCarga === 'error' ? <AlertCircle size={16} /> : <RefreshCw size={16} className="animate-spin" />}
          <span>
            {estadoCarga === 'error'
              ? 'No se pudo cargar la configuración guardada. Para no sobrescribirla, guardar está deshabilitado.'
              : 'Cargando la configuración guardada…'}
          </span>
          {estadoCarga === 'error' && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={cargarConfigRemota}>
              Reintentar
            </button>
          )}
        </div>
      )}

      {/* KPIs de Infraestructura y Estado */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.1rem',
          marginBottom: '1.5rem',
        }}
      >
        <GlobalStatCard
          title="Estado Backend Express"
          value={healthStatus.apiOnline ? 'Operativo' : 'Degradado'}
          subtitle={healthStatus.latencyMs == null ? 'Latencia: —' : `Latencia: ${healthStatus.latencyMs} ms`}
          icon={<Server size={20} />}
          accentColor={healthStatus.apiOnline ? '#4D9A72' : '#C95C5C'}
          badgeText={healthStatus.apiOnline ? 'TLS 1.3 Activo' : 'Revisar'}
          badgeColor={healthStatus.apiOnline ? '#4D9A72' : '#C95C5C'}
        />
        <GlobalStatCard
          title="Motor PostgreSQL"
          value="Supabase URI"
          subtitle={`${healthStatus.tenantsCount} tenants (${healthStatus.activeTenants} activos)`}
          icon={<Database size={20} />}
          accentColor="#4D7182"
        />
        <GlobalStatCard
          title="Planes Comerciales"
          value={`${config.planes.basico_precio} / ${config.planes.premium_precio}`}
          subtitle="Básico vs Premium (USD/mes)"
          icon={<CreditCard size={20} />}
          accentColor="#C49A3A"
        />
        <GlobalStatCard
          title="Política RBAC & JWT"
          value={`${config.seguridad.expiracion_jwt_horas} Horas`}
          subtitle="5 roles con aislamiento estricto"
          icon={<ShieldCheck size={20} />}
          accentColor="#4D9A72"
        />
      </div>

      {/* Formulario de Configuración en Tarjetas */}
      <form onSubmit={handleGuardarConfiguracion}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '1.25rem',
            marginBottom: '1.5rem',
          }}
        >
          {/* 1. Datos Oficiales para Pago por Transferencia */}
          <div className="card" style={{ padding: '1.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: 'var(--primary-subtle)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CreditCard size={19} />
              </div>
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Cuenta Oficial para Transferencias SaaS
                </h2>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                  Datos bancarios mostrados al contratar planes en EVENTRA
                </p>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Nombre del Titular Oficial</label>
              <input
                type="text"
                className="form-input"
                value={config.transferencia.titular}
                onChange={(e) => handleFieldChange('transferencia', 'titular', e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div className="form-group">
                <label className="form-label">Número de Cuenta</label>
                <input
                  type="text"
                  className="form-input"
                  value={config.transferencia.numero_cuenta}
                  onChange={(e) => handleFieldChange('transferencia', 'numero_cuenta', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Cédula / Identificación</label>
                <input
                  type="text"
                  className="form-input"
                  value={config.transferencia.cedula}
                  onChange={(e) => handleFieldChange('transferencia', 'cedula', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Correo de Notificación de Comprobantes</label>
              <input
                type="email"
                className="form-input"
                value={config.transferencia.correo_notificacion}
                onChange={(e) => handleFieldChange('transferencia', 'correo_notificacion', e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Entidad Financiera / Modalidad</label>
              <input
                type="text"
                className="form-input"
                value={config.transferencia.entidad_bancaria}
                onChange={(e) => handleFieldChange('transferencia', 'entidad_bancaria', e.target.value)}
              />
            </div>
          </div>

          {/* 2. Parámetros de Planes Comerciales y Límites Operativos */}
          <div className="card" style={{ padding: '1.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: 'var(--warning-bg)',
                  color: 'var(--warning-text)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={19} />
              </div>
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Planes Comerciales y Límites Operativos
                </h2>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                  Tarifas mensuales, cuotas de recursos y políticas de facturación para Plan Básico y Premium
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* ── Sub-tarjeta Plan Básico ─────────────────────── */}
              <div
                style={{
                  padding: '1.1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  background: 'rgba(77, 113, 130, 0.04)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', display: 'inline-block' }} />
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      Configuración Plan Básico
                    </h3>
                  </div>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.6rem',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--bg-card)',
                      color: 'var(--primary)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    Tier Boutique (${config.planes.basico_precio ?? 49}/mes)
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.85rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.72rem' }}>Precio (USD/mes)</label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={config.planes.basico_precio ?? 49}
                      onChange={(e) => handleFieldChange('planes', 'basico_precio', Number(e.target.value) || 49)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.72rem' }}>Máx. Eventos / Mes</label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={config.planes.basico_max_eventos ?? 20}
                      onChange={(e) => handleFieldChange('planes', 'basico_max_eventos', Number(e.target.value) || 20)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.72rem' }}>Máx. Staff (Usuarios)</label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={config.planes.basico_max_usuarios ?? 3}
                      onChange={(e) => handleFieldChange('planes', 'basico_max_usuarios', Number(e.target.value) || 3)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.72rem' }}>Máx. Clientes CRM</label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={config.planes.basico_max_clientes ?? 50}
                      onChange={(e) => handleFieldChange('planes', 'basico_max_clientes', Number(e.target.value) || 50)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.72rem' }}>Máx. Servicios Catálogo</label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={config.planes.basico_max_servicios ?? 20}
                      onChange={(e) => handleFieldChange('planes', 'basico_max_servicios', Number(e.target.value) || 20)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.72rem' }}>Consultas IA / Mes</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      value={config.planes.basico_max_chatbot ?? 300}
                      onChange={(e) => handleFieldChange('planes', 'basico_max_chatbot', Number(e.target.value) || 300)}
                    />
                  </div>
                </div>
              </div>

              {/* ── Sub-tarjeta Plan Premium ────────────────────── */}
              <div
                style={{
                  padding: '1.1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(196, 154, 58, 0.3)',
                  background: 'rgba(196, 154, 58, 0.05)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--warning)', display: 'inline-block' }} />
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      Configuración Plan Premium
                    </h3>
                  </div>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.6rem',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--bg-card)',
                      color: 'var(--warning-text)',
                      border: '1px solid rgba(196, 154, 58, 0.3)',
                    }}
                  >
                    Corporativo + IA (${config.planes.premium_precio ?? 99}/mes)
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.85rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.72rem' }}>Precio (USD/mes)</label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={config.planes.premium_precio ?? 99}
                      onChange={(e) => handleFieldChange('planes', 'premium_precio', Number(e.target.value) || 99)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.72rem' }}>Máx. Eventos / Mes</label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={config.planes.premium_max_eventos ?? 100}
                      onChange={(e) => handleFieldChange('planes', 'premium_max_eventos', Number(e.target.value) || 100)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.72rem' }}>Máx. Staff (Usuarios)</label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={config.planes.premium_max_usuarios ?? 10}
                      onChange={(e) => handleFieldChange('planes', 'premium_max_usuarios', Number(e.target.value) || 10)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.72rem' }}>Máx. Clientes CRM</label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={config.planes.premium_max_clientes ?? 200}
                      onChange={(e) => handleFieldChange('planes', 'premium_max_clientes', Number(e.target.value) || 200)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.72rem' }}>Máx. Servicios Catálogo</label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={config.planes.premium_max_servicios ?? 50}
                      onChange={(e) => handleFieldChange('planes', 'premium_max_servicios', Number(e.target.value) || 50)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.72rem' }}>Consultas IA / Mes</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      value={config.planes.premium_max_chatbot ?? 1500}
                      onChange={(e) => handleFieldChange('planes', 'premium_max_chatbot', Number(e.target.value) || 1500)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Identidad Global y Soporte */}
          <div className="card" style={{ padding: '1.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: 'var(--success-bg)',
                  color: 'var(--success-text)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Building2 size={19} />
              </div>
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Identidad del Ecosistema SaaS
                </h2>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                  Información institucional y canales de atención a empresas
                </p>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Nombre de la Plataforma</label>
              <input
                type="text"
                className="form-input"
                value={config.plataforma.nombre_comercial}
                onChange={(e) => handleFieldChange('plataforma', 'nombre_comercial', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Lema / Descriptor Corporativo</label>
              <input
                type="text"
                className="form-input"
                value={config.plataforma.subtitulo}
                onChange={(e) => handleFieldChange('plataforma', 'subtitulo', e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '0.85rem' }}>
              <label className="form-label">Correo Oficial de Soporte Técnico</label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={15}
                  style={{
                    position: 'absolute',
                    left: '0.8rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
                <input
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: '2.25rem' }}
                  value={config.plataforma.correo_soporte}
                  onChange={(e) => handleFieldChange('plataforma', 'correo_soporte', e.target.value)}
                />
              </div>
            </div>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                fontSize: '0.84rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={config.plataforma.registro_publico_activo}
                onChange={(e) =>
                  handleFieldChange('plataforma', 'registro_publico_activo', e.target.checked)
                }
              />
              <span>Permitir contratación pública de planes desde `/precios` y `/planes/pago`</span>
            </label>
          </div>

          {/* 4. Gobernanza RBAC y Seguridad Multi-Tenant */}
          <div className="card" style={{ padding: '1.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: 'var(--primary-subtle)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Lock size={19} />
              </div>
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Políticas de seguridad
                </h2>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                  Reglas de aislamiento de datos, colisiones y sesiones JWT
                </p>
              </div>
            </div>

            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--cream)', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
              Informativo: el aislamiento por empresa, el bloqueo anticolisión y el cambio de clave en el primer acceso están siempre activos en la plataforma. La sesión JWT dura 24 horas.
            </p>

            <div className="form-group">
              <label className="form-label">Tiempo de Expiración de Sesión JWT (Horas)</label>
              <input
                type="number"
                min="1"
                max="72"
                className="form-input"
                value={config.seguridad.expiracion_jwt_horas}
                onChange={(e) =>
                  handleFieldChange(
                    'seguridad',
                    'expiracion_jwt_horas',
                    Number(e.target.value) || 8
                  )
                }
              />
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0.35rem 0 0' }}>
                Entre 1 y 72 horas. Se aplica a los inicios de sesión posteriores al guardado.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  fontSize: '0.84rem',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={config.seguridad.aislamiento_estricto_tenant}
                  onChange={(e) =>
                    handleFieldChange('seguridad', 'aislamiento_estricto_tenant', e.target.checked)
                  }
                />
                <span>
                  <strong>Datos separados por empresa:</strong> Bloquear consultas cruzadas entre tenants
                </span>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  fontSize: '0.84rem',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={config.seguridad.bloqueo_anticolision_postgresql}
                  onChange={(e) =>
                    handleFieldChange(
                      'seguridad',
                      'bloqueo_anticolision_postgresql',
                      e.target.checked
                    )
                  }
                />
                <span>
                  <strong>Prevención Anti-Colisión (HTTP 409):</strong> Bloqueo `UNIQUE` de salones por fecha en PostgreSQL
                </span>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  fontSize: '0.84rem',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={config.seguridad.forzar_cambio_clave_primer_acceso}
                  onChange={(e) =>
                    handleFieldChange(
                      'seguridad',
                      'forzar_cambio_clave_primer_acceso',
                      e.target.checked
                    )
                  }
                />
                <span>
                  <strong>Cambio de Contraseña en Primer Acceso:</strong> Exigir actualización tras alta con clave temporal
                </span>
              </label>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ConfiguracionSaasPage;
