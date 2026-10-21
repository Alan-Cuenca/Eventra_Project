import React from 'react';
import { Calculator, ShieldCheck, Bot, Users, CheckCircle2 } from 'lucide-react';

export const BeneficiosPublic = () => {
  const beneficios = [
    {
      icon: Calculator,
      title: 'Cotizador Dinámico',
      description: 'Genera cotizaciones profesionales en segundos calculando costos por comensal, paquetes personalizados, salones y servicios adicionales con márgenes de ganancia precisos.',
      tag: 'Precisión Comercial'
    },
    {
      icon: ShieldCheck,
      title: 'Control Anti-Colisiones',
      description: 'Garantía técnica de cero colisiones. Nuestro algoritmo de reserva concurrente bloquea fechas y salones duplicados directamente en base de datos PostgreSQL.',
      tag: 'Concurrencia Robusta'
    },
    {
      icon: Bot,
      title: 'EVARA AI Assistant',
      description: 'Agente inteligente que atiende consultas comerciales 24/7, guía a los prospectos en la selección de opciones y asiste en la verificación de disponibilidades.',
      tag: 'Automatización Inteligente'
    },
    {
      icon: Users,
      title: 'Gestión Multi-Tenant & RBAC',
      description: 'Acceso segregado por roles estrictos: Administrador, Gerente, Trabajador y Portal exclusivo para el Cliente final. Cada cual ve solo lo que necesita ver.',
      tag: 'Seguridad Empresarial'
    }
  ];

  return (
    <section id="beneficios" className="scroll-mt-28 py-20 md:py-28 bg-[#EEEBDD] border-t border-[#CBC6B6]/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Encabezado de la sección */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-[#CBC6B6] text-xs font-semibold text-[#526F7D]">
            <span>Propuesta de Valor B2B</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#233D49] tracking-tight">
            Diseñado para erradicar el caos en la coordinación de recepciones
          </h2>
          <p className="text-base sm:text-lg text-[#233D49]/75 leading-relaxed">
            EVENTRA sustituye hojas de cálculo dispersas y notas de papel por una arquitectura centralizada que otorga certeza a tu equipo y prestigio a tus clientes.
          </p>
        </div>

        {/* Grid de 4 Beneficios Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {beneficios.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="group bg-white rounded-2xl p-7 border border-[#CBC6B6]/70 shadow-sm hover:shadow-lg hover:-translate-y-1.5 transition-all duration-300 ease-out flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-xl bg-[#526F7D]/10 text-[#526F7D] flex items-center justify-center group-hover:bg-[#526F7D] group-hover:text-white transition-colors duration-300">
                      <Icon className="w-6 h-6 transition-colors duration-300" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#526F7D] bg-[#CBC6B6]/30 px-2.5 py-1 rounded-full">
                      {item.tag}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-[#233D49] mb-3 group-hover:text-[#526F7D] transition-colors duration-200">
                    {item.title}
                  </h3>

                  <p className="text-sm text-[#233D49]/75 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-[#CBC6B6]/30 flex items-center gap-1.5 text-xs font-semibold text-[#526F7D]">
                  <CheckCircle2 className="w-4 h-4 text-[#4D9A72]" />
                  <span>Estándar empresarial</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
