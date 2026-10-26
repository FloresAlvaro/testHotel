#!/bin/sh
set -eu
# Se ejecuta explícitamente con la identidad administrativa, o como último initdb.
# Sin xtrace y sin contraseñas en argumentos, logs o archivos SQL generados.
: "${POSTGRES_RUNTIME_PASSWORD:?Configura POSTGRES_RUNTIME_PASSWORD}"
: "${POSTGRES_MIGRATOR_PASSWORD:?Configura POSTGRES_MIGRATOR_PASSWORD}"
: "${POSTGRES_BACKUP_PASSWORD:?Configura POSTGRES_BACKUP_PASSWORD}"
: "${POSTGRES_VERIFY_PASSWORD:?Configura POSTGRES_VERIFY_PASSWORD}"
export PGPASSWORD="${PGPASSWORD:-${POSTGRES_PASSWORD:?Configura la contraseña administrativa}}"
directory=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
psql -X -q -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" <<'SQL'
CREATE TABLE IF NOT EXISTS public.schema_migrations(name text PRIMARY KEY,checksum char(64) NOT NULL,applied_at timestamptz NOT NULL DEFAULT now());
SQL
psql -X -q -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f "${HOTEL_SECURITY_SQL:-$directory/roles.sql}"
echo 'Roles separados y permisos verificados; credenciales no mostradas.'
