# Primera entrega: verificaciones y protecciones operativas

Implementación de los puntos 1 y 2 acordados, sobre `codex/portal-huesped-ui`. Se conservaron el contexto PostgreSQL de auditoría y zona horaria, los roles customer/personal, la cola persistente de correo y la verificación de webhooks Stripe.

## Verificaciones automáticas

`.github/workflows/checks.yml` se activa al subir cambios, abrir/actualizar un pull request y por ejecución manual. Tiene tres trabajos independientes:

- Backend: PostgreSQL 16 aislado, `TEST_DATABASE_URL` obligatorio y `npm run test:ci`. Las pruebas de integración crean/eliminan un esquema propio.
- Frontend: instalación con lockfile, lint, TypeScript y compilación de producción.
- E2E: otra base PostgreSQL vacía (`hotel_e2e`), esquema y migraciones por archivo, seed ficticio, compilación frontend, arranque API/frontend y pruebas Playwright con Chromium. Adjunta trazas, capturas y logs si falla; retención de siete días. No utiliza credenciales reales de correo ni pagos.

Las acciones oficiales utilizadas son checkout, setup-node y upload-artifact v7. Referencias: [checkout](https://github.com/actions/checkout), [setup-node](https://github.com/actions/setup-node), [upload-artifact](https://github.com/actions/upload-artifact). Los procesos de la aplicación mantienen Node 22 en CI, compatible con la versión del frontend Docker.

`Backend-H/scripts/prepare-e2e.js` exige NODE_ENV=test, E2E_ALLOW_WRITES=1 y una E2E_DATABASE_URL cuyo nombre incluya `_e2e`. Rechaza una base con tablas antes de modificarla. `wait-e2e.js` comprueba salud HTTP de la API y disponibilidad del frontend, con espera acotada. El workflow utiliza los mismos scripts y comandos verificados localmente. Playwright conserva Chrome como opción local predeterminada; E2E_BROWSER=chromium selecciona el navegador instalado en CI.

La ejecución en la infraestructura de GitHub se comprobará después de publicar estos archivos. No se configuró protección de ramas ni se fusionaron las ramas.

## Diagnóstico de peticiones

Cada petición recibe un UUID generado por el servidor en `X-Request-ID`. Un encabezado enviado por el cliente no sustituye ese ID. Las respuestas JSON de error incorporan `requestId`; CORS expone el encabezado para que el frontend pueda leerlo.

Los registros HTTP son JSON con requestId, método, ruta, código de estado y duración. Excluyen la query y el cuerpo de la petición. Los errores registran identificador, ruta, estado y código técnico cuando existe; no vuelcan el objeto completo de error. El cliente frontend añade el ID al diagnóstico en consola, sin registrar encabezados de autorización ni cuerpos de petición. El middleware se instala antes de CORS y del limitador para identificar también sus rechazos. El cuerpo original del webhook Stripe sigue verificándose antes de express.json.

## Último administrador y cambios de permisos

`userAdministrationService.js` centraliza edición de personal y activación/desactivación. Las tres rutas usan una transacción y el mismo bloqueo asesor PostgreSQL. Si un cambio dejaría cero administradores activos, responde 409 y revierte la operación. Dos administradores que intentan desactivarse simultáneamente no pueden dejar al sistema sin administrador.

Cambiar rol o estado activo incrementa auth_version, invalidando los JWT anteriores. La edición de nombre/correo sin cambio de permisos no fuerza esa revocación. Las cuentas customer siguen administrándose desde la ficha del huésped; las rutas de personal no pueden desactivar ni convertir esas cuentas.

## Validación de configuración

El módulo puro `runtimeSettings.js` valida antes de aceptar tráfico:

- URL PostgreSQL con servidor/base; JWT_SECRET de al menos 32 caracteres y duración JWT con unidad explícita, por ejemplo 24h.
- Puertos y números enteros sin aceptar sufijos arbitrarios; límites del pool coherentes; límites de uso e intervalos positivos.
- Booleanos explícitos; APP_URL HTTP/HTTPS sin credenciales, ruta o parámetros; orígenes CORS válidos y coherentes con APP_URL cuando se habilitan credenciales. En producción rechaza CORS comodín.
- TRUST_PROXY vacío por defecto. Solo acepta `loopback` o IPs/subredes declaradas; rechaza confianza global, conteos de saltos y prefijos inválidos. Se aplica a Express.
- SMTP con remitente válido y credenciales completas cuando se proporcionan; puertos válidos. Demo de pago habilitada expresamente y Stripe con sus dos secretos cuando se selecciona ese proveedor.

Variables nuevas documentadas: TRUST_PROXY y SHUTDOWN_TIMEOUT_MS (30000 por defecto, intervalo permitido 1000..300000 ms). Si se aumenta el plazo de cierre, también debe ajustarse stop_grace_period de Compose para dar margen; el valor predeterminado es 40 segundos.

## Salud y cierre ordenado

`GET /health` comprueba conexión real con PostgreSQL: 200 disponible, 503 no disponible. La conexión de la comprobación se libera también si falla una consulta. La API espera una conexión válida antes de escuchar y arrancar trabajos.

SIGTERM y SIGINT siguen un único flujo idempotente: dejar de aceptar tráfico, detener temporizadores, esperar peticiones y trabajo en curso, cerrar el pool y terminar con código 0. Se cierran conexiones HTTP ociosas. Si se supera el plazo de seguridad, se termina con código 1; si ocurre un fallo durante el cierre, también se informa como error.

Correo y conciliación utilizan un ejecutor periódico que evita solapamientos y permite esperar una operación en curso. La cola de correo deja de tomar nuevos mensajes durante el cierre y cierra el transporte en finally. El mantenimiento de salud del pool conserva su temporizador y lo cancela al cerrar. Se retiraron los manejadores de señales del módulo PostgreSQL para que no cerrara el pool antes de finalizar peticiones o trabajadores.

El límite de cierre puede interrumpir una dependencia que no responde. Las transacciones PostgreSQL y la idempotencia existente de pagos permiten recuperación al reiniciar. El envío SMTP conserva la garantía previa de entrega con posible repetición si el proceso cae después del envío y antes de confirmar su registro.

## Verificación

Se añadieron pruebas de configuración inválida/válida, IDs de petición, ausencia de tokens/query en logs, trabajos sin solapamiento, parada inmediata, espera de operaciones y límite de cierre. Las pruebas PostgreSQL comprueban último administrador vía PUT/PATCH, desactivaciones simultáneas, separación customer/personal y revocación de JWT. Las pruebas HTTP verifican salud 200/503 y conservación de firmas Stripe. El cierre con señales reales y el recorrido E2E se comprueban en una instancia local aislada.

El seed y el esquema funcional no necesitan cambios para esta entrega: se reutiliza auth_version y no se añaden tablas ni migraciones. El ejecutor con historial de migraciones, respaldos externos, cookies HttpOnly e invitaciones siguen en las etapas siguientes.

Resultados locales: 110 pruebas backend correctas (8 suites, incluidas PostgreSQL y firmas Stripe); los 8 recorridos E2E correctos con Chromium y frontend compilado; comprobación adicional correcta del ID en encabezado/respuesta/consola; lint, TypeScript y build correctos; YAML analizado correctamente. SIGTERM y SIGINT se probaron contra procesos reales con PostgreSQL: ambos terminaron con código 0 y pool cerrado. La preparación E2E se verificó en base vacía y su rechazo sobre la misma base ya poblada. GitHub Actions aún no se ejecutó remotamente.

## Paso 3: historial de migraciones (implementado localmente)

`src/database/migrations.js` registra nombre, SHA-256 y fecha en
`schema_migrations`; `scripts/migrate.js` lo utiliza y la preparación E2E comparte
el mismo ejecutor. El checksum normaliza CRLF a LF para admitir checkouts Windows.
Antes de aplicar archivos pendientes comprueba que ningún archivo registrado
falte o haya cambiado. Rechaza incorporar números anteriores a los ya aplicados.

Una conexión dedicada mantiene el bloqueo asesor 724002 durante toda la secuencia.
Cada archivo y su registro se confirman juntos. Se retira únicamente la envoltura
BEGIN/COMMIT exterior de los archivos históricos; el SQL histórico no cambia.
Esto conserva el commit del enum customer antes de usarlo en la migración 003.
La conexión se destruye al finalizar para no devolver ajustes de sesión al pool.

Instalaciones nuevas: cargar primero el esquema inicial y después ejecutar
`npm run db:migrate`; Docker conserva su inicialización actual y requiere el mismo
comando explícito para establecer/verificar el historial. Instalaciones existentes:
la primera ejecución repite las migraciones idempotentes, registra las que realmente
terminan y conserva los datos. No se deduce su aplicación solo por existir tablas.
El seed no se vuelve a cargar en la base del hotel. La API no migra al arrancar.

Verificación del paso 3: 114 pruebas backend correctas en 9 suites. PostgreSQL
verificó instalación desde esquema inicial, ejecución concurrente, repetición sin
cambios, checksum alterado, rollback de DDL con error, reintento y adopción de una
instalación con seed manteniendo usuarios y reservas. También se ejecutó
`prepare-e2e.js` en una base temporal vacía y se eliminó al terminar. No se repitió
la suite visual: no cambió la UI. La demo y producción no se migraron en esta etapa.

Pendientes posteriores: respaldos externos, sesiones/cookies HttpOnly e
invitaciones, contratos generados y tipado gradual. Los cambios siguen locales,
sin commit ni publicación remota de esta etapa.

## Pasos finales: respaldos, sesiones, invitaciones y contratos

La implementación y operación están descritas en
[la guía de sesiones, respaldos y contratos](sesiones-respaldos-contratos.md).
Incluye migración 006, sesiones opacas revocables HttpOnly con CSRF, invitaciones
de personal/huéspedes por SMTP, copia externa configurable con integridad y
retención segura, OpenAPI/declaraciones generadas y checkJs estricto inicial.

Validación local: 123 pruebas backend correctas en 10 suites, incluidos contratos
reales, concurrencia, caducidad y revocación; 10 recorridos Chromium correctos,
incluido correo SMTP entregado a Mailpit y aceptación desde móvil; lint,
TypeScript y build frontend correctos; api:check y typecheck backend correctos.
Se comprobó que api:check detecta un archivo modificado sin regeneración, y se
analizó el YAML del workflow. La prueba desechable de respaldos comprobó
restauración de todas las tablas, copia, fallo del destino, integridad alterada y
retención limitada a conjuntos reconocidos. Se inspeccionó el formulario móvil
renderizado de aceptación. GitHub Actions aún no se ejecutó remotamente para
esta entrega.

Se respaldó la demo antes de migrar. Se aplicó 006 (estableciendo también el
historial de 001..005), se reconstruyeron los servicios y se verificó salud,
login HttpOnly, SSR privado y logout en localhost:3001/3000. Los conteos de usuarios, clientes, reservas y pagos coincidieron con el respaldo previo.
No se volvió a cargar el seed ni se modificaron contraseñas, nombre del hotel o reservas.

Configuración pendiente por instalación: destino externo real y almacenamiento
cifrado, HTTPS y correo SMTP de producción. La demo utiliza Mailpit y respaldo
local; no se afirma que exista una copia fuera del servidor. Los cambios de esta
entrega permanecen locales hasta que se solicite publicarlos.
