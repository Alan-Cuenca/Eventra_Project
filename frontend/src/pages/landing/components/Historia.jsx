import React from 'react';
import { History, MapPin, TrendingUp, Users } from 'lucide-react';

export const Historia = () => {
  return (
    <section id="historia" className="bg-[#EEEBDD] py-24 px-8 scroll-mt-24">
      <div className="max-w-7xl mx-auto">
        
        {/* Bloque Superior: Texto e Imagen */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-16">
          <div>
            <h2 className="font-serif text-3xl md:text-5xl text-[#233D49] mb-8">Nuestra Historia</h2>
            <p className="font-sans text-lg text-[#526F7D] mb-6 leading-relaxed">
              La historia comienza con Segundo Oña, conocido como "El Marinero", quien aprendió a elaborar y vender helados gracias a su suegro y a su esposa.
            </p>
            <p className="font-sans text-lg text-[#526F7D] mb-6 leading-relaxed">
              Sus primeros pasos fueron humildes: comenzó utilizando un pequeño coche prestado para vender sus helados de paila y recorrió diferentes plazas, mercados y parques de Ambato. Con el tiempo, encontró en la esquina de Montalvo y Bolívar, cerca de la Catedral, el lugar que se convertiría en el pilar de nuestra identidad.
            </p>
            <p className="font-sans text-lg text-[#526F7D] leading-relaxed">
              Tras más de 35 años de trayectoria, <strong>Helados La Catedral</strong> es reconocido como parte de la tradición gastronómica de Ambato, representando la perseverancia y el trabajo de su fundador.
            </p>
          </div>
          
          <div className="h-[500px] w-full rounded-2xl overflow-hidden shadow-xl border-4 border-white/50 relative group">
            <img 
              src="/Catedral.jpg" 
              alt="Catedral de Ambato" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
            />
          </div>
        </div>

        {/* Bloque Inferior: Cards Aisladas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          <div className="bg-[#CBC6B6] p-6 rounded-2xl hover:-translate-y-2 hover:shadow-lg transition-all duration-300">
            <div className="bg-white/50 w-12 h-12 rounded-full flex items-center justify-center text-[#526F7D] mb-4">
              <Users size={24} />
            </div>
            <h4 className="font-serif text-xl text-[#233D49] mb-2">Elaboración Artesanal</h4>
            <p className="font-sans text-sm text-[#526F7D]">Tradición de generación en generación.</p>
          </div>
          
          <div className="bg-[#CBC6B6] p-6 rounded-2xl hover:-translate-y-2 hover:shadow-lg transition-all duration-300">
            <div className="bg-white/50 w-12 h-12 rounded-full flex items-center justify-center text-[#526F7D] mb-4">
              <MapPin size={24} />
            </div>
            <h4 className="font-serif text-xl text-[#233D49] mb-2">Identidad Ambateña</h4>
            <p className="font-sans text-sm text-[#526F7D]">Ubicación histórica junto a la Catedral de Ambato.</p>
          </div>
          
          <div className="bg-[#CBC6B6] p-6 rounded-2xl hover:-translate-y-2 hover:shadow-lg transition-all duration-300">
            <div className="bg-white/50 w-12 h-12 rounded-full flex items-center justify-center text-[#526F7D] mb-4">
              <TrendingUp size={24} />
            </div>
            <h4 className="font-serif text-xl text-[#233D49] mb-2">Historia de Perseverancia</h4>
            <p className="font-sans text-sm text-[#526F7D]">De un coche prestado a locales propios.</p>
          </div>
          
          <div className="bg-[#CBC6B6] p-6 rounded-2xl hover:-translate-y-2 hover:shadow-lg transition-all duration-300">
            <div className="bg-white/50 w-12 h-12 rounded-full flex items-center justify-center text-[#526F7D] mb-4">
              <History size={24} />
            </div>
            <h4 className="font-serif text-xl text-[#233D49] mb-2">Tradición Familiar</h4>
            <p className="font-sans text-sm text-[#526F7D]">Recuerdos entre generaciones de ambateños.</p>
          </div>
        </div>

      </div>
    </section>
  );
};
