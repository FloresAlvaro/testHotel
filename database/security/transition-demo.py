"""Transición de la demo existente. Por defecto solo planifica; --execute aplica.

No ejecuta seed, no elimina volúmenes, no imprime configuración ni credenciales.
Requiere las imágenes finales ya construidas/probadas y .env preparado.
"""
import datetime
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import time
from urllib.parse import quote

root = Path(__file__).resolve().parents[2]
compose = ['docker', 'compose', '-p', 'hotel-demo', '-f', str(root/'docker-compose.yml'), '-f', str(root/'docker-compose.demo.yml')]
execute = sys.argv[1:] == ['--execute']
if sys.argv[1:] and not execute:
    raise SystemExit('Uso: python3 database/security/transition-demo.py [--execute]')

def command(args, *, environment=None, source=None):
    result = subprocess.run(args, input=source, text=True, capture_output=True, cwd=root, env=environment)
    if result.returncode:
        # No mostrar configuración, URL, stderr del driver o respuestas sensibles.
        raise RuntimeError('Falló una operación de transición; conserva los contenedores/volúmenes y revisa su estado con acceso administrativo. No se hizo reversión automática.')
    return result.stdout

def inspect(identity):
    return json.loads(command(['docker', 'inspect', identity]))[0]

def service(name):
    identity = command([*compose,'ps','-aq',name]).strip()
    if not identity or '\n' in identity:
        raise RuntimeError('Debe existir exactamente un contenedor de '+name)
    return inspect(identity)

def volume(info, destination):
    matches=[item for item in info['Mounts'] if item['Destination']==destination and item['Type']=='volume']
    if len(matches)!=1: raise RuntimeError('No se pudo identificar el volumen de '+destination)
    return matches[0]['Name']

def preserve_image(info, tag):
    available=subprocess.run(['docker','image','inspect',info['Image']],capture_output=True)
    if available.returncode==0:
        command(['docker','tag',info['Image'],tag])
        return {'method':'tag','original_image':info['Image']}
    # Después de ciertos reinicios de Docker puede quedar el snapshot del
    # contenedor sin el registro de su imagen. Exportar/importar preserva ese
    # rootfs sin copiar Config.Env (que contiene credenciales del servicio).
    # No usar docker commit ni escribir un tar al host.
    config=info.get('Config') or {}
    workdir=config.get('WorkingDir') or '/'
    user=config.get('User') or 'root'
    if not workdir.startswith('/') or any(char in workdir for char in '\r\n\x00') or not re.fullmatch(r'[a-zA-Z0-9_.:-]+',user):
        raise RuntimeError('Metadatos de recuperación inesperados; no detener servicios')
    safe_path='PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin'
    changes=['--change','WORKDIR '+workdir,'--change','USER '+user,'--change','ENV '+safe_path]
    for name in ['Entrypoint','Cmd']:
        value=config.get(name)
        if value is not None:
            if not isinstance(value,list) or not all(isinstance(item,str) and '\x00' not in item for item in value):
                raise RuntimeError('Comando de recuperación inesperado; no detener servicios')
            changes.extend(['--change',('ENTRYPOINT' if name=='Entrypoint' else 'CMD')+' '+json.dumps(value)])
    exporter=subprocess.Popen(['docker','export',info['Id']],stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    try:
        importer=subprocess.Popen(['docker','import',*changes,'-',tag],stdin=exporter.stdout,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    except BaseException:
        exporter.kill();exporter.communicate();raise
    exporter.stdout.close()
    importer.communicate()
    exporter.communicate()
    if importer.returncode or exporter.returncode:
        raise RuntimeError('No se pudo preservar el snapshot de recuperación; servicios todavía intactos. Detalle sensible omitido')
    imported=json.loads(command(['docker','image','inspect',tag]))[0]
    if imported['Config'].get('Env')!=[safe_path]:
        raise RuntimeError('La imagen de recuperación no tiene el entorno mínimo esperado; no detener servicios')
    return {'method':'export-import','original_image':info['Image'],'snapshot_image':imported['Id'],'environment':'safe_PATH_only'}

config=json.loads(command([*compose,'--profile','tools','config','--format','json']))
# Rechazar montajes mal interpretados por YAML antes de detener escritores.
for name in ['backend','frontend','migrate']:
    for mount in config['services'][name].get('tmpfs',[]):
        if not isinstance(mount,str) or not mount.split(':',1)[0].startswith('/'):
            raise SystemExit('Montaje tmpfs no válido para '+name+'; servicios intactos')
db=service('db');api=service('backend');ui=service('frontend');backups=service('backups')
db_volume=volume(db,'/var/lib/postgresql/data');backup_volume=volume(backups,'/backups')
network=next((name for name in db['NetworkSettings']['Networks'] if name.startswith('hotel-demo_')),None)
if not network: raise SystemExit('No se encontró la red aislada del proyecto hotel-demo')
settings=config['services']['db']['environment']
for key in ['POSTGRES_RUNTIME_PASSWORD','POSTGRES_MIGRATOR_PASSWORD','POSTGRES_BACKUP_PASSWORD','POSTGRES_VERIFY_PASSWORD']:
    if not settings.get(key): raise SystemExit('Falta configuración de roles preparada')
if not config['services']['backend']['environment'].get('MFA_ENCRYPTION_KEY'): raise SystemExit('Falta clave MFA preparada')
# Las etiquetas finales son las construidas y probadas; las imágenes en ejecución
# pueden conservar un ID anterior aunque la etiqueta ya se haya reemplazado.
final_api=command(['docker','image','inspect','hotel-demo-backend','--format','{{.Id}}']).strip()
final_ui=command(['docker','image','inspect','hotel-demo-frontend','--format','{{.Id}}']).strip()
steps=[
 '1. Guardar etiquetas rollback de los ID actualmente en ejecución (DB/API/UI).',
 '2. Detener backend y backups; generar respaldo final restaurado/verificado con administrador en contenedor efímero.',
 '3. Recrear solo DB con la misma identidad de volumen y nuevas variables/montajes, sin seed ni borrado.',
 '4. Ejecutar runner histórico como administrador desde imagen final efímera, stdin y URL solo en entorno.',
 '5. Aplicar provision.sh; verificar rol runtime y registro de migraciones sin mostrar secretos.',
 '6. Iniciar imágenes finales API/UI/backups y generar respaldo con lector/verificador separados.',
]
for line in steps: print(line,flush=True)
if not execute:
    print('PLAN ÚNICAMENTE: no se modificaron imágenes, contenedores, roles ni datos. Añadir --execute solo al autorizar la transición final.')
    raise SystemExit(0)

stamp=datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
checkpoint={'at':stamp,'db_volume':db_volume,'backup_volume':backup_volume,'images':{},'rollback_sources':{},'final_images':{'backend':final_api,'frontend':final_ui},'stage':'prepared'}
fd,checkpoint_path=tempfile.mkstemp(prefix='hotel-security-transition-'+stamp+'-',suffix='.json')
def save(stage):
    checkpoint['stage']=stage
    Path(checkpoint_path).write_text(json.dumps(checkpoint,indent=2)+'\n')
    os.chmod(checkpoint_path,0o600)
os.close(fd)
for label,info in [('db',db),('backend',api),('frontend',ui)]:
    tag='hotel-rollback/'+label+':'+stamp
    checkpoint['rollback_sources'][label]=preserve_image(info,tag)
    checkpoint['images'][label]=tag
    save('rollback_image_'+label+'_saved')
save('rollback_images_saved')
print('Checkpoint sin secretos: '+checkpoint_path,flush=True)
command([*compose,'stop','backend','backups']);save('writers_stopped')
admin={
 'POSTGRES_DB':settings['POSTGRES_DB'],'POSTGRES_USER':settings['POSTGRES_USER'],
 'POSTGRES_PASSWORD':settings['POSTGRES_PASSWORD'],'PGHOST':'db',
 'BACKUP_RETENTION_DAYS':str(config['services']['backups']['environment'].get('BACKUP_RETENTION_DAYS',14)),
}
backup_image=config['services']['backups']['image']
command(['docker','run','--rm','--network',network,*[part for name in admin for part in ['-e',name]],'-v',str(root/'database/backup')+':/scripts:ro','-v',backup_volume+':/backups','--entrypoint','sh',backup_image,'/scripts/backup.sh'],environment={**os.environ,**admin})
latest=json.loads(command(['docker','run','--rm','-v',backup_volume+':/backups:ro','--entrypoint','cat',backup_image,'/backups/latest.json']))
if not latest.get('restored'): raise RuntimeError('El respaldo final no confirmó restauración')
checkpoint['pre_transition_backup']=latest['archive'];save('final_backup_restored')
command([*compose,'up','-d','--no-deps','--force-recreate','db'])
newdb=service('db')
if volume(newdb,'/var/lib/postgresql/data')!=db_volume: raise RuntimeError('El volumen PostgreSQL cambió; abortar y conservar ambos volúmenes')
for _ in range(90):
    result=subprocess.run(['docker','exec',newdb['Id'],'pg_isready','-h','127.0.0.1','-U',settings['POSTGRES_USER'],'-d',settings['POSTGRES_DB']],capture_output=True)
    if result.returncode==0:break
    time.sleep(.5)
else:raise RuntimeError('PostgreSQL recreado no está listo; no iniciar API')
save('db_recreated_volume_preserved')
admin_url='postgresql://'+quote(settings['POSTGRES_USER'],safe='')+':'+quote(settings['POSTGRES_PASSWORD'],safe='')+'@db:5432/'+quote(settings['POSTGRES_DB'],safe='')
# Importar el módulo puro evita SET ROLE antes de existir hotel_owner. El runner
# valida todos los checksums ya registrados antes de ejecutar solo lo pendiente.
source='''const {Pool}=require('pg');const migrate=require('./src/database/migrations');
(async()=>{const pool=new Pool({connectionString:process.env.DATABASE_URL});try{await migrate(pool,'/app/migrations');console.log('Historial validado y migraciones pendientes confirmadas');}finally{await pool.end();}})().catch(()=>{console.error('Migración administrativa fallida; detalle sensible omitido');process.exitCode=1});'''
command(['docker','run','--rm','-i','--network',network,'--read-only','--tmpfs','/tmp:size=32m,mode=1777','--cap-drop','ALL','--security-opt','no-new-privileges:true','-e','DATABASE_URL','-v',str(root/'database/migrations')+':/app/migrations:ro',final_api,'node'],source=source,environment={**os.environ,'DATABASE_URL':admin_url})
save('migrations_applied_admin_ephemeral')
command(['docker','exec',newdb['Id'],'sh','/security/provision.sh']);save('roles_provisioned')
# Comprobación de atributos públicos; no consulta/expone contraseñas.
role_check=command(['docker','exec',newdb['Id'],'psql','-X','-qAt','-U',settings['POSTGRES_USER'],'-d',settings['POSTGRES_DB'],'-c',"SELECT NOT(rolsuper OR rolcreatedb OR rolcreaterole OR rolbypassrls) FROM pg_roles WHERE rolname='hotel_runtime'"])
if role_check.strip()!='t':raise RuntimeError('El rol runtime no superó la comprobación de permisos')
command([*compose,'up','-d','--no-build','backend','frontend','backups']);save('final_images_started')
if service('backend')['Image']!=final_api or service('frontend')['Image']!=final_ui:
    raise RuntimeError('Las etiquetas de imágenes cambiaron durante la transición; verificar los ID contra el checkpoint antes de continuar')
newbackup=service('backups')
# El loop puede estar generando su primer respaldo; adquirir lock espera reintentos
# acotados, sin omitir un error de permisos persistente.
for _ in range(12):
    result=subprocess.run(['docker','exec',newbackup['Id'],'sh','/scripts/backup.sh'],capture_output=True)
    if result.returncode==0:break
    time.sleep(5)
else:raise RuntimeError('El respaldo con identidades separadas no se verificó; conservar el respaldo administrativo previo')
latest=json.loads(command(['docker','exec',newbackup['Id'],'cat','/backups/latest.json']))
if not latest.get('restored'):raise RuntimeError('El nuevo respaldo no confirmó restauración')
checkpoint['post_transition_backup']=latest['archive'];save('post_transition_backup_restored')
print('Transición completada; faltan smoke operativo de salud/login/SSR/puertos/uid y revisión del checkpoint. No se cargó seed ni se eliminó ningún volumen.',flush=True)
