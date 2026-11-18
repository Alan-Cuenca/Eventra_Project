-- Columnas de identidad/marca blanca de empresas (antes en el auto-DDL de db.js).
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS slug VARCHAR(100);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS mensajes_chatbot_mes INTEGER DEFAULT 0;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE empresas ALTER COLUMN logo_url TYPE TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS paleta_colores VARCHAR(50) DEFAULT 'sofisticacion_sutil';
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS marca_agua_activa BOOLEAN DEFAULT true;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS portal_titulo VARCHAR(150);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS portal_descripcion TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS paleta_personalizada JSONB;
