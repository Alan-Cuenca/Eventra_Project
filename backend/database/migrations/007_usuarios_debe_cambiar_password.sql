-- Cambio obligatorio de contraseña temporal (antes en src/config/schemaMigrations.js).
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS debe_cambiar_password BOOLEAN DEFAULT false;
