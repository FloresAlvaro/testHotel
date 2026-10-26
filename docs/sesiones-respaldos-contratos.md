# Sesiones, invitaciones, respaldos externos y contratos

## Actualizar una instalación existente

Haz un respaldo antes de actualizar y continúa solo si informa restauración
verificada. Construye los servicios, aplica las migraciones y reinicia la API/frontend. En la demo:

```sh
docker compose -p hotel-demo -f docker-compose.yml -f docker-compose.demo.yml up -d db backups mailpit
docker compose -p hotel-demo -f docker-compose.yml -f docker-compose.demo.yml exec -T backups sh /scripts/backup.sh
docker compose -p hotel-demo -f docker-compose.yml -f docker-compose.demo.yml build backend frontend
docker compose -p hotel-demo -f docker-compose.yml -f docker-compose.demo.yml run --rm migrate
docker compose -p hotel-demo -f docker-compose.yml -f docker-compose.demo.yml exec -T db sh /security/provision.sh
docker compose -p hotel-demo -f docker-compose.yml -f docker-compose.demo.yml up -d backend frontend backups mailpit
```

La migración 006 agrega `web_session` y `user_invitation` sin modificar usuarios,
contraseñas o reservas. Los archivos 001..005 conservan sus checksums. En una base
nueva, Compose aplica también 006 antes del seed. El seed conserva las cuentas
existentes; no almacena sesiones ni invitaciones válidas previamente creadas.

## Sesiones del navegador

El frontend usa POST/GET/DELETE `/api/users/session`. La cookie `hotel_session` es
HttpOnly, SameSite=Lax, sin Domain y con Path=/; usa Secure cuando APP_URL es HTTPS.
La credencial de sesión no aparece en JSON, Pinia ni localStorage. Solo se guarda
su SHA-256 en PostgreSQL. El frontend elimina los antiguos auth_token/auth_user.
Será necesario volver a iniciar sesión al instalar esta actualización.

El perfil y el CSRF se conservan en memoria. SSR reenvía la cookie usando la URL
interna y el navegador utiliza la URL pública. GET /users/session recupera el
perfil y CSRF; las escrituras autenticadas por cookie requieren X-Hotel-CSRF.
Login/logout requieren X-Hotel-Request: 1 y rechazan un Origin ajeno a APP_URL.
El cierre elimina la sesión en el servidor; las sesiones anteriores también
pierden validez al cambiar contraseña, permisos o estado mediante auth_version.

SESSION_MAX_AGE controla la duración fija en milisegundos (86400000 por defecto).
La API limpia sesiones vencidas al crear otra. APP_URL/CORS deben corresponder
al frontend y CORS_CREDENTIALS debe ser true. En producción remota APP_URL requiere
HTTPS. Frontend y API deben compartir el mismo sitio; no se habilitan cookies
cross-site. El proxy HTTPS debe reenviar correctamente al servicio interno.

POST /users/login conserva el contrato Bearer para integraciones existentes;
la interfaz web no lo usa. El token Bearer mantiene su expiración JWT y se revoca
por auth_version; cerrar una sesión de navegador revoca esa sesión en particular.
Las respuestas de /api y las páginas /auth usan Cache-Control: no-store.

## Invitaciones

En **Equipo → Invitar persona**, el administrador indica nombre, email y rol.
La sección de invitaciones permite consultar su estado y revocarlas. Reenviar una
invitación al mismo correo invalida la anterior. La cuenta no se crea hasta la
aceptación. No se permite invitar un correo que ya tenga cuenta.

En la ficha del huésped, **Acceso al portal → Enviar invitación por correo** crea
una invitación ligada al cliente con rol customer fijo. La creación manual con
contraseña inicial continúa disponible en un desplegable.

Los enlaces vencen en 48 horas y se consumen una sola vez bajo bloqueo transaccional.
PostgreSQL almacena el hash; el enlace original solo está en la cola SMTP hasta
que se envía. El correo no contiene contraseñas. Al abrir el enlace, el formulario
retira el token de la URL y requiere una contraseña de 8..128 caracteres con
mayúscula, minúscula y número. No permite elegir otro rol ni otro huésped.

La aceptación comprueba que el administrador emisor siga activo y tenga ese rol,
y que la ficha vinculada siga activa. Una cuenta existente impide aceptar otra
invitación para el mismo correo/cliente. El login continúa como paso separado.
SMTP_HOST y MAIL_FROM deben estar configurados para invitar. En la demo, Mailpit
recibe los mensajes en localhost:8025; no llegan a direcciones externas.

## Respaldos y copia externa

Cada ejecución genera un conjunto `hotel-FECHA-ID/` con `archive.dump`,
`tables.txt`, `manifest.json` y `SHA256SUMS`. El dump se restaura primero en una
base temporal, y los conteos de todas las tablas restauradas se guardan en el
manifiesto de contenido. No sobrescribe la base del hotel. `flock` impide
solapamientos y libera el bloqueo incluso si el proceso termina abruptamente.

Para habilitar una copia externa, prepara un directorio que exista en un disco
remoto/montaje de la instalación y define BACKUP_OFFSITE_PATH en el `.env` raíz.
Añade el override en todos los comandos que administren ese servicio:

```sh
docker compose -p hotel-demo -f docker-compose.yml -f docker-compose.demo.yml -f docker-compose.offsite.yml up -d backups
docker compose -p hotel-demo -f docker-compose.yml -f docker-compose.demo.yml -f docker-compose.offsite.yml exec backups sh /scripts/backup.sh
```

El override exige una ruta existente y no crea un directorio local como sustituto.
Dentro del contenedor se usa /offsite; el conjunto se publica por rename después
de copiar y verificar cada checksum. No se acepta el mismo directorio local.
latest.json solo avanza si termina la restauración y, al habilitarse, la copia
externa. status.json indica si el último intento falló; la pantalla Presentación
y correo muestra el resultado y la última copia externa verificada.

BACKUP_RETENTION_DAYS admite 1..3650 (14 por defecto); BACKUP_INTERVAL_SECONDS,
60..2592000 (86400 por defecto). Solo se eliminan conjuntos antiguos con nombre
propio, manifiesto y hashes válidos tras completar un nuevo respaldo. No se
eliminan copias al fallar el dump, restauración o destino externo. Los archivos
sueltos del formato anterior se conservan para su revisión, sin purga automática.
restore.sh admite ambos formatos y exige una base nueva hotel_restore_* distinta
de POSTGRES_DB. Nunca restaura sobre la operativa.

No hay proveedor externo ni credenciales inventadas: el montaje real debe
aprovisionarse por instalación. Un segundo directorio del mismo servidor no
protege ante pérdida de ese servidor. Este flujo no añade cifrado del archivo:
usa almacenamiento externo cifrado y restringido al personal responsable.

Prueba reproducible: `python3 database/backup/test-backup.py`. Requiere Docker y
crea/elimina un contenedor propio sin puertos ni volúmenes del hotel. Verifica
restauración de todas las tablas, copia, retención, fallo externo, archivo
alterado y rechazo del mismo destino. La prueba no acredita un proveedor remoto.

## Contratos y tipado gradual

`Backend-H/contracts/schemas.json` define los contratos de sesiones, invitaciones
y estado de respaldos. Los cuerpos de las rutas nuevas se validan desde esos
esquemas mediante un conversor explícito a Joi; las reglas de autorización,
consumo único y vínculos siguen en el servidor. No sustituye las validaciones
custom de fechas/pagos existentes.

`npm run api:generate` desde Backend-H produce la especificación completa en
`docs/api/openapi.json` y tipos TypeScript seleccionados en
`Frontend-H/app/types/generated/api.ts`. El documento combina los módulos OpenAPI
existentes de operación, portal, ocupación, pagos, correo y recuperación con los
nuevos de sesiones/invitaciones. Los tipos ya se consumen en login, store de
autenticación, invitaciones y respaldos. No se generan tipos para todos los
recursos antiguos en esta etapa gradual.

`npm run api:check` falla si la especificación o declaraciones están desactualizadas.
La comprobación backend `npm run typecheck` aplica checkJs estricto a tokenHash y
sessionCookies con JSDoc, sin reformatear o migrar el resto del backend. CI incluye
estos comandos, las pruebas PostgreSQL, respaldo desechable y E2E con SMTP local.
La documentación de la API de Mailpit usada por las pruebas está en
https://mailpit.axllent.org/docs/api-v1/.
