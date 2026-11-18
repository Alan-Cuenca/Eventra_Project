-- Datos de cobro de cada empresa (banco, cuenta, titular...) que ven sus clientes al pagar.
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS datos_pago JSONB;
