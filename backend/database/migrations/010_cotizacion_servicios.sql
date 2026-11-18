-- Servicios elegidos en una cotización (a la carta o adicionales a un paquete) y datos del evento.
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS tipo_evento VARCHAR(60);
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS num_invitados INTEGER;

CREATE TABLE IF NOT EXISTS cotizacion_servicios (
    cotizacion_id    UUID           NOT NULL REFERENCES cotizaciones(id) ON DELETE CASCADE,
    servicio_id      UUID           NOT NULL REFERENCES servicios(id) ON DELETE RESTRICT,
    precio_unitario  DECIMAL(10, 2) NOT NULL,
    PRIMARY KEY (cotizacion_id, servicio_id)
);

CREATE INDEX IF NOT EXISTS idx_cotizacion_servicios_cotizacion ON cotizacion_servicios(cotizacion_id);
