"""Prueba permisos y backup en PostgreSQL desechable sin red externa.

Opt-in: SECURITY_RESTORE_VOLUME/ARCHIVE monta únicamente un respaldo de lectura;
su contenido se restaura a la base temporal, nunca a PostgreSQL de producción.
"""
import os
from pathlib import Path, PurePosixPath
import re
import secrets
import subprocess
import sys
import time
import uuid

root = Path(__file__).resolve().parents[2]
container = 'hotel-roles-test-' + uuid.uuid4().hex[:10]
image_containers = []
restore_volume=os.environ.get('SECURITY_RESTORE_VOLUME')
restore_archive=os.environ.get('SECURITY_RESTORE_ARCHIVE')
if bool(restore_volume)!=bool(restore_archive):
    raise SystemExit('Configura SECURITY_RESTORE_VOLUME y SECURITY_RESTORE_ARCHIVE juntos')
if restore_volume:
    if not re.fullmatch(r'[a-zA-Z0-9][a-zA-Z0-9_.-]*',restore_volume):
        raise SystemExit('Nombre de volumen de respaldo no válido')
    archive=PurePosixPath(restore_archive)
    if len(archive.parts)!=2 or archive.parts[1]!='archive.dump' or not re.fullmatch(r'hotel-\d{8}T\d{6}Z-\d+',archive.parts[0]):
        raise SystemExit('El respaldo debe ser hotel-fecha-id/archive.dump, relativo al volumen')
credentials = {
    'POSTGRES_USER': 'hotel_fixture', 'POSTGRES_DB': 'hotel_security_test',
    'POSTGRES_PASSWORD': secrets.token_hex(24),
    **{name: secrets.token_hex(24) for name in ['POSTGRES_RUNTIME_PASSWORD', 'POSTGRES_MIGRATOR_PASSWORD', 'POSTGRES_BACKUP_PASSWORD', 'POSTGRES_VERIFY_PASSWORD']},
}

def run(args, source=None, ok=True, environment=None):
    result = subprocess.run(args, input=source, text=True, capture_output=True, env=environment)
    if ok and result.returncode:
        if restore_volume:
            raise RuntimeError('Falló el ensayo aislado de la copia restaurada; diagnóstico con datos potencialmente sensibles omitido')
        # SQL de prueba nunca contiene credenciales; no mostramos argumentos/env.
        raise RuntimeError(result.stdout + result.stderr)
    return result

def execute(*args, source=None, ok=True, variables=None):
    env = {**os.environ, **credentials, **(variables or {})}
    options = [part for name in [*credentials, *(variables or {})] for part in ['-e', name]]
    return run(['docker', 'exec', '-i', *options, container, *args], source, ok, env)

def sql(source, user='hotel_fixture', ok=True):
    password = credentials['POSTGRES_RUNTIME_PASSWORD'] if user == 'hotel_runtime' else credentials['POSTGRES_PASSWORD']
    return execute('psql', '-X', '-qAt', '-h', '127.0.0.1', '-U', user, '-d', 'hotel_security_test', '-v', 'ON_ERROR_STOP=1', source=source, ok=ok, variables={'PGPASSWORD': password})

try:
    mounts=[]
    if restore_volume:
        # Inspeccionar primero evita crear por error un volumen con nombre nuevo.
        run(['docker','volume','inspect',restore_volume])
        mounts=['--mount','type=volume,source='+restore_volume+',target=/restore-input,readonly']
    run(['docker', 'run', '-d', '--name', container, '--network', 'none',
         *mounts,*[part for name in credentials for part in ['-e', name]], 'postgres:16-alpine@sha256:f4610795587492cd4fb887c2dc3de301b813278bb6f616992061141b5f15ac36'], environment={**os.environ, **credentials})
    for _ in range(60):
        if execute('pg_isready', '-h', '127.0.0.1', '-U', 'hotel_fixture', '-d', 'hotel_security_test', ok=False).returncode == 0:
            break
        time.sleep(.5)
    else:
        raise RuntimeError('PostgreSQL temporal no inició')
    if restore_volume:
        restored_path='/restore-input/'+restore_archive
        execute('sh','-c','cd "$1" && sha256sum -c SHA256SUMS','sh',str(PurePosixPath(restored_path).parent))
        execute('pg_restore','--exit-on-error','--no-owner','--no-acl','-U','hotel_fixture','-d','hotel_security_test',restored_path)
        if sql('SELECT count(*) FROM public.user_mfa').stdout.strip()!='0':
            raise RuntimeError('La copia contiene factores MFA existentes; usar fixtures independientes sin importar una clave operativa')
        print('OK: respaldo de lectura con integridad verificada restaurado a PostgreSQL temporal, sin esquema/seed previo ni clave MFA operativa',flush=True)
    else:
        for source in [root/'database/init/01-schema.sql', *sorted((root/'database/migrations').glob('*.sql')), root/'database/init/data_seed.sql']:
            sql(source.read_text())
    run(['docker', 'cp', str(root/'database/security'), container+':/security'])
    for _ in range(2):
        execute('sh', '/security/provision.sh')
    assert sql("SELECT NOT (rolsuper OR rolcreatedb OR rolcreaterole OR rolbypassrls) FROM pg_roles WHERE rolname=current_user", 'hotel_runtime').stdout.strip() == 't'
    # CRUD funcional y triggers: reserva => email/auditoría; cobro => movimiento/recibo.
    result = sql('''BEGIN;
    INSERT INTO client(name,document) VALUES('Prueba de permisos','security-test') RETURNING id \gset c_
    INSERT INTO room_type(name,price,capacity) VALUES('Permisos',100,2) RETURNING id \gset t_
    INSERT INTO room(number,room_type_id,floor) VALUES('SEC',:t_id,1) RETURNING id \gset r_
    INSERT INTO "user"(name,email,password,role) VALUES('Fixture','permission@example.invalid','not-a-real-password','admin') RETURNING id \gset u_
    INSERT INTO reservation(client_id,room_id,user_id,check_in,check_out,total_price) VALUES(:c_id,:r_id,:u_id,'2040-01-01','2040-01-03',200) RETURNING id \gset b_
    INSERT INTO payment(reservation_id,amount,type,method,status) VALUES(:b_id,50,'partial','credit_card','completed') RETURNING id \gset p_
    SELECT count(*) FROM payment_receipt WHERE payment_id=:p_id;
    SELECT count(*) FROM cash_movement WHERE payment_id=:p_id;
    INSERT INTO web_session(token_hash,user_id,auth_version,csrf_token,expires_at) VALUES(repeat('a',64),:u_id,0,repeat('b',64),now()+interval '1 hour');
    DELETE FROM web_session WHERE user_id=:u_id;
    SELECT count(*)>0 FROM audit_log WHERE table_name='reservation' AND record_id=:b_id;
    COMMIT;''', 'hotel_runtime')
    assert result.stdout.strip().splitlines() == ['1', '1', 't'], result.stdout
    forbidden = [
        'CREATE ROLE security_elevated', 'CREATE DATABASE security_elevated',
        'CREATE TABLE public.security_elevated(id int)', 'CREATE SCHEMA security_elevated',
        'CREATE TEMP TABLE security_elevated(id int)', 'SET ROLE hotel_owner',
        "UPDATE audit_log SET action='DELETE'", 'DELETE FROM audit_log',
        "INSERT INTO audit_log(action,table_name) VALUES('INSERT','fake')",
        'ALTER TABLE client ADD COLUMN injected text', 'TRUNCATE payment',
        'DELETE FROM cash_movement', 'UPDATE payment_receipt SET number=number',
        'ALTER FUNCTION public.hotel_audit_change() SECURITY INVOKER',
    ]
    for statement in forbidden:
        assert sql(statement, 'hotel_runtime', ok=False).returncode != 0, statement
    # Credenciales de migración: DDL bajo el owner, sin privilegios globales.
    execute('psql', '-X', '-q', '-h', '127.0.0.1', '-U', 'hotel_migrator', '-d', 'hotel_security_test', '-v', 'ON_ERROR_STOP=1', source='CREATE TABLE security_future(id int); DROP TABLE security_future;', variables={'PGPASSWORD': credentials['POSTGRES_MIGRATOR_PASSWORD'], 'PGOPTIONS': '-c role=hotel_owner'})
    # El verificador puede crear bases propias, pero no conectar a la operativa.
    assert execute('psql', '-h', '127.0.0.1', '-U', 'hotel_backup_verify', '-d', 'hotel_security_test', '-c', 'SELECT 1', ok=False, variables={'PGPASSWORD': credentials['POSTGRES_VERIFY_PASSWORD']}).returncode != 0
    assert execute('psql', '-h', '127.0.0.1', '-U', 'hotel_backup', '-d', 'hotel_security_test', '-c', 'CREATE DATABASE forbidden', ok=False, variables={'PGPASSWORD': credentials['POSTGRES_BACKUP_PASSWORD']}).returncode != 0
    run(['docker', 'cp', str(root/'database/backup'), container+':/scripts'])
    execute('mkdir', '-p', '/backups')
    execute('sh', '/scripts/backup.sh', variables={'PGHOST': '127.0.0.1', 'POSTGRES_USER': 'hotel_backup', 'POSTGRES_PASSWORD': credentials['POSTGRES_BACKUP_PASSWORD'], 'VERIFY_PGUSER': 'hotel_backup_verify', 'VERIFY_PGPASSWORD': credentials['POSTGRES_VERIFY_PASSWORD']})
    print('OK: política idempotente, runtime restringido, CRUD/triggers/sesiones, DDL migrador, backup lector y restauración verificada con identidad separada')
    if '--images' in sys.argv:
        # Imágenes locales ya construidas: sin exponer puertos ni usar la demo.
        # Comparten únicamente loopback de la DB desechable (network=none).
        migration_values = {'MIGRATION_DATABASE_URL': 'postgresql://hotel_migrator:'+credentials['POSTGRES_MIGRATOR_PASSWORD']+'@127.0.0.1:5432/hotel_security_test'}
        run(['docker','run','--rm','--network','container:'+container,'--read-only','--tmpfs','/tmp:size=32m,mode=1777','--cap-drop','ALL','--security-opt','no-new-privileges:true',
             '-e','MIGRATION_DATABASE_URL','-v',str(root/'database/migrations')+':/app/migrations:ro',os.environ.get('SECURITY_BACKEND_IMAGE','hotel-demo-backend'),'node','scripts/migrate.js'],environment={**os.environ,**migration_values})
        execute('sh', '/security/provision.sh')
        for label, image, values in [
            ('api', os.environ.get('SECURITY_BACKEND_IMAGE', 'hotel-demo-backend'), {
                'NODE_ENV': 'production', 'PORT': '3300', 'DATABASE_URL': 'postgresql://hotel_runtime:'+credentials['POSTGRES_RUNTIME_PASSWORD']+'@127.0.0.1:5432/hotel_security_test',
                'JWT_SECRET': secrets.token_hex(32), 'APP_URL': 'http://localhost:3311', 'CORS_ORIGIN': 'http://localhost:3311', 'CORS_CREDENTIALS': 'true',
                'MFA_ENABLED': 'true', 'MFA_ENCRYPTION_KEY': secrets.token_hex(32), 'SECURITY_RETENTION_ENABLED': 'true', 'SECURITY_SESSION_RETENTION_DAYS': '7', 'SECURITY_LINK_RETENTION_HOURS': '24',
                'SECURITY_TEST_PASSWORD': secrets.token_hex(12),
            }),
            ('ui', os.environ.get('SECURITY_FRONTEND_IMAGE', 'hotel-demo-frontend'), {
                'NODE_ENV': 'production', 'NITRO_HOST': '127.0.0.1', 'NITRO_PORT': '3311',
                'NUXT_API_INTERNAL_BASE': 'http://127.0.0.1:3300/api', 'NUXT_PUBLIC_API_BASE': 'http://localhost:3300/api',
            }),
        ]:
            name = container+'-'+label
            options = [part for key in values for part in ['-e', key]]
            run(['docker','run','-d','--name',name,'--network','container:'+container,'--read-only','--tmpfs','/tmp:size=64m,mode=1777','--cap-drop','ALL','--security-opt','no-new-privileges:true','--pids-limit','128','--memory','768m','--cpus','1',*options,image],environment={**os.environ,**values})
            image_containers.append(name)
            assert run(['docker','exec',name,'id','-u']).stdout.strip() != '0'
            assert run(['docker','exec',name,'sh','-c','touch /app/security-write-denied'],ok=False).returncode != 0
        smoke = r'''
        const assert=require('node:assert/strict');
        const {Pool}=require('pg');const bcrypt=require('bcryptjs');const OTP=require('otpauth');
        let step='startup';
        (async()=>{
         for(const url of ['http://127.0.0.1:3300/health','http://127.0.0.1:3311/auth/login']){
          let ready=false;for(let i=0;i<80;i++){try{if((await fetch(url)).status===200){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,250));}assert(ready,'Servicio aislado no listo');
         }
         step='frontend-headers';const loginPage=await fetch('http://127.0.0.1:3311/auth/login');
         assert.equal(loginPage.headers.get('x-frame-options'),'DENY');
         assert(loginPage.headers.get('content-security-policy')?.includes("frame-ancestors 'none'"));
         assert.equal(loginPage.headers.get('x-content-type-options'),'nosniff');
         assert((await loginPage.text()).includes('Iniciar'));
         step='runtime-database';const pool=new Pool({connectionString:process.env.DATABASE_URL});
         const identity=(await pool.query('SELECT rolsuper,rolcreatedb,rolcreaterole FROM pg_roles WHERE rolname=current_user')).rows[0];
         assert.deepEqual(identity,{rolsuper:false,rolcreatedb:false,rolcreaterole:false});
         const email='image-smoke@example.invalid';
         await pool.query('INSERT INTO "user"(name,email,password,role) VALUES($1,$2,$3,$4)',['Image Smoke',email,await bcrypt.hash(process.env.SECURITY_TEST_PASSWORD,10),'admin']);
         const headers={'content-type':'application/json','origin':'http://localhost:3311','x-hotel-request':'1'};
         async function post(path,body){const res=await fetch('http://127.0.0.1:3300/api/users'+path,{method:'POST',headers,body:JSON.stringify(body)});assert.equal(res.status,200,'Fallo HTTP '+path);return {res,data:(await res.json()).data};}
         step='password-only-login';const initial=await post('/session',{email,password:process.env.SECURITY_TEST_PASSWORD});
         headers.cookie=initial.res.headers.get('set-cookie').split(';')[0];headers['x-hotel-csrf']=initial.data.csrfToken;
         step='mfa-challenge';const challenge=(await post('/mfa/enable',{password:process.env.SECURITY_TEST_PASSWORD})).data;
         assert(challenge.mfaRequired&&challenge.enrollmentRequired);assert(!challenge.token);
         step='mfa-enrollment';const enrollment=(await post('/mfa/enroll',{challengeId:challenge.challengeId})).data;
         assert.equal(enrollment.recoveryCodes.length,10);
         const code=new OTP.TOTP({issuer:'Hotel',label:email,algorithm:'SHA1',digits:6,period:30,secret:OTP.Secret.fromBase32(enrollment.secret)}).generate();
         step='mfa-confirm';const complete=await post('/mfa/confirm',{challengeId:challenge.challengeId,code,recoveryCodesSaved:true});
         const cookie=complete.res.headers.get('set-cookie')?.split(';')[0];assert(cookie);
         step='session-profile';const profile=await fetch('http://127.0.0.1:3300/api/users/session',{headers:{cookie}});assert.equal(profile.status,200);
         const status=await fetch('http://127.0.0.1:3300/api/users/mfa/status',{headers:{cookie}});assert.equal(status.status,200);assert((await status.json()).data.enabled);
         step='authenticated-ssr';const page=await fetch('http://127.0.0.1:3311/admin/settings?tab=security',{headers:{cookie},redirect:'manual'});
         assert.equal(page.status,200,'SSR autenticado');assert(page.headers.get('cache-control')?.includes('no-store'));
         // Recuperación y renovación fuerzan DELETE user_mfa + cascada de códigos.
         headers.cookie=cookie;headers['x-hotel-csrf']=complete.data.csrfToken;
         step='mfa-recovery-renew';const renewal=(await post('/mfa/renew',{password:process.env.SECURITY_TEST_PASSWORD,code:enrollment.recoveryCodes[0]})).data;
         step='mfa-replacement-enrollment';const replacement=(await post('/mfa/enroll',{challengeId:renewal.challengeId})).data;
         const nextCode=new OTP.TOTP({issuer:'Hotel',label:email,algorithm:'SHA1',digits:6,period:30,secret:OTP.Secret.fromBase32(replacement.secret)}).generate();
         step='mfa-replacement-confirm';const updated=await post('/mfa/confirm',{challengeId:renewal.challengeId,code:nextCode,recoveryCodesSaved:true});
         const old=await fetch('http://127.0.0.1:3300/api/users/session',{headers:{cookie}});assert.equal(old.status,401);
         headers.cookie=updated.res.headers.get('set-cookie').split(';')[0];headers['x-hotel-csrf']=updated.data.csrfToken;
         step='mfa-disable';await post('/mfa/disable',{password:process.env.SECURITY_TEST_PASSWORD,code:replacement.recoveryCodes[0]});
         step='password-only-after-disable';await post('/session',{email,password:process.env.SECURITY_TEST_PASSWORD});
         await pool.end();console.log('OK: imágenes no root/read-only, API production con runtime restringido, frontend SSR/cabeceras, MFA inscripción/recuperación/renovación y revocación');
        })().catch(error=>{console.error(JSON.stringify({event:'isolated_smoke_failed',step,code:error.code,actualStatus:typeof error.actual==='number'?error.actual:undefined}));process.exitCode=1});
        '''
        run(['docker','exec','-i',image_containers[0],'node'],source=smoke)
        print('OK: smoke HTTP de imágenes finales, MFA real y SSR autenticado, sin puertos host')
finally:
    for name in reversed(image_containers):
        run(['docker', 'rm', '-f', '-v', name], ok=False)
    run(['docker', 'rm', '-f', '-v', container], ok=False)
