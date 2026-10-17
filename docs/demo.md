# Demo del sistema hotelero

Datos ficticios para uso local, con contraseñas públicas. La carga usa la fecha del día en `America/La_Paz`; si reutilizas el volumen días después, las reservas conservan sus fechas originales.

## Inicio con Docker

Configura el `.env` raíz a partir de `.env.example`, incluyendo `JWT_SECRET`, tal como explica el README. Desde la raíz:

```sh
docker compose -p hotel-demo -f docker-compose.yml -f docker-compose.demo.yml up --build -d
```

Usa un proyecto y volumen separados de la base habitual. Comparte los puertos configurados en `.env`: detén la otra instancia si ocupa esos puertos o configura `FRONTEND_PORT`, `BACKEND_PORT` y `POSTGRES_PORT` con puertos libres antes de arrancar. Con los valores predeterminados, abre http://localhost:3001.

El archivo base de Compose carga el esquema y las migraciones de operaciones y portal. La variante demo añade `database/init/data_seed.sql`. PostgreSQL ejecuta esos archivos en orden y el seed al final, solo al inicializar un volumen vacío. Reiniciar los contenedores no actualiza una demo ya cargada.

Para regenerar exclusivamente los datos de esta demo (borra sus cambios):

```sh
docker compose -p hotel-demo -f docker-compose.yml -f docker-compose.demo.yml down -v
docker compose -p hotel-demo -f docker-compose.yml -f docker-compose.demo.yml up --build -d
```

El seed exige tablas vacías y falla sin modificar datos existentes si se intenta cargar de nuevo. No es una migración ni una actualización de datos del hotel.

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

- **Dashboard:** 10 habitaciones, 2 ocupadas, 4 reservadas, 2 disponibles y 2 en mantenimiento; 8 clientes y 10 reservas al cargar los datos.
- **Check-in:** habitación 203, Sofía Martínez, llegada de hoy. Reserva de Bs. 240, adelanto completado de Bs. 60 y saldo pendiente de Bs. 180.
- **Check-out:** habitación 201, Pedro Ramírez, salida prevista hoy. Los Bs. 360 ya están pagados. Al salir, la habitación pasa a mantenimiento según el flujo actual.
- **Pagos:** habitación 102, John Smith, check-in realizado hoy. Reserva de Bs. 120, adelanto completado de Bs. 100 y saldo pendiente de Bs. 20.
- **Disponibilidad:** habitación 202 con dos reservas consecutivas, desde hoy +5 hasta +8 y desde +8 hasta +10. Demuestra que una salida y entrada el mismo día son compatibles.
- **Cancelación:** reserva futura de la habitación 101. Se puede cancelar sin afectar sus estancias históricas.
- **Reportes:** pagos históricos en reservas finalizadas, cobros completados de hoy y ejemplos pendientes, fallidos y reembolsados. Solo los completados cuentan como ingresos.
- **Usuarios:** entrar como administrador para crear un empleado con su rol; la sesión del administrador se conserva.

Para comprobar cantidades, precios, saldos, estados, comprobantes, configuración, tareas y fechas justo después de cargar el seed:

```sh
docker compose -p hotel-demo -f docker-compose.yml -f docker-compose.demo.yml exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1' < database/verify-demo.sql
```

La concurrencia se verifica en `Backend-H/tests/concurrency.integration.test.js`; un seed estático prepara escenarios de demostración, no simula solicitudes simultáneas.
