# Backend del hotel

El backend usa Express y PostgreSQL. Los controladores manejan HTTP; los servicios de reservas,
pagos, habitaciones y usuarios aplican las reglas de negocio y gestionan las transacciones.
Los modelos reciben una conexión opcional para que consultas, bloqueos y escrituras pertenezcan
a la misma transacción.

## Comportamiento y permisos

- Las cuentas se invitan desde la administración de usuarios mediante `/api/account/invitations`.
  `POST /api/users/register` requiere rol `admin` y se conserva por compatibilidad; el registro
  público no está permitido. El primer administrador
  se provisiona mediante el procedimiento de instalación o el seed de desarrollo.
- Las entradas y salidas se registran mediante `/api/check-in` y `/api/check-in/check-out`.
  Actualizar una reserva no permite sustituir esos procesos.
- El estado de una habitación considera todas sus reservas. Una estancia ingresada prevalece
  sobre reservas futuras. Después de una salida, la habitación queda en mantenimiento hasta
  que el personal la prepare y cambie su estado.
- Al cambiar fechas se recalcula el precio con la tarifa actual del tipo de habitación, salvo
  que se proporcione explícitamente un precio. No se permite reducirlo por debajo de lo ya pagado.
- Los pagos pendientes no son ingresos. Al completarlos se verifica el saldo bajo bloqueo de
  la reserva. Las cantidades monetarias se comparan en centavos.
- Los reportes incluyen el último día del período y consideran únicamente pagos completados.
  Su fecha de agrupación sigue siendo la fecha de creación del pago.
- Las fechas de reservas y consultas se envían como `YYYY-MM-DD`; PostgreSQL DATE se devuelve
  como texto para evitar cambios de día por la zona horaria del servidor.
- Se auditan cambios operativos de reservas, pagos, habitaciones y permisos. Los registros
  guardan estados e importes, sin contraseñas ni los datos personales completos del huésped.
- Las columnas `updated_at` se mantienen mediante los triggers del esquema de PostgreSQL.

## Calidad y diagnóstico

- `npm run lint` detecta errores habituales y código sin uso; `npm run lint:fix` aplica las
  correcciones automáticas de ESLint.
- `npm run format` formatea el backend con Prettier; `npm run format:check` verifica el formato
  sin modificar archivos.
- `npm run check` ejecuta lint, formato, tipos, contrato generado y pruebas. Requiere las variables
  `DATABASE_URL` y `JWT_SECRET`; para pruebas usa valores aislados, como los del ejemplo siguiente.
- `.github/workflows/checks.yml` ejecuta las verificaciones en cada push y pull request.
  El backend se prueba con PostgreSQL temporal; el frontend ejecuta lint, tipos y pruebas de UI.
- Cada petición recibe `X-Request-ID`. El identificador aparece en los logs HTTP y en las
  respuestas de error como `requestId`; el frontend también lo imprime en la consola.
  Los logs de errores internos incluyen ese mismo identificador. Para investigar un error,
  busca el ID de la respuesta en los logs del backend.

## Ejecución de pruebas

`npm test -- --runInBand` ejecuta las pruebas unitarias. Las pruebas de integración se omiten
cuando no existe `BACKEND_INTEGRATION_DATABASE_URL`.

Para verificar también SQL, HTTP y concurrencia, usa exclusivamente una base temporal llamada
`review`, sin datos del hotel. Por ejemplo, en PowerShell desde esta carpeta:

```powershell
docker run --detach --name hotel-backend-review-db --publish 127.0.0.1:55439:5432 --env POSTGRES_USER=review --env POSTGRES_PASSWORD=review-test-only --env POSTGRES_DB=review postgres:16-alpine
$env:BACKEND_INTEGRATION_DATABASE_URL='postgresql://review:review-test-only@127.0.0.1:55439/review'
$env:DATABASE_URL=$env:BACKEND_INTEGRATION_DATABASE_URL
$env:JWT_SECRET='isolated-test-secret-of-at-least-32-characters'
$env:NODE_ENV='test'
npm test -- --runInBand
docker rm --force hotel-backend-review-db
```

Espera a que PostgreSQL esté listo antes de ejecutar las pruebas. La suite crea y reinicia el
esquema `backend_review_test` dentro de esa base. Nunca apuntes esta variable a una base real.

## Nuevos flujos de cuenta y operaciones

Consulta [OPERATIONS.md](OPERATIONS.md) para configurar cookies y correo, invitar empleados, generar el contrato compartido y crear copias PostgreSQL con restauración verificada.
