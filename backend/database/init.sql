-- =============================================================================
-- EVENTRA - Script de Inicialización de Base de Datos
-- Compatible con: PostgreSQL 14+
-- =============================================================================
-- Descripción del modelo:
--
--   [empresas] ──< [usuarios] >── [roles]
--
--   Una EMPRESA puede tener múltiples USUARIOS registrados bajo ella.
--   Cada USUARIO pertenece a una sola EMPRESA y tiene un único ROL asignado.
--   Los ROLES definen los permisos y el perfil de acceso de cada usuario
--   dentro del sistema EVENTRA (Administrador, Gerente, Trabajador, Cliente).
-- =============================================================================


-- =============================================================================
-- TABLA: empresas
-- =============================================================================
-- Almacena las organizaciones o empresas que utilizan la plataforma EVENTRA.
-- Es la entidad raíz del sistema: todos los usuarios deben pertenecer a una empresa.
-- =============================================================================
CREATE TABLE IF NOT EXISTS empresas (
    id               SERIAL PRIMARY KEY,
    nombre_comercial VARCHAR(100) NOT NULL,
    ruc              VARCHAR(20)  UNIQUE,
    fecha_registro   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);


-- =============================================================================
-- TABLA: roles
-- =============================================================================
-- Define los perfiles de acceso disponibles en el sistema.
-- Cada usuario tendrá exactamente un rol, que determina sus permisos
-- y las funcionalidades a las que puede acceder dentro de EVENTRA.
-- =============================================================================
CREATE TABLE IF NOT EXISTS roles (
    id          SERIAL      PRIMARY KEY,
    nombre      VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT
);


-- =============================================================================
-- DATOS INICIALES: roles
-- =============================================================================
-- Se insertan los 4 perfiles base del sistema. Se usa ON CONFLICT DO NOTHING
-- para que el script sea idempotente (seguro de ejecutar múltiples veces).
-- =============================================================================
INSERT INTO roles (nombre, descripcion) VALUES
    ('Administrador', 'Acceso total al sistema. Gestiona empresas, usuarios, roles y configuración global de EVENTRA.')
    ON CONFLICT (nombre) DO NOTHING;

INSERT INTO roles (nombre, descripcion) VALUES
    ('Gerente', 'Gestiona los eventos y el personal de su empresa. Puede visualizar reportes y administrar trabajadores.')
    ON CONFLICT (nombre) DO NOTHING;

INSERT INTO roles (nombre, descripcion) VALUES
    ('Trabajador', 'Personal operativo de la empresa. Accede a los eventos asignados y gestiona sus tareas correspondientes.')
    ON CONFLICT (nombre) DO NOTHING;

INSERT INTO roles (nombre, descripcion) VALUES
    ('Cliente', 'Usuario externo que puede consultar, contratar y hacer seguimiento de los servicios de eventos.')
    ON CONFLICT (nombre) DO NOTHING;


-- =============================================================================
-- TABLA: usuarios
-- =============================================================================
-- Almacena los usuarios del sistema. Cada usuario está vinculado a una empresa
-- (empresa_id) y tiene un perfil de acceso definido por su rol (rol_id).
--
-- Relaciones:
--   - empresa_id → empresas(id): Si se elimina una empresa, se eliminan en
--     cascada todos sus usuarios (ON DELETE CASCADE).
--   - rol_id    → roles(id):    El rol es obligatorio para cada usuario.
--
-- Se utiliza UUID como clave primaria para mayor seguridad y escalabilidad,
-- evitando la exposición de IDs secuenciales en la API.
-- =============================================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id      INTEGER     NOT NULL,
    rol_id          INTEGER     NOT NULL,
    nombre_completo VARCHAR(150) NOT NULL,
    email           VARCHAR(150) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    estado_activo   BOOLEAN     DEFAULT true,
    fecha_creacion  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_usuarios_empresa
        FOREIGN KEY (empresa_id)
        REFERENCES empresas(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_usuarios_rol
        FOREIGN KEY (rol_id)
        REFERENCES roles(id)
);


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
    id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id     INTEGER      NOT NULL,
    nombres        VARCHAR(100) NOT NULL,
    apellidos      VARCHAR(100) NOT NULL,
    email          VARCHAR(150) UNIQUE,
    telefono       VARCHAR(20),
    estado_activo  BOOLEAN      DEFAULT true,
    fecha_creacion TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_clientes_empresa
        FOREIGN KEY (empresa_id)
        REFERENCES empresas(id)
        ON DELETE CASCADE
);


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
