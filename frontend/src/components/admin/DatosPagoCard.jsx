import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Building2, Save, Loader2 } from 'lucide-react';

const CAMPOS = [
  { key: 'banco', label: 'Institución bancaria', placeholder: 'Ej. Banco Pichincha' },
  { key: 'tipo_cuenta', label: 'Tipo de cuenta', placeholder: 'Corriente / Ahorros' },
  { key: 'numero_cuenta', label: 'Número de cuenta', placeholder: '0000000000' },
  { key: 'titular', label: 'Titular', placeholder: 'Nombre del beneficiario' },
  { key: 'identificacion', label: 'RUC / Cédula', placeholder: '' },
  { key: 'correo', label: 'Correo para notificaciones', placeholder: 'pagos@tuempresa.com' },
  { key: 'deuna', label: 'Código o alias de Deuna (opcional)', placeholder: '' },
];

/**
 * Permite al Administrador/Gerente definir los datos de cobro de su empresa.
 * Esos datos son los que ve el Cliente en "Realizar Pago".
 */
export const DatosPagoCard = () => {
  const [datos, setDatos] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    api.get('/empresas/mi-branding')
      .then((res) => setDatos(res?.data?.datos_pago || {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const guardar = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      await api.put('/empresas/mi-datos-pago', datos);
      setMsg({ tipo: 'ok', texto: 'Datos de pago guardados.' });
    } catch (err) {
      setMsg({ tipo: 'error', texto: err.message || 'No se pudieron guardar los datos de pago.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-[#CEC8B8] p-6 space-y-4" style={{ marginTop: '1.5rem' }}>
      <div className="flex items-center gap-2 text-sm font-bold text-[#233D49]">
        <Building2 size={18} className="text-[#4D7182]" />
        <span>Datos de cobro para tus clientes</span>
      </div>
      <p className="text-xs text-[#4D7182]">
        Se muestran al cliente cuando paga por transferencia o Deuna. Si los dejas vacíos, el cliente verá que debe consultarlos contigo.
      </p>
      {loading ? (
        <Loader2 className="animate-spin" size={18} />
      ) : (
        <form onSubmit={guardar} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CAMPOS.map((c) => (
            <label key={c.key} className="text-xs font-semibold text-[#233D49] space-y-1">
              <span>{c.label}</span>
              <input
                type="text"
                className="form-input"
                maxLength={120}
                placeholder={c.placeholder}
                value={datos[c.key] || ''}
                onChange={(e) => setDatos((d) => ({ ...d, [c.key]: e.target.value }))}
              />
            </label>
          ))}
          <div className="sm:col-span-2 flex items-center gap-3">
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Guardar datos de pago
            </button>
            {msg && (
              <span className="text-xs font-semibold" style={{ color: msg.tipo === 'ok' ? '#4D9A72' : '#C95C5C' }}>
                {msg.texto}
              </span>
            )}
          </div>
        </form>
      )}
    </section>
  );
};

export default DatosPagoCard;
