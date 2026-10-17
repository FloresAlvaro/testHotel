"""Prueba destructiva SOLO en un contenedor temporal propio, sin puertos ni volúmenes."""
import json
from pathlib import Path
import subprocess
import time
import uuid

root = Path(__file__).resolve().parents[2]
container = 'hotel-backup-test-' + uuid.uuid4().hex[:10]
credentials = ['-e', 'PGHOST=127.0.0.1', '-e', 'POSTGRES_USER=hotel_test', '-e',
               'POSTGRES_DB=hotel_test', '-e', 'POSTGRES_PASSWORD=isolated-backup-test',
               '-e', 'BACKUP_OFFSITE_ENABLED=true', '-e', 'BACKUP_RETENTION_DAYS=1']

def run(args, *, source=None, ok=True):
    result = subprocess.run(args, input=source, text=True, capture_output=True)
    if ok and result.returncode:
        raise RuntimeError(result.stdout + result.stderr)
    return result

def execute(*args, source=None, ok=True, extra=()):
    return run(['docker', 'exec', '-i', *credentials, *extra, container, *args], source=source, ok=ok)

try:
    run(['docker', 'run', '-d', '--name', container, '--network', 'none',
         '-e', 'POSTGRES_USER=hotel_test', '-e', 'POSTGRES_DB=hotel_test',
         '-e', 'POSTGRES_PASSWORD=isolated-backup-test', 'postgres:16-alpine'])
    for _ in range(60):
        if execute('pg_isready', '-U', 'hotel_test', '-d', 'hotel_test', ok=False).returncode == 0:
            break
        time.sleep(0.5)
    else:
        raise RuntimeError('PostgreSQL temporal no inició')
    for sql in [root/'database/init/01-schema.sql', *sorted((root/'database/migrations').glob('*.sql')), root/'database/init/data_seed.sql']:
        execute('psql', '-U', 'hotel_test', '-d', 'hotel_test', '-v', 'ON_ERROR_STOP=1', source=sql.read_text())
    run(['docker', 'cp', str(root/'database/backup'), container+':/scripts'])
    execute('mkdir', '-p', '/backups', '/offsite', '/backups/hotel-no-borrar')
    execute('sh', '/scripts/backup.sh')
    latest = json.loads(execute('cat', '/backups/latest.json').stdout)
    assert latest['restored'] and latest['offsite_verified']
    archive = '/offsite/' + latest['archive']
    execute('sh', '/scripts/restore.sh', archive, 'hotel_restore_proof')
    # Compara los conteos de TODAS las tablas contra el contenido del respaldo.
    manifest = execute('cat', str(Path(archive).parent/'tables.txt')).stdout.strip().splitlines()
    for record in manifest:
        relation, count = record.split('|')
        schema, table = relation.split('.')
        actual = execute('psql', '-U', 'hotel_test', '-d', 'hotel_restore_proof', '-At', '-c',
                         f'SELECT count(*) FROM "{schema}"."{table}"').stdout.strip()
        assert actual == count, relation
    old = 'hotel-20000101T000000Z-99'
    current = latest['archive'].split('/')[0]
    execute('cp', '-r', '/backups/'+current, '/backups/'+old)
    execute('cp', '-r', '/offsite/'+current, '/offsite/'+old)
    execute('touch', '-t', '200001010000', '/backups/'+old, '/offsite/'+old, '/backups/hotel-no-borrar')
    # Un destino inexistente no altera latest ni elimina copias anteriores.
    failed = execute('sh', '/scripts/backup.sh', ok=False,
                     extra=['-e', 'BACKUP_OFFSITE_DIRECTORY=/unavailable'])
    assert failed.returncode != 0
    assert json.loads(execute('cat', '/backups/latest.json').stdout) == latest
    assert json.loads(execute('cat', '/backups/status.json').stdout)['ok'] is False
    execute('test', '-d', '/backups/hotel-no-borrar')
    execute('test', '-d', '/backups/'+old)
    execute('test', '-d', '/offsite/'+old)
    execute('sh', '/scripts/backup.sh')
    execute('test', '!', '-d', '/backups/'+old)
    execute('test', '!', '-d', '/offsite/'+old)
    execute('test', '-d', '/backups/hotel-no-borrar')
    # Alterar la copia externa impide restaurarla.
    execute('sh', '-c', 'printf corrupt >> "$1"', 'sh', archive)
    assert execute('sh', '/scripts/restore.sh', archive, 'hotel_restore_corrupt', ok=False).returncode != 0
    # No acepta como destino externo el mismo directorio local.
    assert execute('sh', '/scripts/backup.sh', ok=False,
                   extra=['-e', 'BACKUP_OFFSITE_DIRECTORY=/backups']).returncode != 0
    print('OK: respaldo, restauración de todas las tablas, copia externa, fallo externo, integridad y retención segura')
finally:
    run(['docker', 'rm', '-f', '-v', container], ok=False)
