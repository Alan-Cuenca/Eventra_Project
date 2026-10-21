import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ShieldCheck, Mail, Lock, CheckCircle2, ArrowRight } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-[#CBC6B6]/30 border-t border-[#CBC6B6] pt-16 pb-12 text-[#233D49]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Grid de 4 columnas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[#CBC6B6]/70">
          
          {/* Columna Marca (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#526F7D] flex items-center justify-center text-white shadow-sm">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-bold tracking-tight text-[#233D49]">
                    EVENTRA
                  </span>
                  <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-[#CBC6B6]/50 text-[#233D49]/80 border border-[#CBC6B6]/70">
                    SaaS
                  </span>
                </div>
                <span className="text-xs text-[#526F7D] font-medium">
                  Gestión Inteligente de Eventos
                </span>
              </div>
            </Link>

            <p className="text-sm text-[#233D49]/80 max-w-sm leading-relaxed">
              Plataforma SaaS integral para centros de recepciones y empresas de eventos. Centraliza cotizaciones dinámicas, reservas blindadas anti-colisión, pagos y cronogramas con diseño de alta gama.
            </p>

            <div className="space-y-1.5 pt-2">
              <div className="flex items-center gap-2 text-xs text-[#233D49]/85 font-medium">
                <ShieldCheck className="w-4 h-4 text-[#4D9A72]" />
                <span>Zero Double-Booking garantizado con PostgreSQL</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#233D49]/85 font-medium">
                <Lock className="w-4 h-4 text-[#526F7D]" />
                <span>Seguridad RBAC y almacenamiento en Supabase</span>
              </div>
            </div>
          </div>

          {/* Columna Módulos y Tour */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#526F7D]">
              Módulos del Sistema
            </h4>
            <ul className="space-y-2 text-sm text-[#233D49]/80 font-medium">
              <li>
                <Link to="/funcionalidades" className="hover:text-[#526F7D] transition-colors">
                  Cotizador Dinámico (4 Pasos)
                </Link>
              </li>
              <li>
                <Link to="/funcionalidades" className="hover:text-[#526F7D] transition-colors">
                  Agenda & Reservas Anti-Colisión
                </Link>
              </li>
              <li>
                <Link to="/funcionalidades" className="hover:text-[#526F7D] transition-colors">
                  Cronograma & Checklist Móvil
                </Link>
              </li>
              <li>
                <Link to="/funcionalidades" className="hover:text-[#526F7D] transition-colors">
                  Portal Exclusivo del Anfitrión
                </Link>
              </li>
              <li>
                <Link to="/evara-ai" className="hover:text-[#526F7D] transition-colors flex items-center gap-1">
                  <span>Asistente EVARA AI (24/7)</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna Legal y Seguridad */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#526F7D]">
              Seguridad & Legal
            </h4>
            <ul className="space-y-2 text-sm text-[#233D49]/80 font-medium">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#4D9A72]" />
                <span>Control de Acceso RBAC</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#4D9A72]" />
                <span>Cifrado HTTPS / TLS 1.3</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#4D9A72]" />
                <span>Aislamiento Multi-Tenant</span>
              </li>
              <li>
                <a href="#terminos" onClick={(e) => { e.preventDefault(); alert('EVENTRA SaaS: Términos de Servicio disponibles bajo suscripción corporativa.'); }} className="hover:text-[#526F7D] transition-colors">
                  Términos del Servicio
                </a>
              </li>
              <li>
                <a href="#privacidad" onClick={(e) => { e.preventDefault(); alert('EVENTRA SaaS: Política de Privacidad conforme a estándares de protección de datos personales.'); }} className="hover:text-[#526F7D] transition-colors">
                  Política de Privacidad
                </a>
              </li>
            </ul>
          </div>

          {/* Columna Portal & Precios */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#526F7D]">
              Planes & Acceso
            </h4>
            <p className="text-xs text-[#233D49]/70 leading-relaxed">
              Descubre el plan que impulsará la rentabilidad de tu negocio o ingresa al portal.
            </p>
            <div className="space-y-2 pt-1">
              <Link
                to="/precios"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#526F7D] hover:underline"
              >
                <span>Ver Planes y Precios</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <div>
                <Link
                  to="/login"
                  className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#526F7D] hover:bg-[#3E5763] text-white text-xs font-bold shadow-sm transition-all duration-200"
                >
                  <span>Reservar / Ingresar</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
            <div className="pt-2 text-xs text-[#233D49]/70">
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#526F7D]" />
                <span>contacto@eventra.app</span>
              </div>
            </div>
          </div>

        </div>

        {/* Fila Inferior de Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#233D49]/70 text-center sm:text-left">
          <p>
            &copy; 2026 EVENTRA SaaS. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/login" className="hover:text-[#526F7D] transition-colors font-medium">
              Portal del Personal & Anfitrión
            </Link>
            <span>·</span>
            <span className="font-medium">Estándar Sofisticación Sutil</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
