# Servicios del huésped y operación del template

Antes de actualizar el backend, aplica todas las migraciones, incluida 006,
usando la secuencia de respaldo, construcción y migración del
[README](../README.md#actualizar-una-instalación-existente-sin-borrar-datos).
Para la demo sigue [sus comandos específicos](demo.md#actualizar-una-demo-existente).
No es necesario borrar la base ni volver a cargar el seed.

## Solicitudes

Desde el detalle de una reserva, el huésped solicita nuevas fechas o cancelación. Solo se admiten reservas confirmadas y antes de la anticipación configurada (24 horas por defecto). Una solicitud pendiente por reserva. El acceso se verifica por el cliente autenticado, nunca por un `client_id` del formulario.

Recepción consulta las solicitudes; admin y manager aprueban o rechazan en **Solicitudes de huéspedes**. Una aprobación comprueba de nuevo estado y disponibilidad bajo los mismos bloqueos de las reservas. En cambios, el responsable introduce el total acordado con el huésped y una respuesta. No puede reducirlo por debajo de los pagos completados. No se aprueba mientras exista un checkout o reembolso pendiente. Cancelar no devuelve fondos automáticamente: el hotel revisa los pagos y procesa el reembolso aparte.

## Correo y recuperación

Configura `APP_URL` con el origen público del frontend y `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM` con tu proveedor SMTP. No guardes credenciales en la interfaz ni en Git. En producción se exige TLS. El SMTP puede pertenecer a un proveedor transaccional o a un servidor propio.

Las reservas, sus cambios y los comprobantes insertan mensajes en una cola PostgreSQL en la misma transacción. La respuesta a solicitudes y los reembolsos también encolan correo. El trabajador del backend entrega cada 15 segundos y reintenta hasta 8 veces con espera creciente. **Presentación y correo** muestra entrega a SMTP, errores y reintentos manuales. Entregado a SMTP no garantiza recepción en la bandeja del destinatario. Una caída después de enviar y antes de confirmar la transacción puede causar un duplicado; el Message-ID permanece estable. Revisa la reputación del dominio, SPF/DKIM/DMARC con tu proveedor antes de activar correo público.

`/auth/forgot-password` responde igual para cuentas existentes e inexistentes. El enlace dura 30 minutos, tiene 32 bytes aleatorios y la tabla de recuperación guarda solo su SHA-256. Solo se usa una vez, se limita la frecuencia y al cambiar la contraseña se revocan las sesiones anteriores. La copia del enlace necesaria para entrega permanece en la cola hasta su envío y se elimina del cuerpo después; protege la base y sus respaldos. Sin SMTP se informa que recuperación no está configurada.

En la demo, SMTP apunta a Mailpit: abre http://localhost:8025 para ver los correos capturados. No se entregan fuera del entorno local. No uses esta configuración para una instancia pública.

## Pagos

`PAYMENT_PROVIDER=disabled` es el valor seguro por defecto. El template incluye dos adaptadores:

- `demo` + `ALLOW_DEMO_PAYMENTS=true`: simulación identificada en todas las pantallas; no solicita tarjetas ni cobra dinero. Compose demo activa ambos.
- `stripe`: configura `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `APP_URL` y `STRIPE_CURRENCIES` (por defecto USD,EUR). El hotel necesita una cuenta comercial elegible para su país y moneda. No se convierte BOB a otra moneda automáticamente. Verifica disponibilidad y condiciones de la cuenta con el proveedor antes de usarlo.

El checkout permite cubrir el anticipo configurado (30 % por defecto, descontando lo ya pagado) o el saldo. Importes calculados en centavos en el servidor. Un checkout activo por reserva. Por defecto vence a las 24 horas; Stripe admite su propia ventana máxima y el enlace puede vencer antes. Un enlace vencido no cancela la reserva. Las reservas conservan su importe; el porcentaje determina cuánto se ofrece como anticipo, no un cargo extra. No se capturan datos bancarios en el sistema.

Registra el webhook público `POST /api/webhooks/stripe` con eventos `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.expired` y `refund.updated`. Se verifica la firma usando el cuerpo original. El retorno del navegador jamás confirma un pago. Los eventos y pagos duplicados no duplican el movimiento ni el recibo. El trabajador concilia sesiones vencidas y reintenta reembolsos pendientes. En Stripe prueba con claves test y su herramienta oficial de eventos antes de habilitar claves live.

Admin y manager pueden devolver el importe completo desde **Pagos en línea**. La devolución usa la pasarela original e idempotencia. Los pagos de pasarela no pueden alterarse ni reembolsarse con la operación de caja manual. Un cobro tardío que excede el saldo o llega después de cancelar pasa a reembolso pendiente. Los movimientos de pasarela no pertenecen al turno de un recepcionista. El vencimiento automático de enlaces demo se procesa cada minuto.

No se configuró ninguna cuenta comercial real. Cada instalación debe elegir proveedor, credenciales, moneda y condiciones de devolución antes de operar con dinero. Para otro proveedor, implementa el adaptador respetando estas garantías y su webhook firmado.

## Presentación

**Presentación y correo** permite al administrador configurar descripción, imagen principal, fotografías y descripciones por tipo de habitación y reglas. El nombre, teléfono, dirección y correo se editan en Configuración. «Mi hotel» se mantiene como nombre genérico. El portal y la selección de habitaciones muestran el contenido configurado. La imagen local de ejemplo es una ilustración marcada como tal; sustituye las imágenes por fotografías autorizadas del hotel (URL HTTPS o archivos en `Frontend-H/public/images/`). Las imágenes remotas son solicitadas por el navegador al host indicado.

## Respaldos y restauración

El servicio `backups` de Compose hace una copia al iniciar y cada 86400 segundos. Guarda archivos `pg_dump` custom y SHA-256 en un volumen separado; conserva 14 días por defecto. Configura `BACKUP_INTERVAL_SECONDS` y `BACKUP_RETENTION_DAYS` según la instalación. Cada copia se restaura con `pg_restore --exit-on-error` en una base temporal `hotel_restore_...`, se consultan tablas clave, y solo después se publica `latest.json` como verificada. La base temporal se elimina al terminar. La cuenta PostgreSQL requiere permiso para crear y eliminar esas bases temporales.

```sh
docker compose logs backups
docker compose exec backups cat /backups/latest.json
docker compose exec backups ls /backups
# Restaurar manualmente a una base NUEVA; no permite sobrescribir la operativa:
docker compose exec backups sh /scripts/restore.sh /backups/hotel-FECHA-ID/archive.dump hotel_restore_revision
```

El volumen de respaldo y el volumen de datos están en el mismo host: una pérdida del equipo puede afectar ambos. Antes de producción configura una copia cifrada fuera del host con el almacenamiento de la instalación. No hay destino remoto inventado ni credenciales incluidas. Los dumps contienen datos personales y credenciales cifradas por hash: restringe el acceso y elimina copias vencidas. La exportación de preferencias del navegador sigue siendo una función distinta y no respalda la base.

## Demo y pruebas

El seed incorpora reglas, presentación y una solicitud pendiente de ejemplo, sin claves de proveedor ni tarjetas. `database/demo-guest-services.sql` complementa una demo existente sin borrar reservas o cambiar contraseñas/nombre. No debe ejecutarse en una base de producción.

Pruebas backend: `DATABASE_URL`, `TEST_DATABASE_URL` apuntando exclusivamente a una base aislada y `JWT_SECRET` de prueba, después `npm test -- --runInBand`. Las pruebas integradas crean y eliminan su esquema y verifican aislamiento, aprobación, solapamiento, pagos duplicados, reembolso y recuperación. SMTP real y Stripe live necesitan verificación con la cuenta elegida por cada instalación.

## Ocupación y datos de reserva

Aplica también `005-reservation-guests.sql` en instalaciones existentes. El formulario del portal pide al menos un adulto y permite indicar niños (máximo 20 personas en total por reserva). La búsqueda y la confirmación comprueban `room_type.capacity` con adultos + niños, en el servidor y nuevamente bajo bloqueo al confirmar. La tarifa vigente sigue siendo por habitación; no hay un precio infantil inventado ni se solicitan edades o documentos de menores.

Hora estimada de llegada y solicitudes especiales son opcionales. Se guardan en columnas separadas de las notas internas y son visibles para el huésped propietario y para recepción. Una solicitud especial no garantiza un servicio adicional. Nombre y correo de acceso proceden de la cuenta existente. Los mensajes de reserva y comprobante usan el correo de la cuenta vinculada activa y, cuando no hay cuenta, el correo de la ficha del cliente.

La fotografía de referencia `demo-bedroom.webp` fue generada para este template y está identificada como imagen de ejemplo. Sustitúyela por imágenes autorizadas de la propiedad al personalizar la instalación.

Las sesiones HttpOnly, las invitaciones y la copia externa configurable están detalladas en [la guía actualizada](sesiones-respaldos-contratos.md). El nuevo respaldo publica conjuntos con dump, manifiesto, conteos de tablas y checksums. La restauración también admite los dumps anteriores con su archivo `.sha256`.
