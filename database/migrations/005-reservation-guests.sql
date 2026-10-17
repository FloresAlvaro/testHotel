BEGIN;
ALTER TABLE reservation ADD COLUMN IF NOT EXISTS adults INT NOT NULL DEFAULT 1 CHECK(adults BETWEEN 1 AND 20);
ALTER TABLE reservation ADD COLUMN IF NOT EXISTS children INT NOT NULL DEFAULT 0 CHECK(children BETWEEN 0 AND 19);
ALTER TABLE reservation ADD COLUMN IF NOT EXISTS arrival_time TIME;
ALTER TABLE reservation ADD COLUMN IF NOT EXISTS special_requests VARCHAR(1000) NOT NULL DEFAULT '';
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='reservation'::regclass AND conname='reservation_guest_count') THEN
 ALTER TABLE reservation ADD CONSTRAINT reservation_guest_count CHECK(adults+children<=20);
 END IF;
END $$;
CREATE OR REPLACE FUNCTION hotel_notify_reservation() RETURNS trigger AS $$
DECLARE email_address TEXT; hotel TEXT; event TEXT;
BEGIN
 IF TG_OP='UPDATE' AND ROW(OLD.status,OLD.check_in,OLD.check_out,OLD.total_price) IS NOT DISTINCT FROM ROW(NEW.status,NEW.check_in,NEW.check_out,NEW.total_price) THEN RETURN NEW; END IF;
 SELECT COALESCE((SELECT email FROM "user" WHERE client_id=c.id AND is_active LIMIT 1),c.email) INTO email_address FROM client c WHERE c.id=NEW.client_id;
 SELECT hotel_name INTO hotel FROM hotel_settings WHERE id=1;
 IF COALESCE(email_address,'')='' THEN RETURN NEW; END IF;
 event:=CASE WHEN TG_OP='INSERT' THEN 'Confirmación de reserva' ELSE 'Actualización de reserva' END;
 INSERT INTO email_outbox(recipient,subject,body,event_key) VALUES(email_address,event||' #'||NEW.id,
 hotel||E'\nReserva #'||NEW.id||E'\nLlegada: '||NEW.check_in||E'\nSalida: '||NEW.check_out||E'\nEstado: '||NEW.status||E'\nTotal: '||NEW.total_price||E'\nAdultos: '||NEW.adults||E'\nNiños: '||NEW.children,
 'reservation:'||NEW.id||':'||txid_current()) ON CONFLICT DO NOTHING;
 RETURN NEW;
END; $$ LANGUAGE plpgsql;
COMMIT;
