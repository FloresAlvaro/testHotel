# Sistema de gestión hotelera

Aplicación con frontend Nuxt, API Express y PostgreSQL para administrar huéspedes,
habitaciones, reservas, entradas/salidas y pagos. Incluye un portal de reservas
para clientes.

- [Demo con cuentas y datos ficticios](docs/demo.md).
- [Sesiones, invitaciones, respaldos externos y contratos](docs/sesiones-respaldos-contratos.md).
- [Operación del hotel](docs/operaciones.md).

## Requisitos y ubicación

Ejecuta los comandos Docker desde la raíz del repositorio, donde está
`docker-compose.yml`, con Docker Desktop iniciado y Docker Compose v2 disponible.
Para Docker no necesitas instalar Node.js en el equipo. Para desarrollo local,
usa **Node.js 22.19 o posterior de la rama 22.x** y npm, compatibles con el Nuxt instalado.

```sh
docker --version
docker compose version
# Solo para desarrollo local:
node --version
npm --version
```

## Preparación del entorno (una sola vez)

Crea `.env` en la raíz **solo si todavía no existe**. No reemplaces un `.env` ya
configurado.

macOS/Linux, desde Bash o zsh:

```sh
[ -f .env ] || cp .env.example .env
```

Windows PowerShell:

```powershell
if (!(Test-Path .env)) { Copy-Item .env.example .env }
```

Edita `.env`: reemplaza `JWT_SECRET` por una clave aleatoria de al menos 32
caracteres y define `POSTGRES_PASSWORD`. Con Node instalado puedes generar una
clave y copiarla al archivo:

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Para la contraseña PostgreSQL, usa letras y números o codifica los caracteres
reservados de URL. Los siguientes comandos sirven en Bash, zsh y PowerShell salvo
los bloques que indiquen otro intérprete.

## Seguridad de accesos y PostgreSQL

Las contraseñas deben tener al menos 8 caracteres y no superar 72 bytes UTF-8; letras acentuadas y emojis pueden ocupar varios bytes. Este límite se valida antes de usar bcrypt para evitar truncamientos. Las cuentas existentes con contraseñas superiores a ese límite deben restablecerlas por correo o solicitar asistencia al administrador.

Cambiar la activación del acceso de un huésped revoca sus sesiones y tokens anteriores; al reactivarlo debe iniciar sesión nuevamente.

Docker Compose exige `POSTGRES_PASSWORD` sin valor predeterminado. El puerto de PostgreSQL se publica únicamente en `127.0.0.1`; los contenedores siguen accediendo mediante `db:5432`. Para administración remota utiliza un túnel SSH. En bases existentes, cambiar la variable no cambia la contraseña almacenada: coordina la rotación en PostgreSQL antes de actualizar los servicios.

## Ejecutar el sistema sin datos de demo

Después de preparar `.env`. Si la demo está usando los mismos puertos, detenla
primero con su comando `down` de la sección de demo (sin `-v`).

```sh
docker compose up --build -d
docker compose exec backend npm run db:migrate
```

En el **primer arranque, si todavía no hay administrador**, créalo con el comando
interactivo. Solicita nombre, correo y contraseña; no recibe contraseñas como
argumentos:

```sh
docker compose exec backend npm run admin:create
```

Esta instalación no carga cuentas ni reservas ficticias. Inicia sesión con el
administrador que acabas de crear. Para invitar personal desde **Equipo → Invitar
persona**, configura SMTP; para huéspedes, usa la ficha del cliente. Consulta
[la guía de accesos](docs/sesiones-respaldos-contratos.md).

| Servicio | Dirección predeterminada |
|---|---|
| Aplicación | http://localhost:3001 |
| Login | http://localhost:3001/auth/login |
| Salud de la API | http://localhost:3000/health |
| Swagger | http://localhost:3000/api-docs |
| OpenAPI JSON | http://localhost:3000/api-docs.json |
| PostgreSQL | localhost:5432 |

## Ejecutar la demo

Usa el mismo `.env` preparado arriba. La demo utiliza el proyecto `hotel-demo` y
un volumen de PostgreSQL propio. Si el sistema normal ocupa los mismos puertos,
detén primero esa instancia con `docker compose down` (conserva sus datos).

```sh
docker compose -p hotel-demo -f docker-compose.yml -f docker-compose.demo.yml up --build -d
docker compose -p hotel-demo -f docker-compose.yml -f docker-compose.demo.yml exec backend npm run db:migrate
```

Abre http://localhost:3001. Cuentas principales:

| Rol | Correo | Contraseña de demo |
|---|---|---|
| Administrador | admin@hotel.com | Admin123! |
| Gerente | manager@hotel.com | Manager123! |
| Recepción | recepcion1@hotel.com | Recep123! |
| Customer / huésped | customer@hotel.com | Customer123! |

El customer entra al portal `/portal` y puede reservar desde `/portal/book`.
Los correos de demo se consultan en http://localhost:8025 (Mailpit); los pagos
son simulados. No se necesita `admin:create` en la demo.

El seed se carga **solo la primera vez que se crea el volumen vacío**. Reiniciar
no vuelve a cargar datos. Para cuentas adicionales, actualización y regeneración
voluntaria de los datos, consulta [docs/demo.md](docs/demo.md).

## Estado, logs y parada

Sistema normal:

```sh
docker compose ps
docker compose logs -f backend frontend
docker compose logs --tail=50 backups
docker compose down
```

Demo (conserva el mismo proyecto y los dos archivos en todos los comandos):

```sh
docker compose -p hotel-demo -f docker-compose.yml -f docker-compose.demo.yml ps
docker compose -p hotel-demo -f docker-compose.yml -f docker-compose.demo.yml logs -f backend frontend
docker compose -p hotel-demo -f docker-compose.yml -f docker-compose.demo.yml down
```

`Ctrl+C` deja de seguir los logs; los servicios continúan ejecutándose.
`down` detiene y elimina contenedores, conservando datos y respaldos en volúmenes.
Para volver a iniciar, repite el comando `up -d` correspondiente. **Añadir `-v`
a `down` elimina los volúmenes y sus datos**; no lo uses para actualizar.

Comprobar salud en macOS/Linux:

```sh
curl --fail http://localhost:3000/health
```

En PowerShell:

```powershell
Invoke-RestMethod http://localhost:3000/health
```

## Actualizar una instalación existente sin borrar datos

Los scripts de inicialización solo se aplican sobre un volumen vacío. Una
actualización necesita ejecutar el runner de migraciones, que conserva los datos
y registra cada archivo/checksum. Desde la raíz, para el sistema normal:

```sh
docker compose up -d db backups
docker compose exec -T backups sh /scripts/backup.sh
docker compose build backend frontend
docker compose run --rm --no-deps backend npm run db:migrate
docker compose up -d backend frontend backups
```

El segundo comando debe terminar con respaldo y restauración verificados antes
de continuar. Para la demo, usa la secuencia equivalente de
[su guía de actualización](docs/demo.md#actualizar-una-demo-existente).
No cargues el seed sobre una base con datos. No edites migraciones ya registradas.

## Desarrollo local con recarga en caliente

### Nuxt local, API y PostgreSQL en Docker

Desde la raíz, con el `.env` raíz preparado:

```sh
# Libera el puerto 3001 si el frontend Docker estaba iniciado.
docker compose stop frontend
docker compose up --build -d db backend
docker compose exec backend npm run db:migrate
# Solo si aún no existe administrador:
# docker compose exec backend npm run admin:create
cd Frontend-H
npm ci
npm run dev -- --host 0.0.0.0 --port 3001
```

Abre http://localhost:3001. Termina Nuxt con `Ctrl+C`.
Los valores por defecto de Nuxt apuntan a http://localhost:3000/api. Si cambias el
puerto del backend, crea `Frontend-H/.env` con los valores correspondientes:

```dotenv
NUXT_PUBLIC_API_BASE=http://localhost:3000/api
NUXT_API_INTERNAL_BASE=http://localhost:3000/api
```

En Docker la URL SSR es `http://backend:3000/api`; desde el equipo es localhost.
No uses el nombre `backend` como URL pública del navegador.

### API y Nuxt locales, solo PostgreSQL en Docker

Desde la raíz:

```sh
docker compose stop backend frontend
docker compose up -d db
```

Crea `Backend-H/.env` desde su ejemplo si todavía no existe (`cp` en macOS/Linux,
`Copy-Item` en PowerShell). Edita estos valores; sustituye la URL por las
credenciales y puerto de PostgreSQL definidos en el `.env` raíz:

```dotenv
DATABASE_URL=postgresql://USUARIO:CLAVE@localhost:5432/hotel_db
JWT_SECRET=REEMPLAZAR_POR_UNA_CLAVE_ALEATORIA_DE_AL_MENOS_32_CARACTERES
APP_URL=http://localhost:3001
CORS_ORIGIN=http://localhost:3001
CORS_CREDENTIALS=true
```

En una terminal desde la raíz:

```sh
cd Backend-H
npm ci
npm run db:migrate
# Solo si aún no existe administrador:
# npm run admin:create
npm run dev
```

En otra terminal desde la raíz:

```sh
cd Frontend-H
npm ci
npm run dev -- --host 0.0.0.0 --port 3001
```

El contenedor `db` ya instala esquema y migraciones al crear el volumen. Si usas
un PostgreSQL instalado fuera de Docker, crea primero una base vacía y carga
`database/init/01-schema.sql` con `psql` antes de `npm run db:migrate`.
Copiar el `.env` raíz no configura automáticamente el backend ejecutado con Node;
este lee su propio `Backend-H/.env` al iniciarse desde esa carpeta.

## Autenticación y API

El navegador utiliza `/api/users/session` con cookie HttpOnly y protección CSRF.
No guarda credenciales en localStorage. Después de instalar la actualización de
sesiones hay que volver a iniciar sesión. POST `/api/users/login` mantiene Bearer
para integraciones; el dashboard requiere admin/manager. El registro público de
empleados está cerrado.

## Comprobaciones de desarrollo

Desde la raíz, después de `npm ci` en ambas carpetas:

```sh
npm run lint --prefix Frontend-H
npm run typecheck --prefix Frontend-H
npm run build --prefix Frontend-H
npm run api:check --prefix Backend-H
npm run typecheck --prefix Backend-H
```

Para regenerar OpenAPI y tipos después de modificar sus contratos:

```sh
npm run api:generate --prefix Backend-H
```

Las pruebas backend requieren `DATABASE_URL` y `JWT_SECRET` de prueba, aunque las
unitarias no conecten a PostgreSQL. `TEST_DATABASE_URL` habilita las suites de
integración y debe apuntar exclusivamente a una base aislada. Nunca uses la base
del hotel o de la demo interactiva. Consulta los comandos de
[pruebas operativas](docs/operaciones.md#pruebas-repetibles).

La comprobación de respaldos crea y elimina su propio contenedor desechable:

```sh
python3 database/backup/test-backup.py
```

## Solución de problemas

- **No inicia Docker:** abre Docker Desktop antes de ejecutar Compose.
- **JWT_SECRET ausente:** prepara el `.env` raíz; para Node local, prepara además Backend-H/.env.
- **Puertos ocupados:** detén la otra instancia. Si cambias puertos, ajusta `FRONTEND_PORT`, `BACKEND_PORT`, `POSTGRES_PORT`, `APP_URL` y, si se define, `CORS_ORIGIN`. APP_URL y CORS_ORIGIN deben coincidir con la dirección exacta del navegador.
- **Login falla por CORS/cookie:** no mezcles localhost con 127.0.0.1; usa el mismo host en APP_URL, navegador y API. En Node local configura CORS_CREDENTIALS=true y un origen explícito.
- **Faltan tablas nuevas:** aplica `npm run db:migrate` con el contenedor actualizado. Reiniciar la API no aplica migraciones.
- **No aparecen datos nuevos de demo:** el seed solo se aplica en volúmenes vacíos. Actualizar el código conserva los datos existentes.
- **Contraseña PostgreSQL cambiada en `.env`:** una base ya inicializada conserva la contraseña anterior; editar el archivo no cambia el usuario de PostgreSQL. No borres volúmenes para solucionar una instalación con datos importantes.
- **Invitaciones sin correo:** la instalación normal necesita SMTP. En demo consulta Mailpit en localhost:8025 y los logs de backend.

## Integridad de reservas y pagos

Las operaciones de reservas y check-in/out bloquean primero la habitación y después la reserva en una misma transacción. Al editar fechas se comprueba disponibilidad; al cancelar se recalcula el estado sin liberar otra estancia activa. El esquema inicial también incluye una restricción PostgreSQL de exclusión para solapamientos. Check-in y check-out deben hacerse mediante sus endpoints específicos, no mediante un cambio genérico de estado de reserva.

Los pagos se serializan por reserva y vuelven a comprobar su saldo al completarse. Un pago pendiente no descuenta saldo: pueden existir varios pendientes, pero solo se completan mientras exista saldo. Los importes aceptan hasta dos decimales y las comparaciones usan centavos. No se crean ni completan cobros sobre reservas canceladas; los pagos completados conservan la opción de reembolso.

### Pruebas de integración PostgreSQL

Para preparar un PostgreSQL aislado de la instalación y la demo, desde la raíz:

```sh
docker compose -f docker-compose.test.yml up -d --wait
```

Este proyecto independiente usa PostgreSQL 16, el puerto `127.0.0.1:55432` y
almacenamiento temporal en memoria, sin montar datos del hotel. Las credenciales
son exclusivas de pruebas. No combines este archivo con `docker-compose.yml`.

En PowerShell, desde `Backend-H/`:

```powershell
$env:DATABASE_URL = 'postgresql://hotel_test:isolated-test-only@127.0.0.1:55432/hotel_test'
$env:TEST_DATABASE_URL = $env:DATABASE_URL
$env:JWT_SECRET = 'isolated-test-secret-at-least-32-characters'
$env:NODE_ENV = 'test'
$env:RATE_LIMIT_MAX_REQUESTS = '10000'
npm test -- --runInBand
```

Usa una terminal dedicada a pruebas para no conservar estas variables en la
terminal de desarrollo. Las suites preparan sus propios esquemas; no cargues
datos del hotel. Para eliminar el entorno de pruebas, desde la raíz:

```sh
docker compose -f docker-compose.test.yml down
```

Los datos de prueba se pierden al detener el contenedor; vuelve a ejecutar las
suites para recrearlos.

`Backend-H/tests/concurrency.integration.test.js` crea un esquema temporal propio y lo elimina al terminar. Requiere una **base de pruebas aislada**, con permiso para crear esquemas y la extensión `btree_gist`; no uses la base del hotel. Sin `TEST_DATABASE_URL` esa suite se omite y se ejecutan las pruebas unitarias habituales.

Desde `Backend-H/`, configura `TEST_DATABASE_URL`, `DATABASE_URL` y `JWT_SECRET` con valores de prueba y ejecuta:

```sh
npm test -- --runInBand
```

La suite comprueba peticiones simultáneas de creación, modificación, cancelación, check-in y cobros, además de altas HTTP por rol. No requiere servicios de correo ni pagos externos.

### Configuración, caja y operación

Se añadieron configuración compartida, turnos y arqueo de caja, comprobantes internos imprimibles, calendario de habitaciones, limpieza/mantenimiento e historial de cambios. La recuperación por correo está disponible cuando SMTP está configurado. Consulta [instalación, reglas y pruebas de los módulos operativos](docs/operaciones.md), especialmente la migración requerida para bases existentes.

### Portal del huésped

Los clientes disponen de acceso propio en `/portal` para crear reservas y consultar sus estancias, pagos y comprobantes. El administrador crea y gestiona el acceso desde la ficha del huésped. Consulta [cuentas de demo, migraciones y reglas de aislamiento](docs/portal-huesped.md). El seed actualizado incluye `customer@hotel.com` y `customer2@hotel.com`, ambos con contraseña de demo `Customer123!`.

### Solicitudes, correo, pagos y respaldos

El template incluye solicitudes con aprobación del hotel, SMTP con cola y recuperación de contraseña, checkout configurable (Stripe o demo), presentación editable y copias PostgreSQL con restauración de prueba. Consulta [configuración, límites y operación](docs/servicios-huesped.md). El modo demo no cobra dinero ni entrega correos a Internet.

### Verificaciones automáticas y protección operativa

La primera integración incorpora CI para backend, frontend y E2E, identificadores de petición y logs JSON, protección concurrente del último administrador, validación de configuración y cierre ordenado. Consulta [el detalle de implementación y comprobaciones](docs/entrega-calidad-operacion.md). El workflow está definido en `.github/workflows/checks.yml`.

### Historial de migraciones

Tras instalar el esquema inicial (o actualizar una instalación existente), ejecuta
`npm run db:migrate` desde `Backend-H/`, con `DATABASE_URL` apuntando a la base que
vas a actualizar. En Docker: `docker compose exec backend npm run db:migrate`.
El inicio de la API no ejecuta migraciones automáticamente.

El ejecutor guarda nombre, SHA-256 y fecha en `schema_migrations`. La primera
vez vuelve a ejecutar las migraciones históricas idempotentes y registra cada
una únicamente al confirmarse. Conserva los datos existentes. El esquema inicial
y el seed no forman parte de este historial; no vuelvas a cargar el seed sobre
una base con datos reales.

Cada archivo se confirma por separado, junto con su registro, para permitir que
el rol `customer` exista antes de utilizarlo. Un bloqueo PostgreSQL serializa
los ejecutores concurrentes (espera máxima de bloqueo: 30 segundos). Si falla
un archivo, se revierte ese archivo; los anteriores permanecen confirmados y
el siguiente intento continúa desde allí. Haz un respaldo antes de actualizar.

No edites, renombres ni elimines archivos ya registrados: un checksum diferente
o un archivo ausente detiene la actualización. Restaura el archivo original y
crea una migración con un número posterior al último. Las nuevas migraciones
no deben controlar transacciones internas ni usar operaciones que requieran
salir de una transacción (por ejemplo `CREATE INDEX CONCURRENTLY`).

### Sesiones, invitaciones y copia externa

Consulta [la guía de operación](docs/sesiones-respaldos-contratos.md) para actualizar una base existente, configurar el destino de respaldos e invitar personal o huéspedes. Los contratos se generan con `npm run api:generate` y se verifican con `npm run api:check` desde `Backend-H/`.
