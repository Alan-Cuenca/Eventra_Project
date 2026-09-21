import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ROLES, ROLES_CONFIG } from '../../services/mockData';
import { Shield, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

export const RoleSwitcher = () => {
  const { user, roleId, switchDemoRole } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return null;

  return (
    <aside
      aria-label="Selector de demostración de roles"
      style={{
        position: 'fixed',
        bottom: '1rem',
        right: '1rem',
        zIndex: 9999,
        background: 'rgba(17, 24, 39, 0.92)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(99, 102, 241, 0.4)',
        borderRadius: '12px',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)',
        color: '#fff',
        fontSize: '0.8rem',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
      }}
    >
      <header
        onClick={() => setCollapsed(!collapsed)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          padding: '0.5rem 0.85rem',
          cursor: 'pointer',
          background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.2), rgba(245, 158, 11, 0.1))',
          fontWeight: 600,
          borderBottom: collapsed ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Sparkles size={14} color="#f59e0b" />
          <span>Demo Role Switcher</span>
        </div>
        {collapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </header>

      {!collapsed && (
        <div style={{ padding: '0.65rem 0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div style={{ color: '#9ca3af', fontSize: '0.725rem' }}>
            Rol actual: <strong style={{ color: '#818cf8' }}>{ROLES_CONFIG[roleId]?.nombre || 'Indefinido'}</strong>
          </div>
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => switchDemoRole(ROLES.ADMIN)}
              className={`btn ${roleId === ROLES.ADMIN ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.725rem' }}
            >
              👑 Admin
            </button>
            <button
              onClick={() => switchDemoRole(ROLES.GERENTE)}
              className={`btn ${roleId === ROLES.GERENTE ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.725rem' }}
            >
              💼 Gerente
            </button>
            <button
              onClick={() => switchDemoRole(ROLES.TRABAJADOR)}
              className={`btn ${roleId === ROLES.TRABAJADOR ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.725rem' }}
            >
              🛠️ Trabajador
            </button>
            <button
              onClick={() => switchDemoRole(ROLES.CLIENTE)}
              className={`btn ${roleId === ROLES.CLIENTE ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.725rem' }}
            >
              🎉 Cliente
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
