#!/bin/sh
set -eu
interval="${BACKUP_INTERVAL_SECONDS:-86400}"
case "$interval" in ''|*[!0-9]*) echo 'Intervalo de respaldo no válido' >&2; exit 1;; esac
[ "$interval" -ge 60 ] && [ "$interval" -le 2592000 ] || { echo 'El intervalo debe estar entre 60 y 2592000 segundos' >&2; exit 1; }
while :; do
 sh /scripts/backup.sh || echo 'Falló el respaldo. Se conservaron copias anteriores; revisa los logs.' >&2
 sleep "$interval"
done
