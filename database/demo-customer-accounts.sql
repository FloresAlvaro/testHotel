-- Solo para una DEMO previamente cargada. Añade accesos sin reemplazar cuentas ni contraseñas existentes.
-- Ejecutar después de todas las migraciones; credenciales públicas, nunca para producción.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
INSERT INTO "user"(name,email,password,role,client_id,is_active)
SELECT c.name,d.email,crypt('Customer123!',gen_salt('bf',10)),'customer',c.id,true
FROM (VALUES ('1234567','customer@hotel.com'),('US9988776','customer2@hotel.com')) AS d(document,email)
JOIN client c ON c.document=d.document AND c.is_active=true
ON CONFLICT DO NOTHING;
DO $$ BEGIN
 IF (SELECT count(*) FROM "user" u JOIN client c ON c.id=u.client_id
     WHERE u.role='customer' AND ((u.email='customer@hotel.com' AND c.document='1234567') OR (u.email='customer2@hotel.com' AND c.document='US9988776')))<>2 THEN
  RAISE EXCEPTION 'No se encontraron las fichas de demo o existe un conflicto de cuentas. No se reemplazaron accesos existentes.';
 END IF;
END $$;
COMMIT;
