import React, { useState, useEffect } from 'react';
import { eventraService } from '../../services/eventraService';
import {
  exportarReporteIngresosPDF,
  exportarReporteEventosPDF,
  exportarReporteSaldosPDF,
} from '../../utils/pdfReportGenerator';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  FileText,
  Download,
  DollarSign,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Building2,
  CheckCircle2,
  Clock,
  Layers,
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  Loader2,
  ShieldCheck,
} from 'lucide-react';

const COLORES_DONUT = ['#526F7D', '#233D49', '#4D9A72', '#C49A3A'];

export const ReportesPage = () => {
  const [reporteData, setReporteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exportingType, setExportingType] = useState(null);
  const [activeTab, setActiveTab] = useState('saldos'); // 'saldos' | 'ingresos' | 'eventos'
  const [errorMsg, setErrorMsg] = useState(null);

  const cargarReportes = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await eventraService.getReportesResumen();
      setReporteData(data);
    } catch (err) {
      console.error('Error al cargar reportes:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Error al obtener datos analíticos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarReportes();
  }, []);

  const handleExportPDF = async (tipo) => {
    if (!reporteData) return;
    try {
      setExportingType(tipo);
      const { membrete, kpis, reporte_ingresos, reporte_eventos, reporte_saldos } = reporteData;

      if (tipo === 'ingresos') {
        await exportarReporteIngresosPDF({
          membrete,
          transacciones: reporte_ingresos?.transacciones || [],
          kpis,
        });
      } else if (tipo === 'eventos') {
        await exportarReporteEventosPDF({
          membrete,
          eventos: reporte_eventos?.listado || [],
          kpis,
        });
      } else if (tipo === 'saldos') {
        await exportarReporteSaldosPDF({
          membrete,
          saldos: reporte_saldos?.listado || [],
          kpis,
        });
      }
    } catch (err) {
      console.error('Error al exportar PDF:', err);
    } finally {
      setExportingType(null);
    }
  };

  const membrete = reporteData?.membrete || {};
  const kpis = reporteData?.kpis || {};
  const ingresosTendencia = reporteData?.reporte_ingresos?.tendencia_mensual || [];
  const eventosPorEstado = reporteData?.reporte_eventos?.por_estado || [];
  const transacciones = reporteData?.reporte_ingresos?.transacciones || [];
  const eventosListado = reporteData?.reporte_eventos?.listado || [];
  const saldosListado = reporteData?.reporte_saldos?.listado || [];

  return (
    <div className="space-y-8 font-sans text-[#233D49]">
      {/* ── Header del Módulo con Membrete y Botones de Exportación ── */}
      <div className="bg-white rounded-2xl border border-[#CBC6B6]/50 p-6 sm:p-8 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4">
          <img
            src={membrete.logo_url || '/logo_Helados_Catedral.jpg'}
            alt="Logo Empresa"
            className="w-14 h-14 rounded-2xl bg-[#EEEBDD] p-1.5 border border-[#CBC6B6] object-contain shadow-xs shrink-0"
            onError={(e) => {
              e.currentTarget.src = '/logo_Helados_Catedral.jpg';
            }}
          />
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-[#233D49]">
                {membrete.nombre_comercial || 'Reportes Corporativos'}
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#526F7D]/15 text-[#526F7D] border border-[#526F7D]/30">
                RUC: {membrete.ruc || '9999999999001'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#526F7D] mt-1">
              Dashboards analíticos de ingresos, eventos y cartera de saldos por cobrar con exportación formal en PDF.
            </p>
          </div>
        </div>

        {/* Acciones de Exportación en PDF */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleExportPDF('ingresos')}
            disabled={loading || exportingType !== null}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#526F7D] hover:bg-[#233D49] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
            title="Exportar Reporte de Ingresos a PDF"
          >
            {exportingType === 'ingresos' ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}
            <span>PDF Ingresos</span>
          </button>

          <button
            type="button"
            onClick={() => handleExportPDF('eventos')}
            disabled={loading || exportingType !== null}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#526F7D] hover:bg-[#233D49] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
            title="Exportar Reporte de Eventos a PDF"
          >
            {exportingType === 'eventos' ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}
            <span>PDF Eventos</span>
          </button>

          <button
            type="button"
            onClick={() => handleExportPDF('saldos')}
            disabled={loading || exportingType !== null}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#526F7D] hover:bg-[#233D49] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
            title="Exportar Reporte de Saldos por Cobrar a PDF"
          >
            {exportingType === 'saldos' ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}
            <span>PDF Saldos</span>
          </button>

          <button
            type="button"
            onClick={cargarReportes}
            disabled={loading}
            className="p-2.5 rounded-xl bg-[#EEEBDD] hover:bg-[#CBC6B6]/50 text-[#233D49] border border-[#CBC6B6] transition-colors cursor-pointer"
            title="Recargar datos"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-[#526F7D]' : ''} />
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-[#C95C5C]/15 border border-[#C95C5C]/30 text-[#233D49] text-sm flex items-center justify-between">
          <span>{errorMsg}</span>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-xs font-bold text-[#526F7D] hover:text-[#233D49]"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* ── KPI Cards (Toss-Style con tabular-nums) ─────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Total Recaudado */}
        <div className="bg-white rounded-2xl border border-[#CBC6B6]/40 shadow-sm p-6 hover:shadow-md transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#526F7D]">
              Total Recaudado
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#4D9A72]/15 text-[#4D9A72] flex items-center justify-center">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-extrabold tracking-tight text-[#233D49] tabular-nums">
              ${Number(kpis.total_recaudado || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-[#8A98A0]">
              Ingresos de pagos validados y aprobados contablemente
            </p>
          </div>
        </div>

        {/* Card 2: Saldos por Cobrar */}
        <div className="bg-white rounded-2xl border border-[#CBC6B6]/40 shadow-sm p-6 hover:shadow-md transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#C49A3A]">
              Saldos por Cobrar
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#C49A3A]/15 text-[#C49A3A] flex items-center justify-center">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-extrabold tracking-tight text-[#233D49] tabular-nums">
              ${Number(kpis.total_saldos_pendientes || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-[#8A98A0]">
              Cartera pendiente de abono en cotizaciones y reservas
            </p>
          </div>
        </div>

        {/* Card 3: Eventos Registrados */}
        <div className="bg-white rounded-2xl border border-[#CBC6B6]/40 shadow-sm p-6 hover:shadow-md transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#526F7D]">
              Eventos Registrados
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#526F7D]/15 text-[#526F7D] flex items-center justify-center">
              <Calendar size={18} />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-extrabold tracking-tight text-[#233D49] tabular-nums">
              {kpis.total_eventos || 0}
            </div>
            <p className="text-xs text-[#8A98A0]">
              {kpis.eventos_activos || 0} eventos actualmente en planificación o progreso
            </p>
          </div>
        </div>
      </div>

      {/* ── Gráficos Minimalistas (Recharts) ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico 1: BarChart de Ingresos */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#CBC6B6]/40 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#EEEBDD]">
            <div>
              <h2 className="text-base font-bold text-[#233D49]">Evolución Mensual de Ingresos</h2>
              <p className="text-xs text-[#526F7D]">Recaudación consolidada por mes contable</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#EEEBDD] text-[#526F7D]">
              Moneda: USD
            </span>
          </div>

          <div className="h-64 w-full">
            {ingresosTendencia.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ingresosTendencia} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#CBC6B6" strokeOpacity={0.5} />
                  <XAxis
                    dataKey="mes_etiqueta"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#526F7D', fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#526F7D', fontSize: 12 }}
                    tickFormatter={(val) => `$${val}`}
                  />
                  <Tooltip
                    cursor={{ fill: '#EEEBDD', opacity: 0.4 }}
                    formatter={(val) => [`$${Number(val).toLocaleString('en-US')}`, 'Ingresos']}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      border: '1px solid #CBC6B6',
                      boxShadow: '0 4px 12px rgba(35, 61, 73, 0.08)',
                      color: '#233D49',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="total_ingresos" fill="#526F7D" radius={[6, 6, 0, 0]} name="Ingresos ($)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-xs text-[#8A98A0]">
                <span>No hay datos suficientes para graficar ingresos este periodo.</span>
              </div>
            )}
          </div>
        </div>

        {/* Gráfico 2: PieChart Donut de Eventos por Estado */}
        <div className="bg-white rounded-2xl border border-[#CBC6B6]/40 shadow-sm p-6 space-y-4">
          <div className="pb-2 border-b border-[#EEEBDD]">
            <h2 className="text-base font-bold text-[#233D49]">Eventos por Estado</h2>
            <p className="text-xs text-[#526F7D]">Distribución del estado operativo</p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {eventosPorEstado.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={eventosPorEstado}
                    dataKey="total"
                    nameKey="estado_progreso"
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {eventosPorEstado.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORES_DONUT[index % COLORES_DONUT.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      border: '1px solid #CBC6B6',
                      color: '#233D49',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    formatter={(value) => <span className="text-xs text-[#233D49] font-medium">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-[#8A98A0] text-center">
                Sin eventos registrados para la distribución.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Tablas con Pestañas (Tabs) ───────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#CBC6B6]/40 shadow-sm overflow-hidden">
        {/* Barra de Pestañas */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-[#EEEBDD] bg-[#EEEBDD]/30 gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('saldos')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'saldos'
                  ? 'bg-[#526F7D] text-white shadow-xs'
                  : 'bg-white text-[#526F7D] hover:bg-[#EEEBDD]'
              }`}
            >
              Saldos Pendientes ({saldosListado.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ingresos')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'ingresos'
                  ? 'bg-[#526F7D] text-white shadow-xs'
                  : 'bg-white text-[#526F7D] hover:bg-[#EEEBDD]'
              }`}
            >
              Historial de Ingresos ({transacciones.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('eventos')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'eventos'
                  ? 'bg-[#526F7D] text-white shadow-xs'
                  : 'bg-white text-[#526F7D] hover:bg-[#EEEBDD]'
              }`}
            >
              Resumen de Eventos ({eventosListado.length})
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleExportPDF(activeTab)}
            disabled={exportingType !== null}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#CBC6B6] text-[#233D49] hover:bg-[#EEEBDD] text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Download size={13} className="text-[#526F7D]" />
            <span>Descargar PDF de esta vista</span>
          </button>
        </div>

        {/* Contenido de la Tabla según Pestaña */}
        <div className="overflow-x-auto">
          {activeTab === 'saldos' && (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#EEEBDD] bg-[#F9F8F4] text-[#526F7D] text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-5">Evento</th>
                  <th className="py-3.5 px-5">Cliente</th>
                  <th className="py-3.5 px-5">Fecha Evento</th>
                  <th className="py-3.5 px-5 text-right">Costo Total</th>
                  <th className="py-3.5 px-5 text-right">Abonado</th>
                  <th className="py-3.5 px-5 text-right">Saldo Pendiente</th>
                  <th className="py-3.5 px-5 text-center">Estado de Pago</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEEBDD]">
                {saldosListado.map((row) => (
                  <tr key={row.evento_id} className="hover:bg-[#F9F8F4] transition-colors">
                    <td className="py-3.5 px-5 font-semibold text-[#233D49] text-xs">
                      {row.evento_titulo || 'Evento'}
                    </td>
                    <td className="py-3.5 px-5 text-xs text-[#233D49]">
                      {row.cliente_nombre || 'Cliente General'}
                    </td>
                    <td className="py-3.5 px-5 text-xs text-[#526F7D]">
                      {row.fecha_evento ? new Date(row.fecha_evento).toLocaleDateString('es-ES') : 'Sin fecha'}
                    </td>
                    <td className="py-3.5 px-5 text-xs text-right tabular-nums">
                      ${Number(row.costo_total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-5 text-xs text-right tabular-nums text-[#4D9A72] font-semibold">
                      ${Number(row.total_abonado || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-5 text-xs text-right tabular-nums text-[#C95C5C] font-bold">
                      ${Number(row.saldo_pendiente || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-5 text-xs text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          row.estado_pago === 'Pagado'
                            ? 'bg-[#4D9A72]/15 text-[#4D9A72]'
                            : row.estado_pago === 'Abonado Parcial'
                            ? 'bg-[#C49A3A]/15 text-[#9A7422]'
                            : 'bg-[#C95C5C]/15 text-[#C95C5C]'
                        }`}
                      >
                        {row.estado_pago}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'ingresos' && (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#EEEBDD] bg-[#F9F8F4] text-[#526F7D] text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-5">Fecha</th>
                  <th className="py-3.5 px-5">Cliente</th>
                  <th className="py-3.5 px-5">Evento Asociado</th>
                  <th className="py-3.5 px-5">Concepto</th>
                  <th className="py-3.5 px-5">Método de Pago</th>
                  <th className="py-3.5 px-5 text-right">Monto Aprobado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEEBDD]">
                {transacciones.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F9F8F4] transition-colors">
                    <td className="py-3.5 px-5 text-xs text-[#526F7D]">
                      {p.fecha ? new Date(p.fecha).toLocaleDateString('es-ES') : 'N/A'}
                    </td>
                    <td className="py-3.5 px-5 font-semibold text-[#233D49] text-xs">
                      {p.cliente_nombre || 'Cliente General'}
                    </td>
                    <td className="py-3.5 px-5 text-xs text-[#233D49]">
                      {p.evento_titulo || 'Evento'}
                    </td>
                    <td className="py-3.5 px-5 text-xs text-[#526F7D]">
                      {p.concepto || 'Abono'}
                    </td>
                    <td className="py-3.5 px-5 text-xs">
                      <span className="px-2 py-0.5 rounded-md bg-[#EEEBDD] text-[#526F7D] font-medium text-[11px]">
                        {p.metodo_pago || 'Efectivo'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-xs text-right tabular-nums text-[#4D9A72] font-bold">
                      ${Number(p.monto || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'eventos' && (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#EEEBDD] bg-[#F9F8F4] text-[#526F7D] text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-5">Evento</th>
                  <th className="py-3.5 px-5">Cliente</th>
                  <th className="py-3.5 px-5">Fecha</th>
                  <th className="py-3.5 px-5">Salón / Espacio</th>
                  <th className="py-3.5 px-5 text-center">Estado Operativo</th>
                  <th className="py-3.5 px-5 text-right">Presupuesto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEEBDD]">
                {eventosListado.map((evt) => (
                  <tr key={evt.id} className="hover:bg-[#F9F8F4] transition-colors">
                    <td className="py-3.5 px-5 font-semibold text-[#233D49] text-xs">
                      {evt.titulo || 'Evento'}
                    </td>
                    <td className="py-3.5 px-5 text-xs text-[#233D49]">
                      {evt.cliente_nombre || 'Cliente General'}
                    </td>
                    <td className="py-3.5 px-5 text-xs text-[#526F7D]">
                      {evt.fecha_evento ? new Date(evt.fecha_evento).toLocaleDateString('es-ES') : 'Por definir'}
                    </td>
                    <td className="py-3.5 px-5 text-xs text-[#526F7D]">
                      {evt.salon_o_lugar || 'Salón Principal'}
                    </td>
                    <td className="py-3.5 px-5 text-xs text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#526F7D]/15 text-[#526F7D]">
                        {evt.estado_progreso || 'En Planificación'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-xs text-right tabular-nums font-bold text-[#233D49]">
                      ${Number(evt.costo_total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportesPage;

