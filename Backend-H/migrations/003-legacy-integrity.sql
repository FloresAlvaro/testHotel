-- Actualiza instalaciones previas sin modificar ni eliminar sus datos.
CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'reservation'::regclass AND conname = 'reservation_no_room_overlap') THEN
    ALTER TABLE reservation ADD CONSTRAINT reservation_no_room_overlap
      EXCLUDE USING gist (room_id WITH =, daterange(check_in, check_out, '[)') WITH &&)
      WHERE (status <> 'cancelled');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'check_in_log'::regclass AND conname = 'check_checkout_after_checkin') THEN
    ALTER TABLE check_in_log ADD CONSTRAINT check_checkout_after_checkin
      CHECK (check_out_time IS NULL OR (check_in_time IS NOT NULL AND check_out_time >= check_in_time));
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_checkin_per_reservation
  ON check_in_log(reservation_id) WHERE check_in_time IS NOT NULL;
