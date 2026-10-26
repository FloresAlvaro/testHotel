# Roles y contenedores de seguridad

La API usa `hotel_runtime`, sin DDL, propiedad de objetos o privilegios globales. `hotel_owner` es NOLOGIN; `hotel_migrator` puede asumirlo para DDL. `hotel_backup` solo lee; `hotel_backup_verify` tiene CREATEDB para restauraciones nuevas y no puede conectar a la base operativa. No asignar estas identidades a otros proyectos del mismo clúster: sus nombres son fijos.

`roles.sql` debe aplicarse como administrador **después de cada lote de migraciones**. Transfiere solo objetos de aplicación de `public`, no los miembros de extensiones. Nunca lo apliques a un clúster compartido sin inventariar antes las identidades y objetos. Conserva la cuenta administrativa original fuera de la API. El script no borra roles ni volúmenes.

Runtime puede leer las tablas necesarias y escribir únicamente las de negocio, sesiones y colas. Solo los triggers de auditoría y liquidación de pagos son SECURITY DEFINER; fijan `search_path` y quedan sin EXECUTE público. Runtime no puede alterar auditoría, recibos ni movimientos directamente. Nuevas tablas no reciben DML automáticamente: revisar la política al añadirlas.

## Instalación nueva

1. Copiar `.env.example` y configurar identidad/contraseña administrativa y JWT fuera de Git. Ejecutar `python3 database/security/prepare-env.py` para generar los cuatro secretos de roles y la clave MFA independientes sin imprimirlos. Las contraseñas generadas son hexadecimales, seguras al construir URLs; codificar como URL cualquier contraseña manual con caracteres reservados.
2. `docker compose up -d --build` aplica esquema, migraciones montadas y finalmente `90-security.sh` en un volumen nuevo. El seed solo se activa mediante el override demo. No dar a la API ni al servicio de respaldos las credenciales administrativas.
3. Verificar salud, login, identidad runtime y backup restaurado. La API en producción rechaza cuentas con privilegios administrativos o CREATE en public.

## Actualizar una instalación con datos

Los volúmenes existentes no ejecutan initdb. No basta con reconstruir la imagen.

1. Registrar configuración e imágenes; generar un respaldo con restauración verificada antes de tocar roles. Ensayar el procedimiento en copia aislada. Conservar la cuenta administrativa de recuperación.
2. Preparar los secretos con `prepare-env.py`; no mostrar `.env` o `docker compose config` completo en logs.
3. Aplicar migraciones pendientes con la identidad administrativa existente antes de introducir los roles, o con `MIGRATION_DATABASE_URL` y `hotel_migrator` después del primer provisionamiento. El runner ejecuta `SET ROLE hotel_owner` por conexión. Mantener los checksums históricos.
4. Ejecutar `sh /security/provision.sh` dentro de PostgreSQL con las variables POSTGRES_USER/DB/PASSWORD administrativas y los cuatro secretos de roles nuevos presentes en su entorno. Para el volumen existente, el contenedor debe recibir las nuevas variables/montajes; recrear solo db conservando el volumen, **sin `down -v`**. El script usa psql sin secretos en argumentos y es idempotente. La identidad administrativa debe poder transferir propiedad de los objetos.
5. Reconstruir/recrear API, frontend y backups. Comprobar permisos/uid, API, SSR/login, portal, correo, cobros simulados, auditoría y respaldo. La API no recibe MIGRATION_DATABASE_URL.

Cuando se ejecute `npm run db:migrate` desde el backend, definir únicamente en ese proceso `MIGRATION_DATABASE_URL=postgresql://hotel_migrator:...@host/base`; en Compose ejecutar `docker compose build migrate` y `docker compose run --rm migrate`; después reaplicar `provision.sh`. No colocar esta credencial en el entorno del servidor HTTP. Para migraciones futuras con nuevas extensiones que necesiten administración, usar una operación administrativa separada.

## Respaldos

`backup.sh` ejecuta pg_dump con el lector. `VERIFY_PGUSER`/`VERIFY_PGPASSWORD` se usan solo para crear una base `hotel_restore_*`, restaurar, verificar todas sus tablas y borrarla. `restore.sh` usa la identidad verificadora para restaurar a una base nueva. El volumen de copias mantiene dumps privados (umask 077); solo `latest.json`/`status.json`, sin datos ni secretos, son legibles por el proceso Node no root. Las credenciales de verificación permiten crear bases y deben protegerse y limitarse al servicio de respaldo. El script admite el modo administrativo anterior únicamente para instalaciones heredadas/pruebas que no definan VERIFY_*.

## Aislamiento Docker

Node corre como uid 1000, rootfs read-only, sin capacidades, con `no-new-privileges`, límite de procesos/CPU/memoria y tmpfs `/tmp`. La API lee migraciones/manifiestos sin escritura. Frontend conserva URL interna SSR y URL pública separadas. La clave `MFA_ENCRYPTION_KEY` es de 32 bytes hexadecimales y se conserva fuera de PostgreSQL/dumps; no se reemplaza si ya existe. La capacidad MFA está habilitada; cada administrador decide activarla en su cuenta desde Configuración → Seguridad y retención activa de sesiones vencidas (7 días) y enlaces vencidos en cola (24 horas).

Los puertos publicados de la plantilla se ligan a loopback; usar un proxy HTTPS explícito y revisar firewall/orígenes para despliegue público. No publicar el seed ni proveedor demo en operación real.

## Pruebas y reversión

- `python3 database/security/test-roles.py`: contenedor PostgreSQL desechable, sin volúmenes ni red externa; política aplicada dos veces, CRUD/triggers/sesiones, rechazos de DDL/roles/auditoría, migrador, lector y restauración verificadora.
- `python3 database/security/test-roles.py --images`: añade migración y smoke de imágenes locales `hotel-demo-backend`/`hotel-demo-frontend` (o variables `SECURITY_BACKEND_IMAGE`/`SECURITY_FRONTEND_IMAGE`), con usuario no root, rootfs de solo lectura y red sin puertos host. Comprueba API production/runtime, SSR autenticado y MFA real con datos ficticios; no usa contenedores ni credenciales de la demo.
- Para ensayar sobre una copia restaurada, definir **explícitamente** `SECURITY_RESTORE_VOLUME` con el volumen de respaldos existente y `SECURITY_RESTORE_ARCHIVE=hotel-fecha-id/archive.dump` al ejecutar la misma prueba `--images`. Se monta ese volumen únicamente como lectura en `/restore-input`, se verifica SHA256SUMS y se restaura en un PostgreSQL temporal con `network=none`, sin cargar esquema/seed antes. No hay conexión a PostgreSQL operativo, ni dump en el host, ni contraseña/clave MFA de producción; el ensayo exige que la copia no contenga factores MFA inscritos y usa una cuenta ficticia para probar MFA.
- `python3 database/backup/test-backup.py`: integridad, retención, copia externa y errores; contenedor temporal independiente.
- Ejecutar suites backend e integración y smoke/E2E de las imágenes integradas antes de despliegue. Las suites generales que crean esquemas usan la identidad de fixtures, no sustituyen la prueba restringida anterior.

Reversión: no eliminar cuentas originales ni alterar su contraseña. Mantener imágenes previas. Si falla una ruta, diagnosticar el privilegio exacto; evitar devolver SUPERUSER al runtime. Un administrador puede restaurar/reasignar objetos o usar una base restaurada nueva; no se automatiza ninguna reversión destructiva. Las imágenes antiguas pueden reconectarse con configuración anterior solo durante recuperación controlada y tras valorar la mitigación del parser.

`python3 database/security/transition-demo.py` prepara y muestra el procedimiento concreto de la demo existente mediante lecturas. Solo `--execute` lo aplica: guarda imágenes de recuperación y checkpoint sin secretos en `/tmp`, detiene escritores, verifica respaldo, conserva el volumen DB, aplica migraciones administrativas efímeras, provisiona roles y verifica un nuevo respaldo. Las imágenes finales y `.env` deben estar previamente preparados y probados. Revisar el plan/checkpoint y completar smoke operativo; no ejecutarlo durante una auditoría sin autorización de transición.
