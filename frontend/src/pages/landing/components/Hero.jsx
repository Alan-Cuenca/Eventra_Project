import React from 'react';

export const Hero = () => {
  return (
    <section id="inicio" className="relative min-h-screen flex flex-col items-center justify-center text-center px-8 scroll-mt-24">
      <div className="absolute inset-0 bg-[url('/Fondo.jpg')] bg-cover bg-center z-0"></div>
      <div className="absolute inset-0 bg-[#233D49]/60 z-0"></div>
      
      <div className="relative z-10 max-w-4xl bg-[#EEEBDD]/95 backdrop-blur-md p-12 rounded-2xl shadow-xl border border-[#CBC6B6] animate-fade-in-up">
        <span className="inline-block py-1 px-4 rounded-full bg-white text-[#526F7D] font-sans text-sm font-semibold tracking-wide uppercase mb-6 border border-[#CBC6B6] shadow-sm">
          El sabor que forma parte de la historia de Ambato
        </span>
        <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-[#233D49] mb-6 leading-tight">
          Tradición, sabor y frescura en cada helado.
        </h1>
        <p className="font-sans text-lg md:text-xl text-[#526F7D] mb-10 leading-relaxed max-w-2xl mx-auto">
          Descubre uno de los sabores tradicionales del centro de Ambato y disfruta de nuestros helados artesanales elaborados con dedicación y una receta que ha pasado de generación en generación.
        </p>
        <a 
          href="#sabores" 
          className="inline-block bg-[#526F7D] text-white px-8 py-4 rounded-xl font-sans text-lg font-medium hover:bg-[#233D49] transition-colors shadow-sm"
        >
          Descubre nuestros sabores
        </a>
      </div>
    </section>
  );
};
