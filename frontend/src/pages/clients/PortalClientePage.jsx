/**
 * EVENTRA — Portal del Cliente (Vista temporal)
 * Destino de redirección para usuarios con rol_id = 4 (Cliente).
 * Esta página será expandida con las funcionalidades del portal de cliente.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  CalendarDays,
  FileText,
  Star,
  MessageSquare,
  LogOut,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import logoImg from '../../assets/logo.png';

const ACCESOS_RAPIDOS = [
  {
    id: 'mis-eventos',
    icon: CalendarDays,
    titulo: 'Mis Eventos',
    desc: 'Consulta y haz seguimiento de todos tus eventos contratados.',
    color: '#456677',
    colorBg: 'rgba(69,102,119,0.15)',
  },
  {
    id: 'cotizaciones',
    icon: FileText,
    titulo: 'Mis Cotizaciones',
    desc: 'Revisa presupuestos y aprueba propuestas de tu empresa organizadora.',
    color: '#C4B59F',
    colorBg: 'rgba(196,181,159,0.12)',
  },
  {
    id: 'valoraciones',
    icon: Star,
    titulo: 'Valoraciones',
    desc: 'Comparte tu experiencia y califica los servicios recibidos.',
    color: '#c28834',
    colorBg: 'rgba(194,136,52,0.15)',
  },
  {
    id: 'soporte',
    icon: MessageSquare,
    titulo: 'Soporte',
    desc: 'Contacta al equipo organizador o abre un ticket de asistencia.',
    color: '#2e8b57',
    colorBg: 'rgba(46,139,87,0.12)',
  },
];

export const PortalClientePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const nombre = user?.nombre_completo ?? localStorage.getItem('eventra_user')
    ? JSON.parse(localStorage.getItem('eventra_user') || '{}')?.nombre_completo
    : 'Cliente';

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(ellipse 120% 70% at 50% 0%, rgba(69,102,119,0.18) 0%, transparent 55%), var(--bg-main)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── Top Bar ──────────────────────────────────────────────────── */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 2rem',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(18,28,35,0.7)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <img
            src={logoImg}
            alt="EVENTRA"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'var(--ivory-pure)',
              padding: '3px',
              objectFit: 'contain',
            }}
          />
          <div>
            <span
              style={{
                fontSize: '1rem',
                fontWeight: 800,
                letterSpacing: '0.06em',
                color: 'var(--text-primary)',
              }}
            >
              EVENTRA
            </span>
            <span
              style={{
                display: 'block',
                fontSize: '0.65rem',
                color: 'var(--accent)',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                lineHeight: 1,
              }}
            >
              Portal Cliente
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ textAlign: 'right', fontSize: '0.82rem' }}>
            <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
              {user?.nombre_completo ?? nombre}
            </div>
            <div
              style={{
                color: 'var(--accent)',
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              🎉 Cliente
            </div>
          </div>
          <button
            id="portal-logout-btn"
            onClick={handleLogout}
            className="btn btn-secondary"
            style={{ gap: '0.4rem', fontSize: '0.8rem', padding: '0.5rem 0.85rem' }}
          >
            <LogOut size={15} />
            Salir
          </button>
        </div>
      </header>

      {/* ── Cuerpo principal ─────────────────────────────────────────── */}
      <main style={{ flex: 1, padding: '3rem 2rem', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
        {/* Bienvenida */}
        <div className="animate-fade-in" style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Sparkles size={18} color="var(--accent)" />
            <span style={{ color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Bienvenido/a de nuevo
            </span>
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Hola, {(user?.nombre_completo ?? nombre)?.split(' ')[0]} 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Este es tu portal personal en EVENTRA. Aquí puedes gestionar tus eventos, revisar cotizaciones y contactar a tu organizador.
          </p>
        </div>

        {/* Banner de estado */}
        <div
          className="glass-card animate-fade-in"
          style={{
            marginBottom: '2.5rem',
            padding: '1.5rem 2rem',
            background: 'linear-gradient(135deg, rgba(69,102,119,0.25) 0%, rgba(196,181,159,0.1) 100%)',
            border: '1px solid rgba(196,181,159,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>
              Estado del portal
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              🚀 Portal en construcción — Funcionalidades llegando pronto
            </div>
            <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Tu sesión está activa y el acceso basado en rol está funcionando correctamente.
            </div>
          </div>
          <div
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(46,139,87,0.15)',
              border: '1px solid rgba(46,139,87,0.35)',
              color: '#5bc286',
              fontSize: '0.78rem',
              fontWeight: 700,
            }}
          >
            ● Conectado a Render
          </div>
        </div>

        {/* Grid de accesos rápidos */}
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-secondary)' }}>
          Accesos rápidos
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {ACCESOS_RAPIDOS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                id={`portal-card-${item.id}`}
                className="glass-card interactive"
                style={{ cursor: 'pointer', padding: '1.5rem' }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: item.colorBg,
                    border: `1px solid ${item.color}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem',
                  }}
                >
                  <Icon size={22} color={item.color} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{item.titulo}</h3>
                  <ChevronRight size={16} color="var(--text-muted)" />
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Info sesión */}
        <div
          className="glass-card"
          style={{ marginTop: '2.5rem', padding: '1.25rem 1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}
        >
          <div style={{ fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            🔒 Información de sesión
          </div>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <span>Rol: <strong style={{ color: 'var(--accent)' }}>Cliente (rol_id = 4)</strong></span>
            <span>Email: <strong style={{ color: 'var(--text-primary)' }}>{user?.email ?? '—'}</strong></span>
            <span>Token: <strong style={{ color: 'var(--text-primary)' }}>
              {localStorage.getItem('token')?.substring(0, 20)}…
            </strong></span>
          </div>
        </div>
      </main>

      <style>{`
        @media (max-width: 600px) {
          main { padding: 1.5rem 1rem !important; }
          h1 { font-size: 1.6rem !important; }
        }
      `}</style>
    </div>
  );
};

export default PortalClientePage;
