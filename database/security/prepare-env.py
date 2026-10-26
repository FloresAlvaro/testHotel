"""Añade secretos de roles separados sin mostrar ni reemplazar los demás ajustes."""
import os
from pathlib import Path
import re
import secrets
import sys
import tempfile

path = Path(sys.argv[1] if len(sys.argv) > 1 else '.env').resolve()
if not path.is_file():
    raise SystemExit('Primero prepara el archivo .env administrativo existente.')
source = path.read_text()
names = ['POSTGRES_RUNTIME_PASSWORD', 'POSTGRES_MIGRATOR_PASSWORD', 'POSTGRES_BACKUP_PASSWORD', 'POSTGRES_VERIFY_PASSWORD', 'MFA_ENCRYPTION_KEY']
changed = 0
for name in names:
    pattern = re.compile(rf'^{name}=(.*)$', re.MULTILINE)
    matches = list(pattern.finditer(source))
    if len(matches) > 1:
        raise SystemExit(f'Hay definiciones duplicadas de {name}; resuélvelas antes de continuar.')
    if matches and matches[0].group(1).strip() and not matches[0].group(1).startswith('replace-with-'):
        continue
    line = name + '=' + secrets.token_hex(32)
    source = pattern.sub(line, source) if matches else source.rstrip() + '\n' + line + '\n'
    changed += 1
descriptor, temporary = tempfile.mkstemp(prefix='.hotel-env-', dir=path.parent)
try:
    with os.fdopen(descriptor, 'w') as output:
        output.write(source)
    os.chmod(temporary, 0o600)
    os.replace(temporary, path)
finally:
    if os.path.exists(temporary):
        os.unlink(temporary)
print(f'Configuración conservada; {changed} secretos independientes preparados; archivo con permisos 0600. Valores no mostrados.')
