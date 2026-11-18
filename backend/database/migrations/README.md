# Migraciones de base de datos

- Archivos `NNN_descripcion.sql`, aplicados en orden numérico, una sola vez cada uno.
- El historial queda en la tabla `schema_migrations` (nombre, checksum, fecha).
- Ejecutar: `npm run migrate` (desde `backend/`). En Render se ejecuta en cada deploy.
- **Nunca edites una migración ya aplicada**: crea una nueva con el siguiente número.
- Cada migración corre dentro de una transacción; si falla, se revierte y el deploy se detiene.
- Escríbelas idempotentes (`IF NOT EXISTS`, `DROP ... IF EXISTS`) por si la BD ya tenía el cambio.
- `database/init.sql` es solo el esquema base para una BD nueva; el runner lo aplica solo si no existe la tabla `empresas`.
