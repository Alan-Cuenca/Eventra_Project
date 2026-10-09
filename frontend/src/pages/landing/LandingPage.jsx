import React from 'react';
import { Link } from 'react-router-dom';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Historia } from './components/Historia';
import { Sabores } from './components/Sabores';
import { Ubicacion } from './components/Ubicacion';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#EEEBDD] font-sans">
      <Header />
      <main>
        <Hero />
        <Historia />
        <Sabores />
        <Ubicacion />
      </main>
      <footer className="bg-[#CBC6B6] py-8 border-t border-[#526F7D]/20">
        <div className="max-w-6xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <p className="font-sans text-[#233D49] text-sm md:text-base">
            &copy; {new Date().getFullYear()} Helados La Catedral. El sabor que forma parte de la historia de Ambato.
          </p>
          <Link 
            to="/login" 
            className="font-sans text-xs text-[#526F7D]/70 hover:text-[#233D49] transition-colors"
          >
            Portal de Gestión
          </Link>
        </div>
      </footer>
    </div>
  );
};
