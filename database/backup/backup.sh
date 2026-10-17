#!/bin/sh
set -eu
export PGCONNECT_TIMEOUT=10
umask 077
export PGPASSWORD="$POSTGRES_PASSWORD"
export PGHOST="${PGHOST:-db}" PGUSER="$POSTGRES_USER"
export PGDATABASE="$POSTGRES_DB"
mkdir -p /backups
if ! mkdir /backups/.lock 2>/dev/null; then echo 'Ya hay un respaldo en curso'; exit 1; fi
stamp=$(date -u +%Y%m%dT%H%M%SZ)
scratch="hotel_restore_${stamp}_$$"
archive="/backups/hotel-${stamp}.dump"
cleanup() { dropdb --if-exists "$scratch" >/dev/null 2>&1 || true; rm -f "$archive.partial"; rmdir /backups/.lock; }
trap cleanup EXIT INT TERM
pg_dump --format=custom --no-owner --no-acl --file="$archive.partial"
createdb "$scratch"
pg_restore --exit-on-error --no-owner --no-acl --dbname="$scratch" "$archive.partial"
PGDATABASE="$scratch" psql -v ON_ERROR_STOP=1 -c 'SELECT count(*) FROM reservation; SELECT count(*) FROM payment; SELECT count(*) FROM "user"; SELECT count(*) FROM hotel_settings;' >/dev/null
mv "$archive.partial" "$archive"
sha256sum "$archive" > "$archive.sha256"
printf '{"verified_at":"%s","archive":"%s","restored":true}\n' "$stamp" "$(basename "$archive")" > /backups/latest.json
find /backups -name 'hotel-*.dump*' -mtime +"${BACKUP_RETENTION_DAYS:-14}" -type f -delete
echo "Respaldo y restauración comprobados: $(basename "$archive")"
