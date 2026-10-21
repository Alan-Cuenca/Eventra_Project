/**
 * EVENTRA — Portal de Registro para Clientes Finales
 * Flujo SaaS Nivel 3: El cliente se registra de forma exclusiva y segura en el portal
 * de una empresa específica (identificada por su slug en la URL: /portal/:slug/registro).
 *
 * Elimina cualquier selector de roles (fuerza rol Cliente).
 * Resuelve y valida el inquilino (empresa_id) de forma oculta en el backend.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import {
  Lock,
  Mail,
  User,
  Building2,
  Phone,
  CreditCard,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import logoImg from '../../assets/logo.png';

export const Registro = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  // Estados para resolución del portal
  const [empresa, setEmpresa] = useState(null);
  const [loadingPortal, setLoadingPortal] = useState(Boolean(slug));
  const [portalError, setPortalError] = useState('');
  const [manualSlug, setManualSlug] = useState('');

  // Estados del formulario
  const [formData, setFormData] = useState({
    nombre_completo: '',
    email: '',
    telefono: '',
    cedula: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // 1. Cargar información de la empresa si existe un slug en la URL
  useEffect(() => {
    if (!slug) {
      setLoadingPortal(false);
      return;
    }

    const fetchPortalInfo = async () => {
      setLoadingPortal(true);
      setPortalError('');
      try {
        const response = await api.get(`/auth/portal/${slug.trim()}`);
        if (response && response.data) {
          setEmpresa(response.data);
        } else {
          setPortalError('No se encontró información del portal para este organizador.');
        }
      } catch (err) {
        console.error('[Registro] Error cargando portal:', err);
        setPortalError(
          err.message ||
          'El portal de esta empresa organizadora no existe o se encuentra inactivo.'
        );
      } finally {
        setLoadingPortal(false);
      }
    };

    fetchPortalInfo();
  }, [slug]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleManualSlugSubmit = (e) => {
    e.preventDefault();
    if (manualSlug.trim()) {
      navigate(`/portal/${manualSlug.trim().toLowerCase()}/registro`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      // POST /api/auth/registro-cliente
      const response = await api.post('/auth/registro-cliente', {
        empresa_slug: slug.trim(),
        nombre_completo: formData.nombre_completo.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        telefono: formData.telefono.trim() || null,
        cedula: formData.cedula.trim() || null,
      });

      // Si retorna token, guardarlo para sesión activa
      if (response && response.token) {
        localStorage.setItem('token', response.token);
        if (response.data?.usuario) {
          localStorage.setItem('eventra_user', JSON.stringify(response.data.usuario));
          localStorage.setItem('rol_id', '4');
          localStorage.setItem('rol_nombre', 'Cliente');
        }
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/portal-cliente', { replace: true });
      }, 2500);
    } catch (err) {
      console.error('[Registro] Error en registro de cliente:', err);
      let msg = 'Ocurrió un error al procesar tu registro.';
      if (err.status === 409) {
        msg = 'Ya existe una cuenta con este correo o documento. Inicia sesión en su lugar.';
      } else if (err.status === 404) {
        msg = 'No se encontró la empresa organizadora vinculada.';
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ── Pantalla de Éxito ─────────────────────────────────────────────────── */
  if (success) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F3F0E4',
          padding: '24px',
        }}
      >
        <div
          style={{
            maxWidth: '440px',
            width: '100%',
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '40px 32px',
            boxShadow: '0 4px 20px rgba(35, 61, 73, 0.08)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#E8F5EE',
              color: '#4D9A72',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <CheckCircle2 size={32} />
          </div>
          <h2 style={{ color: '#233D49', fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>
            ¡Bienvenido a {empresa?.nombre_comercial || 'tu Portal de Eventos'}!
          </h2>
          <p style={{ color: '#4D7182', fontSize: '14px', lineHeight: '1.5', marginBottom: '24px' }}>
            Tu cuenta de cliente ha sido creada exitosamente. Te estamos dirigiendo a tu portal para consultar cotizaciones y eventos...
          </p>
          <button
            onClick={() => navigate('/portal-cliente', { replace: true })}
            style={{
              backgroundColor: '#4D7182',
              color: '#FFFFFF',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            Ir a mi Portal <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  /* ── Caso A: Acceso a /registro sin slug específico ─────────────────────── */
  if (!slug) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#F3F0E4',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 16px',
          fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: '480px',
            width: '100%',
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '36px 32px',
            boxShadow: '0 4px 24px rgba(35, 61, 73, 0.08)',
            textAlign: 'center',
          }}
        >
          <img src={logoImg} alt="EVENTRA" style={{ height: '36px', margin: '0 auto 16px' }} />
          <h1 style={{ color: '#233D49', fontSize: '22px', fontWeight: '700', marginBottom: '8px' }}>
            Portal de Clientes EVENTRA
          </h1>
          <p style={{ color: '#4D7182', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
            Cada empresa de eventos cuenta con su propio portal exclusivo. Para registrarte como cliente, ingresa el identificador o enlace proporcionado por tu organizador.
          </p>

          <form onSubmit={handleManualSlugSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ position: 'relative' }}>
              <Building2 size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#7E919C' }} />
              <input
                type="text"
                required
                value={manualSlug}
                onChange={(e) => setManualSlug(e.target.value)}
                placeholder="Identificador de la empresa (ej: luxury-events)"
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 40px',
                  borderRadius: '8px',
                  border: '1px solid #CEC8B8',
                  fontSize: '14px',
                  color: '#233D49',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                backgroundColor: '#4D7182',
                color: '#FFFFFF',
                border: 'none',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              Ir al Registro de mi Empresa <ArrowRight size={16} />
            </button>
          </form>

          {/* Información para colaboradores */}
          <div
            style={{
              marginTop: '28px',
              padding: '16px',
              borderRadius: '10px',
              backgroundColor: '#F9F8F5',
              border: '1px solid #ECE7D5',
              textAlign: 'left',
              display: 'flex',
              gap: '12px',
            }}
          >
            <HelpCircle size={20} style={{ color: '#4D7182', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '12px', color: '#4D7182', lineHeight: '1.5' }}>
              <strong>¿Eres colaborador (Gerente o Trabajador)?</strong><br />
              Los miembros del equipo no se registran por aquí. Debes abrir el enlace de invitación enviado a tu correo electrónico por el Administrador.
            </div>
          </div>

          <div style={{ marginTop: '20px', fontSize: '13px', color: '#4D7182' }}>
            ¿Ya tienes una cuenta activa?{' '}
            <Link to="/login" style={{ color: '#233D49', fontWeight: '700', textDecoration: 'none' }}>
              Inicia sesión aquí
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── Caso B: Cargando información del portal ───────────────────────────── */
  if (loadingPortal) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F3F0E4',
        }}
      >
        <div style={{ textAlign: 'center', color: '#4D7182' }}>
          <Loader2 size={36} className="animate-spin" style={{ margin: '0 auto 12px' }} />
          <p style={{ fontSize: '14px', fontWeight: '600' }}>Conectando con el portal de la empresa...</p>
        </div>
      </div>
    );
  }

  /* ── Caso C: Portal inválido o inactivo ─────────────────────────────────── */
  if (portalError || !empresa) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F3F0E4',
          padding: '24px',
        }}
      >
        <div
          style={{
            maxWidth: '440px',
            width: '100%',
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '36px 32px',
            boxShadow: '0 4px 20px rgba(35, 61, 73, 0.08)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#FBE8E8',
              color: '#C95C5C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <AlertCircle size={32} />
          </div>
          <h2 style={{ color: '#233D49', fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>
            Portal No Disponible
          </h2>
          <p style={{ color: '#4D7182', fontSize: '14px', lineHeight: '1.5', marginBottom: '24px' }}>
            {portalError || 'No se pudo verificar la empresa organizadora con el enlace proporcionado.'}
          </p>
          <Link
            to="/registro"
            style={{
              display: 'inline-block',
              backgroundColor: '#4D7182',
              color: '#FFFFFF',
              padding: '12px 24px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '14px',
            }}
          >
            Buscar Otra Empresa
          </Link>
        </div>
      </div>
    );
  }

  /* ── Caso D: Formulario Oficial de Registro de Cliente en el Portal ─────── */
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F3F0E4',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: '500px',
          width: '100%',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '36px 32px',
          boxShadow: '0 4px 24px rgba(35, 61, 73, 0.08)',
        }}
      >
        {/* Cabecera personalizada del portal */}
        <div style={{ textAlign: 'center', marginBottom: '26px' }}>
          <img src={logoImg} alt="EVENTRA" style={{ height: '32px', margin: '0 auto 12px' }} />

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 14px',
              borderRadius: '20px',
              backgroundColor: '#EBF2F5',
              color: '#4D7182',
              fontSize: '12px',
              fontWeight: '700',
              marginBottom: '10px',
            }}
          >
            <Sparkles size={14} /> Portal Oficial: {empresa.nombre_comercial}
          </div>

          <h1 style={{ color: '#233D49', fontSize: '22px', fontWeight: '700', margin: '0 0 6px' }}>
            Registro de Cliente
          </h1>
          <p style={{ color: '#4D7182', fontSize: '13px', margin: 0 }}>
            Crea tu cuenta para cotizar, contratar y seguir tus eventos con {empresa.nombre_comercial}.
          </p>
        </div>

        {/* Alerta de error */}
        {error && (
          <div
            style={{
              backgroundColor: '#FDF2F2',
              border: '1px solid #F8D7D7',
              borderRadius: '8px',
              padding: '12px 16px',
              color: '#C95C5C',
              fontSize: '13px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {/* Nombre Completo */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#233D49', marginBottom: '5px' }}>
              Nombre y Apellidos *
            </label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '12px', top: '11px', color: '#7E919C' }} />
              <input
                type="text"
                name="nombre_completo"
                required
                value={formData.nombre_completo}
                onChange={handleChange}
                placeholder="Ej. Valeria Morales"
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 40px',
                  borderRadius: '8px',
                  border: '1px solid #CEC8B8',
                  fontSize: '14px',
                  color: '#233D49',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Correo Electrónico */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#233D49', marginBottom: '5px' }}>
              Correo Electrónico *
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '11px', color: '#7E919C' }} />
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="tu.correo@ejemplo.com"
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 40px',
                  borderRadius: '8px',
                  border: '1px solid #CEC8B8',
                  fontSize: '14px',
                  color: '#233D49',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Teléfono y Cédula en 2 columnas */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#233D49', marginBottom: '5px' }}>
                Teléfono / WhatsApp
              </label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: '#7E919C' }} />
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  placeholder="0998765432"
                  style={{
                    width: '100%',
                    padding: '10px 10px 10px 34px',
                    borderRadius: '8px',
                    border: '1px solid #CEC8B8',
                    fontSize: '14px',
                    color: '#233D49',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#233D49', marginBottom: '5px' }}>
                Cédula (Opcional)
              </label>
              <div style={{ position: 'relative' }}>
                <CreditCard size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: '#7E919C' }} />
                <input
                  type="text"
                  name="cedula"
                  value={formData.cedula}
                  onChange={handleChange}
                  placeholder="1723456789"
                  style={{
                    width: '100%',
                    padding: '10px 10px 10px 34px',
                    borderRadius: '8px',
                    border: '1px solid #CEC8B8',
                    fontSize: '14px',
                    color: '#233D49',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Contraseña */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#233D49', marginBottom: '5px' }}>
              Contraseña * (mínimo 6 caracteres)
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '11px', color: '#7E919C' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                minLength={6}
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '10px 40px 10px 40px',
                  borderRadius: '8px',
                  border: '1px solid #CEC8B8',
                  fontSize: '14px',
                  color: '#233D49',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '10px',
                  background: 'none',
                  border: 'none',
                  color: '#7E919C',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirmar Contraseña */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#233D49', marginBottom: '5px' }}>
              Confirmar Contraseña *
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '11px', color: '#7E919C' }} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                required
                minLength={6}
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '10px 40px 10px 40px',
                  borderRadius: '8px',
                  border: '1px solid #CEC8B8',
                  fontSize: '14px',
                  color: '#233D49',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '10px',
                  background: 'none',
                  border: 'none',
                  color: '#7E919C',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Botón de Registro */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '10px',
              width: '100%',
              backgroundColor: '#4D7182',
              color: '#FFFFFF',
              border: 'none',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'background-color 0.2s',
            }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Registrando...
              </>
            ) : (
              'Crear mi Cuenta de Cliente'
            )}
          </button>
        </form>

        <div style={{ marginTop: '22px', textAlign: 'center', fontSize: '13px', color: '#4D7182' }}>
          ¿Ya tienes cuenta en este portal?{' '}
          <Link to="/login" style={{ color: '#233D49', fontWeight: '700', textDecoration: 'none' }}>
            Inicia sesión aquí
          </Link>
        </div>
      </div>
    </div>
  );
};
