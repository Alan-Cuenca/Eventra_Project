import React from 'react';

export const Header = () => {
  return (
    <header className="bg-[#EEEBDD] py-4 px-8 flex justify-between items-center sticky top-0 z-50 shadow-sm border-b border-[#CBC6B6]">
      <div className="flex items-center gap-4">
        <img src="/logo_Helados_Catedral.jpg" alt="Logo" className="h-14 object-contain rounded-full shadow-sm" />
        <span className="font-serif text-2xl font-bold text-[#526F7D] hidden sm:block">Helados La Catedral</span>
      </div>
      <nav className="hidden md:flex gap-8 text-[#526F7D] font-sans text-lg font-medium">
        <a href="#inicio" className="hover:text-[#233D49] transition-colors">Inicio</a>
        <a href="#historia" className="hover:text-[#233D49] transition-colors">Historia</a>
        <a href="#sabores" className="hover:text-[#233D49] transition-colors">Sabores</a>
        <a href="#ubicacion" className="hover:text-[#233D49] transition-colors">Ubicación</a>
      </nav>
    </header>
  );
};
