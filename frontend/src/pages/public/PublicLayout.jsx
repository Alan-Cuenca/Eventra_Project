import React, { useEffect, Component } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';
import { useBranding } from '../../context/ThemeBrandingContext';

class PublicErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error en vista pública de EVENTRA:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-xl mx-auto my-20 p-8 bg-white rounded-2xl border border-[var(--ev-border)] text-center shadow-md">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-[#C95C5C]/15 text-[#C95C5C] flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-[var(--ev-text-main)] mb-2">
            Ha ocurrido un inconveniente al cargar esta sección
          </h2>
          <p className="text-xs sm:text-sm text-[var(--ev-text-muted)] mb-6">
            No te preocupes, el sistema sigue protegido. Intenta refrescar o volver al inicio.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => this.setState({ hasError: false })}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[var(--ev-primary)] text-white text-xs sm:text-sm font-semibold hover:bg-[var(--ev-primary-hover)] transition-colors active:scale-[0.98]"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reintentar</span>
            </button>
            <Link
              to="/"
              onClick={() => this.setState({ hasError: false })}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white border border-[var(--ev-border)] text-[var(--ev-text-main)] text-xs sm:text-sm font-semibold hover:bg-[var(--ev-surface)] transition-colors active:scale-[0.98]"
            >
              <Home className="w-4 h-4 text-[var(--ev-primary)]" />
              <span>Ir al Inicio</span>
            </Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export const PublicLayout = () => {
  const { pathname } = useLocation();
  const { aplicarVariablesCSS } = useBranding();

  // Asegura que las vistas públicas comerciales siempre apliquen los colores oficiales de EVENTRA ("Sofisticación Sutil")
  useEffect(() => {
    aplicarVariablesCSS('sofisticacion_sutil');
  }, [aplicarVariablesCSS]);

  // Desplazamiento automático al inicio de página al cambiar de ruta
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--ev-bg-base)] text-[var(--ev-text-main)] font-sans selection:bg-[var(--ev-primary)] selection:text-white antialiased transition-colors duration-300">
      {/* ── Navbar Superior Fijo ────────────────────────────────────────── */}
      <Navbar />

      {/* ── Contenido de la Ruta Hija protegido con ErrorBoundary ───────── */}
      <main className="flex-1 pt-20">
        <PublicErrorBoundary key={pathname}>
          <Outlet />
        </PublicErrorBoundary>
      </main>

      {/* ── Footer Corporativo ─────────────────────────────────────────── */}
      <Footer />
    </div>
  );
};
