-- Ejecutar como administrador, después de las migraciones, exclusivamente en public.
-- psql lee contraseñas del entorno; nunca pasarlas mediante argumentos -v.
\set ON_ERROR_STOP on
\getenv runtime_password POSTGRES_RUNTIME_PASSWORD
\getenv migrator_password POSTGRES_MIGRATOR_PASSWORD
\getenv backup_password POSTGRES_BACKUP_PASSWORD
\getenv verifier_password POSTGRES_VERIFY_PASSWORD
BEGIN;
SELECT pg_advisory_xact_lock(724003);
DO $$ DECLARE role_name text; membership record; BEGIN
 IF current_user IN ('hotel_owner','hotel_runtime','hotel_migrator','hotel_backup','hotel_backup_verify') THEN
  RAISE EXCEPTION 'Usa una cuenta administrativa independiente para provisionar roles';
 END IF;
 FOREACH role_name IN ARRAY ARRAY['hotel_owner','hotel_runtime','hotel_migrator','hotel_backup','hotel_backup_verify'] LOOP
  IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname=role_name) THEN EXECUTE format('CREATE ROLE %I',role_name); END IF;
  EXECUTE format('ALTER ROLE %I NOSUPERUSER NOCREATEROLE NOREPLICATION NOBYPASSRLS',role_name);
 END LOOP;
 -- Ninguna pertenencia histórica puede conceder privilegios al runtime o lectores.
 FOR membership IN SELECT parent.rolname AS parent,child.rolname AS child FROM pg_auth_members m JOIN pg_roles parent ON parent.oid=m.roleid JOIN pg_roles child ON child.oid=m.member WHERE child.rolname IN ('hotel_runtime','hotel_backup','hotel_backup_verify') LOOP
  EXECUTE format('REVOKE %I FROM %I',membership.parent,membership.child);
 END LOOP;
END $$;
ALTER ROLE hotel_owner NOLOGIN NOCREATEDB;
ALTER ROLE hotel_runtime LOGIN NOCREATEDB;
ALTER ROLE hotel_migrator LOGIN NOCREATEDB;
ALTER ROLE hotel_backup LOGIN NOCREATEDB;
-- Solo puede crear bases nuevas para restaurar copias; no tiene acceso a la operativa.
ALTER ROLE hotel_backup_verify LOGIN CREATEDB;
ALTER ROLE hotel_runtime PASSWORD :'runtime_password';
ALTER ROLE hotel_migrator PASSWORD :'migrator_password';
ALTER ROLE hotel_backup PASSWORD :'backup_password';
ALTER ROLE hotel_backup_verify PASSWORD :'verifier_password';
GRANT hotel_owner TO hotel_migrator;
REVOKE ALL ON SCHEMA public FROM PUBLIC;
ALTER SCHEMA public OWNER TO hotel_owner;
DO $$ DECLARE item record; BEGIN
 -- Evita transferir objetos internos de extensiones al propietario de la aplicación.
 FOR item IN SELECT c.oid,c.relkind,c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('r','p','S','v','m') AND NOT EXISTS(SELECT 1 FROM pg_depend d WHERE d.classid='pg_class'::regclass AND d.objid=c.oid AND d.deptype='e') ORDER BY c.relkind='S' LOOP
  EXECUTE format('ALTER %s public.%I OWNER TO hotel_owner',CASE item.relkind WHEN 'S' THEN 'SEQUENCE' WHEN 'v' THEN 'VIEW' WHEN 'm' THEN 'MATERIALIZED VIEW' ELSE 'TABLE' END,item.relname);
 END LOOP;
 FOR item IN SELECT t.typname FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typtype='e' LOOP
  EXECUTE format('ALTER TYPE public.%I OWNER TO hotel_owner',item.typname);
 END LOOP;
 FOR item IN SELECT p.oid::regprocedure AS signature FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND NOT EXISTS(SELECT 1 FROM pg_depend d WHERE d.classid='pg_proc'::regclass AND d.objid=p.oid AND d.deptype='e') LOOP
  EXECUTE format('ALTER FUNCTION %s OWNER TO hotel_owner',item.signature);
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC',item.signature);
 END LOOP;
 EXECUTE format('REVOKE ALL ON DATABASE %I FROM PUBLIC',current_database());
 EXECUTE format('GRANT CONNECT ON DATABASE %I TO hotel_owner,hotel_migrator,hotel_runtime,hotel_backup',current_database());
 EXECUTE format('GRANT TEMPORARY ON DATABASE %I TO hotel_owner',current_database());
END $$;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM hotel_runtime,hotel_backup,hotel_backup_verify;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM hotel_runtime,hotel_backup,hotel_backup_verify;
REVOKE ALL ON SCHEMA public FROM hotel_backup_verify;
GRANT USAGE ON SCHEMA public TO hotel_runtime,hotel_backup;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO hotel_runtime,hotel_backup;
REVOKE SELECT ON public.schema_migrations FROM hotel_runtime;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO hotel_backup;
GRANT INSERT,UPDATE ON public."user",public.client,public.room_type,public.room,public.reservation,public.check_in_log,public.payment,public.hotel_settings,public.housekeeping_task,public.cash_shift,public.reservation_request,public.password_reset,public.email_outbox,public.online_payment,public.user_invitation TO hotel_runtime;
GRANT INSERT ON public.payment_webhook TO hotel_runtime;
GRANT INSERT,DELETE ON public.web_session TO hotel_runtime;
GRANT INSERT,UPDATE ON public.user_mfa,public.mfa_recovery_code,public.mfa_challenge TO hotel_runtime;
GRANT DELETE ON public.mfa_challenge TO hotel_runtime;
GRANT DELETE ON public.user_mfa TO hotel_runtime;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO hotel_runtime;
REVOKE ALL ON SEQUENCE public.audit_log_id_seq,public.cash_movement_id_seq,public.payment_receipt_id_seq FROM hotel_runtime;
-- Solo los dos triggers que escriben registros derivados necesitan elevación.
ALTER FUNCTION public.hotel_audit_change() SECURITY DEFINER;
ALTER FUNCTION public.hotel_audit_change() SET search_path=pg_catalog,public,pg_temp;
ALTER FUNCTION public.hotel_payment_event() SECURITY DEFINER;
ALTER FUNCTION public.hotel_payment_event() SET search_path=pg_catalog,public,pg_temp;
-- Nuevos objetos quedan cerrados a escrituras hasta revisar y reaplicar esta política.
ALTER DEFAULT PRIVILEGES FOR ROLE hotel_owner IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE hotel_owner IN SCHEMA public GRANT SELECT ON TABLES TO hotel_backup;
ALTER DEFAULT PRIVILEGES FOR ROLE hotel_owner IN SCHEMA public GRANT SELECT ON SEQUENCES TO hotel_backup;
COMMIT;
