#!/bin/sh
set -eu
export PGCONNECT_TIMEOUT=10
umask 077
export PGPASSWORD="$POSTGRES_PASSWORD"
export PGHOST="${PGHOST:-db}" PGUSER="$POSTGRES_USER" PGDATABASE="$POSTGRES_DB"
# El lector solo vuelca datos. El verificador crea/restaura bases temporales propias.
verify() { PGUSER="${VERIFY_PGUSER:-$POSTGRES_USER}" PGPASSWORD="${VERIFY_PGPASSWORD:-$POSTGRES_PASSWORD}" "$@"; }
root="${BACKUP_DIRECTORY:-/backups}"
external="${BACKUP_OFFSITE_DIRECTORY:-/offsite}"
retention="${BACKUP_RETENTION_DAYS:-14}"
case "$retention" in ''|*[!0-9]*|0) echo 'Retención no válida' >&2; exit 1;; esac
[ "$retention" -ge 1 ] && [ "$retention" -le 3650 ] || exit 1
mkdir -p "$root"
# El descriptor se libera incluso si el proceso termina abruptamente.
exec 9>"$root/.backup.lock"
flock -n 9 || { echo 'Ya hay un respaldo en curso'; exit 1; }
stamp=$(date -u +%Y%m%dT%H%M%SZ)
scratch="hotel_restore_${stamp}_$$"
name="hotel-${stamp}-$$"
work="$root/.$name.partial"
offsite=false
complete=false
cleanup() {
 verify dropdb --if-exists "$scratch" >/dev/null 2>&1 || true
 rm -rf "$work"
 if [ "$offsite" = true ]; then rm -rf "$external/.$name.partial"; fi
 if [ "$complete" != true ]; then printf '{"ok":false,"attempted_at":"%s"}\n' "$stamp" > "$root/status.json.partial"; chmod 644 "$root/status.json.partial"; mv "$root/status.json.partial" "$root/status.json"; fi

}
trap cleanup EXIT
trap 'exit 1' INT TERM
mkdir "$work"
pg_dump --format=custom --no-owner --no-acl --file="$work/archive.dump"
verify createdb "$scratch"
verify pg_restore --exit-on-error --no-owner --no-acl --dbname="$scratch" "$work/archive.dump"
PGDATABASE="$scratch" verify psql -v ON_ERROR_STOP=1 -c 'SELECT count(*) FROM reservation; SELECT count(*) FROM payment; SELECT count(*) FROM "user"; SELECT count(*) FROM hotel_settings;' >/dev/null
# El manifiesto describe el contenido que realmente se restauró del dump consistente.
PGDATABASE="$scratch" verify psql -X -v ON_ERROR_STOP=1 -At -c "SELECT format('SELECT %L AS relation, count(*) AS rows FROM %I.%I;', schemaname||'.'||tablename, schemaname, tablename) FROM pg_tables WHERE schemaname NOT IN ('pg_catalog','information_schema') ORDER BY schemaname,tablename" > "$work/counts.sql"
PGDATABASE="$scratch" verify psql -X -v ON_ERROR_STOP=1 -At -f "$work/counts.sql" > "$work/tables.txt"
rm "$work/counts.sql"
(cd "$work" && sha256sum archive.dump tables.txt > SHA256SUMS && sha256sum -c SHA256SUMS)
printf '{"verified_at":"%s","archive":"%s/archive.dump","restored":true}\n' "$stamp" "$name" > "$work/manifest.json"
(cd "$work" && sha256sum manifest.json >> SHA256SUMS)
mv "$work" "$root/$name"
if [ "${BACKUP_OFFSITE_ENABLED:-false}" = true ]; then
 [ -d "$external" ] && [ ! "$root" -ef "$external" ] && [ "$(cd "$root" && pwd -P)" != "$(cd "$external" && pwd -P)" ] || { echo 'Configura un destino externo distinto y disponible' >&2; exit 1; }
 offsite=true
 mkdir "$external/.$name.partial"
 cp "$root/$name/"* "$external/.$name.partial/"
 (cd "$external/.$name.partial" && sha256sum -c SHA256SUMS)
 mv "$external/.$name.partial" "$external/$name"
fi
printf '{"verified_at":"%s","archive":"%s/archive.dump","restored":true,"offsite_verified":%s}\n' "$stamp" "$name" "$offsite" > "$root/latest.json.partial"
chmod 644 "$root/latest.json.partial"
mv "$root/latest.json.partial" "$root/latest.json"
printf '{"ok":true,"attempted_at":"%s"}\n' "$stamp" > "$root/status.json.partial"
chmod 644 "$root/status.json.partial"
mv "$root/status.json.partial" "$root/status.json"
complete=true
# Solo elimina conjuntos propios completos y verificados. Un fallo anterior no purga nada.
prune() {
 find "$1" -maxdepth 1 -type d -name 'hotel-*' -mtime +"$retention" | while IFS= read -r candidate; do
  base=$(basename "$candidate")
  printf '%s\n' "$base" | LC_ALL=C grep -Eq '^hotel-[0-9]{8}T[0-9]{6}Z-[0-9]+$' || continue
  [ "$base" != "$name" ] || continue
  if (cd "$candidate" && sha256sum -c SHA256SUMS >/dev/null 2>&1) && [ -f "$candidate/manifest.json" ]; then rm -rf "$candidate"; fi
 done
}
prune "$root"
if [ "$offsite" = true ]; then prune "$external"; fi
echo "Respaldo restaurado y verificado: $name; copia externa: $offsite"
