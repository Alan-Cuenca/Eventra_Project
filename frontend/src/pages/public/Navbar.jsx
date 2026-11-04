import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Calendar, ArrowRight, Menu, X, Sparkles } from 'lucide-react';

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Inicio', path: '/' },
    { name: 'Funcionalidades', path: '/funcionalidades' },
    { name: 'EVARA AI', path: '/evara-ai', badge: '24/7' },
    { name: 'Precios', path: '/precios' },
  ];

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl backdrop-saturate-[180%] bg-[var(--ev-surface)]/75 border-b border-[var(--ev-border)]/50 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6),_0_10px_30px_-5px_rgba(var(--ev-text-main-rgb)/0.07)] transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Logotipo de EVENTRA */}
        <Link 
          to="/" 
          onClick={closeMenu}
          className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-[var(--ev-primary)]/40 rounded-xl p-1 active:scale-[0.98] transition-transform duration-200"
        >
          <div className="w-10 h-10 rounded-xl bg-[var(--ev-primary)] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform duration-200">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold tracking-tight text-[var(--ev-text-main)]">
                EVENTRA
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--ev-border)]/40 text-[var(--ev-text-main)]/80 border border-[var(--ev-border)]/60">
                SaaS
              </span>
            </div>
            <span className="text-[11px] text-[var(--ev-primary)] font-medium tracking-wide">
              Gestión Inteligente de Eventos
            </span>
          </div>
        </Link>

        {/* Enlaces de Navegación Desktop */}
        <nav className="hidden md:flex items-center gap-7">
          {navLinks.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `text-sm font-medium transition-all duration-200 relative py-1.5 flex items-center gap-1.5 ${
                  isActive
                    ? 'text-[var(--ev-primary)] font-bold after:w-full after:h-0.5 after:bg-[var(--ev-primary)] after:absolute after:bottom-0 after:left-0'
                    : 'text-[var(--ev-text-main)]/75 hover:text-[var(--ev-primary)] after:w-0 after:h-0.5 after:bg-[var(--ev-primary)] after:absolute after:bottom-0 after:left-0 hover:after:w-full after:transition-all after:duration-200'
                }`
              }
            >
              <span>{item.name}</span>
              {item.badge && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[var(--ev-primary)]/15 text-[var(--ev-primary)] border border-[var(--ev-primary)]/25">
                  <Sparkles className="w-2.5 h-2.5" />
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Acciones Derecha: CTA Principal Redondeado con Tactilidad */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/login"
            className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--ev-primary)] hover:bg-[var(--ev-primary-hover)] text-white text-sm font-semibold shadow-xs hover:shadow-md active:scale-[0.98] apple-spring focus:outline-none focus:ring-2 focus:ring-[var(--ev-primary)]/50"
          >
            <span>Reservar / Ingresar</span>
            <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform duration-200" />
          </Link>
        </div>

        {/* Botón Menú Mobile */}
        <div className="flex md:hidden items-center">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-[var(--ev-text-main)] hover:bg-[var(--ev-border)]/30 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ev-primary)]/40"
            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Menú Mobile Desplegable */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[var(--ev-border)] bg-[var(--ev-surface)]/95 backdrop-blur-xl px-4 pt-3 pb-6 shadow-lg animate-fade-in-up">
          <div className="flex flex-col space-y-2">
            {navLinks.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeMenu}
                className={({ isActive }) =>
                  `px-3 py-2.5 rounded-xl text-base font-medium flex items-center justify-between transition-colors ${
                    isActive
                      ? 'bg-[var(--ev-primary)]/15 text-[var(--ev-primary)] font-bold shadow-xs border border-[var(--ev-border)]/60'
                      : 'text-[var(--ev-text-main)] hover:bg-[var(--ev-border)]/30'
                  }`
                }
              >
                <span>{item.name}</span>
                {item.badge && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--ev-primary)]/15 text-[var(--ev-primary)]">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}

            <div className="pt-3 border-t border-[var(--ev-border)]/60">
              <Link
                to="/login"
                onClick={closeMenu}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-[var(--ev-primary)] text-white font-semibold text-center shadow-sm active:scale-[0.98] transition-all"
              >
                <span>Reservar / Ingresar</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
