import React from 'react';

const sabores = [
  { name: 'Mora', desc: 'Uno de los sabores tradicionales y representativos del negocio.', img: '/Mora.jpg', cat: 'Tradicional' },
  { name: 'Coco', desc: 'Una alternativa clásica dentro de sus sabores tradicionales.', img: '/Coco.jpg', cat: 'Tradicional' },
  { name: 'Taxo', desc: 'Un sabor elaborado a partir de una fruta muy asociada a la gastronomía andina.', img: '/Taxo.webp', cat: 'Tradicional' },
  { name: 'Maracuyá', desc: 'Uno de los sabores incorporados dentro de la variedad de la heladería.', img: '/Maracuya.webp', cat: 'Nuevo Sabor' },
  { name: 'Café', desc: 'Una opción disponible dentro de la variedad ampliada de sabores.', img: '/Cafe.jpg', cat: 'Nuevo Sabor' },
  { name: 'Ron pasas', desc: 'Una alternativa de sabor más intenso.', img: '/Ron_Pasas.png', cat: 'Especial' },
  { name: 'Guanábana', desc: 'Se da este sabor como una opción de textura cremosa y fruta natural.', img: '/Guanabana.webp', cat: 'Especial' },
];

export const Sabores = () => {
  return (
    <section id="sabores" className="bg-[#EEEBDD] py-24 px-8 scroll-mt-24">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="font-serif text-3xl md:text-5xl text-[#233D49] mb-4">Catálogo de Sabores</h2>
        <p className="font-sans text-lg text-[#526F7D] mb-16">Nuestra selecta variedad elaborada artesanalmente</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {sabores.map((sabor, idx) => (
            <div key={idx} className="group bg-[#CBC6B6] rounded-2xl shadow-sm border border-[#CBC6B6] overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="h-56 overflow-hidden bg-white/20 relative">
                <img 
                  src={sabor.img} 
                  alt={sabor.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#526F7D]">{sabor.cat}</span>
                </div>
              </div>
              <div className="p-6 text-left">
                <h3 className="font-serif text-2xl text-[#233D49] mb-3">{sabor.name}</h3>
                <p className="font-sans text-[#526F7D] text-sm leading-relaxed">{sabor.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
