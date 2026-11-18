CREATE TABLE IF NOT EXISTS configuracion_saas (
    clave      VARCHAR(100) PRIMARY KEY,
    valor      JSONB NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
