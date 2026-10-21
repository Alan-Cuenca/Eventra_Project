import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Menu, X, Calendar, Sparkles } from 'lucide-react';

export const NavbarPublic = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Beneficios', href: '#beneficios' },
    { name: 'Módulos', href: '#modulos' },
    { name: 'Planes', href: '#precios' },
    { name: 'Contacto', href: '#contacto' },
  ];

  const handleScroll = (e, href) => {
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#EEEBDD]/90 backdrop-blur-md border-b border-[#CBC6B6]/60 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Logo de la Marca */}
        <Link 
          to="/" 
          className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-[#526F7D]/40 rounded-lg p-1"
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

        {/* Navegación Desktop */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={(e) => handleScroll(e, link.href)}
              className="text-sm font-medium text-[#233D49]/80 hover:text-[#526F7D] transition-colors duration-150 relative py-1 hover:after:w-full after:w-0 after:h-0.5 after:bg-[#526F7D] after:absolute after:bottom-0 after:left-0 after:transition-all after:duration-200"
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* Acciones de la Derecha */}
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
            className="p-2 rounded-lg text-[#233D49] hover:bg-[#CBC6B6]/30 transition-colors focus:outline-none"
            aria-label="Abrir menú"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Menú Mobile desplegable */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#CBC6B6]/80 bg-[#EEEBDD] px-4 pt-3 pb-6 shadow-lg animate-fade-in-up">
          <div className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleScroll(e, link.href)}
                className="px-3 py-2 rounded-lg text-base font-medium text-[#233D49] hover:bg-[#CBC6B6]/40 transition-colors"
              >
                {link.name}
              </a>
            ))}
            <div className="pt-2 border-t border-[#CBC6B6]/40">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#526F7D] text-white font-semibold text-center shadow-sm"
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
