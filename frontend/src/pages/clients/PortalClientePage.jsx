import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { eventraService } from '../../services/eventraService';
import {
  CalendarDays,
  FileText,
  CreditCard,
  MessageSquare,
  LogOut,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Clock,
  MapPin,
  Users,
  DollarSign,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  CalendarCheck,
  Moon,
  Sun
} from 'lucide-react';
import logoImg from '../../assets/logo.png';

export const PortalClientePage = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClientData = async () => {
      try {
        const data = await eventraService.getEventos();
        const list = Array.isArray(data) ? data : (data?.data && Array.isArray(data.data) ? data.data : []);
        setEventos(list);
      } catch (err) {
        console.error('Error al cargar datos del cliente', err);
      } finally {
        setLoading(false);
      }
    };
    fetchClientData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const nombre = user?.nombre_completo ?? 'Cliente';
  const mainEvent = eventos.length > 0 ? eventos[0] : null;

  // Cálculos financieros de ejemplo o reales basados en el evento principal
  const totalEvento = mainEvent?.total || mainEvent?.presupuesto_estimado || 8500;
  const pagado = mainEvent?.pagado || 5500;
  const saldoPendiente = Math.max(0, totalEvento - pagado);
  const porcentajePagado = Math.min(100, Math.round((pagado / totalEvento) * 100));

  const ACCESOS_RAPIDOS = [
    {
      id: 'pagos',
      to: '/pagos/procesar',
      icon: CreditCard,
      titulo: 'Realizar Abono / Pago',
      desc: 'Registra tus comprobantes de depósito o transferencia de forma segura.',
      badge: 'Finanzas'
    },
    {
      id: 'mis-eventos',
      to: '/eventos',
      icon: CalendarDays,
      titulo: 'Detalle de Mis Eventos',
      desc: 'Consulta la fecha, salón, menú contratado y cronograma operativo.',
      badge: 'Agenda'
    },
    {
      id: 'cotizaciones',
      to: '/cotizaciones',
      icon: FileText,
      titulo: 'Mis Cotizaciones',
      desc: 'Revisa presupuestos detallados y aprueba nuevas opciones de paquetes.',
      badge: 'Propuestas'
    },
    {
      id: 'reservas',
      to: '/reservas',
      icon: CalendarCheck,
      titulo: 'Espacios y Salones',
      desc: 'Verifica la reserva de salones sin riesgo de colisiones de agenda.',
      badge: 'Disponibilidad'
    },
  ];

  return (
    <div className="min-h-screen bg-[#F3F0E4] text-[#233D49] flex flex-col font-sans selection:bg-[#4D7182] selection:text-white">
      
      {/* ── Top Bar Oficial "Sofisticación Sutil" ─────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#F3F0E4]/95 backdrop-blur-md border-b border-[#CEC8B8] px-4 sm:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={logoImg}
            alt="EVENTRA"
            className="w-10 h-10 rounded-xl bg-white p-1 border border-[#CEC8B8] object-contain shadow-sm"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold tracking-tight text-[#233D49]">
                EVENTRA
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#4D7182]/15 text-[#4D7182]">
                Portal Cliente
              </span>
            </div>
            <span className="text-xs text-[#4D7182] font-medium hidden sm:block">
              Seguimiento Exclusivo de Recepciones
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            id="portal-theme-toggle-btn"
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-white border border-[#CEC8B8] text-[#4D7182] hover:text-[#233D49] transition-colors shadow-sm flex items-center justify-center cursor-pointer"
            title={isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
            aria-label="Alternar tema visual"
          >
            {isDark ? <Moon size={16} color="var(--primary)" /> : <Sun size={16} color="#C49A3A" />}
          </button>

          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-[#233D49] leading-tight">
              {nombre}
            </p>
            <p className="text-xs text-[#4D7182] font-medium">
              Anfitrión Verificado
            </p>
          </div>

          <button
            id="portal-logout-btn"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#CEC8B8] text-xs font-semibold text-[#233D49] hover:bg-[#FAF8F2] hover:text-[#C95C5C] hover:border-[#C95C5C]/40 transition-colors shadow-sm"
          >
            <LogOut size={14} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </header>

      {/* ── Cuerpo Principal ────────────────────────────────────────── */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-8 animate-fade-in">
        
        {/* Saludo y Bienvenida */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#4D7182]">
            <Sparkles size={14} />
            <span>Bienvenido a tu espacio exclusivo</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#233D49] tracking-tight">
            Hola, {nombre.split(' ')[0]}
          </h1>
          <p className="text-sm text-[#233D49]/75 max-w-2xl">
            Desde este portal puedes supervisar cada detalle de tu evento, consultar cotizaciones aprobadas, revisar saldos y realizar abonos de forma directa.
          </p>
        </div>

        {/* ── Card Resumen del Evento Activo ─────────────────────────── */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#CEC8B8] shadow-md relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-[#CEC8B8]/50">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#4D9A72]/15 text-[#4D9A72] border border-[#4D9A72]/30">
                  {mainEvent?.estado || 'Confirmado'}
                </span>
                <span className="text-xs text-[#4D7182] font-semibold">
                  Evento Principal
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#233D49]">
                {mainEvent?.titulo || mainEvent?.nombre || 'Recepción Familiar San Andrés'}
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-xs text-[#233D49]/80 font-medium">
                <span className="flex items-center gap-1">
                  <CalendarDays size={14} className="text-[#4D7182]" />
                  {mainEvent?.fecha ? new Date(mainEvent.fecha).toLocaleDateString('es-ES', { dateStyle: 'long' }) : '28 de Noviembre de 2026'}
                </span>
                <span className="flex items-center gap-1">
                  <Building2 size={14} className="text-[#4D7182]" />
                  {mainEvent?.salon_nombre || mainEvent?.salon || 'Salón Cristal Imperial'}
                </span>
                <span className="flex items-center gap-1">
                  <Users size={14} className="text-[#4D7182]" />
                  {mainEvent?.num_invitados || 150} Comensales
                </span>
              </div>
            </div>

            <Link
              to="/pagos/procesar"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#4D7182] hover:bg-[#3E5763] text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all"
            >
              <CreditCard size={16} />
              <span>Abonar a este Evento</span>
            </Link>
          </div>

          {/* Widget de Progreso Financiero */}
          <div className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 rounded-2xl bg-[#F3F0E4]/60 border border-[#CEC8B8]">
              <span className="text-xs text-[#4D7182] font-semibold">Inversión Total Contratada</span>
              <p className="text-2xl font-extrabold text-[#233D49] mt-1">
                ${Number(totalEvento).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-[#4D7182] mt-0.5">Paquete base + servicios incluidos</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F3F0E4]/60 border border-[#CEC8B8]">
              <span className="text-xs text-[#4D9A72] font-semibold">Monto Abonado</span>
              <p className="text-2xl font-extrabold text-[#4D9A72] mt-1">
                ${Number(pagado).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-[#4D9A72] mt-0.5">{porcentajePagado}% del total cubierto</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F3F0E4]/60 border border-[#CEC8B8]">
              <span className="text-xs text-[#C49A3A] font-semibold">Saldo Pendiente</span>
              <p className="text-2xl font-extrabold text-[#C49A3A] mt-1">
                ${Number(saldoPendiente).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-[#233D49]/60 mt-0.5">Liquidación previa a la fecha del evento</p>
            </div>
          </div>

          {/* Barra de Progreso */}
          <div className="mt-5 pt-3">
            <div className="flex items-center justify-between text-xs font-semibold text-[#233D49] mb-1.5">
              <span>Progreso de Pagos</span>
              <span>{porcentajePagado}% Completado</span>
            </div>
            <div className="w-full h-3 rounded-full bg-[#CEC8B8]/40 overflow-hidden">
              <div 
                className="h-full rounded-full bg-[#4D9A72] transition-all duration-500 ease-out"
                style={{ width: `${porcentajePagado}%` }}
              />
            </div>
          </div>
        </div>

        {/* ── Accesos Rápidos Modulares ──────────────────────────────── */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-[#233D49] tracking-tight">
            Gestión Rápida de tu Recepción
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {ACCESOS_RAPIDOS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  id={`portal-card-${item.id}`}
                  onClick={() => item.to && navigate(item.to)}
                  className="group bg-white rounded-2xl p-6 border border-[#CEC8B8] shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-[#4D7182]/10 text-[#4D7182] flex items-center justify-center group-hover:bg-[#4D7182] group-hover:text-white transition-colors duration-200">
                        <Icon size={22} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#4D7182] bg-[#F3F0E4] px-2 py-0.5 rounded-full border border-[#CEC8B8]/60">
                        {item.badge}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-[#233D49] mb-1.5 group-hover:text-[#4D7182] transition-colors">
                      {item.titulo}
                    </h4>
                    <p className="text-xs text-[#233D49]/70 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-[#CEC8B8]/40 flex items-center justify-between text-xs font-semibold text-[#4D7182]">
                    <span>Ingresar</span>
                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Footer de Seguridad y Conexión ─────────────────────────── */}
        <div className="p-4 rounded-2xl bg-white border border-[#CEC8B8] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#233D49]/70">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-[#4D9A72]" />
            <span>Sesión protegida por RBAC · Conexión directa a Supabase & Render</span>
          </div>
          <div className="text-right text-[#4D7182] font-medium">
            ¿Necesitas ayuda? Contacta a tu coordinador asignado
          </div>
        </div>

      </main>
    </div>
  );
};

export default PortalClientePage;
