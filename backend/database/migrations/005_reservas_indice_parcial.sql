-- El UNIQUE total bloqueaba el salón aun con la reserva cancelada.
-- Se reemplaza por un índice único parcial que ignora las Canceladas.
ALTER TABLE reservas DROP CONSTRAINT IF EXISTS uq_reserva_salon_fecha;
CREATE UNIQUE INDEX IF NOT EXISTS uq_reserva_salon_fecha_activa
    ON reservas (empresa_id, LOWER(TRIM(salon_o_lugar)), fecha_evento, hora_inicio)
    WHERE estado <> 'Cancelada';
