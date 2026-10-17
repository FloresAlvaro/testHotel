#!/bin/sh
# Restaura únicamente a una base NUEVA; nunca sobrescribe la base operativa.
set -eu
export PGCONNECT_TIMEOUT=10
if [ "$#" -ne 2 ]; then echo 'Uso: restore.sh /backups/archivo.dump hotel_restore_nombre'; exit 1; fi
case "$2" in hotel_restore_*) ;; *) echo 'El destino debe comenzar con hotel_restore_'; exit 1;; esac
export PGHOST="${PGHOST:-db}" PGUSER="$POSTGRES_USER" PGPASSWORD="$POSTGRES_PASSWORD"
sha256sum -c "$1.sha256"
createdb "$2"
pg_restore --exit-on-error --no-owner --no-acl --dbname="$2" "$1"
echo "Restauración disponible en $2. La base operativa no fue modificada."
