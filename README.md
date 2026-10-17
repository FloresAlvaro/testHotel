# Sistema de gestion hotelera

Aplicacion para administrar usuarios, clientes, habitaciones, reservas, entradas y salidas, pagos e indicadores. Incluye frontend Nuxt, API REST con Express y PostgreSQL.

## Demo con datos de ejemplo

Consulta [la guía de demo](docs/demo.md) para iniciar una instancia separada con usuarios por rol, reservas y pagos. La inicialización normal carga solo el esquema; la demo se activa con `docker-compose.demo.yml`.

## Requisitos

- Docker Desktop con Docker Compose v2.
- Node.js 20 o superior y npm solo para desarrollo local o pruebas.

## Inicio completo con Docker

Ejecuta los comandos desde la raiz del repositorio. Primero crea el archivo de entorno:

```powershell
Copy-Item .env.example .env
```

Edita `.env` y reemplaza `JWT_SECRET` por una clave aleatoria de al menos 32 caracteres. Para generarla en PowerShell:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Los valores de `.env.example` sirven para desarrollo local; cambia tambien la contrasena de PostgreSQL antes de exponer el sistema. Si cambias `POSTGRES_PASSWORD`, usa caracteres seguros para URL, por ejemplo letras y numeros.

Construye las imagenes e inicia PostgreSQL, el backend y el frontend:

```powershell
docker compose up --build -d
```

Abre la aplicacion en `http://localhost:3001`. La API esta en `http://localhost:3000`, la documentacion en `http://localhost:3000/api-docs` y PostgreSQL se publica en el puerto `5432`. En el primer inicio, PostgreSQL crea el esquema y aplica las migraciones de `database/migrations/` en orden.

Comprueba el estado y los logs:

```powershell
docker compose ps
docker compose logs -f backend frontend
```

Verifica el backend:

```powershell
Invoke-RestMethod http://localhost:3000/health
```

Para detener los servicios sin borrar los datos:

```powershell
docker compose down
```

Los datos permanecen en el volumen `postgres_data`. El script de inicializacion se ejecuta solo al crear un volumen vacio; los cambios posteriores al SQL no se aplican automaticamente. `docker compose down -v` elimina la base de datos y todos sus datos.

Si un puerto esta ocupado, cambia `FRONTEND_PORT`, `BACKEND_PORT` o `POSTGRES_PORT` en `.env` y vuelve a ejecutar Compose. El frontend usa la URL interna de Docker para sus solicitudes SSR y la URL publicada del backend desde el navegador.

## Desarrollo local

Puedes mantener PostgreSQL y el backend en Docker y ejecutar Nuxt con recarga en caliente. Desde la raiz:

```powershell
Copy-Item .env.example .env
docker compose up --build -d db backend
Set-Location Frontend-H
npm ci
$env:NUXT_PUBLIC_API_BASE = 'http://localhost:3000/api'
$env:NUXT_API_INTERNAL_BASE = 'http://localhost:3000/api'
npm run dev -- --host 0.0.0.0 --port 3001
```

La interfaz local quedara en `http://localhost:3001`. Para ejecutar el backend fuera de Docker, crea `Backend-H/.env` desde `Backend-H/.env.example` y configura `DATABASE_URL` con una instancia PostgreSQL accesible. La base debe existir antes de aplicar el esquema:

```powershell
psql -U hotel_user -d hotel_db -f database/init/01-schema.sql
psql -U hotel_user -d hotel_db -f database/migrations/001-operations.sql
psql -U hotel_user -d hotel_db -f database/migrations/002-customer-role.sql
psql -U hotel_user -d hotel_db -f database/migrations/003-customer-portal.sql
psql -U hotel_user -d hotel_db -f database/migrations/004-guest-services.sql
psql -U hotel_user -d hotel_db -f database/migrations/005-reservation-guests.sql
Set-Location Backend-H
npm ci
npm run dev
```

Configura tambien `JWT_SECRET` con al menos 32 caracteres. El backend valida `DATABASE_URL` y `JWT_SECRET` al arrancar.

## API y primer usuario

- Estado: `GET /health`
- Swagger: `http://localhost:3000/api-docs`
- OpenAPI JSON: `http://localhost:3000/api-docs.json`
- Recursos: `/api/users`, `/api/clients`, `/api/rooms`, `/api/room-types`, `/api/reservations`, `/api/check-in`, `/api/payments` y `/api/dashboard`

El alta pública de empleados está deshabilitada. Para el primer administrador, configura `Backend-H/.env` según las instrucciones de desarrollo y, desde `Backend-H/`, ejecuta:

```sh
npm run admin:create
```

El comando solicita nombre, email y contraseña (entrada oculta); solo funciona si todavía no existe ningún administrador y no imprime la contraseña. No recibe credenciales en argumentos de línea de comandos. En Docker puedes ejecutarlo con `docker compose exec backend npm run admin:create`.

Después inicia sesión y crea empleados desde **Configuración → Usuarios**, eligiendo su rol. La API es `POST /api/users`, con `name`, `email`, `password` y `role` opcional (por defecto `receptionist`). Requiere un administrador autenticado y devuelve el usuario creado sin token de sesión. `POST /api/users/register` conserva el mismo comportamiento como alias protegido. Las cuentas existentes conservan sus credenciales.

El inicio de sesión está en `POST /api/users/login`. Las rutas protegidas requieren `Authorization: Bearer <token>`. El dashboard requiere rol `admin` o `manager`.

## Pruebas

```powershell
Set-Location Backend-H
npm ci
$env:DATABASE_URL = 'postgresql://hotel_user:hotel_password@localhost:5432/hotel_db'
$env:JWT_SECRET = 'test-secret-at-least-32-characters-long'
npm test -- --runInBand
```

Las pruebas no requieren una instancia PostgreSQL activa; esas variables solo son necesarias para cargar la configuracion del backend.

## Solucion de problemas

- Si Compose indica que falta `JWT_SECRET`, confirma que copiaste `.env.example` como `.env` en la raiz y vuelve a iniciar los servicios.
- Si un puerto no esta disponible, modifica los puertos en `.env`; no cambies los puertos internos de los contenedores.
- Si cambiaste las credenciales PostgreSQL despues de inicializar el volumen, la base existente conserva las credenciales anteriores. Para reiniciar desde cero, `docker compose down -v` borra los datos.
- Para revisar un servicio concreto, usa `docker compose logs -f db`, `docker compose logs -f backend` o `docker compose logs -f frontend`.

## Integridad de reservas y pagos

Las operaciones de reservas y check-in/out bloquean primero la habitación y después la reserva en una misma transacción. Al editar fechas se comprueba disponibilidad; al cancelar se recalcula el estado sin liberar otra estancia activa. El esquema inicial también incluye una restricción PostgreSQL de exclusión para solapamientos. Check-in y check-out deben hacerse mediante sus endpoints específicos, no mediante un cambio genérico de estado de reserva.

Los pagos se serializan por reserva y vuelven a comprobar su saldo al completarse. Un pago pendiente no descuenta saldo: pueden existir varios pendientes, pero solo se completan mientras exista saldo. Los importes aceptan hasta dos decimales y las comparaciones usan centavos. No se crean ni completan cobros sobre reservas canceladas; los pagos completados conservan la opción de reembolso.

### Pruebas de integración PostgreSQL

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

La primera integración incorpora CI para backend, frontend y E2E, identificadores de petición y logs JSON, protección concurrente del último administrador, validación de configuración y cierre ordenado. Consulta [el detalle de implementación y comprobaciones](docs/entrega-calidad-operacion.md). El workflow se ejecutará al publicar estos archivos en GitHub.

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
