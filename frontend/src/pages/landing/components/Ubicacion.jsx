import React from 'react';
import { Map, Clock, Phone } from 'lucide-react';

export const Ubicacion = () => {
  return (
    <section id="ubicacion" className="bg-[#EEEBDD] py-24 px-8 border-t border-[#CBC6B6] scroll-mt-24">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-serif text-3xl md:text-5xl text-[#233D49] mb-16 text-center">Visítanos y Contacto</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="flex flex-col items-center text-center p-8 bg-white/50 rounded-2xl shadow-sm border border-[#CBC6B6]">
            <Map className="text-[#526F7D] mb-6" size={48} />
            <h3 className="font-serif text-2xl text-[#233D49] mb-4">Nuestras Sedes</h3>
            <p className="font-sans text-[#526F7D] mb-3 leading-relaxed">
              <strong>Sede Principal:</strong> Simón Bolívar y Juan Montalvo, Centro de Ambato (junto a la Catedral y Parque Montalvo)
            </p>
            <p className="font-sans text-[#526F7D] leading-relaxed">
              <strong>Sucursal:</strong> Vargas Torres y García Moreno
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-8 bg-white/50 rounded-2xl shadow-sm border border-[#CBC6B6]">
            <Clock className="text-[#526F7D] mb-6" size={48} />
            <h3 className="font-serif text-2xl text-[#233D49] mb-4">Horario de Atención</h3>
            <p className="font-sans text-[#526F7D] text-lg leading-relaxed">
              Lunes a domingo<br />
              10:00 – 19:30
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-8 bg-white/50 rounded-2xl shadow-sm border border-[#CBC6B6]">
            <Phone className="text-[#526F7D] mb-6" size={48} />
            <h3 className="font-serif text-2xl text-[#233D49] mb-4">Contacto</h3>
            <p className="font-sans text-[#526F7D] text-xl font-medium">
              +593 99 316 6303
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
