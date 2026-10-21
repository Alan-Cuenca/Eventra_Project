import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ArrowRight, ShieldCheck, Mail, MapPin } from 'lucide-react';

export const FooterPublic = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="contacto" className="scroll-mt-28 bg-[#CBC6B6]/30 border-t border-[#CBC6B6] pt-16 pb-12 text-[#233D49]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[#CBC6B6]/60">
          
          {/* Columna Marca (2 cols en lg) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
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
            </div>

            <p className="text-sm text-[#233D49]/75 max-w-sm leading-relaxed">
              Plataforma web integral para empresas de eventos y recepciones. Centraliza cotizaciones, reservas anti-colisión, pagos y cronogramas con la elegancia y seguridad que tus anfitriones merecen.
            </p>

            <div className="flex items-center gap-2 text-xs text-[#526F7D] font-medium pt-1">
              <ShieldCheck className="w-4 h-4 text-[#4D9A72]" />
              <span>Arquitectura desacoplada en Node.js, React y PostgreSQL</span>
            </div>
          </div>

          {/* Columna Plataforma */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#526F7D]">
              Plataforma
            </h4>
            <ul className="space-y-2 text-sm text-[#233D49]/80 font-medium">
              <li><a href="#beneficios" className="hover:text-[#526F7D] transition-colors">Cotizador Dinámico</a></li>
              <li><a href="#beneficios" className="hover:text-[#526F7D] transition-colors">Control de Reservas</a></li>
              <li><a href="#modulos" className="hover:text-[#526F7D] transition-colors">Cronograma de Tareas</a></li>
              <li><a href="#modulos" className="hover:text-[#526F7D] transition-colors">Conciliación de Pagos</a></li>
              <li><a href="#beneficios" className="hover:text-[#526F7D] transition-colors">EVARA AI Assistant</a></li>
            </ul>
          </div>

          {/* Columna Seguridad & Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#526F7D]">
              Seguridad & SLA
            </h4>
            <ul className="space-y-2 text-sm text-[#233D49]/80 font-medium">
              <li><span className="cursor-default">Control RBAC Estricto</span></li>
              <li><span className="cursor-default">Validación de Concurrencia</span></li>
              <li><span className="cursor-default">Cifrado HTTPS / TLS</span></li>
              <li><span className="cursor-default">Términos del Servicio</span></li>
              <li><span className="cursor-default">Privacidad de Datos</span></li>
            </ul>
          </div>

          {/* Columna Acceso & Contacto */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#526F7D]">
              Portal Corporativo
            </h4>
            <p className="text-xs text-[#233D49]/70 leading-relaxed">
              ¿Ya formas parte de EVENTRA o deseas acceder a la demostración operativa?
            </p>
            <div className="pt-1">
              <Link
                to="/login"
                className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#526F7D] hover:bg-[#3E5763] text-white text-xs font-bold shadow-sm transition-all duration-200"
              >
                <span>Reservar / Ingresar</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="pt-2 text-xs text-[#233D49]/70 space-y-1">
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#526F7D]" />
                <span>contacto@eventra.app</span>
              </div>
            </div>
          </div>

        </div>

        {/* Fila Inferior de Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#233D49]/60 text-center sm:text-left">
          <p>
            &copy; {currentYear} EVENTRA SaaS. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/login" className="hover:text-[#233D49] transition-colors">
              Portal de Clientes y Personal
            </Link>
            <span>·</span>
            <span>Estándar Sofisticación Sutil</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
