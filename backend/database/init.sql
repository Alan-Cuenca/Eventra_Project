-- =============================================================================
-- EVENTRA - Script de Inicialización y Migración de Base de Datos
-- Compatible con: PostgreSQL 14+ / Supabase
-- =============================================================================
-- Este script es 100% idempotente: es seguro de ejecutar tanto en una base de
-- datos limpia como en una base de datos existente de Supabase.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- =============================================================================
-- TABLA: empresas
-- =============================================================================
-- Almacena las organizaciones o empresas que utilizan la plataforma EVENTRA.
-- Es la entidad raíz del sistema: todos los usuarios deben pertenecer a una empresa.
-- =============================================================================
CREATE TABLE IF NOT EXISTS empresas (
    id                   SERIAL       PRIMARY KEY,
    nombre_comercial     VARCHAR(100) NOT NULL,
    slug                 VARCHAR(100) UNIQUE,
    ruc                  VARCHAR(20)  UNIQUE,
    plan_suscripcion     VARCHAR(50)  DEFAULT 'Basico',
    estado_activo        BOOLEAN      DEFAULT true,
    mensajes_chatbot_mes INTEGER      DEFAULT 0,
    fecha_registro       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- Agrega columnas a instancias ya existentes (idempotente)
ALTER TABLE empresas
    ADD COLUMN IF NOT EXISTS plan_suscripcion VARCHAR(50) DEFAULT 'Basico';

ALTER TABLE empresas
    ADD COLUMN IF NOT EXISTS estado_activo BOOLEAN DEFAULT true;

ALTER TABLE empresas
    ADD COLUMN IF NOT EXISTS slug VARCHAR(100);

ALTER TABLE empresas
    ADD COLUMN IF NOT EXISTS mensajes_chatbot_mes INTEGER DEFAULT 0;

-- Si existen empresas sin slug, genera un slug base normalizado a partir del nombre_comercial
UPDATE empresas
    SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(nombre_comercial, '[^a-zA-Z0-9]+', '-', 'g'), '^-|-$', '', 'g')) || '-' || id
    WHERE slug IS NULL;

-- Asegurar restricción UNIQUE en empresas(slug)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_empresas_slug'
    ) THEN
        ALTER TABLE empresas ADD CONSTRAINT uq_empresas_slug UNIQUE (slug);
    END IF;
END $$;


-- =============================================================================
-- TABLA: roles
-- =============================================================================
CREATE TABLE IF NOT EXISTS roles (
    id          SERIAL      PRIMARY KEY,
    nombre      VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT
);


-- =============================================================================
-- DATOS INICIALES: roles (1..5)
-- =============================================================================
-- Se usa ON CONFLICT (id) para garantizar inserción/actualización segura
-- incluso si la base de datos ya tenía los 4 roles previos.
-- =============================================================================
INSERT INTO roles (id, nombre, descripcion) VALUES
    (1, 'Administrador', 'Acceso total al sistema de su empresa. Gestiona usuarios, eventos, clientes y configuración de su tenant.'),
    (2, 'Gerente', 'Gestiona los eventos y el personal de su empresa. Puede visualizar reportes y administrar trabajadores.'),
    (3, 'Trabajador', 'Personal operativo de la empresa. Accede a los eventos asignados y gestiona sus tareas correspondientes.'),
    (4, 'Cliente', 'Usuario externo que puede consultar, contratar y hacer seguimiento de los servicios de eventos.'),
    (5, 'Super_Admin', 'Rol supremo global de la plataforma EVENTRA (SaaS Owner). Gestión integral de inquilinos (empresas), planes de suscripción y métricas globales.')
ON CONFLICT (id) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion;

-- Ajuste de secuencia de roles para evitar conflictos de autoincremento
SELECT setval(pg_get_serial_sequence('roles', 'id'), COALESCE((SELECT MAX(id) FROM roles), 1));


-- =============================================================================
-- TABLA: usuarios
-- =============================================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id          INTEGER,
    rol_id              INTEGER      NOT NULL,
    nombre_completo     VARCHAR(150) NOT NULL,
    cedula              VARCHAR(20),
    fecha_nacimiento    DATE,
    email               VARCHAR(150) UNIQUE NOT NULL,
    password_hash       VARCHAR(255) NOT NULL,
    estado_activo       BOOLEAN      DEFAULT true,
    fecha_creacion      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_usuarios_empresa
        FOREIGN KEY (empresa_id)
        REFERENCES empresas(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_usuarios_rol
        FOREIGN KEY (rol_id)
        REFERENCES roles(id)
);

-- Idempotencia para modificaciones de usuarios
ALTER TABLE usuarios ALTER COLUMN empresa_id DROP NOT NULL;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cedula VARCHAR(20);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


-- =============================================================================
-- TABLA: clientes
-- =============================================================================
-- Almacena los clientes de cada empresa registrada en EVENTRA.
-- Implementa aislamiento de datos SaaS mediante empresa_id:
--   cada consulta debe filtrar por empresa_id para garantizar que
--   una empresa nunca pueda ver los clientes de otra.
--
-- Relación:
--   empresa_id → empresas(id): Si se elimina la empresa, sus clientes
--   se eliminan en cascada (ON DELETE CASCADE).
-- =============================================================================
CREATE TABLE IF NOT EXISTS clientes (
    id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id          INTEGER      NOT NULL,
    nombres             VARCHAR(100) NOT NULL,
    apellidos           VARCHAR(100) NOT NULL,
    email               VARCHAR(150),
    telefono            VARCHAR(20),
    estado_activo       BOOLEAN      DEFAULT true,
    fecha_creacion      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_clientes_empresa
        FOREIGN KEY (empresa_id)
        REFERENCES empresas(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_clientes_empresa_email
        UNIQUE (empresa_id, email)
);

-- Idempotencia para clientes
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Migración idempotente: eliminar restricción UNIQUE global previa de email si existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'clientes_email_key'
    ) THEN
        ALTER TABLE clientes DROP CONSTRAINT clientes_email_key;
    END IF;
END $$;

-- Asegurar restricción UNIQUE compuesta (empresa_id, email)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_clientes_empresa_email'
    ) THEN
        ALTER TABLE clientes ADD CONSTRAINT uq_clientes_empresa_email UNIQUE (empresa_id, email);
    END IF;
END $$;


-- =============================================================================
-- TABLA: servicios
-- =============================================================================
-- Almacena el catálogo de servicios que cada empresa ofrece en EVENTRA.
-- Implementa aislamiento de datos SaaS mediante empresa_id:
--   cada empresa gestiona y visualiza únicamente su propio catálogo.
--
-- Control de acceso (RBAC):
--   Solo Administradores (rol_id=1) y Gerentes (rol_id=2) pueden
--   crear o modificar servicios a nivel de API.
--
-- Relación:
--   empresa_id → empresas(id): Cascada en eliminación.
-- =============================================================================
CREATE TABLE IF NOT EXISTS servicios (
    id             UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id     INTEGER        NOT NULL,
    nombre         VARCHAR(100)   NOT NULL,
    descripcion    TEXT,
    precio_base    DECIMAL(10, 2) NOT NULL,
    estado_activo  BOOLEAN        DEFAULT true,
    fecha_creacion TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_servicios_empresa
        FOREIGN KEY (empresa_id)
        REFERENCES empresas(id)
        ON DELETE CASCADE
);


-- =============================================================================
-- TABLA: paquetes
-- =============================================================================
-- Agrupa uno o más servicios en un paquete comercial con precio total.
-- Cada paquete pertenece a una empresa (aislamiento SaaS).
--
-- Control de acceso (RBAC):
--   Solo Administradores (rol_id=1) y Gerentes (rol_id=2) pueden
--   crear paquetes a nivel de API.
--
-- Relación N:M con servicios:
--   Un paquete puede contener muchos servicios y un servicio puede
--   pertenecer a muchos paquetes → tabla intermedia paquete_servicios.
-- =============================================================================
CREATE TABLE IF NOT EXISTS paquetes (
    id             UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id     INTEGER        NOT NULL,
    nombre         VARCHAR(100)   NOT NULL,
    descripcion    TEXT,
    precio_total   DECIMAL(10, 2) NOT NULL,
    estado_activo  BOOLEAN        DEFAULT true,
    fecha_creacion TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_paquetes_empresa
        FOREIGN KEY (empresa_id)
        REFERENCES empresas(id)
        ON DELETE CASCADE
);


-- =============================================================================
-- TABLA INTERMEDIA: paquete_servicios
-- =============================================================================
-- Implementa la relación Many-to-Many entre paquetes y servicios.
-- Llave primaria compuesta (paquete_id, servicio_id) garantiza que
-- un mismo servicio no se duplique dentro del mismo paquete.
--
-- Cascadas:
--   - Si se elimina un paquete  → se eliminan sus relaciones.
--   - Si se elimina un servicio → se eliminan sus relaciones.
-- =============================================================================
CREATE TABLE IF NOT EXISTS paquete_servicios (
    paquete_id  UUID NOT NULL,
    servicio_id UUID NOT NULL,

    PRIMARY KEY (paquete_id, servicio_id),

    CONSTRAINT fk_ps_paquete
        FOREIGN KEY (paquete_id)
        REFERENCES paquetes(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_ps_servicio
        FOREIGN KEY (servicio_id)
        REFERENCES servicios(id)
        ON DELETE CASCADE
);


-- =============================================================================
-- TABLA: cotizaciones
-- =============================================================================
-- Registra las cotizaciones generadas para los clientes de cada empresa.
-- Implementa aislamiento SaaS mediante empresa_id.
--
-- Relaciones:
--   empresa_id  → empresas(id)  : Cascada en eliminación.
--   cliente_id  → clientes(id)  : Cascada en eliminación.
--   paquete_id  → paquetes(id)  : Opcional (NULL si se cotiza sin paquete).
--
-- Estado (máquina de estados):
--   'Pendiente' → 'Aprobada' → 'Rechazada' | 'Completada'
--
-- Control de acceso (RBAC):
--   Administradores (1), Gerentes (2) y Trabajadores (3) pueden crear.
--   Cualquier usuario autenticado puede listar.
-- =============================================================================
CREATE TABLE IF NOT EXISTS cotizaciones (
    id                    UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id            INTEGER        NOT NULL,
    cliente_id            UUID           NOT NULL,
    paquete_id            UUID,
    fecha_estimada_evento DATE           NOT NULL,
    total_calculado       DECIMAL(10, 2) NOT NULL,
    estado                VARCHAR(20)    DEFAULT 'Pendiente',
    fecha_creacion        TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_cotizaciones_empresa
        FOREIGN KEY (empresa_id)
        REFERENCES empresas(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_cotizaciones_cliente
        FOREIGN KEY (cliente_id)
        REFERENCES clientes(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_cotizaciones_paquete
        FOREIGN KEY (paquete_id)
        REFERENCES paquetes(id)
        ON DELETE SET NULL
);


-- =============================================================================
-- TABLA: reservas
-- =============================================================================
-- Registra la reserva física de un salón o lugar para un evento.
-- Implementa doble capa de protección contra sobreventa:
--   1. Control en aplicación: SELECT COUNT(*) antes de insertar.
--   2. Control en BD: restricción UNIQUE a nivel de base de datos
--      como última línea de defensa ante condiciones de carrera.
--
-- Relaciones:
--   empresa_id   → empresas(id)    : Cascada en eliminación.
--   cotizacion_id → cotizaciones(id): Cascada en eliminación.
--
-- Control de acceso (RBAC):
--   Administradores (1), Gerentes (2) y Trabajadores (3) pueden crear.
-- =============================================================================
CREATE TABLE IF NOT EXISTS reservas (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id      INTEGER      NOT NULL,
    cotizacion_id   UUID         NOT NULL,
    salon_o_lugar   VARCHAR(150) NOT NULL,
    fecha_evento    DATE         NOT NULL,
    hora_inicio     TIME         NOT NULL,
    hora_fin        TIME         NOT NULL,
    estado          VARCHAR(20)  DEFAULT 'Confirmada',
    fecha_creacion  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

    -- Doble protección: BD rechaza duplicados aunque la app falle
    CONSTRAINT uq_reserva_salon_fecha
        UNIQUE (empresa_id, salon_o_lugar, fecha_evento),

    CONSTRAINT fk_reservas_empresa
        FOREIGN KEY (empresa_id)
        REFERENCES empresas(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_reservas_cotizacion
        FOREIGN KEY (cotizacion_id)
        REFERENCES cotizaciones(id)
        ON DELETE CASCADE
);


-- =============================================================================
-- TABLA: eventos
-- =============================================================================
-- Tabla central del sistema EVENTRA. Representa el evento planificado
-- y en ejecución, vinculado a su reserva física de espacio.
--
-- Ciclo de vida (estado_progreso):
--   'En Planificación' → 'En Progreso' → 'Finalizado' | 'Cancelado'
--
-- Relaciones:
--   empresa_id → empresas(id) : Cascada en eliminación.
--   reserva_id → reservas(id) : Cascada en eliminación.
--
-- Control de acceso (RBAC):
--   Crear/Editar: Administradores (1) y Gerentes (2).
--   Ver/Actualizar estado: Admin (1), Gerente (2) y Trabajador (3).
-- =============================================================================
CREATE TABLE IF NOT EXISTS eventos (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id       INTEGER     NOT NULL,
    reserva_id       UUID        NOT NULL,
    titulo           VARCHAR(150) NOT NULL,
    descripcion      TEXT,
    estado_progreso  VARCHAR(50) DEFAULT 'En Planificación',
    fecha_creacion   TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_eventos_empresa
        FOREIGN KEY (empresa_id)
        REFERENCES empresas(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_eventos_reserva
        FOREIGN KEY (reserva_id)
        REFERENCES reservas(id)
        ON DELETE CASCADE
);


-- =============================================================================
-- TABLA: actividades
-- =============================================================================
-- Registra las tareas individuales asociadas a un evento.
-- Permite la asignación a un usuario responsable (Trabajador).
--
-- Ciclo de vida (estado):
--   'Pendiente' → 'En Progreso' → 'Completada' | 'Cancelada'
--
-- Relaciones:
--   empresa_id    → empresas(id) : Cascada en eliminación.
--   evento_id     → eventos(id)  : Cascada en eliminación.
--   responsable_id → usuarios(id): SET NULL si se elimina el usuario;
--                                  la actividad sobrevive sin responsable.
--
-- Control de acceso (RBAC):
--   Crear/Asignar: Administradores (1) y Gerentes (2).
--   Ver y actualizar estado: todos los usuarios autenticados
--   (los Trabajadores ven solo sus propias actividades por lógica de app).
-- =============================================================================
CREATE TABLE IF NOT EXISTS actividades (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id        INTEGER     NOT NULL,
    evento_id         UUID        NOT NULL,
    responsable_id    UUID,
    titulo            VARCHAR(150) NOT NULL,
    descripcion       TEXT,
    fecha_vencimiento DATE,
    estado            VARCHAR(50) DEFAULT 'Pendiente',
    fecha_creacion    TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_actividades_empresa
        FOREIGN KEY (empresa_id)
        REFERENCES empresas(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_actividades_evento
        FOREIGN KEY (evento_id)
        REFERENCES eventos(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_actividades_responsable
        FOREIGN KEY (responsable_id)
        REFERENCES usuarios(id)
        ON DELETE SET NULL
);


-- =============================================================================
-- TABLA: pagos
-- =============================================================================
-- Registra los pagos y anticipos recibidos por cada evento de la empresa.
-- Implementa aislamiento SaaS mediante empresa_id.
-- Permite llevar el control financiero completo de un evento:
--   anticipos, abonos y liquidaciones finales.
--
-- Ciclo de vida (estado):
--   'Pendiente' → 'Completado' | 'Anulado'
--
-- Conceptos típicos: 'Anticipo', 'Abono', 'Liquidación'
--
-- Relaciones:
--   empresa_id → empresas(id) : Cascada en eliminación.
--   evento_id  → eventos(id)  : Cascada en eliminación.
--
-- Control de acceso (RBAC):
--   Registrar: Administradores (1) y Gerentes (2).
--   Consultar:  Admin (1), Gerente (2) y Trabajador (3).
-- =============================================================================
CREATE TABLE IF NOT EXISTS pagos (
    id              UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id      INTEGER        NOT NULL,
    evento_id       UUID           NOT NULL,
    monto           DECIMAL(10, 2) NOT NULL,
    concepto        VARCHAR(100)   NOT NULL,
    metodo_pago     VARCHAR(50),
    fecha_pago      DATE           DEFAULT CURRENT_DATE,
    estado          VARCHAR(50)    DEFAULT 'Completado',
    comprobante_url TEXT,
    fecha_registro  TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_pagos_empresa
        FOREIGN KEY (empresa_id)
        REFERENCES empresas(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_pagos_evento
        FOREIGN KEY (evento_id)
        REFERENCES eventos(id)
        ON DELETE CASCADE
);

-- Idempotencia para pagos
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS comprobante_url TEXT;


-- =============================================================================
-- TABLA: proveedores
-- =============================================================================
-- Almacena los proveedores o terceros que brindan servicios para los eventos
-- de cada empresa registrada en EVENTRA.
-- Implementa aislamiento SaaS mediante empresa_id.
--
-- Especialidades típicas: 'Música', 'Decoración', 'Catering', 'Fotografía',
--   'Iluminación', 'Transporte', etc.
--
-- Relación:
--   empresa_id → empresas(id) : Cascada en eliminación.
--
-- Control de acceso (RBAC):
--   Crear/Editar: Administradores (1) y Gerentes (2).
--   Consultar:    Admin (1), Gerente (2) y Trabajador (3).
-- =============================================================================
CREATE TABLE IF NOT EXISTS proveedores (
    id                         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id                 INTEGER      NOT NULL,
    nombre_empresa_o_contacto  VARCHAR(150) NOT NULL,
    especialidad               VARCHAR(100) NOT NULL,
    telefono                   VARCHAR(20),
    email                      VARCHAR(150),
    estado_activo              BOOLEAN      DEFAULT true,
    fecha_registro             TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_proveedores_empresa
        FOREIGN KEY (empresa_id)
        REFERENCES empresas(id)
        ON DELETE CASCADE
);


-- =============================================================================
-- TABLA: solicitudes_modificacion
-- =============================================================================
-- Registra las peticiones de cambio que los Clientes o Trabajadores realizan
-- sobre un evento planificado. Permite al equipo Admin/Gerente aprobarlas
-- o rechazarlas manteniendo trazabilidad de los cambios solicitados.
--
-- Ciclo de vida (estado):
--   'Pendiente' → 'Aprobada' | 'Rechazada'
--
-- Relaciones:
--   empresa_id → empresas(id) : Cascada en eliminación.
--   evento_id  → eventos(id)  : Cascada en eliminación.
--   cliente_id → clientes(id) : SET NULL si se elimina el cliente;
--                               la solicitud sobrevive sin cliente asociado.
--
-- Control de acceso (RBAC):
--   Crear:            cualquier usuario autenticado.
--   Aprobar/Rechazar: solo Admin (1) y Gerente (2).
-- =============================================================================
CREATE TABLE IF NOT EXISTS solicitudes_modificacion (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id          INTEGER     NOT NULL,
    evento_id           UUID        NOT NULL,
    cliente_id          UUID,
    descripcion_cambio  TEXT        NOT NULL,
    estado              VARCHAR(50) DEFAULT 'Pendiente',
    fecha_solicitud     TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_solicitudes_empresa
        FOREIGN KEY (empresa_id)
        REFERENCES empresas(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_solicitudes_evento
        FOREIGN KEY (evento_id)
        REFERENCES eventos(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_solicitudes_cliente
        FOREIGN KEY (cliente_id)
        REFERENCES clientes(id)
        ON DELETE SET NULL
);


-- =============================================================================
-- MIGRACIONES IDEMPOTENTES PARA BASES DE DATOS PREVIAS
-- =============================================================================
-- Si las tablas ya existían antes de la arquitectura SaaS o actualizaciones recientes,
-- estas instrucciones garantizan que todas las columnas existan sin alterar datos.
-- =============================================================================

-- Asegurar empresa_id con clave foránea en todas las tablas operativas
ALTER TABLE clientes                 ADD COLUMN IF NOT EXISTS empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE;
ALTER TABLE servicios                ADD COLUMN IF NOT EXISTS empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE;
ALTER TABLE paquetes                 ADD COLUMN IF NOT EXISTS empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE;
ALTER TABLE cotizaciones             ADD COLUMN IF NOT EXISTS empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE;
ALTER TABLE reservas                 ADD COLUMN IF NOT EXISTS empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE;
ALTER TABLE eventos                  ADD COLUMN IF NOT EXISTS empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE;
ALTER TABLE actividades              ADD COLUMN IF NOT EXISTS empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE;
ALTER TABLE pagos                    ADD COLUMN IF NOT EXISTS empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE;
ALTER TABLE proveedores              ADD COLUMN IF NOT EXISTS empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE;
ALTER TABLE solicitudes_modificacion ADD COLUMN IF NOT EXISTS empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE;


-- =============================================================================
-- ÍNDICES MULTI-TENANT (Aislamiento y Rendimiento SaaS)
-- =============================================================================
-- Acelera los filtros obligatorios WHERE empresa_id = $1 en toda la plataforma
CREATE INDEX IF NOT EXISTS idx_usuarios_empresa     ON usuarios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_clientes_empresa     ON clientes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_servicios_empresa    ON servicios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_paquetes_empresa     ON paquetes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_empresa ON cotizaciones(empresa_id);
CREATE INDEX IF NOT EXISTS idx_reservas_empresa     ON reservas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_eventos_empresa      ON eventos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_actividades_empresa  ON actividades(empresa_id);
CREATE INDEX IF NOT EXISTS idx_pagos_empresa        ON pagos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_proveedores_empresa  ON proveedores(empresa_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_empresa  ON solicitudes_modificacion(empresa_id);


-- =============================================================================
-- TABLA: suscripciones_pagos
-- =============================================================================
-- Registra los pagos de suscripción mensual/anual de las empresas hacia el SaaS EVENTRA.
-- Supervisado por el Super_Admin (5) y liquidado por el Administrador de cada empresa (1).
CREATE TABLE IF NOT EXISTS suscripciones_pagos (
    id              UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id      INTEGER        NOT NULL,
    plan_nombre     VARCHAR(50)    NOT NULL,
    monto           DECIMAL(10, 2) NOT NULL,
    comprobante_url TEXT,
    estado          VARCHAR(50)    DEFAULT 'En Revisión',
    fecha_pago      DATE           DEFAULT CURRENT_DATE,
    fecha_registro  TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_suscripciones_empresa
        FOREIGN KEY (empresa_id)
        REFERENCES empresas(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_suscripciones_pagos_empresa ON suscripciones_pagos(empresa_id);


