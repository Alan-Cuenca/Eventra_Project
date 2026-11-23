import React from 'react';

/**
 * Mensaje de error bajo un campo de formulario (paleta oficial: rojo error #C95C5C).
 * No renderiza nada si no hay mensaje.
 */
export const ErrorCampo = ({ mensaje, campo }) => {
  if (!mensaje) return null;
  return (
    <p
      role="alert"
      data-cy={campo ? `error-${campo}` : undefined}
      style={{ color: '#C95C5C', fontSize: '0.78rem', fontWeight: 600, marginTop: '0.35rem', lineHeight: 1.35 }}
    >
      {mensaje}
    </p>
  );
};

/** Estilo de borde para un campo con error (se combina con el estilo existente del input). */
export const bordeError = (hayError) => (hayError ? { borderColor: '#C95C5C', boxShadow: '0 0 0 1px #C95C5C' } : undefined);
