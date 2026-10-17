#!/bin/sh
# Restaura únicamente a una base NUEVA; nunca sobrescribe la base operativa.
set -eu
export PGCONNECT_TIMEOUT=10
if [ "$#" -ne 2 ]; then echo 'Uso: restore.sh /backups/hotel-fecha-id/archive.dump hotel_restore_nombre'; exit 1; fi
case "$2" in hotel_restore_*) ;; *) echo 'El destino debe comenzar con hotel_restore_'; exit 1;; esac
[ "$2" != "$POSTGRES_DB" ] || { echo 'El destino no puede ser la base operativa'; exit 1; }
export PGHOST="${PGHOST:-db}" PGUSER="$POSTGRES_USER" PGPASSWORD="$POSTGRES_PASSWORD"
archive="$1"
if [ -f "$(dirname "$archive")/SHA256SUMS" ]; then
 (cd "$(dirname "$archive")" && sha256sum -c SHA256SUMS)
else
 sha256sum -c "$archive.sha256"
fi
createdb "$2"
pg_restore --exit-on-error --no-owner --no-acl --dbname="$2" "$archive"
echo "Restauración disponible en $2. La base operativa no fue modificada."
