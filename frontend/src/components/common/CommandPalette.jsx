import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  CalendarDays,
  CheckSquare,
  CalendarCheck,
  Calculator,
  Sparkles,
  CreditCard,
  FileEdit,
  Layers,
  Package,
  Users,
  Building2,
  BarChart3,
  UserCheck,
  ShieldCheck,
  Palette,
  Moon,
  Sun,
  X,
  CornerDownLeft,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export const CommandPalette = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { isAdmin, isGerente, isTrabajador, isCliente } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  const commandItems = [
    // Secciones Principales
    { id: 'dash', label: 'Panel Principal', path: '/dashboard', icon: <LayoutDashboard size={16} />, category: 'Navegación', visible: true },
    { id: 'events', label: 'Eventos & Calendario', path: '/eventos', icon: <CalendarDays size={16} />, category: 'Navegación', visible: isAdmin || isGerente || isCliente },
    { id: 'activities', label: 'Checklist Operativo', path: '/actividades', icon: <CheckSquare size={16} />, category: 'Navegación', visible: isAdmin || isGerente || isTrabajador },
    { id: 'reservations', label: 'Reservas Anti-Colisión', path: '/reservas', icon: <CalendarCheck size={16} />, category: 'Navegación', visible: isAdmin || isGerente || isTrabajador || isCliente },
    { id: 'quotes', label: 'Cotizaciones', path: '/cotizaciones', icon: <Calculator size={16} />, category: 'Navegación', visible: isAdmin || isGerente || isCliente },
    { id: 'quoter', label: 'Cotizador Dinámico', path: '/cotizador', icon: <Sparkles size={16} />, category: 'Navegación', visible: isAdmin || isGerente || isCliente },
    { id: 'payments', label: 'Gestión de Pagos & Anticipos', path: '/pagos', icon: <CreditCard size={16} />, category: 'Navegación', visible: isAdmin || isGerente || isTrabajador },
    { id: 'requests', label: 'Solicitudes de Modificación', path: '/solicitudes', icon: <FileEdit size={16} />, category: 'Navegación', visible: isAdmin || isGerente || isCliente },
    // Catálogo & CRM
    { id: 'services', label: 'Catálogo de Servicios', path: '/servicios', icon: <Layers size={16} />, category: 'Catálogo', visible: isAdmin || isGerente },
    { id: 'packages', label: 'Paquetes de Gala', path: '/paquetes', icon: <Package size={16} />, category: 'Catálogo', visible: isAdmin || isGerente },
    { id: 'clients', label: 'Directorio de Clientes (CRM)', path: '/clientes', icon: <Users size={16} />, category: 'CRM', visible: isAdmin || isGerente },
    { id: 'providers', label: 'Proveedores & Aliados', path: '/proveedores', icon: <Building2 size={16} />, category: 'CRM', visible: isAdmin || isGerente },
    // Administración
    { id: 'reports', label: 'Reportes & Analítica', path: '/reportes', icon: <BarChart3 size={16} />, category: 'Administración', visible: isAdmin || isGerente },
    { id: 'team', label: 'Equipo y Colaboradores', path: '/colaboradores', icon: <UserCheck size={16} />, category: 'Administración', visible: isAdmin },
    { id: 'subscription', label: 'Mi Suscripción SaaS & Límites', path: '/mi-suscripcion', icon: <ShieldCheck size={16} />, category: 'Administración', visible: isAdmin },
    { id: 'branding', label: 'Configuración de Marca Blanca', path: '/configuracion-marca', icon: <Palette size={16} />, category: 'Administración', visible: isAdmin },
  ];

  const visibleCommands = commandItems.filter((item) => item.visible);

  const filteredCommands = visibleCommands.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  // Focus en el input al abrir
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
      setQuery('');
    }
  }, [isOpen]);

  // Manejo de atajos con flechas y Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filteredCommands.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % (filteredCommands.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filteredCommands[selectedIndex];
        if (selected) {
          navigate(selected.path);
          onClose();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, navigate, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20">
      {/* Backdrop con Blur */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Omnibar en Liquid Glass con Radios Concéntricos (R_ext 20px - p-2 = R_int 12px) */}
      <div className="relative mx-auto max-w-xl rounded-[20px] backdrop-blur-xl backdrop-saturate-[180%] bg-[var(--ev-surface)]/80 border-0 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6),_0_10px_25px_-5px_rgba(35,61,73,0.1)] overflow-hidden animate-fade-in z-50">
        
        {/* Input de Búsqueda */}
        <div className="flex items-center px-4 py-3.5 border-b border-[var(--ev-border)]/20 backdrop-blur-xl backdrop-saturate-[180%] bg-[var(--ev-surface)]/80">
          <Search size={18} className="text-[var(--ev-primary)] shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent text-sm text-[var(--ev-text-main)] placeholder-[var(--ev-text-muted)] focus:outline-none"
            placeholder="Escribe para buscar comandos, módulos o clientes... (⌘K)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-[8px] text-[var(--ev-text-muted)] hover:text-[var(--ev-text-main)] hover:bg-[var(--ev-border)]/30 active:scale-[0.98]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Lista de Resultados */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--ev-text-muted)]">
              No se encontraron comandos para "{query}"
            </div>
          ) : (
            filteredCommands.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    navigate(item.path);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-[12px] text-xs transition-colors active:scale-[0.99] ${
                    isSelected
                      ? 'bg-[var(--ev-primary)]/15 text-[var(--ev-primary)] font-bold shadow-2xs'
                      : 'text-[var(--ev-text-main)]/85 hover:bg-[var(--ev-border)]/20'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`p-1.5 rounded-[8px] ${isSelected ? 'bg-[var(--ev-primary)] text-white shadow-xs' : 'bg-[var(--ev-border)]/30 text-[var(--ev-primary)]'}`}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-semibold text-[var(--ev-text-muted)]">
                      {item.category}
                    </span>
                    {isSelected && (
                      <CornerDownLeft size={13} className="text-[var(--ev-primary)]" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer con Atajos */}
        <div className="px-4 py-2 border-t border-[var(--ev-border)]/40 bg-[var(--ev-bg-base)]/40 flex items-center justify-between text-[11px] text-[var(--ev-text-muted)]">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1.5 py-0.5 rounded bg-[var(--ev-surface)] border border-[var(--ev-border)] font-mono text-[10px]">↑</kbd> <kbd className="px-1.5 py-0.5 rounded bg-[var(--ev-surface)] border border-[var(--ev-border)] font-mono text-[10px]">↓</kbd> Navegar</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-[var(--ev-surface)] border border-[var(--ev-border)] font-mono text-[10px]">↵</kbd> Seleccionar</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-[var(--ev-surface)] border border-[var(--ev-border)] font-mono text-[10px]">esc</kbd> Cerrar</span>
          </div>
          <button
            type="button"
            onClick={() => {
              toggleTheme();
              onClose();
            }}
            className="inline-flex items-center gap-1 hover:text-[var(--ev-text-main)]"
          >
            {isDark ? <Sun size={12} /> : <Moon size={12} />}
            <span>Alternar Modo {isDark ? 'Claro' : 'Oscuro'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};

