BEGIN;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS client_id INT REFERENCES client(id) ON DELETE RESTRICT;
CREATE UNIQUE INDEX IF NOT EXISTS user_customer_client_unique ON "user"(client_id) WHERE client_id IS NOT NULL;
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='"user"'::regclass AND conname='user_customer_link') THEN
  ALTER TABLE "user" ADD CONSTRAINT user_customer_link CHECK ((role='customer') = (client_id IS NOT NULL));
 END IF;
END $$;
COMMIT;
