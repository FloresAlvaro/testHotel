#!/bin/sh
set -u
while :; do
 sh /scripts/backup.sh || echo 'Falló el respaldo. Revisar logs del servicio backups.' >&2
 sleep "${BACKUP_INTERVAL_SECONDS:-86400}"
done
