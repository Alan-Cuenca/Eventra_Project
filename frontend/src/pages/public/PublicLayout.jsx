import React, { useEffect, Component } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';

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
        <div className="max-w-xl mx-auto my-20 p-8 bg-white rounded-2xl border border-[#CBC6B6] text-center shadow-md">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-[#C95C5C]/15 text-[#C95C5C] flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-[#233D49] mb-2">
            Ha ocurrido un inconveniente al cargar esta sección
          </h2>
          <p className="text-xs sm:text-sm text-[#233D49]/70 mb-6">
            No te preocupes, el sistema sigue protegido. Intenta refrescar o volver al inicio.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => this.setState({ hasError: false })}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#526F7D] text-white text-xs sm:text-sm font-semibold hover:bg-[#3E5763] transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reintentar</span>
            </button>
            <Link
              to="/"
              onClick={() => this.setState({ hasError: false })}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-[#CBC6B6] text-[#233D49] text-xs sm:text-sm font-semibold hover:bg-[#FAFAF8] transition-colors"
            >
              <Home className="w-4 h-4 text-[#526F7D]" />
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

  // Desplazamiento automático al inicio de página al cambiar de ruta
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-[#EEEBDD] text-[#233D49] font-sans selection:bg-[#526F7D] selection:text-white antialiased">
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
