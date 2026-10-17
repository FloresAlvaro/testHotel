BEGIN;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS auth_version INT NOT NULL DEFAULT 0;
ALTER TABLE hotel_settings ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
ALTER TABLE hotel_settings ADD COLUMN IF NOT EXISTS cover_image VARCHAR(500) NOT NULL DEFAULT '';
ALTER TABLE hotel_settings ADD COLUMN IF NOT EXISTS request_notice_hours INT NOT NULL DEFAULT 24 CHECK(request_notice_hours BETWEEN 0 AND 720);
ALTER TABLE hotel_settings ADD COLUMN IF NOT EXISTS deposit_percent INT NOT NULL DEFAULT 30 CHECK(deposit_percent BETWEEN 1 AND 100);
ALTER TABLE hotel_settings ADD COLUMN IF NOT EXISTS payment_due_hours INT NOT NULL DEFAULT 24 CHECK(payment_due_hours BETWEEN 1 AND 168);
ALTER TABLE room_type ADD COLUMN IF NOT EXISTS image_url VARCHAR(500) NOT NULL DEFAULT '';
CREATE TABLE IF NOT EXISTS reservation_request (
 id SERIAL PRIMARY KEY, reservation_id INT NOT NULL REFERENCES reservation(id), client_id INT NOT NULL REFERENCES client(id),
 kind TEXT NOT NULL CHECK(kind IN ('dates','cancel')), check_in DATE, check_out DATE, reason VARCHAR(1000) NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
 response VARCHAR(1000) NOT NULL DEFAULT '', reviewed_by INT REFERENCES "user"(id),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), reviewed_at TIMESTAMPTZ,
 CHECK((kind='cancel' AND check_in IS NULL AND check_out IS NULL) OR (kind='dates' AND check_out>check_in AND check_out-check_in<=365))
);
CREATE UNIQUE INDEX IF NOT EXISTS reservation_request_pending ON reservation_request(reservation_id) WHERE status='pending';
CREATE TABLE IF NOT EXISTS password_reset (
 id SERIAL PRIMARY KEY, user_id INT NOT NULL REFERENCES "user"(id), token_hash TEXT NOT NULL UNIQUE,
 expires_at TIMESTAMPTZ NOT NULL, used_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS email_outbox (
 id SERIAL PRIMARY KEY, recipient VARCHAR(254) NOT NULL, subject VARCHAR(200) NOT NULL, body TEXT NOT NULL,
 event_key TEXT NOT NULL UNIQUE, attempts INT NOT NULL DEFAULT 0, available_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 sent_at TIMESTAMPTZ, last_error TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS email_outbox_pending ON email_outbox(available_at) WHERE sent_at IS NULL;
CREATE TABLE IF NOT EXISTS online_payment (
 id UUID PRIMARY KEY, reservation_id INT NOT NULL REFERENCES reservation(id), user_id INT NOT NULL REFERENCES "user"(id),
 provider TEXT NOT NULL CHECK(provider IN ('demo','stripe')), amount NUMERIC(10,2) NOT NULL CHECK(amount>0), currency VARCHAR(3) NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','paid','expired','refund_pending','refunded')),
 provider_session TEXT UNIQUE, provider_intent TEXT UNIQUE, checkout_url TEXT, payment_id INT UNIQUE REFERENCES payment(id),
 expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS online_payment_pending ON online_payment(reservation_id) WHERE status='pending';
CREATE TABLE IF NOT EXISTS payment_webhook (id TEXT PRIMARY KEY, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
-- La cola se escribe en la misma transacción que la reserva o el comprobante.
CREATE OR REPLACE FUNCTION hotel_notify_reservation() RETURNS trigger AS $$
DECLARE email_address TEXT; hotel TEXT; event TEXT;
BEGIN
 IF TG_OP='UPDATE' AND ROW(OLD.status,OLD.check_in,OLD.check_out,OLD.total_price) IS NOT DISTINCT FROM ROW(NEW.status,NEW.check_in,NEW.check_out,NEW.total_price) THEN RETURN NEW; END IF;
 SELECT COALESCE((SELECT email FROM "user" WHERE client_id=c.id AND is_active LIMIT 1),c.email) INTO email_address FROM client c WHERE c.id=NEW.client_id;
 SELECT hotel_name INTO hotel FROM hotel_settings WHERE id=1;
 IF COALESCE(email_address,'')='' THEN RETURN NEW; END IF;
 event:=CASE WHEN TG_OP='INSERT' THEN 'Confirmación de reserva' ELSE 'Actualización de reserva' END;
 INSERT INTO email_outbox(recipient,subject,body,event_key) VALUES(email_address,event||' #'||NEW.id,
 hotel||E'\nReserva #'||NEW.id||E'\nLlegada: '||NEW.check_in||E'\nSalida: '||NEW.check_out||E'\nEstado: '||NEW.status||E'\nTotal: '||NEW.total_price,
 'reservation:'||NEW.id||':'||txid_current()) ON CONFLICT DO NOTHING;
 RETURN NEW;
END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS hotel_notify_reservation ON reservation;
CREATE TRIGGER hotel_notify_reservation AFTER INSERT OR UPDATE ON reservation FOR EACH ROW EXECUTE FUNCTION hotel_notify_reservation();
CREATE OR REPLACE FUNCTION hotel_notify_receipt() RETURNS trigger AS $$
DECLARE email_address TEXT;
BEGIN
 SELECT COALESCE((SELECT email FROM "user" WHERE client_id=c.id AND is_active LIMIT 1),c.email) INTO email_address FROM payment p JOIN reservation r ON r.id=p.reservation_id JOIN client c ON c.id=r.client_id WHERE p.id=NEW.payment_id;
 IF COALESCE(email_address,'')<>'' THEN
 INSERT INTO email_outbox(recipient,subject,body,event_key) VALUES(email_address,'Comprobante '||NEW.number,
 COALESCE(NEW.snapshot->'hotel'->>'hotel_name','Mi hotel')||E'\nComprobante: '||NEW.number||E'\nReserva: '||(NEW.snapshot->>'reservation_id')||E'\nImporte: '||(NEW.snapshot->'payment'->>'amount')||' '||(NEW.snapshot->'hotel'->>'currency')||E'\nPuedes consultar el comprobante en tu portal.',
 'receipt:'||NEW.id) ON CONFLICT DO NOTHING;
 END IF; RETURN NEW;
END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS hotel_notify_receipt ON payment_receipt;
CREATE TRIGGER hotel_notify_receipt AFTER INSERT ON payment_receipt FOR EACH ROW EXECUTE FUNCTION hotel_notify_receipt();
COMMIT;
