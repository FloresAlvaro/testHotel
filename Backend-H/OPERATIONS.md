# Autenticación, contrato y copias de seguridad

## Puesta en marcha

`npm start` aplica las migraciones de `migrations/` antes de aceptar peticiones. También pueden aplicarse con `npm run migrate`. Se ejecutan en transacción, con bloqueo y checksum; una migración aplicada no debe editarse. `000-initial.sql` permite crear una base vacía. Las instalaciones existentes con las ocho tablas principales adoptan esa base inicial sin recrear sus datos; las migraciones posteriores agregan autenticación, retiran índices duplicados e incorporan restricciones de integridad antiguas. Un esquema parcial o datos incompatibles detienen la migración; deben revisarse antes de reintentar. `database/init/01-schema.sql` conserva la misma base inicial para Docker; los cambios posteriores se agregan como nuevas migraciones.

Configura `FRONTEND_URL` con el origen público exacto del frontend y `CORS_ORIGIN` con ese mismo origen; activa `CORS_CREDENTIALS=true`. Para HTTPS las cookies se marcan Secure automáticamente. Backend y frontend deben servirse en el mismo sitio para la cookie SameSite=Lax. Los despliegues anteriores deben iniciar sesión nuevamente: los JWT antiguos no tienen sesión registrada.

El navegador recibe una cookie HttpOnly y recupera su perfil al recargar. Las operaciones autenticadas con cookie comprueban Origin. Configuración > Seguridad permite consultar y cerrar sesiones propias. Cambiar/restablecer la contraseña o modificar permisos/desactivar al usuario revoca sus sesiones.

La configuración valida duración de sesión, puerto SMTP, opciones booleanas y coherencia entre origen, CORS y HTTPS. Si existe un proxy inverso, define `TRUST_PROXY` con las IPs o subredes de esos proxies (por ejemplo `loopback,10.0.0.5/32`); la aplicación rechaza confianza global o números de saltos. El valor predeterminado es no confiar en proxies.

El backend limpia tokens expirados y sesiones expiradas/revocadas con más de `AUTH_RETENTION_DAYS` días (30 por defecto). Se ejecuta al iniciar y cada `AUTH_CLEANUP_INTERVAL_MS` (una hora), con bloqueo para evitar limpiezas simultáneas entre instancias. Las sesiones activas se conservan.

## Empleados y contraseñas

Configuración > Usuarios > Invitar empleado crea una cuenta pendiente. El empleado elige su contraseña mediante un enlace de un solo uso, válido 24 horas. Se puede renovar desde Reenviar invitación; el enlace anterior queda invalidado. Solo los administradores pueden invitar. El endpoint antiguo `/users/register` continúa disponible para administradores por compatibilidad y está marcado como obsoleto.

Define `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` y, si corresponde, `SMTP_SECURE=true` (TLS directo, habitualmente puerto 465). Sin SMTP, las invitaciones permiten copiar el enlace manualmente; la recuperación pública devuelve servicio no disponible. Con SMTP, la recuperación responde igual para correos existentes o desconocidos. Sus enlaces caducan a los 30 minutos. Los tokens se guardan como hashes y se eliminan después del uso. El envío real requiere credenciales SMTP válidas.

Los fallos SMTP transitorios se reintentan hasta `SMTP_MAX_ATTEMPTS` (3 por defecto), con espera incremental desde `SMTP_RETRY_DELAY_MS` (500 ms). No se repiten rechazos permanentes ni errores de credenciales. No hay una cola persistente de correo: si se agotan los intentos, debe renovarse la invitación o solicitarse otra recuperación.

## Tipos y contrato

Los modelos de respuesta compartidos están en `src/config/apiSchemas.json`. Los modelos de solicitudes se derivan de los validadores Joi mediante `joiSchema.js`; las reglas custom se señalan en OpenAPI y siguen siendo responsabilidad de Joi. Tras modificar modelos, validaciones o rutas documentadas, ejecuta `npm run api:generate`. Genera `openapi.json` y tipos de backend/frontend. `npm run api:check` comprueba que estén actualizados. Una prueba comprueba que cada endpoint de los routers tenga documentación; algunas estadísticas agregadas todavía usan esquemas abiertos.

`npm run typecheck` comprueba todo `src/` y `server.js` mediante `checkJs`, JSDoc y declaraciones compartidas. `tsconfig.json` mantiene comprobación estricta para configuración, conexión/transacciones PostgreSQL, JWT, sesiones, mantenimiento, correo, autorización, tokens, errores, dinero, cookies y requestId. `tsconfig.compat.json` comprueba además los modelos, servicios, rutas y controladores restantes con un nivel inicial menos estricto. Sigue pendiente endurecer todos esos módulos y, si se decide, convertir los archivos a `.ts`. El frontend utiliza los modelos generados; las validaciones Joi del servidor siguen siendo obligatorias.

## Copia y restauración comprobada

Desde Backend-H, con Docker y el contenedor PostgreSQL activos:

```sh
npm run backup
npm run backup -- --container hotel-db --directory ../.backups
npm run backup:verify -- --container hotel-db --file ../.backups/archivo.dump
```

El contenedor debe definir POSTGRES_USER y POSTGRES_DB y permitir sus comandos locales PostgreSQL. `DOCKER_BIN` permite indicar una ruta al ejecutable Docker. No se envía la contraseña como argumento de proceso.

Cada creación ejecuta `pg_dump` en formato custom, calcula SHA-256, restaura con `pg_restore --exit-on-error` en una base temporal nueva y consulta todas sus tablas. El archivo `.verified.json` registra checksum, fecha, tablas y cantidades restauradas. La base temporal se elimina al terminar; la base original nunca se sobrescribe. Si la verificación falla, el comando termina con error. El flujo también se ejecuta en CI sobre PostgreSQL temporal.

Las copias se guardan en `.backups/`, excluida de Git. Contienen datos del hotel: limita su acceso. `BACKUP_KEEP_COUNT` conserva las últimas 14 copias verificadas por directorio (mínimo 2); la retención solo elimina archivos con el nombre generado por estos scripts y sus manifiestos completos. Si falla la creación, verificación o copia externa, no se aplica retención a las copias locales anteriores.

`BACKUP_MIRROR_DIRECTORY` permite copiar las tres piezas de cada backup a otra ubicación montada (unidad de red, disco externo, etc.), comprobando también su checksum. Debe configurarse con una ubicación real fuera del equipo para obtener protección externa; un segundo directorio local solo prueba el mecanismo. `BACKUP_DIRECTORY` cambia la ubicación local. Los scripts leen `.env` de la raíz y Backend-H, respetando las variables ya presentes en el proceso.

`npm run backup:watch` realiza una copia al arrancar y repite cada `BACKUP_INTERVAL_HOURS` (24 por defecto), sin solapar ejecuciones. Este proceso debe mantenerse activo mediante el supervisor de servicios del equipo. No se ha instalado ni iniciado un servicio permanente en tu equipo. La pantalla de copias de preferencias continúa exportando únicamente preferencias del navegador; las copias PostgreSQL se administran con estos comandos.

Para recuperación real ante una avería, primero verifica el archivo y restaura con `pg_restore` en una base nueva. Revisa el resultado antes de apuntar DATABASE_URL a esa base. El comando de verificación deliberadamente solo restaura en bases temporales generadas por él.
