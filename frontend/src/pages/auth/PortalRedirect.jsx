/**
 * EVENTRA — PortalRedirect.jsx
 * Vista de asistencia y redirección para usuarios que acceden a /registro sin slug específico.
 * Explica el modelo SaaS multi-tenant, ayuda a los clientes a encontrar su portal
 * y orienta a los empleados sobre el flujo de invitación por correo.
 * Diseño: "Sofisticación Sutil" (Estrictamente Light Mode).
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, ArrowRight, HelpCircle, Mail, Sparkles } from 'lucide-react';
import logoImg from '../../assets/logo.png';

export const PortalRedirect = () => {
  const [slugInput, setSlugInput] = useState('');
  const navigate = useNavigate();

  const handleBuscarPortal = (e) => {
    e.preventDefault();
    if (slugInput.trim()) {
      navigate(`/portal/${slugInput.trim().toLowerCase()}/registro`);
    }
  };

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
          padding: '40px 32px',
          boxShadow: '0 4px 24px rgba(35, 61, 73, 0.08)',
          textAlign: 'center',
        }}
      >
        {/* Logotipo y Título */}
        <img src={logoImg} alt="EVENTRA" style={{ height: '36px', margin: '0 auto 14px' }} />

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: '20px',
            backgroundColor: '#ECE7D5',
            color: '#4D7182',
            fontSize: '12px',
            fontWeight: '600',
            marginBottom: '12px',
          }}
        >
          <Sparkles size={14} /> Portal de Clientes SaaS
        </div>

        <h1 style={{ color: '#233D49', fontSize: '22px', fontWeight: '700', marginBottom: '8px' }}>
          Portal de Registro de Clientes
        </h1>
        <p style={{ color: '#4D7182', fontSize: '14px', lineHeight: '1.6', marginBottom: '26px' }}>
          En EVENTRA, cada empresa de organización de eventos cuenta con su propio portal exclusivo. Si eres cliente de un evento, ingresa el identificador (slug) de tu empresa organizadora.
        </p>

        {/* Buscador de Portal */}
        <form onSubmit={handleBuscarPortal} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ position: 'relative' }}>
            <Building2 size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#7E919C' }} />
            <input
              type="text"
              required
              value={slugInput}
              onChange={(e) => setSlugInput(e.target.value)}
              placeholder="Identificador del organizador (ej: luxury-events)"
              style={{
                width: '100%',
                padding: '11px 12px 11px 40px',
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
              transition: 'background-color 0.2s',
            }}
          >
            Continuar al Portal de mi Empresa <ArrowRight size={16} />
          </button>
        </form>

        {/* Aviso Explicativo para Colaboradores / Empleados */}
        <div
          style={{
            marginTop: '28px',
            padding: '16px',
            borderRadius: '12px',
            backgroundColor: '#F9F8F5',
            border: '1px solid #ECE7D5',
            textAlign: 'left',
            display: 'flex',
            gap: '12px',
          }}
        >
          <Mail size={20} style={{ color: '#4D7182', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '13px', color: '#4D7182', lineHeight: '1.5' }}>
            <strong style={{ color: '#233D49' }}>¿Eres colaborador (Gerente o Trabajador)?</strong><br />
            Los miembros del equipo operativo no se autoregistran. Debes abrir el enlace seguro que tu Administrador envió a tu correo electrónico.
          </div>
        </div>

        {/* Enlace a Login */}
        <div style={{ marginTop: '22px', fontSize: '13px', color: '#4D7182' }}>
          ¿Ya tienes una cuenta activa?{' '}
          <Link to="/login" style={{ color: '#233D49', fontWeight: '700', textDecoration: 'none' }}>
            Inicia sesión aquí
          </Link>
        </div>
      </div>
    </div>
  );
};
