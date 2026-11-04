import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

/**
 * =============================================================================
 * ErrorBoundary (EVENTRA SaaS)
 * =============================================================================
 * Captura excepciones no controladas en el ciclo de renderizado de React,
 * evitando que la pantalla quede en blanco (White Screen of Death) y mostrando
 * una tarjeta informativa adherida a la estética "Sofisticación Sutil".
 * =============================================================================
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Error no capturado:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="card"
          style={{
            maxWidth: '540px',
            margin: '3rem auto',
            padding: '2rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(201, 92, 92, 0.15)',
              color: '#C95C5C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AlertCircle size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Ha ocurrido un detalle al cargar esta sección
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {this.state.error?.message || 'No fue posible completar el renderizado visual de este módulo.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <RotateCcw size={15} /> Recargar Vista
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
