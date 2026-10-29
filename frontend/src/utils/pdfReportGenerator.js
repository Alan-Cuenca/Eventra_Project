/**
 * pdfReportGenerator.js
 * =============================================================================
 * Generador Modular de Reportes Corporativos en PDF para EVENTRA SaaS.
 * Diseñado bajo la identidad visual "Sofisticación Sutil" y soporte White-Label:
 *  - Membrete Corporativo Minimalista con datos y logo de la empresa.
 *  - Paletas Dinámicas Curadas (Sofisticación Sutil, Bosque Olivo, Terracota Real, Champagne Gala, Lavanda Imperial).
 *  - Marca de Agua Corporativa no intrusiva opcional por página.
 *  - Tablas limpias con jsPDF y jspdf-autotable.
 * =============================================================================
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const PALETAS_RGB = {
  sofisticacion_sutil: {
    primary: [82, 111, 125],    // #526F7D
    bg: [238, 235, 221],         // #EEEBDD Crema
    border: [203, 198, 182],     // #CBC6B6 Beige
    text: [35, 61, 73],          // #233D49 Azul Oscuro
  },
  bosque_olivo: {
    primary: [86, 107, 89],     // #566B59
    bg: [244, 243, 238],        // #F4F3EE
    border: [213, 211, 200],    // #D5D3C8
    text: [36, 48, 38],         // #243026
  },
  terracota_real: {
    primary: [140, 90, 75],     // #8C5A4B
    bg: [246, 241, 235],        // #F6F1EB
    border: [222, 207, 194],    // #DECFC2
    text: [56, 38, 32],         // #382620
  },
  champagne_gala: {
    primary: [125, 107, 77],    // #7D6B4D
    bg: [247, 245, 240],        // #F7F5F0
    border: [223, 216, 200],    // #DFD8C8
    text: [46, 41, 34],         // #2E2922
  },
  lavanda_imperial: {
    primary: [104, 90, 124],    // #685A7C
    bg: [244, 242, 247],        // #F4F2F7
    border: [211, 205, 217],    // #D3CDD9
    text: [43, 35, 56],         // #2B2338
  },
};

/**
 * Convierte una URL de imagen a Base64 / DataURL para ser incrustada en jsPDF.
 * @param {string} url - Ruta de la imagen (ej. /logo_Helados_Catedral.jpg o data URL)
 * @returns {Promise<string|null>}
 */
const cargarImagenBase64 = (url) => {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    if (typeof url === 'string' && url.startsWith('data:image')) {
      return resolve(url);
    }
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        resolve(dataUrl);
      } catch (err) {
        console.warn('[pdfReportGenerator] No se pudo convertir la imagen a canvas:', err);
        resolve(null);
      }
    };
    img.onerror = () => {
      console.warn('[pdfReportGenerator] Error cargando logo:', url);
      resolve(null);
    };
    img.src = url;
  });
};

/**
 * Dibuja un monograma tipográfico minimalista cuando la empresa no cuenta con logo imagen.
 */
const dibujarMonograma = (doc, nombre = 'EV', x, y, paleta = PALETAS_RGB.sofisticacion_sutil) => {
  const iniciales = nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || 'EV';

  doc.setFillColor(...paleta.primary);
  doc.roundedRect(x, y, 20, 20, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(iniciales, x + 10, y + 12.5, { align: 'center' });
};

/**
 * Genera el membrete corporativo minimalista en la parte superior del documento.
 * @param {jsPDF} doc - Instancia del documento jsPDF
 * @param {object} membrete - Datos de la empresa emisora
 * @param {string} tituloReporte - Título específico del reporte
 * @param {string|null} logoBase64 - Imagen en formato DataURL
 */
const dibujarMembrete = (doc, membrete = {}, tituloReporte = 'Reporte Corporativo', logoBase64 = null) => {
  const paletaKey = membrete.paleta_colores || 'sofisticacion_sutil';
  const paleta = PALETAS_RGB[paletaKey] || PALETAS_RGB.sofisticacion_sutil;

  const pageWidth = doc.internal.pageSize.getWidth();
  const startX = 14;
  const startY = 12;

  // 1. Logotipo o Monograma Minimalista
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', startX, startY, 20, 20);
    } catch {
      dibujarMonograma(doc, membrete.nombre_comercial, startX, startY, paleta);
    }
  } else {
    dibujarMonograma(doc, membrete.nombre_comercial, startX, startY, paleta);
  }

  // 2. Datos de la Empresa (Lado izquierdo, junto al logo)
  const textX = startX + 24;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...paleta.text);
  doc.text(membrete.nombre_comercial || 'EVENTRA SaaS Partner', textX, startY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...paleta.primary);
  doc.text(`RUC: ${membrete.ruc || '9999999999001'}  •  Plan ${membrete.plan_suscripcion || 'Empresarial'}`, textX, startY + 12);
  doc.text(`EVENTRA SaaS  •  Gestión Integral de Recepciones`, textX, startY + 17);

  // 3. Título del Reporte y Metadatos (Lado derecho)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...paleta.text);
  doc.text(tituloReporte, pageWidth - startX, startY + 6, { align: 'right' });

  const fechaStr = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(138, 152, 160);
  doc.text(`Emisión: ${fechaStr}`, pageWidth - startX, startY + 12, { align: 'right' });
  if (membrete.usuario_responsable) {
    doc.text(`Generado por: ${membrete.usuario_responsable}`, pageWidth - startX, startY + 17, { align: 'right' });
  }

  // 4. Línea divisoria minimalista en color de borde de la paleta
  const lineY = startY + 24;
  doc.setDrawColor(...paleta.border);
  doc.setLineWidth(0.6);
  doc.line(startX, lineY, pageWidth - startX, lineY);
};

/**
 * Añade la numeración de página y leyenda confidencial al pie.
 */
const aplicarPieDePagina = (doc) => {
  const pageCount = doc.internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Línea sutil en pie
    doc.setDrawColor(220, 218, 210);
    doc.setLineWidth(0.5);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(138, 152, 160);
    doc.text('Documento corporativo confidencial generado mediante EVENTRA SaaS', 14, pageHeight - 7);

    const paginacion = `Página ${i} de ${pageCount}`;
    doc.text(paginacion, pageWidth - 14, pageHeight - 7, { align: 'right' });
  }
};

/**
 * Dibuja una marca de agua diagonal translúcida en cada página si está activa en el membrete.
 */
const aplicarMarcaAguaDoc = (doc, membrete = {}) => {
  if (membrete?.marca_agua_activa === false) return;

  const pageCount = doc.internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const textoMarca = (membrete?.nombre_comercial || 'EVENTRA').toUpperCase();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    try {
      if (doc.saveGraphicsState) doc.saveGraphicsState();
      if (doc.setGState && typeof doc.GState === 'function') {
        doc.setGState(new doc.GState({ opacity: 0.035 }));
      }
    } catch {
      // Continuar con fallback
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(40);
    doc.setTextColor(190, 195, 200);

    // Texto en ángulo diagonal centrado
    doc.text(textoMarca, pageWidth / 2, pageHeight / 2, {
      align: 'center',
      angle: 35,
    });

    try {
      if (doc.restoreGraphicsState) doc.restoreGraphicsState();
    } catch {
      // Ignorar fallo de estado gráfico
    }
  }
};

/**
 * Obtiene los estilos de autoTable parametrizados según la paleta armónica del Tenant.
 */
const obtenerEstilosAutoTable = (paletaKey = 'sofisticacion_sutil') => {
  const p = PALETAS_RGB[paletaKey] || PALETAS_RGB.sofisticacion_sutil;
  return {
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      textColor: p.text,
      cellPadding: { top: 4, right: 5, bottom: 4, left: 5 },
      lineWidth: 0,
      valign: 'middle',
    },
    headStyles: {
      fillColor: p.bg,
      textColor: p.text,
      fontStyle: 'bold',
      lineWidth: { bottom: 1 },
      lineColor: p.primary,
    },
    alternateRowStyles: {
      fillColor: [250, 249, 247],
    },
  };
};

// =============================================================================
// REPORTES INDIVIDUALES EXPORTABLES
// =============================================================================

/**
 * 1. Exporta el Reporte de Ingresos y Cobranzas en PDF.
 */
export const exportarReporteIngresosPDF = async ({ membrete, transacciones = [], kpis = {} }) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const logoBase64 = await cargarImagenBase64(membrete?.logo_url || '/logo_Helados_Catedral.jpg');
  const estilos = obtenerEstilosAutoTable(membrete?.paleta_colores);

  dibujarMembrete(doc, membrete, 'Reporte Financiero de Ingresos', logoBase64);

  // Resumen ejecutivo rápido en texto
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(35, 61, 73);
  doc.text(`Total Recaudado (Pagos Aprobados): $${Number(kpis.total_recaudado || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD`, 14, 43);

  const tableRows = transacciones.map((t) => [
    t.fecha ? new Date(t.fecha).toLocaleDateString('es-ES') : 'N/A',
    t.cliente_nombre || 'Cliente General',
    t.evento_titulo || 'Evento',
    t.concepto || 'Abono',
    t.metodo_pago || 'Efectivo',
    `$${Number(t.monto || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    t.estado || 'Aprobado',
  ]);

  autoTable(doc, {
    ...estilos,
    startY: 47,
    head: [['Fecha', 'Cliente', 'Evento', 'Concepto', 'Método', 'Monto', 'Estado']],
    body: tableRows.length > 0 ? tableRows : [['-', 'Sin transacciones aprobadas registradas', '-', '-', '-', '$0.00', '-']],
    columnStyles: {
      0: { cellWidth: 22 },
      3: { cellWidth: 24 },
      4: { cellWidth: 24 },
      5: { halign: 'right', fontStyle: 'bold' },
      6: { halign: 'center' },
    },
  });

  aplicarMarcaAguaDoc(doc, membrete);
  aplicarPieDePagina(doc);
  doc.save(`Reporte_Ingresos_${membrete?.slug || 'eventra'}_${Date.now()}.pdf`);
};

/**
 * 2. Exporta el Reporte Operativo de Eventos en PDF.
 */
export const exportarReporteEventosPDF = async ({ membrete, eventos = [], kpis = {} }) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const logoBase64 = await cargarImagenBase64(membrete?.logo_url || '/logo_Helados_Catedral.jpg');
  const estilos = obtenerEstilosAutoTable(membrete?.paleta_colores);

  dibujarMembrete(doc, membrete, 'Reporte Operativo de Eventos', logoBase64);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(35, 61, 73);
  doc.text(`Total de Eventos: ${kpis.total_eventos || eventos.length}  |  Eventos Activos: ${kpis.eventos_activos || 0}`, 14, 43);

  const tableRows = eventos.map((e) => [
    e.titulo || 'Evento',
    e.cliente_nombre || 'Cliente',
    e.cliente_email || 'Sin correo',
    e.fecha_evento ? new Date(e.fecha_evento).toLocaleDateString('es-ES') : 'Por definir',
    e.salon_o_lugar || 'Salón Principal',
    e.estado_progreso || 'En Planificación',
    `$${Number(e.costo_total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
  ]);

  autoTable(doc, {
    ...estilos,
    startY: 47,
    head: [['Evento', 'Cliente', 'Contacto', 'Fecha', 'Espacio/Salón', 'Estado', 'Presupuesto']],
    body: tableRows.length > 0 ? tableRows : [['Sin eventos registrados', '-', '-', '-', '-', '-', '$0.00']],
    columnStyles: {
      5: { halign: 'center' },
      6: { halign: 'right', fontStyle: 'bold' },
    },
  });

  aplicarMarcaAguaDoc(doc, membrete);
  aplicarPieDePagina(doc);
  doc.save(`Reporte_Eventos_${membrete?.slug || 'eventra'}_${Date.now()}.pdf`);
};

/**
 * 3. Exporta el Reporte de Saldos Pendientes (Cuentas por Cobrar) en PDF.
 */
export const exportarReporteSaldosPDF = async ({ membrete, saldos = [], kpis = {} }) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const logoBase64 = await cargarImagenBase64(membrete?.logo_url || '/logo_Helados_Catedral.jpg');
  const estilos = obtenerEstilosAutoTable(membrete?.paleta_colores);

  dibujarMembrete(doc, membrete, 'Estado de Saldos Pendientes (Cuentas por Cobrar)', logoBase64);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(35, 61, 73);
  doc.text(`Total Cartera por Cobrar: $${Number(kpis.total_saldos_pendientes || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD`, 14, 43);

  const tableRows = saldos.map((s) => [
    s.evento_titulo || 'Evento',
    s.cliente_nombre || 'Cliente',
    s.cliente_telefono || s.cliente_email || '-',
    s.fecha_evento ? new Date(s.fecha_evento).toLocaleDateString('es-ES') : 'Por coordinar',
    `$${Number(s.costo_total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    `$${Number(s.total_abonado || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    `$${Number(s.saldo_pendiente || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    s.estado_pago || 'Pendiente',
  ]);

  autoTable(doc, {
    ...estilos,
    startY: 47,
    head: [['Evento', 'Cliente', 'Teléfono / Contacto', 'Fecha Evento', 'Costo Total', 'Abonado', 'Saldo Pendiente', 'Estado']],
    body: tableRows.length > 0 ? tableRows : [['Sin saldos pendientes', '-', '-', '-', '$0.00', '$0.00', '$0.00', 'Al día']],
    columnStyles: {
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right', fontStyle: 'bold', textColor: [201, 92, 92] },
      7: { halign: 'center' },
    },
  });

  aplicarMarcaAguaDoc(doc, membrete);
  aplicarPieDePagina(doc);
  doc.save(`Reporte_Saldos_Pendientes_${membrete?.slug || 'eventra'}_${Date.now()}.pdf`);
};
