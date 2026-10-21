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
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#EEEBDD]/90 backdrop-blur-md border-b border-[#CBC6B6]/70 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Logotipo de EVENTRA */}
        <Link 
          to="/" 
          onClick={closeMenu}
          className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-[#526F7D]/40 rounded-xl p-1 transition-transform duration-200"
        >
          <div className="w-10 h-10 rounded-xl bg-[#526F7D] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform duration-200">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold tracking-tight text-[#233D49]">
                EVENTRA
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#CBC6B6]/40 text-[#233D49]/80 border border-[#CBC6B6]/60">
                SaaS
              </span>
            </div>
            <span className="text-[11px] text-[#526F7D] font-medium tracking-wide">
              Gestión Inteligente de Eventos
            </span>
          </div>
        </Link>

        {/* Enlaces de Navegación Desktop */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `text-sm font-medium transition-all duration-200 relative py-1.5 flex items-center gap-1.5 ${
                  isActive
                    ? 'text-[#526F7D] font-bold after:w-full after:h-0.5 after:bg-[#526F7D] after:absolute after:bottom-0 after:left-0'
                    : 'text-[#233D49]/80 hover:text-[#526F7D] after:w-0 after:h-0.5 after:bg-[#526F7D] after:absolute after:bottom-0 after:left-0 hover:after:w-full after:transition-all after:duration-200'
                }`
              }
            >
              <span>{item.name}</span>
              {item.badge && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[#526F7D]/15 text-[#526F7D] border border-[#526F7D]/20">
                  <Sparkles className="w-2.5 h-2.5" />
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Botón Acción a la Derecha */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/login"
            className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#526F7D] hover:bg-[#3E5763] text-white text-sm font-semibold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#526F7D]/50"
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
            className="p-2 rounded-xl text-[#233D49] hover:bg-[#CBC6B6]/30 transition-colors focus:outline-none focus:ring-2 focus:ring-[#526F7D]/40"
            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Menú Mobile Desplegable */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#CBC6B6] bg-[#EEEBDD] px-4 pt-3 pb-6 shadow-lg animate-fade-in-up">
          <div className="flex flex-col space-y-2">
            {navLinks.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeMenu}
                className={({ isActive }) =>
                  `px-3 py-2.5 rounded-xl text-base font-medium flex items-center justify-between transition-colors ${
                    isActive
                      ? 'bg-white text-[#526F7D] font-bold shadow-xs border border-[#CBC6B6]/60'
                      : 'text-[#233D49] hover:bg-[#CBC6B6]/30'
                  }`
                }
              >
                <span>{item.name}</span>
                {item.badge && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#526F7D]/15 text-[#526F7D]">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}

            <div className="pt-3 border-t border-[#CBC6B6]/60">
              <Link
                to="/login"
                onClick={closeMenu}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#526F7D] text-white font-semibold text-center shadow-sm hover:bg-[#3E5763] transition-colors"
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
