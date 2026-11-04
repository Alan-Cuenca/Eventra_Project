import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * EVENTRA — Drawer (Slide-Over Contextual)
 * Cumple con estándares de Linear/Vercel (Preservación de Contexto):
 * Se desliza desde la derecha con desenfoque de fondo y superficie Liquid Glass,
 * permitiendo crear o editar sin perder de vista la tabla o listado principal.
 */
export const Drawer = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  width = 'max-w-lg', // max-w-md, max-w-lg, max-w-xl, max-w-2xl
  footer = null,
}) => {
  // Manejo de tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Bloquear scroll de fondo cuando el drawer está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop con desenfoque suave (Backdrop blur) */}
      <div
        className="fixed inset-0 bg-black/25 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        {/* Panel Deslizante desde la derecha */}
        <div
          className={`w-screen ${width} bg-[var(--ev-surface)] border-l border-[var(--ev-border)]/60 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.7),_-10px_0_40px_-10px_rgba(0,0,0,0.15)] flex flex-col justify-between transform transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] translate-x-0`}
        >
          {/* Header en Liquid Glass con Radios Concéntricos */}
          <div className="px-6 py-4.5 backdrop-blur-xl backdrop-saturate-[180%] bg-[var(--ev-surface)]/80 border-b border-[var(--ev-border)]/50 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)] flex items-center justify-between shrink-0">
            <div>
              <h3 className="text-base font-bold text-[var(--ev-text-main)] tracking-tight">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-[var(--ev-text-muted)] font-medium mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-[10px] text-[var(--ev-text-muted)] hover:text-[var(--ev-text-main)] hover:bg-[var(--ev-border)]/30 active:scale-[0.98] transition-transform duration-150"
              aria-label="Cerrar panel"
            >
              <X size={18} />
            </button>
          </div>

          {/* Cuerpo con Scroll suave */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {children}
          </div>

          {/* Footer opcional fijo con acción primaria a la derecha */}
          {footer && (
            <div className="px-6 py-4 backdrop-blur-md bg-[var(--ev-surface)]/90 border-t border-[var(--ev-border)]/50 flex items-center justify-end gap-3 shrink-0">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

