import { useEffect } from 'react';

/**
 * AccesibilidadFormularios
 * -----------------------------------------------------------------------------
 * Garantiza que todo campo tenga un nombre accesible (lectores de pantalla y clic
 * sobre la etiqueta para enfocar el campo), sin tener que tocar cada formulario:
 *   1. Enlaza cada <label> con el primer campo de su contenedor (for/id).
 *   2. Si un campo sigue sin etiqueta, usa su placeholder/title/name como aria-label.
 *   3. Los botones/enlaces de solo icono toman su `title` como aria-label.
 * Observa el DOM para cubrir pantallas que se renderizan después de cargar datos.
 */
const CAMPOS = 'input:not([type=hidden]),select,textarea';
let contador = 0;

export const asociarEtiquetas = (raiz = document) => {
  raiz.querySelectorAll('label').forEach((label) => {
    if (label.htmlFor || label.querySelector(CAMPOS)) return;
    const contenedor = label.closest('.form-group') || label.parentElement;
    const campo = contenedor?.querySelector(CAMPOS);
    if (!campo || (campo.labels && campo.labels.length > 0)) return;
    if (!campo.id) {
      contador += 1;
      campo.id = `campo-${contador}`;
    }
    label.htmlFor = campo.id;
  });

  raiz.querySelectorAll(CAMPOS).forEach((campo) => {
    if (campo.type === 'checkbox' || campo.type === 'radio') {
      if ((campo.labels && campo.labels.length) || campo.getAttribute('aria-label')) return;
    }
    if ((campo.labels && campo.labels.length > 0) || campo.getAttribute('aria-label') || campo.getAttribute('aria-labelledby')) return;
    const nombre = campo.getAttribute('placeholder') || campo.getAttribute('title') || campo.getAttribute('name');
    if (nombre) campo.setAttribute('aria-label', nombre);
  });

  raiz.querySelectorAll('button:not([aria-label]),a[href]:not([aria-label])').forEach((el) => {
    if ((el.textContent || '').trim()) return;
    const titulo = el.getAttribute('title');
    if (titulo) el.setAttribute('aria-label', titulo);
  });
};

export const AccesibilidadFormularios = () => {
  useEffect(() => {
    let pendiente = false;
    const programar = () => {
      if (pendiente) return;
      pendiente = true;
      setTimeout(() => {
        pendiente = false;
        asociarEtiquetas();
      }, 60);
    };
    asociarEtiquetas();
    const observador = new MutationObserver(programar);
    observador.observe(document.body, { childList: true, subtree: true });
    return () => observador.disconnect();
  }, []);
  return null;
};

export default AccesibilidadFormularios;
