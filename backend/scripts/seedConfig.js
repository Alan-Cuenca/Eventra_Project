import dotenv from 'dotenv';
dotenv.config();
import pool from '../src/config/db.js';

async function run() {
  const config = {
    plataforma: {
      nombre_comercial: 'EVENTRA SaaS Multi-Tenant',
      subtitulo: 'Gestión Inteligente de Eventos y Recepciones',
      correo_soporte: 'soporte@eventra.com',
      modo_mantenimiento: false,
      registro_publico_activo: true,
    },
    transferencia: {
      titular: 'EVENTRA SaaS Corp',
      numero_cuenta: '0011223344',
      cedula: '1790011223001',
      correo_notificacion: 'transferencias@eventra.com',
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
      premium_max_usuarios: 60,
      premium_max_clientes: 200,
      premium_max_servicios: 50,
      premium_max_chatbot: 1525,
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

  await pool.query(`
    CREATE TABLE IF NOT EXISTS configuracion_saas (
      clave VARCHAR(100) PRIMARY KEY,
      valor JSONB NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(
    `INSERT INTO configuracion_saas (clave, valor, updated_at)
     VALUES ('global', $1::jsonb, CURRENT_TIMESTAMP)
     ON CONFLICT (clave)
     DO UPDATE SET valor = EXCLUDED.valor, updated_at = CURRENT_TIMESTAMP`,
    [JSON.stringify(config)]
  );

  const res = await pool.query("SELECT clave, valor, updated_at FROM configuracion_saas WHERE clave = 'global'");
  console.log('CONFIG IN POSTGRESQL SUPABASE:');
  console.log(JSON.stringify(res.rows[0].valor.planes, null, 2));

  await pool.end();
}

run().catch((err) => {
  console.error('Error seeding config:', err);
  process.exit(1);
});
