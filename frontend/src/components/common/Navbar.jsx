import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from './Badge';
import { Bell, LogOut, ShieldCheck, Activity, User } from 'lucide-react';
import { api } from '../../services/api';

export const Navbar = () => {
  const { user, roleConfig, logout } = useAuth();
  const [backendStatus, setBackendStatus] = useState('checking');

  useEffect(() => {
    let isMounted = true;
    api.get('/health')
      .then(() => {
        if (isMounted) setBackendStatus('connected');
      })
      .catch(() => {
        if (isMounted) setBackendStatus('mock');
      });
    return () => { isMounted = false; };
  }, []);

  return (
    <header
      style={{
        height: '70px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(18, 28, 35, 0.88)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: backendStatus === 'connected' ? '#10b981' : '#f59e0b',
              boxShadow: backendStatus === 'connected' ? '0 0 8px #10b981' : '0 0 8px #f59e0b',
            }}
          />
          <span style={{ color: 'var(--text-secondary)' }}>
            {backendStatus === 'connected' ? 'API Express Conectada' : 'Modo Frontend Activo'}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {/* Notificaciones */}
        <button
          className="btn btn-outline"
          style={{ padding: '0.45rem', borderRadius: '50%', border: 'none' }}
          title="Notificaciones"
        >
          <Bell size={18} color="var(--text-secondary)" />
        </button>

        {/* Info de usuario y rol */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), var(--accent))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.9rem',
              color: '#fff',
            }}
          >
            {user?.nombre_completo ? user.nombre_completo.charAt(0).toUpperCase() : <User size={18} />}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {user?.nombre_completo || 'Usuario'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Badge variant={roleConfig?.badgeColor ? roleConfig.badgeColor.replace('badge-', '') : 'primary'}>
                {roleConfig?.nombre || 'Rol'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Botón Logout */}
        <button
          onClick={logout}
          className="btn btn-secondary"
          style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
          title="Cerrar sesión"
        >
          <LogOut size={16} />
          <span>Salir</span>
        </button>
      </div>
    </header>
  );
};
