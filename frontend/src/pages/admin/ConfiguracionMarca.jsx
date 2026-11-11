import React, { useState, useRef, useEffect } from 'react';
import { useBranding, PALETAS } from '../../context/ThemeBrandingContext';
import { eventraService } from '../../services/eventraService';
import { extractPaletteFromImage } from '../../utils/imageColorExtractor';
import {
  Palette,
  UploadCloud,
  Check,
  Copy,
  Sparkles,
  RefreshCw,
  Sliders,
  Globe,
  ExternalLink,
  Eye,
  CheckCircle2,
  AlertCircle,
  FileImage,
  Save,
  X,
} from 'lucide-react';

export const ConfiguracionMarca = () => {
  const {
    branding,
    paletaKey,
    guardarBranding,
    previsualizarPaleta,
    aplicarPaletaIA,
    customPaleta,
  } = useBranding();

  const [selectedPaleta, setSelectedPaleta] = useState(paletaKey);
  const [marcaAgua, setMarcaAgua] = useState(Boolean(branding?.marca_agua_activa));
  const [portalTitulo, setPortalTitulo] = useState(branding?.portal_titulo || '');
  const [portalDescripcion, setPortalDescripcion] = useState(branding?.portal_descripcion || '');

  // Manejo de logo
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(branding?.logo_url || null);
  const [restablecerLogo, setRestablecerLogo] = useState(false);
  const fileInputRef = useRef(null);

  // Estados de IA, guardado y feedback
  const [generandoIA, setGenerandoIA] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [mensajeError, setMensajeError] = useState('');
  const [enlaceCopiado, setEnlaceCopiado] = useState(false);

  // Sincronizar estado cuando se carga branding
  useEffect(() => {
    if (branding) {
      setSelectedPaleta((prev) => branding.paleta_colores || prev || 'sofisticacion_sutil');
      if (branding.marca_agua_activa !== undefined) setMarcaAgua(Boolean(branding.marca_agua_activa));
      if (branding.portal_titulo !== undefined) setPortalTitulo(branding.portal_titulo || '');
      if (branding.portal_descripcion !== undefined) setPortalDescripcion(branding.portal_descripcion || '');

      // Solo sincronizar el logo desde backend si NO hay un archivo seleccionado ni se marcó restablecer
      if (!logoFile && !restablecerLogo) {
        setLogoPreview(branding.logo_url || null);
      }
    }
  }, [
    branding?.logo_url,
    branding?.paleta_colores,
    branding?.portal_titulo,
    branding?.portal_descripcion,
    branding?.marca_agua_activa,
    logoFile,
    restablecerLogo,
  ]);

  const handlePaletaChange = (key) => {
    setSelectedPaleta(key);
    previsualizarPaleta(key, key === 'custom_ia' ? (customPaleta || branding?.paleta_personalizada) : null);
  };

  const ejecutarAnalisisIA = async (overrideFile = null, overridePreview = null) => {
    const file = overrideFile || logoFile;
    const preview = overridePreview || logoPreview;

    if (!file && !preview) {
      setMensajeError('Por favor selecciona o sube un logotipo primero para que la IA pueda analizarlo.');
      return;
    }

    setGenerandoIA(true);
    setMensajeError('');
    setMensajeExito('');

    try {
      // 1. Extracción de color real de alta precisión desde el canvas del navegador
      let clientExtractedPalette = null;
      try {
        clientExtractedPalette = await extractPaletteFromImage(file || preview);
        if (clientExtractedPalette) {
          // Aplicar inmediatamente en la UI para feedback visual instantáneo con los colores reales
          aplicarPaletaIA(clientExtractedPalette);
          setSelectedPaleta('custom_ia');
        }
      } catch (extractorErr) {
        console.warn('[ConfiguracionMarca] Extractor local de canvas:', extractorErr);
      }

      // 2. Enviar al backend para persistencia y análisis multimodal
      let payload;
      if (file) {
        payload = new FormData();
        payload.append('logo', file);
        if (clientExtractedPalette) {
          payload.append('paleta', JSON.stringify(clientExtractedPalette));
        }
      } else if (preview && branding?.logo_url && preview === branding.logo_url) {
        payload = {
          use_current: true,
          logo_url: preview,
          paleta: clientExtractedPalette,
        };
      } else if (preview) {
        payload = {
          logo_url: preview,
          paleta: clientExtractedPalette,
        };
      } else {
        payload = {
          paleta: clientExtractedPalette,
        };
      }

      const res = await eventraService.analizarLogoConIA(payload);
      const data = res?.data || res;
      const finalPalette = data?.paleta || clientExtractedPalette;

      if (finalPalette) {
        aplicarPaletaIA(finalPalette);
        setSelectedPaleta('custom_ia');
        if (data?.logo_url) {
          setLogoPreview(data.logo_url);
          setLogoFile(null);
        }
        setMensajeExito('✨ ¡Tema cromático generado con éxito a partir de los colores reales del logotipo!');
        setTimeout(() => setMensajeExito(''), 5500);
      } else {
        throw new Error(data?.message || 'No se pudo generar la paleta.');
      }
    } catch (err) {
      console.error('[ConfiguracionMarca] Error al analizar logotipo con IA:', err);
      let errorMsg =
        err.data?.message ||
        err.response?.data?.message ||
        err.message ||
        'No se pudo analizar el logotipo con IA. Intenta con otra imagen.';

      if (err.status === 413 || err.response?.status === 413 || String(errorMsg).includes('413')) {
        errorMsg = 'El archivo de imagen es demasiado pesado para la red (excede el límite). Por favor sube una imagen de hasta 15 MB.';
      }

      setMensajeError(errorMsg);
    } finally {
      setGenerandoIA(false);
    }
  };

  const handleGenerarTemaIA = () => ejecutarAnalisisIA();

  const handleFileSelect = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setMensajeError('Por favor selecciona un archivo de imagen válido (PNG, JPG, SVG, WebP).');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setMensajeError('El logotipo no debe superar los 15 MB de tamaño.');
      return;
    }

    setLogoFile(file);
    setRestablecerLogo(false);
    setMensajeError('');

    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleCancelarSeleccionLogo = () => {
    setLogoFile(null);
    setRestablecerLogo(false);
    setLogoPreview(branding?.logo_url || null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleRestablecerAlLogoPorDefecto = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setRestablecerLogo(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Guardado exclusivo del logotipo corporativo con feedback directo
  const handleGuardarLogoDirecto = async (e) => {
    if (e) e.preventDefault();
    if (!logoFile && !restablecerLogo) {
      setMensajeError('Por favor selecciona un nuevo archivo de logotipo antes de guardar.');
      return;
    }
    setGuardando(true);
    setMensajeExito('');
    setMensajeError('');

    try {
      const formData = new FormData();
      if (logoFile) {
        formData.append('logo', logoFile);
      } else if (restablecerLogo) {
        formData.append('restablecer_logo', 'true');
      }

      formData.append('paleta_colores', selectedPaleta);
      if (selectedPaleta === 'custom_ia' && (customPaleta || branding?.paleta_personalizada)) {
        formData.append('paleta_personalizada', JSON.stringify(customPaleta || branding.paleta_personalizada));
      }
      formData.append('marca_agua_activa', String(marcaAgua));
      formData.append('portal_titulo', portalTitulo);
      formData.append('portal_descripcion', portalDescripcion);

      const updated = await guardarBranding(formData);
      if (updated?.logo_url) {
        setLogoPreview(updated.logo_url);
      } else if (restablecerLogo) {
        setLogoPreview(null);
      }
      setLogoFile(null);
      setRestablecerLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setMensajeExito('✅ ¡Nuevo logotipo corporativo guardado y actualizado exitosamente!');
      setTimeout(() => setMensajeExito(''), 4500);
    } catch (err) {
      console.error('[ConfiguracionMarca] Error al guardar logotipo:', err);
      const errorMsg =
        err.data?.message ||
        err.response?.data?.message ||
        err.message ||
        'Error al guardar el nuevo logotipo. Intenta nuevamente.';
      setMensajeError(errorMsg);
    } finally {
      setGuardando(false);
    }
  };

  const handleGuardarCambios = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setMensajeExito('');
    setMensajeError('');

    try {
      const formData = new FormData();
      formData.append('paleta_colores', selectedPaleta);
      if (selectedPaleta === 'custom_ia' && (customPaleta || branding?.paleta_personalizada)) {
        formData.append('paleta_personalizada', JSON.stringify(customPaleta || branding.paleta_personalizada));
      }
      formData.append('marca_agua_activa', String(marcaAgua));
      formData.append('portal_titulo', portalTitulo);
      formData.append('portal_descripcion', portalDescripcion);

      if (logoFile) {
        formData.append('logo', logoFile);
      } else if (restablecerLogo) {
        formData.append('restablecer_logo', 'true');
      }

      const updated = await guardarBranding(formData);
      if (updated?.logo_url) {
        setLogoPreview(updated.logo_url);
      } else if (restablecerLogo) {
        setLogoPreview(null);
      }
      setMensajeExito('¡Identidad visual y paleta completa del sistema guardadas exitosamente!');
      setRestablecerLogo(false);
      setLogoFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setMensajeExito(''), 4500);
    } catch (err) {
      console.error('[ConfiguracionMarca] Error al guardar:', err);
      const errorMsg =
        err.data?.message ||
        err.response?.data?.message ||
        err.message ||
        'Error al guardar los cambios de marca. Intenta nuevamente.';
      setMensajeError(errorMsg);
    } finally {
      setGuardando(false);
    }
  };

  const slugEmpresa = branding?.slug || 'empresa';
  const urlPortalRegistro = `${window.location.origin}/portal/${slugEmpresa}/registro`;
  const activePaletteObj = selectedPaleta === 'custom_ia'
    ? (customPaleta || branding?.paleta_personalizada || PALETAS.sofisticacion_sutil)
    : (PALETAS[selectedPaleta] || PALETAS.sofisticacion_sutil);

  const copiarEnlacePortal = () => {
    navigator.clipboard.writeText(urlPortalRegistro);
    setEnlaceCopiado(true);
    setTimeout(() => setEnlaceCopiado(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pt-2 pb-12 animate-fade-in font-sans">
      {/* Encabezado en Card Protectora */}
      <div className="bg-white rounded-2xl border border-[#CBC6B6]/60 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-2 rounded-xl bg-[#526F7D]/10 text-[#526F7D]">
              <Palette size={20} />
            </span>
            <span className="text-xs font-semibold tracking-wider uppercase text-[#526F7D]">
              Marca Blanca & Experiencia Tenant
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#233D49] tracking-tight">
            Identidad Corporativa y Portal de Empresa
          </h1>
          <p className="text-sm text-[#233D49]/70 mt-1.5 max-w-2xl">
            Personaliza el logotipo, la paleta cromática completa de tu interfaz y la bienvenida que tus clientes verán en su portal exclusivo.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleGuardarCambios}
            disabled={guardando}
            className="btn btn-primary flex items-center justify-center gap-2 shadow-sm font-semibold py-3 px-6 rounded-xl"
            style={{ minWidth: '170px' }}
          >
            {guardando ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Guardar Cambios</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Alertas de Éxito / Error */}
      {mensajeExito && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-[#4D9A72]/30 bg-[#4D9A72]/10 text-[#243026] text-sm animate-fade-in">
          <CheckCircle2 size={18} className="text-[#4D9A72] flex-shrink-0" />
          <span className="font-medium">{mensajeExito}</span>
        </div>
      )}

      {mensajeError && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-[#C95C5C]/30 bg-[#C95C5C]/10 text-[#233D49] text-sm animate-fade-in">
          <AlertCircle size={18} className="text-[#C95C5C] flex-shrink-0" />
          <span className="font-medium">{mensajeError}</span>
        </div>
      )}

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Columna Izquierda: Logotipo y Paletas (7 columnas) */}
        <div className="lg:col-span-7 space-y-8">
          {/* SECCIÓN 1: Logotipo y Marca de Agua */}
          <section className="bg-white rounded-2xl p-6 border border-[#CBC6B6]/60 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-[#CBC6B6]/30 pb-4">
              <div>
                <h2 className="text-lg font-bold text-[#233D49] flex items-center gap-2">
                  <FileImage size={18} className="text-[#526F7D]" />
                  Logotipo Corporativo
                </h2>
                <p className="text-xs text-[#233D49]/70 mt-0.5">
                  Aparece en el menú lateral, membretes de cotizaciones y reportes PDF.
                </p>
              </div>
              <span className="text-xs bg-[#EEEBDD] px-2.5 py-1 rounded-full text-[#526F7D] font-medium">
                PNG / JPG / WebP
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
              {/* Vista Previa del Logo */}
              <div className="sm:col-span-5 flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-[#CBC6B6] bg-[#EEEBDD]/30 min-h-[170px] text-center">
                {logoPreview ? (
                  <div className="relative group flex flex-col items-center">
                    <img
                      src={logoPreview}
                      alt="Logo Empresa"
                      className="max-h-24 max-w-[160px] object-contain drop-shadow-sm mb-2"
                    />
                    <span className="text-[11px] font-semibold text-[#526F7D]">Logotipo Activo</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-[#233D49]/60">
                    <div className="w-16 h-16 rounded-2xl bg-[#526F7D]/10 flex items-center justify-center text-[#526F7D] mb-2 font-black text-xl">
                      {branding?.nombre_comercial ? branding.nombre_comercial.slice(0, 2).toUpperCase() : 'EV'}
                    </div>
                    <span className="text-xs font-medium">Logo EVENTRA (Predeterminado)</span>
                  </div>
                )}
              </div>

              {/* Botones de Carga */}
              <div className="sm:col-span-7 space-y-3">
                {/* Input nativo oculto y accesible con reset on click */}
                <input
                  id="logo-file-input"
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                  onClick={(e) => {
                    e.target.value = null;
                  }}
                  className="hidden"
                />

                {/* Zona de Drop & Clic accesible */}
                <label
                  htmlFor="logo-file-input"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-[#CBC6B6] hover:border-[#526F7D] rounded-xl p-4 text-center cursor-pointer hover:bg-[#EEEBDD]/40 transition-all flex flex-col items-center justify-center gap-1.5 block group"
                >
                  <UploadCloud size={24} className="text-[#526F7D] group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold text-[#233D49]">
                    Arrastra tu imagen o haz clic para subir
                  </span>
                  <span className="text-[11px] text-[#233D49]/60">
                    Formatos: PNG, JPG, WebP o SVG (Máx. 5 MB)
                  </span>
                </label>

                {/* Feedback y Guardado Directo cuando hay un nuevo archivo seleccionado */}
                {logoFile && (
                  <div className="p-3 bg-amber-50/90 border border-amber-200/90 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-amber-900 animate-fade-in shadow-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-bold truncate text-[#233D49]">{logoFile.name}</p>
                        <p className="text-[10px] text-[#233D49]/60">{(logoFile.size / 1024).toFixed(1)} KB — Listo para guardar</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleGuardarLogoDirecto}
                        disabled={guardando}
                        className="btn btn-primary text-xs py-1.5 px-3.5 rounded-lg flex items-center gap-1.5 font-bold shadow-xs"
                      >
                        {guardando ? (
                          <>
                            <RefreshCw size={13} className="animate-spin" />
                            <span>Guardando...</span>
                          </>
                        ) : (
                          <>
                            <Save size={13} />
                            <span>Guardar este logotipo</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelarSeleccionLogo}
                        className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
                        title="Cancelar y descartar este archivo"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Feedback si el usuario marcó restablecer el logo */}
                {restablecerLogo && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-2 text-xs text-rose-900 animate-fade-in">
                    <span className="font-medium">Has marcado restablecer al logotipo predeterminado de EVENTRA.</span>
                    <button
                      type="button"
                      onClick={handleGuardarLogoDirecto}
                      disabled={guardando}
                      className="btn text-xs py-1 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold"
                    >
                      Confirmar restablecimiento
                    </button>
                  </div>
                )}

                {/* Botón Mágico de Generación con IA */}
                <button
                  type="button"
                  onClick={handleGenerarTemaIA}
                  disabled={generandoIA || (!logoFile && !logoPreview)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs tracking-wide text-white shadow-sm transition-all duration-200 bg-gradient-to-r from-[#233D49] to-[#3E5E6D] hover:from-[#1D333E] hover:to-[#334E5C] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed border border-[#526F7D]/30"
                >
                  {generandoIA ? (
                    <>
                      <RefreshCw size={15} className="animate-spin text-amber-300" />
                      <span>Procesando logotipo con IA...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={15} className="text-amber-300 fill-amber-300" />
                      <span>✨ Generar tema con IA</span>
                    </>
                  )}
                </button>

                {logoPreview && !restablecerLogo && (
                  <button
                    type="button"
                    onClick={handleRestablecerAlLogoPorDefecto}
                    className="w-full text-xs text-[#C95C5C] hover:text-[#C95C5C]/80 font-medium py-1.5 transition-colors text-center"
                  >
                    Restablecer al logotipo oficial de EVENTRA
                  </button>
                )}
              </div>
            </div>

            {/* Switch de Marca de Agua Corporativa */}
            <div className="pt-4 border-t border-[#CBC6B6]/30 flex items-center justify-between">
              <div>
                <label htmlFor="switch-marca-agua" className="text-sm font-bold text-[#233D49] cursor-pointer">
                  Marca de Agua Corporativa
                </label>
                <p className="text-xs text-[#233D49]/70 mt-0.5">
                  Proyecta un sello translúcido sutil al fondo del Dashboard, Portal y Reportes PDF.
                </p>
              </div>

              <button
                id="switch-marca-agua"
                type="button"
                role="switch"
                aria-checked={marcaAgua}
                onClick={() => setMarcaAgua((prev) => !prev)}
                className={`w-12 h-6 rounded-full transition-colors relative focus:outline-none ${
                  marcaAgua ? 'bg-[#526F7D]' : 'bg-[#CBC6B6]'
                }`}
              >
                <span
                  className={`block w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform ${
                    marcaAgua ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </section>

          {/* SECCIÓN 2: Selector de Paleta Armónica Completa */}
          <section className="bg-white rounded-2xl p-6 border border-[#CBC6B6]/60 shadow-sm space-y-5">
            <div className="border-b border-[#CBC6B6]/30 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#233D49] flex items-center gap-2">
                  <Sliders size={18} className="text-[#526F7D]" />
                  Paletas Armónicas del Sistema Completo
                </h2>
                <p className="text-xs text-[#233D49]/70 mt-0.5">
                  Al seleccionar una paleta se transforma en vivo el color completo del sistema (fondos, barra lateral, botones, bordes y textos).
                </p>
              </div>
              <span
                className="text-[11px] font-bold px-3 py-1 rounded-full shrink-0"
                style={{
                  backgroundColor: activePaletteObj.primaryLight,
                  color: activePaletteObj.primary,
                }}
              >
                Activa: {activePaletteObj.name}
              </span>
            </div>

            <div className="space-y-3">
              {/* Opción de Paleta Generada por IA (si existe o está activa) */}
              {(customPaleta || selectedPaleta === 'custom_ia' || branding?.paleta_personalizada) && (() => {
                const iaItem = customPaleta || branding?.paleta_personalizada || activePaletteObj;
                const isSelected = selectedPaleta === 'custom_ia';
                return (
                  <div
                    key="custom_ia"
                    onClick={() => handlePaletaChange('custom_ia')}
                    style={{
                      borderColor: isSelected ? iaItem.primary : (iaItem.border || '#CBC6B6'),
                      backgroundColor: isSelected ? iaItem.bg : '#FFFFFF',
                    }}
                    className="p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between gap-4 shadow-xs hover:shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      {/* Muestra de 5 Círculos de Color de la IA */}
                      <div className="flex items-center -space-x-1.5 shrink-0">
                        <div
                          className="w-7 h-7 rounded-full border border-black/15 shadow-sm"
                          style={{ backgroundColor: iaItem.bg }}
                          title={`Fondo Pastel: ${iaItem.bg}`}
                        />
                        <div
                          className="w-7 h-7 rounded-full border border-black/15 shadow-sm"
                          style={{ backgroundColor: iaItem.surface || '#FFFFFF' }}
                          title={`Superficie: ${iaItem.surface || '#FFFFFF'}`}
                        />
                        <div
                          className="w-7 h-7 rounded-full border border-black/15 shadow-sm"
                          style={{ backgroundColor: iaItem.border }}
                          title={`Borde Suave: ${iaItem.border}`}
                        />
                        <div
                          className="w-7 h-7 rounded-full border border-black/15 shadow-sm"
                          style={{ backgroundColor: iaItem.primary }}
                          title={`Color Primario: ${iaItem.primary}`}
                        />
                        <div
                          className="w-7 h-7 rounded-full border border-black/15 shadow-sm"
                          style={{ backgroundColor: iaItem.text }}
                          title={`Texto Tintado: ${iaItem.text}`}
                        />
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold" style={{ color: iaItem.text }}>
                            {iaItem.name || 'Paleta Generada por IA'}
                          </span>
                          <span
                            className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full flex items-center gap-1"
                            style={{
                              backgroundColor: iaItem.primaryLight || '#E4EFF4',
                              color: iaItem.primary,
                            }}
                          >
                            <Sparkles size={11} />
                            Inteligencia Visual
                          </span>
                        </div>
                        <p className="text-xs mt-0.5 line-clamp-1" style={{ color: iaItem.text, opacity: 0.78 }}>
                          {iaItem.desc || 'Paleta armónica extraída dinámicamente de tu logotipo.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      {isSelected ? (
                        <div
                          className="w-6 h-6 rounded-full text-white flex items-center justify-center shadow-xs"
                          style={{ backgroundColor: iaItem.primary }}
                        >
                          <Check size={14} />
                        </div>
                      ) : (
                        <div
                          className="w-6 h-6 rounded-full border-2"
                          style={{ borderColor: iaItem.border || '#CBC6B6' }}
                        />
                      )}
                    </div>
                  </div>
                );
              })()}

              {Object.values(PALETAS).map((item) => {
                const isSelected = selectedPaleta === item.key;
                return (
                  <div
                    key={item.key}
                    onClick={() => handlePaletaChange(item.key)}
                    style={{
                      borderColor: isSelected ? item.primary : item.border,
                      backgroundColor: isSelected ? item.bg : '#FFFFFF',
                    }}
                    className="p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between gap-4 shadow-xs hover:shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      {/* Muestra de 4 Círculos de Color */}
                      <div className="flex items-center -space-x-1.5 shrink-0">
                        <div
                          className="w-7 h-7 rounded-full border border-black/15 shadow-sm"
                          style={{ backgroundColor: item.bg }}
                          title={`Fondo Principal: ${item.bg}`}
                        />
                        <div
                          className="w-7 h-7 rounded-full border border-black/15 shadow-sm"
                          style={{ backgroundColor: item.border }}
                          title={`Borde y Superficie: ${item.border}`}
                        />
                        <div
                          className="w-7 h-7 rounded-full border border-black/15 shadow-sm"
                          style={{ backgroundColor: item.primary }}
                          title={`Color Primario: ${item.primary}`}
                        />
                        <div
                          className="w-7 h-7 rounded-full border border-black/15 shadow-sm"
                          style={{ backgroundColor: item.text }}
                          title={`Texto Principal: ${item.text}`}
                        />
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold" style={{ color: item.text }}>
                            {item.name}
                          </span>
                          <span
                            className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: item.primaryLight,
                              color: item.primary,
                            }}
                          >
                            {item.category}
                          </span>
                        </div>
                        <p className="text-xs mt-0.5 line-clamp-1" style={{ color: item.text, opacity: 0.78 }}>
                          {item.desc}
                        </p>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      {isSelected ? (
                        <div
                          className="w-6 h-6 rounded-full text-white flex items-center justify-center shadow-xs"
                          style={{ backgroundColor: item.primary }}
                        >
                          <Check size={14} />
                        </div>
                      ) : (
                        <div
                          className="w-6 h-6 rounded-full border-2"
                          style={{ borderColor: item.border }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Columna Derecha: Personalización del Portal de Clientes + Vista Previa en Vivo (5 columnas) */}
        <div className="lg:col-span-5 space-y-8">
          {/* SECCIÓN 3: Configuración del Portal */}
          <section className="bg-white rounded-2xl p-6 border border-[#CBC6B6]/60 shadow-sm space-y-6">
            <div className="border-b border-[#CBC6B6]/30 pb-4">
              <h2 className="text-lg font-bold text-[#233D49] flex items-center gap-2">
                <Globe size={18} className="text-[#526F7D]" />
                Portal Público del Cliente
              </h2>
              <p className="text-xs text-[#233D49]/70 mt-0.5">
                Personaliza la pantalla de bienvenida y autoregistro para los anfitriones de tus eventos.
              </p>
            </div>

            {/* Enlace directo */}
            <div className="p-3.5 rounded-xl bg-[#EEEBDD]/40 border border-[#CBC6B6]/70 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#233D49] flex items-center gap-1.5">
                  <ExternalLink size={13} className="text-[#526F7D]" />
                  Enlace Directo de Autoregistro
                </span>
                <span className="text-[11px] font-mono text-[#526F7D]">/{slugEmpresa}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={urlPortalRegistro}
                  className="w-full text-xs font-mono bg-white border border-[#CBC6B6] rounded-lg px-2.5 py-1.5 text-[#233D49] focus:outline-none select-all"
                />
                <button
                  type="button"
                  onClick={copiarEnlacePortal}
                  className="btn btn-secondary btn-sm flex items-center gap-1.5 flex-shrink-0"
                  title="Copiar enlace"
                >
                  {enlaceCopiado ? (
                    <>
                      <Check size={13} className="text-[#4D9A72]" />
                      <span className="text-xs text-[#4D9A72]">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span className="text-xs">Copiar</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Inputs de Título y Descripción */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#233D49] mb-1.5">
                  Título de Bienvenida en el Portal
                </label>
                <input
                  type="text"
                  value={portalTitulo}
                  onChange={(e) => setPortalTitulo(e.target.value)}
                  placeholder={`Bienvenido a ${branding?.nombre_comercial || 'nuestra empresa'}`}
                  maxLength={120}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-[#CBC6B6] bg-white text-[#233D49] focus:outline-none focus:ring-2 focus:ring-[#526F7D]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#233D49] mb-1.5">
                  Descripción o Eslogan de la Empresa
                </label>
                <textarea
                  rows={3}
                  value={portalDescripcion}
                  onChange={(e) => setPortalDescripcion(e.target.value)}
                  placeholder="Creamos momentos memorables con sofisticación, armonía y dedicación exclusiva."
                  maxLength={250}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-[#CBC6B6] bg-white text-[#233D49] focus:outline-none focus:ring-2 focus:ring-[#526F7D] resize-none"
                />
              </div>
            </div>

            {/* VISTA PREVIA EN VIVO */}
            <div className="pt-4 border-t border-[#CBC6B6]/30 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#526F7D] uppercase tracking-wider">
                <Eye size={14} />
                <span>Vista Previa en Vivo ({activePaletteObj.name})</span>
              </div>

              {/* Mock Card del Portal usando la paleta elegida */}
              <div
                className="rounded-2xl p-5 border-2 shadow-sm transition-all relative overflow-hidden"
                style={{
                  backgroundColor: activePaletteObj.bg,
                  borderColor: activePaletteObj.border,
                }}
              >
                {/* Mini watermark preview */}
                {marcaAgua && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.06] pointer-events-none -rotate-12 select-none">
                    <span
                      className="text-4xl font-extrabold uppercase font-serif tracking-widest"
                      style={{ color: activePaletteObj.text }}
                    >
                      {branding?.nombre_comercial || 'EVENTRA'}
                    </span>
                  </div>
                )}

                <div
                  className="relative z-10 bg-white rounded-xl p-4 border shadow-xs space-y-3 text-center"
                  style={{ borderColor: activePaletteObj.border }}
                >
                  <div className="flex justify-center">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="h-10 object-contain" />
                    ) : (
                      <div
                        className="h-9 px-3 rounded-lg flex items-center justify-center text-xs font-bold"
                        style={{
                          backgroundColor: activePaletteObj.primaryLight,
                          color: activePaletteObj.primary,
                        }}
                      >
                        {branding?.nombre_comercial || 'EVENTRA'}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold" style={{ color: activePaletteObj.text }}>
                      {portalTitulo || `Bienvenido a ${branding?.nombre_comercial || 'EVENTRA'}`}
                    </h3>
                    <p className="text-[11px] mt-1 line-clamp-2" style={{ color: activePaletteObj.text, opacity: 0.75 }}>
                      {portalDescripcion ||
                        'Ingresa con tus credenciales o solicita tu presupuesto en línea con nuestros asesores.'}
                    </p>
                  </div>

                  <div
                    role="presentation"
                    className="w-full py-2 px-3 rounded-lg text-xs font-semibold text-white shadow-xs text-center select-none"
                    style={{ backgroundColor: activePaletteObj.primary }}
                  >
                    Registrarme en el Portal
                  </div>

                  <div
                    className="text-[9px] tracking-wider uppercase font-medium"
                    style={{ color: activePaletteObj.text, opacity: 0.55 }}
                  >
                    Operado con tecnología EVENTRA
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracionMarca;
