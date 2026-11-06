import pool from '../config/db.js';
import { actualizarLimitesEnMemoria } from '../middlewares/planLimitsMiddleware.js';

export const DEFAULT_CONFIG = {
  plataforma: {
    nombre_comercial: 'EVENTRA SaaS Multi-Tenant',
    subtitulo: 'Gestión Inteligente de Eventos y Recepciones',
    correo_soporte: 'mfalcon6508@uta.edu.ec',
    modo_mantenimiento: false,
    registro_publico_activo: true,
  },
  transferencia: {
    titular: 'Alejandro Falcon',
    numero_cuenta: '2210101010',
    cedula: '1850116508',
    correo_notificacion: 'mfalcon6508@uta.edu.ec',
    entidad_bancaria: 'Banco Pichincha / Transferencia Interbancaria',
  },
  planes: {
    basico_nombre: 'Plan Básico (Boutique)',
    basico_precio: 49,
    basico_max_eventos: 20,
    basico_max_usuarios: 3,
    basico_max_clientes: 50,
    basico_max_servicios: 20,
    basico_max_chatbot: 300,
    premium_nombre: 'Plan Premium (Corporativo + IA)',
    premium_precio: 99,
    premium_max_eventos: 100,
    premium_max_usuarios: 10,
    premium_max_clientes: 200,
    premium_max_servicios: 50,
    premium_max_chatbot: 1500,
    premium_evara_ai: true,
    dias_gracia_facturacion: 5,
  },
  seguridad: {
    expiracion_jwt_horas: 8,
    aislamiento_estricto_tenant: true,
    bloqueo_anticolision_postgresql: true,
    forzar_cambio_clave_primer_acceso: true,
    auditoria_descargas_pdf: true,
  },
};

export const obtenerConfiguracionGlobal = async (req, res) => {
  try {
    const result = await pool.query("SELECT valor FROM configuracion_saas WHERE clave = 'global'");
    if (result.rows.length > 0 && result.rows[0].valor) {
      const stored = result.rows[0].valor;
      const merged = {
        plataforma: { ...DEFAULT_CONFIG.plataforma, ...(stored.plataforma || {}) },
        transferencia: { ...DEFAULT_CONFIG.transferencia, ...(stored.transferencia || {}) },
        planes: { ...DEFAULT_CONFIG.planes, ...(stored.planes || {}) },
        seguridad: { ...DEFAULT_CONFIG.seguridad, ...(stored.seguridad || {}) },
      };
      return res.status(200).json({
        success: true,
        data: merged,
      });
    }

    return res.status(200).json({
      success: true,
      data: DEFAULT_CONFIG,
    });
  } catch (error) {
    console.error('[configuracionController] Error en obtenerConfiguracionGlobal:', error.message);
    return res.status(200).json({
      success: true,
      data: DEFAULT_CONFIG,
    });
  }
};

export const guardarConfiguracionGlobal = async (req, res) => {
  try {
    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Payload inválido.',
      });
    }

    const valorJson = JSON.stringify(payload);
    await pool.query(
      `INSERT INTO configuracion_saas (clave, valor, updated_at)
       VALUES ('global', $1::jsonb, CURRENT_TIMESTAMP)
       ON CONFLICT (clave)
       DO UPDATE SET valor = EXCLUDED.valor, updated_at = CURRENT_TIMESTAMP`,
      [valorJson]
    );

    // Actualizar límites en memoria si se enviaron planes
    if (payload.planes) {
      actualizarLimitesEnMemoria(payload.planes);
    }

    return res.status(200).json({
      success: true,
      message: 'Configuración global guardada y sincronizada correctamente en PostgreSQL.',
      data: payload,
    });
  } catch (error) {
    console.error('[configuracionController] Error en guardarConfiguracionGlobal:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error al persistir la configuración en la base de datos.',
      error: error.message,
    });
  }
};
