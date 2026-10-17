# Revisión por etapas de origin/newbranch

Esta es la revisión previa a la integración. La implementación posterior de los puntos 1 y 2 está detallada en [la entrega de calidad y operación](entrega-calidad-operacion.md).

Comparación realizada el 17 de octubre de 2026 entre `codex/portal-huesped-ui` (fb41582) y `origin/newbranch` (bb2e33f). Revisión de código: no se ha fusionado ni sustituido código de la aplicación. Los diez commits remotos modifican módulos compartidos; no equivalen a diez mejoras independientes que puedan aplicarse sin adaptación.

## 1. Verificaciones automáticas en GitHub — incorporar primero, adaptadas

Fuente: `.github/workflows/checks.yml`, ambos `package.json`.

La otra rama ejecuta verificaciones frontend y backend con un PostgreSQL de CI. Nuestro proyecto aún no incluye ese workflow. Es valioso automatizar las verificaciones que ya ejecutamos localmente.

Incompatibilidades concretas: el workflow remoto llama `npm run check` y `npm run test:ui`, ausentes en nuestra rama. Usa `BACKEND_INTEGRATION_DATABASE_URL`; nuestra suite requiere `TEST_DATABASE_URL`. Copiar solo la variable equivocada podría omitir las pruebas PostgreSQL. La nueva suite Playwright requiere instalación de navegador y preparación de datos aislados. Debe añadirse build frontend y un trabajo para las pruebas E2E.

Aceptación: un push ejecuta las suites actuales con PostgreSQL, confirma que no se omitan las pruebas de integración y falla deliberadamente si una prueba falla. No se ejecutó GitHub Actions durante esta revisión.

## 2. Identificación de peticiones y logs — incorporar pronto

Fuente: `Backend-H/src/middleware/requestId.js`, `src/app.js`, `src/utils/errorDetails.js` remotos.

El middleware genera un UUID, devuelve `X-Request-ID` y añade `requestId` a errores JSON. Los logs de producción incluyen ese identificador, método, ruta sin query, estado y duración. Facilita relacionar el error del cliente con el registro del servidor.

Adaptación: registrar antes de las rutas, exponer el header en CORS y consumirlo en nuestro cliente API. Conservar el parser raw del webhook Stripe antes de express.json. Mantener ocultos secretos y trazas internas. Actualizar las pruebas de respuestas que comparan objetos exactos.

Aceptación: mismo ID en respuesta y log, sin cambiar códigos HTTP ni revelar tokens de recuperación en URLs registradas.

## 3. Historial y checksum de migraciones — incorporar con rediseño del ejecutor

Fuente: `Backend-H/src/config/migrate.js` remoto y `Backend-H/scripts/migrate.js` actual.

La rama remota lleva historial `schema_migration`, checksum SHA-256 y bloqueo PostgreSQL. Nuestro ejecutor vuelve a ejecutar los archivos idempotentes y no mantiene historial.

Incompatibilidades: usa `Backend-H/migrations/`, nosotros `database/migrations/`. El remoto envuelve todo en una sola transacción; varios SQL nuestros ya contienen BEGIN/COMMIT, por lo que confirmarían la transacción y liberarían prematuramente su bloqueo. Si se quitaran esos delimitadores y se conservara una sola transacción global, `002-customer-role.sql` y `003-customer-portal.sql` seguirían necesitando una confirmación entre agregar el valor enum customer y utilizarlo.

Propuesta: historial y checksum con confirmación por archivo; bloqueo de ejecución que cubra la secuencia completa y política explícita para adoptar bases existentes. No registrar una migración histórica como aplicada basándose solo en la existencia de tablas. Nuestros archivos ya desplegados deben quedar congelados una vez establecido su checksum.

Aceptación: base vacía, base de demo existente, segunda ejecución sin cambios, checksum alterado y dos ejecutores concurrentes.

## 4. Sesiones revocables y cookies HttpOnly — alto valor, integración transversal

Fuente remota: `sessionService.js`, `config/auth.js`, `middleware/auth.js`, `routes/account.js`, store auth y componentes de sesiones.

Incluye sesiones persistentes, caducidad, listado, revocación individual/global y cookie HttpOnly con SameSite y Secure configurables. Nuestro sistema guarda el Bearer en localStorage y dispone de revocación global mediante auth_version al cambiar contraseña, pero no de sesiones individuales.

Debe adaptarse en conjunto: login/logout, hidratación, SSR, CORS, verificación de Origin para escrituras con cookie y enlaces de recuperación. Mantener el rol customer, client_id y la comprobación de ficha activa: el middleware remoto no los incorpora. Conservar el contexto de auditoría. Definir transición para sesiones antiguas y probar si frontend/API se alojan en sitios distintos.

Detalle de interfaz remoto: SettingsSecurity incluye AccountSessions y también conserva un texto que afirma que la API no expone sesiones. Ese texto quedaría incoherente y debe retirarse al integrar.

Aceptación: customer y personal, recarga, cierre de una sesión, cierre global, cambio de contraseña, desactivación, permisos y rechazo de escrituras desde otro origen.

## 5. Invitaciones de empleados — incorporar después de sesiones

Fuente: `authService.js`, `routes/account.js`, migración `001-auth.sql` remotos.

Permite crear cuenta pendiente, enviar enlace de 24 horas y que el empleado elija la contraseña. El reenvío invalida el token anterior. Es mejor para el alta de empleados que comunicar una contraseña inicial.

Adaptación: utilizar nuestra email_outbox persistente. El envío remoto realiza reintentos dentro del proceso, pero no persiste una entrega fallida. Sus enlaces usan un fragmento #token; nuestras pantallas de recuperación consumen query token. Debe elegirse y aplicar un contrato consistente. Integrar los cambios de password_setup_required con administración y validadores sin permitir que un alta de empleados cree un customer sin ficha.

Aceptación: crear, reenviar, aceptar una sola vez, expirar, conservar respuesta neutra en recuperación y revocar sesiones previas.

## 6. Contratos y tipos generados — incorporar por recursos

Fuente: `apiSchemas.json`, `joiSchema.js`, `scripts/generate-api.cjs`, tipos generados remotos.

Centraliza esquemas y genera OpenAPI y declaraciones TypeScript. Evita mantener a mano modelos divergentes.

Adaptación: documentar antes todos nuestros endpoints nuevos (portal, solicitudes, ocupación, pagos, correo, respaldos), su paginación y roles. No copiar los tipos remotos como reemplazo: no describen esas extensiones. El conversor estructural Joi no reemplaza reglas custom ni garantiza describir correctamente todos los esquemas condicionales; verificar en particular las fechas condicionadas por kind de solicitud.

Aceptación: generación reproducible, api:check detecta cambios sin regenerar y consumidores de un recurso compilan contra las respuestas reales.

## 7. Salud, configuración y cierre ordenado — incorporar pronto

Fuente: app.js, server.js, runtimeSettings.js, database.js remotos.

La salud consulta PostgreSQL y devuelve 503 si falla. Valida enteros, booleanos, coherencia CORS/HTTPS y proxies confiables. Su cierre ordenado detiene mantenimiento y pool con un límite de espera.

Adaptación: incluir nuestros trabajadores de correo y conciliación de pagos en el cierre. Separar salud del proceso de disponibilidad para servir tráfico si el despliegue lo necesita. Evitar sustituir database.js entero: el query y transaction remotos no ejecutan nuestro applyContext, que establece actor_id, actor_ip y zona horaria del hotel. Perderlo afecta la atribución de auditoría y las reglas de turnos en pagos.

Aceptación: parámetros inválidos impiden arrancar con error controlado, caída/recuperación PostgreSQL y cierre durante trabajos en curso sin duplicar movimientos.

## 8. Copia externa y política de retención — aprovechar sobre nuestros respaldos

Fuente: scripts/backup.cjs, backup-policy.cjs y backup-watch.cjs remotos.

Nuestra rama ya realiza copia automática y restauración de prueba. La otra añade copia a un directorio montado externo, comprobación de checksum y manifiesto de tablas/cantidades. Conserva copias anteriores cuando falla la verificación o el espejo; elimina solo nombres y conjuntos reconocidos.

Adaptación: elegir un único flujo automático. Nuestros archivos .sha256 siguen el formato de sha256sum (hash y ruta); los remotos guardan solo el hash. Los manifiestos y políticas de retención también difieren. El script remoto depende del CLI Docker en el host; nuestro servicio de respaldo usa directamente herramientas PostgreSQL dentro de su contenedor. Un directorio espejo local no constituye una copia fuera del equipo ni proporciona cifrado.

Aceptación: restauración completa, integridad local y externa, fallo del destino externo sin pérdida de copias anteriores y retención limitada a archivos propios verificados.

## 9. Calidad estática backend — incorporación gradual

Fuente: eslint.config.cjs, configuraciones Prettier, tsconfig.json y tsconfig.compat.json remotos.

Añade lint, formato, comprobación checkJs/JSDoc y verificación de contratos. El TypeScript estricto se aplica a una selección de módulos; el resto utiliza una configuración menos estricta. No equivale a que todo el backend tenga tipado estricto.

Adaptación: dependencias y scripts propios, comenzar por utilidades/configuración y ampliar a servicios. Separar un eventual cambio masivo de formato de cambios funcionales para facilitar revisión. Mantener las pruebas de concurrencia PostgreSQL y los E2E actuales.

## Hallazgos adicionales

- **Proteger al último administrador activo:** userService.js remoto usa bloqueo compartido entre cambios y cuenta administradores activos antes de desactivar/degradar. Es rescatable y prioritario. Debe aplicarse también a todos nuestros endpoints de activación/desactivación y preservar la gestión separada de clientes customer.
- **Reintentos SMTP según tipo de fallo:** el correo remoto distingue fallos transitorios de errores de credenciales o rechazos permanentes. Podemos incorporar esa clasificación dentro de nuestra cola persistente.
- **No sustituir auditoría/pagos por los servicios remotos completos:** la otra rama audita desde servicios, mientras nuestra rama usa triggers y contexto PostgreSQL. Hay que evitar duplicados. Sus servicios de pago tampoco incluyen nuestra protección que obliga a reembolsar pagos de pasarela mediante el proveedor original.
- **Índices redundantes:** hay una migración remota que elimina índices equivalentes a restricciones UNIQUE. Confirmar definiciones reales con catálogo PostgreSQL antes de adoptarla; no se ejecutó en la demo.

## Comprobaciones realizadas y límites

Se inspeccionó código de ambas referencias Git sin modificar el servidor ni la demo. Se ejecutaron 18 comprobaciones aisladas sobre código remoto cargado en memoria: 9 de política de respaldos (valor por defecto, límites de retención, espejo correcto, mismo destino e integridad alterada) y 9 de configuración/protección del administrador (parámetros inválidos, configuración válida, bloqueo del último admin y revocación con otro admin disponible). Todas pasaron. Las pruebas usaron un directorio temporal eliminado al terminar y mocks para la base en la protección de administrador; no demuestran concurrencia PostgreSQL.

No se ejecutaron la suite completa remota, GitHub Actions, envíos reales SMTP, pagos reales, restauración externa ni las funciones de autenticación integradas. Ninguna mejora ha sido incorporada aún. Orden recomendado: CI y diagnóstico; último administrador y configuración; migraciones; respaldo externo; sesiones; invitaciones; contratos generados y tipado gradual.
