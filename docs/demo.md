# Demo del sistema hotelero

Demo local con datos ficticios y contraseñas públicas. Usa el proyecto Docker
`hotel-demo` y un volumen PostgreSQL separado del sistema normal. Ejecuta los
comandos desde la raíz del repositorio, con Docker Desktop iniciado.

## Preparar el entorno

Si no existe `.env`, créalo desde `.env.example`; conserva uno ya configurado.

macOS/Linux (Bash o zsh):

```sh
[ -f .env ] || cp .env.example .env
```

PowerShell:

```powershell
if (!(Test-Path .env)) { Copy-Item .env.example .env }
```

Edita JWT_SECRET con una clave aleatoria de al menos 32 caracteres y define
POSTGRES_PASSWORD. Consulta [los requisitos del README](../README.md#requisitos-y-ubicación).
Los comandos Docker siguientes también sirven en PowerShell.

El sistema normal y la demo comparten los puertos predeterminados. Si está
encendido el sistema normal con esos puertos, detenlo sin borrar sus datos:

```sh
docker compose down
```

## Primer arranque o volver a iniciar

```sh
docker compose -p hotel-demo -f docker-compose.yml -f docker-compose.demo.yml up --build -d
docker compose -p hotel-demo -f docker-compose.yml -f docker-compose.demo.yml exec backend npm run db:migrate
docker compose -p hotel-demo -f docker-compose.yml -f docker-compose.demo.yml ps
```

No necesitas crear un administrador: el seed ya lo incluye. El primer `up`
puede tardar mientras instala dependencias y compila la interfaz.

| Servicio | Dirección |
|---|---|
| Aplicación y login | http://localhost:3001/auth/login |
| Portal customer | http://localhost:3001/portal |
| Nueva reserva customer | http://localhost:3001/portal/book |
| Buzón de correos Mailpit | http://localhost:8025 |
| Salud de la API | http://localhost:3000/health |
| Documentación API | http://localhost:3000/api-docs |

Los enlaces del portal requieren iniciar sesión como customer. Las cuentas del
personal se dirigen al panel del hotel. Los pagos demo no mueven dinero y los
correos llegan únicamente a Mailpit.

PostgreSQL aplica esquema → migraciones → `database/init/data_seed.sql` **solo al
crear un volumen vacío**. El runner registra/verifica el historial; no vuelve a
cargar el seed. Las fechas del seed se calculan al cargarlo en America/La_Paz;
reutilizar el volumen conserva esas fechas y las operaciones realizadas.

## Consultar logs y detener

```sh
docker compose -p hotel-demo -f docker-compose.yml -f docker-compose.demo.yml logs -f backend frontend
docker compose -p hotel-demo -f docker-compose.yml -f docker-compose.demo.yml logs --tail=50 backups mailpit
```

Sal de los logs con Ctrl+C. Para detener toda la demo sin perder datos:

```sh
docker compose -p hotel-demo -f docker-compose.yml -f docker-compose.demo.yml down
```

Para reiniciarla, repite `up -d` con los mismos argumentos de proyecto y archivos.
No cambies a `docker compose up` sin el override: ese comando corresponde al
sistema normal.

## Actualizar una demo existente

Conserva los datos y las contraseñas actuales. Ejecuta los pasos en orden y
continúa tras el respaldo solo si informa restauración verificada:

```sh
docker compose -p hotel-demo -f docker-compose.yml -f docker-compose.demo.yml up -d db backups mailpit
docker compose -p hotel-demo -f docker-compose.yml -f docker-compose.demo.yml exec -T backups sh /scripts/backup.sh
docker compose -p hotel-demo -f docker-compose.yml -f docker-compose.demo.yml build backend frontend
docker compose -p hotel-demo -f docker-compose.yml -f docker-compose.demo.yml run --rm --no-deps backend npm run db:migrate
docker compose -p hotel-demo -f docker-compose.yml -f docker-compose.demo.yml up -d backend frontend backups mailpit
```

Las migraciones 001..006 incluyen operaciones, portal, servicios del huésped,
ocupación, sesiones e invitaciones. No es necesario volver a aplicar cada SQL a
mano. Después de actualizar a sesiones HttpOnly, inicia sesión nuevamente.

## Regenerar los datos ficticios desde cero (borra la demo)

**Esta secuencia elimina la base y los respaldos del proyecto hotel-demo**, además
de las reservas y cambios que hayas hecho allí. Úsala únicamente si quieres
recargar el seed con fechas actuales; no sirve para una actualización normal.
No afecta a los volúmenes de un proyecto distinto, como el sistema normal.

```sh
docker compose -p hotel-demo -f docker-compose.yml -f docker-compose.demo.yml down -v
docker compose -p hotel-demo -f docker-compose.yml -f docker-compose.demo.yml up --build -d
docker compose -p hotel-demo -f docker-compose.yml -f docker-compose.demo.yml exec backend npm run db:migrate
```

No cargues el seed manualmente sobre una base ya poblada: exige tablas vacías y
rechaza esa operación. Para conservar los datos, usa la sección de actualización.

## Cuentas de demostración

| Cuenta | Contraseña | Acceso |
|---|---|---|
| `admin@hotel.com` | `Admin123!` | Administración y alta de empleados |
| `manager@hotel.com` | `Manager123!` | Gerencia |
| `recepcion1@hotel.com` | `Recep123!` | Recepción |
| `recepcion2@hotel.com` | `Recep123!` | Recepción |
| `customer@hotel.com` | `Customer123!` | Portal de María González |
| `customer2@hotel.com` | `Customer123!` | Portal de John Smith |
| `inactivo@hotel.com` | `Recep123!` | Cuenta desactivada; inicio de sesión rechazado |

Para añadir los accesos customer en una demo existente sin borrar datos, consulta [portal del huésped](portal-huesped.md).

La demo ya crea al administrador, por lo que no necesita `npm run admin:create`. El registro público permanece cerrado.

## Recorrido sugerido

- **Dashboard:** habitaciones disponibles, ocupadas, reservadas y en mantenimiento, con estancias actuales y futuras. Las cantidades cambian al operar; usa el verificador justo después de cargar el seed.
- **Check-in:** habitación 203, Sofía Martínez, llegada de hoy. Reserva de Bs. 240, adelanto completado de Bs. 60 y saldo pendiente de Bs. 180.
- **Check-out:** habitación 201, Pedro Ramírez, salida prevista hoy. Los Bs. 360 ya están pagados. Al salir, la habitación pasa a mantenimiento según el flujo actual.
- **Pagos:** habitación 102, John Smith, check-in realizado hoy. Reserva de Bs. 120, adelanto completado de Bs. 100 y saldo pendiente de Bs. 20.
- **Disponibilidad:** habitación 202 con dos reservas consecutivas, desde hoy +5 hasta +8 y desde +8 hasta +10. Demuestra que una salida y entrada el mismo día son compatibles.
- **Cancelación:** reserva futura de la habitación 101. Se puede cancelar sin afectar sus estancias históricas.
- **Reportes:** pagos históricos en reservas finalizadas, cobros completados de hoy y ejemplos pendientes, fallidos y reembolsados. Solo los completados cuentan como ingresos.
- **Equipo:** entrar como administrador, invitar personal con su rol y abrir el mensaje en Mailpit para elegir una contraseña.
- **Customer:** entrar con customer@hotel.com, crear una reserva y consultar pagos, comprobantes y solicitudes de cambios o cancelación.
- **Invitación del huésped:** desde su ficha, enviar una invitación y abrirla desde Mailpit; su acceso queda limitado al portal.

Para comprobar cantidades, precios, saldos, estados, comprobantes, configuración, tareas y fechas justo después de cargar el seed:

```sh
docker compose -p hotel-demo -f docker-compose.yml -f docker-compose.demo.yml cp database/verify-demo.sql db:/tmp/verify-demo.sql
docker compose -p hotel-demo -f docker-compose.yml -f docker-compose.demo.yml exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -f /tmp/verify-demo.sql'
```

La concurrencia se verifica en `Backend-H/tests/concurrency.integration.test.js`; un seed estático prepara escenarios de demostración, no simula solicitudes simultáneas.

## Frontend de demo con recarga en caliente

Primero prepara/inicia la demo con los pasos anteriores. Con Node.js 22.19 o
posterior de la rama 22.x, puedes ejecutar Nuxt en el equipo usando la API y el
buzón de la demo en Docker:

```sh
docker compose -p hotel-demo -f docker-compose.yml -f docker-compose.demo.yml stop frontend
docker compose -p hotel-demo -f docker-compose.yml -f docker-compose.demo.yml up -d db backend mailpit
cd Frontend-H
npm ci
npm run dev -- --host 0.0.0.0 --port 3001
```

Abre http://localhost:3001. Para volver al frontend Docker, termina Nuxt con
Ctrl+C, regresa a la raíz y ejecuta:

```sh
docker compose -p hotel-demo -f docker-compose.yml -f docker-compose.demo.yml up -d frontend
```

Si cambias los puertos predeterminados, ajusta APP_URL/CORS y las URLs de Nuxt
como indica el [README](../README.md#desarrollo-local-con-recarga-en-caliente).

## Respaldos e invitaciones

Para ver el resultado del último respaldo:

```sh
docker compose -p hotel-demo -f docker-compose.yml -f docker-compose.demo.yml exec -T backups cat /backups/latest.json
docker compose -p hotel-demo -f docker-compose.yml -f docker-compose.demo.yml exec -T backups cat /backups/status.json
```

Sin override externo, la demo guarda copias en un volumen local. Para conectar
un destino real y restaurar a una base nueva, consulta
[sesiones, respaldos y contratos](sesiones-respaldos-contratos.md).
Las invitaciones y la recuperación se prueban desde el buzón Mailpit: no configures
SMTP de producción para demostrar el sistema con direcciones ficticias.
