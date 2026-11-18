-- Índices para las consultas más frecuentes (JOIN y filtros por tenant/cliente).
CREATE INDEX IF NOT EXISTS idx_pagos_evento ON pagos(evento_id);
CREATE INDEX IF NOT EXISTS idx_pagos_empresa_estado ON pagos(empresa_id, estado);
CREATE INDEX IF NOT EXISTS idx_eventos_reserva ON eventos(reserva_id);
CREATE INDEX IF NOT EXISTS idx_eventos_empresa ON eventos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_actividades_evento ON actividades(evento_id);
CREATE INDEX IF NOT EXISTS idx_actividades_responsable ON actividades(responsable_id);
CREATE INDEX IF NOT EXISTS idx_reservas_cotizacion ON reservas(cotizacion_id);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_cliente ON cotizaciones(cliente_id);
CREATE INDEX IF NOT EXISTS idx_clientes_empresa_email ON clientes(empresa_id, LOWER(email));
