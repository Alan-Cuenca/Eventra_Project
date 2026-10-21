/**
 * EVENTRA — RegistroClientePortal.jsx
 * Flujo SaaS Nivel 3: Registro exclusivo de clientes finales desde el portal específico de su empresa.
 * Extrae el slug mediante useParams(), valida la empresa y despacha a POST /api/auth/registro-cliente.
 * Diseño: "Sofisticación Sutil" (Estrictamente Light Mode).
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import {
  Lock,
  Mail,
  User,
  Phone,
  CreditCard,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import logoImg from '../../assets/logo.png';

export const RegistroClientePortal = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [empresa, setEmpresa] = useState(null);
  const [loadingPortal, setLoadingPortal] = useState(true);
  const [portalError, setPortalError] = useState('');

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

  // 1. Cargar y verificar información pública del portal por su slug
  useEffect(() => {
    if (!slug) {
      setPortalError('No se especificó el identificador del portal.');
      setLoadingPortal(false);
      return;
    }

    const cargarDatosPortal = async () => {
      setLoadingPortal(true);
      setPortalError('');
      try {
        const response = await api.get(`/auth/portal/${slug.trim()}`);
        if (response && response.data) {
          setEmpresa(response.data);
        } else {
          setPortalError('No se encontró el portal para este organizador de eventos.');
        }
      } catch (err) {
        console.error('[RegistroClientePortal] Error al resolver el portal:', err);
        setPortalError(
          err.message ||
          'El portal de esta empresa no existe o se encuentra inactivo actualmente.'
        );
      } finally {
        setLoadingPortal(false);
      }
    };

    cargarDatosPortal();
  }, [slug]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe contener al menos 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/registro-cliente', {
        empresa_slug: slug.trim(),
        nombre_completo: formData.nombre_completo.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        telefono: formData.telefono.trim() || null,
        cedula: formData.cedula.trim() || null,
      });

      // Almacenar credenciales del cliente autenticado
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
      console.error('[RegistroClientePortal] Error:', err);
      let msg = 'Ocurrió un error al procesar tu registro.';
      if (err.status === 409) {
        msg = 'Ya existe una cuenta con este correo electrónico o cédula. Inicia sesión en su lugar.';
      } else if (err.status === 404) {
        msg = 'La empresa organizadora asociada no fue encontrada.';
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ── Estado: Cargando Portal ───────────────────────────────────────────── */
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

  /* ── Estado: Portal No Encontrado o Inactivo ────────────────────────────── */
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
            {portalError || 'No se pudo verificar la empresa organizadora con el identificador ingresado.'}
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

  /* ── Estado: Registro Exitoso ─────────────────────────────────────────── */
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
            ¡Bienvenido a {empresa.nombre_comercial}!
          </h2>
          <p style={{ color: '#4D7182', fontSize: '14px', lineHeight: '1.5', marginBottom: '24px' }}>
            Tu cuenta de cliente ha sido creada exitosamente. Redirigiendo a tu portal para consultar cotizaciones y eventos...
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

  /* ── Formulario de Registro en el Portal de la Empresa ─────────────────── */
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
        {/* Cabecera del Portal */}
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

        {/* Alerta de Error */}
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
          {/* Nombre y Apellidos */}
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

          {/* Teléfono y Cédula (2 columnas) */}
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

          {/* Botón de Enviar */}
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
