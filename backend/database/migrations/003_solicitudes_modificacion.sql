CREATE TABLE IF NOT EXISTS solicitudes_modificacion (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id         INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    evento_id          UUID NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
    cliente_id         UUID REFERENCES clientes(id) ON DELETE SET NULL,
    descripcion_cambio TEXT NOT NULL,
    estado             VARCHAR(50) DEFAULT 'Pendiente',
    fecha_solicitud    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
