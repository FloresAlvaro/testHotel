BEGIN;
-- Las fechas nuevas de auditoría representan instantes, independientemente de la zona del servidor.
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=current_schema() AND table_name='audit_log' AND column_name='created_at' AND data_type='timestamp without time zone') THEN
  ALTER TABLE audit_log ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'America/La_Paz';
 END IF;
END $$;

CREATE TABLE IF NOT EXISTS hotel_settings (
 id INT PRIMARY KEY CHECK(id=1), hotel_name VARCHAR(200) NOT NULL DEFAULT 'Mi hotel', city VARCHAR(100) NOT NULL DEFAULT '',
 email VARCHAR(200) NOT NULL DEFAULT '', phone VARCHAR(40) NOT NULL DEFAULT '', address VARCHAR(300) NOT NULL DEFAULT '',
 check_in_time TIME NOT NULL DEFAULT '15:00', check_out_time TIME NOT NULL DEFAULT '11:00',
 currency VARCHAR(3) NOT NULL DEFAULT 'BOB' CHECK(currency IN ('BOB','USD','EUR')),
 timezone VARCHAR(100) NOT NULL DEFAULT 'America/La_Paz', version INT NOT NULL DEFAULT 1, updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO hotel_settings(id) VALUES(1) ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS housekeeping_task (
 id SERIAL PRIMARY KEY, room_id INT NOT NULL REFERENCES room(id), kind VARCHAR(20) NOT NULL CHECK(kind IN ('cleaning','maintenance')),
 title VARCHAR(200) NOT NULL, notes TEXT NOT NULL DEFAULT '', status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','in_progress','completed')),
 assigned_to INT REFERENCES "user"(id), created_by INT REFERENCES "user"(id), reservation_id INT REFERENCES reservation(id),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), completed_at TIMESTAMPTZ
);
-- Habitaciones que ya estaban bloqueadas antes de instalar el módulo.
INSERT INTO housekeeping_task(room_id,kind,title,notes)
SELECT r.id,'maintenance','Revisar habitación bloqueada','Tarea creada al activar el módulo operativo'
FROM room r WHERE r.status='maintenance' AND NOT EXISTS(SELECT 1 FROM housekeeping_task t WHERE t.room_id=r.id AND t.status<>'completed');
CREATE UNIQUE INDEX IF NOT EXISTS task_checkout_unique ON housekeeping_task(reservation_id) WHERE reservation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS task_room_status ON housekeeping_task(room_id,status);
CREATE TABLE IF NOT EXISTS cash_shift (
 id SERIAL PRIMARY KEY, user_id INT NOT NULL REFERENCES "user"(id), opening_amount NUMERIC(10,2) NOT NULL CHECK(opening_amount>=0),
 opened_at TIMESTAMPTZ NOT NULL DEFAULT now(), closed_at TIMESTAMPTZ, counted_amount NUMERIC(10,2), expected_amount NUMERIC(12,2),
 currency VARCHAR(3) NOT NULL, notes TEXT NOT NULL DEFAULT '', closed_by INT REFERENCES "user"(id), summary JSONB
);
CREATE UNIQUE INDEX IF NOT EXISTS cash_one_open_shift ON cash_shift(user_id) WHERE closed_at IS NULL;
CREATE TABLE IF NOT EXISTS cash_movement (
 id SERIAL PRIMARY KEY, payment_id INT NOT NULL REFERENCES payment(id), shift_id INT REFERENCES cash_shift(id),
 kind VARCHAR(20) NOT NULL CHECK(kind IN ('payment','refund')), amount NUMERIC(10,2) NOT NULL, method payment_method NOT NULL,
 actor_id INT REFERENCES "user"(id), currency VARCHAR(3) NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(payment_id,kind)
);
CREATE TABLE IF NOT EXISTS payment_receipt (
 id SERIAL PRIMARY KEY, payment_id INT NOT NULL UNIQUE REFERENCES payment(id), number VARCHAR(40) NOT NULL UNIQUE,
 snapshot JSONB NOT NULL, issued_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE OR REPLACE FUNCTION hotel_audit_change() RETURNS trigger AS $$
DECLARE old_data JSONB; new_data JSONB; actor INT;
BEGIN
 actor := NULLIF(current_setting('hotel.actor_id',true),'')::INT;
 IF TG_OP <> 'INSERT' THEN old_data := to_jsonb(OLD) - 'password'; END IF;
 IF TG_OP <> 'DELETE' THEN new_data := to_jsonb(NEW) - 'password'; END IF;
 IF old_data IS NOT DISTINCT FROM new_data THEN RETURN NEW; END IF;
 INSERT INTO audit_log(user_id,action,table_name,record_id,old_value,new_value,ip_address)
 VALUES(actor,TG_OP,TG_TABLE_NAME,COALESCE((new_data->>'id')::INT,(old_data->>'id')::INT),old_data,new_data,NULLIF(current_setting('hotel.actor_ip',true),''));
 RETURN COALESCE(NEW,OLD);
END; $$ LANGUAGE plpgsql;
DO $$ DECLARE name TEXT; BEGIN
 FOREACH name IN ARRAY ARRAY['reservation','payment','room','client','user','hotel_settings','housekeeping_task','cash_shift','room_type','check_in_log'] LOOP
  EXECUTE format('DROP TRIGGER IF EXISTS hotel_audit ON %I',name);
  EXECUTE format('CREATE TRIGGER hotel_audit AFTER INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION hotel_audit_change()',name);
 END LOOP;
END $$;
CREATE OR REPLACE FUNCTION hotel_payment_event() RETURNS trigger AS $$
DECLARE actor INT; shift_record cash_shift%ROWTYPE; settings hotel_settings%ROWTYPE; operation TEXT;
BEGIN
 IF TG_OP='UPDATE' AND OLD.status=NEW.status THEN RETURN NEW; END IF;
 IF NEW.status NOT IN ('completed','refunded') THEN RETURN NEW; END IF;
 actor := NULLIF(current_setting('hotel.actor_id',true),'')::INT;
 SELECT * INTO settings FROM hotel_settings WHERE id=1;
 IF actor IS NOT NULL THEN
  SELECT * INTO shift_record FROM cash_shift WHERE user_id=actor AND closed_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Abre un turno de caja antes de completar o reembolsar pagos' USING ERRCODE='P0001'; END IF;
 END IF;
 operation := CASE WHEN NEW.status='completed' THEN 'payment' ELSE 'refund' END;
 INSERT INTO cash_movement(payment_id,shift_id,kind,amount,method,actor_id,currency)
 VALUES(NEW.id,shift_record.id,operation,CASE WHEN operation='payment' THEN NEW.amount ELSE -NEW.amount END,NEW.method,actor,settings.currency)
 ON CONFLICT(payment_id,kind) DO NOTHING;
 IF NEW.status='completed' THEN
  INSERT INTO payment_receipt(payment_id,number,snapshot)
  SELECT NEW.id,'REC-'||lpad(NEW.id::text,8,'0'),jsonb_build_object('hotel',to_jsonb(settings)-'version','payment',to_jsonb(NEW),'client_name',c.name,'room_number',rm.number,'reservation_id',r.id,'issued_by',actor)
  FROM reservation r JOIN client c ON c.id=r.client_id JOIN room rm ON rm.id=r.room_id WHERE r.id=NEW.reservation_id
  ON CONFLICT(payment_id) DO NOTHING;
 END IF;
 RETURN NEW;
END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS hotel_payment_event ON payment;
CREATE TRIGGER hotel_payment_event AFTER INSERT OR UPDATE ON payment FOR EACH ROW EXECUTE FUNCTION hotel_payment_event();
-- Recibos históricos, sin inventar movimientos de turnos que nunca existieron.
INSERT INTO payment_receipt(payment_id,number,snapshot)
 SELECT p.id,'REC-'||lpad(p.id::text,8,'0'),jsonb_build_object('hotel',to_jsonb(s)-'version','payment',to_jsonb(p),'client_name',c.name,'room_number',rm.number,'reservation_id',r.id,'historical',true)
 FROM payment p JOIN reservation r ON r.id=p.reservation_id JOIN client c ON c.id=r.client_id JOIN room rm ON rm.id=r.room_id CROSS JOIN hotel_settings s
 WHERE p.status IN ('completed','refunded') ON CONFLICT(payment_id) DO NOTHING;
CREATE OR REPLACE FUNCTION hotel_room_ready() RETURNS trigger AS $$
BEGIN
 IF NEW.status IN ('available','reserved') AND EXISTS(SELECT 1 FROM housekeeping_task WHERE room_id=NEW.id AND status<>'completed') THEN
 RAISE EXCEPTION 'Finaliza las tareas pendientes antes de habilitar la habitación' USING ERRCODE='P0001';
 END IF;
 RETURN NEW;
END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS hotel_room_ready ON room;
CREATE TRIGGER hotel_room_ready BEFORE UPDATE OF status ON room FOR EACH ROW EXECUTE FUNCTION hotel_room_ready();
COMMIT;
