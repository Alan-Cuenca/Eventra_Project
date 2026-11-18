-- Solicitudes de contratación de plan hechas desde la landing pública.
CREATE TABLE IF NOT EXISTS solicitudes_registro_plan (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_nombre      VARCHAR(30)  NOT NULL,
    ciclo            VARCHAR(10)  NOT NULL DEFAULT 'mensual',
    correo_contacto  VARCHAR(150) NOT NULL,
    nombre_empresa   VARCHAR(150) NOT NULL,
    comprobante_url  TEXT         NOT NULL,
    estado           VARCHAR(20)  NOT NULL DEFAULT 'Pendiente',
    fecha_solicitud  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);
