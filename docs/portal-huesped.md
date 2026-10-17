# Portal del huésped

Se implementan acceso de clientes, aislamiento de datos y consulta de sus estancias, pagos y comprobantes. El portal permite crear reservas en línea y consultar estancias, pagos y comprobantes. Los cambios o cancelaciones de reservas existentes se gestionan con recepción. Los pagos por pasarela y la recuperación de contraseña continúan pendientes.

## Acceso de demostración

En `/auth/login`:

| Cuenta | Contraseña | Ficha vinculada |
|---|---|---|
| `customer@hotel.com` | `Customer123!` | María González; estancia futura e histórica con pagos |
| `customer2@hotel.com` | `Customer123!` | John Smith; estancia activa |

Al iniciar sesión se dirige a `/portal`, incluso si la URL anterior era administrativa. El personal continúa entrando a su panel habitual. Las credenciales son públicas y exclusivas de demostración.

## Crear un acceso real

Un administrador abre **Huéspedes → ficha del huésped → Acceso al portal del huésped** y define correo de acceso y contraseña inicial. El acceso se vincula al ID de la ficha, no al correo del cliente. Solo se permite una cuenta por ficha activa. El administrador entrega las credenciales por un medio seguro; no se envían correos automáticamente.

El mismo panel activa/desactiva la cuenta. Desactivar la cuenta o la ficha del huésped bloquea peticiones con sesiones existentes y nuevos inicios de sesión. Las cuentas customer se excluyen de la lista de empleados y de los responsables de tareas.

## Migraciones y demo existente

El orden es: `01-schema.sql` → `001-operations.sql` → `002-customer-role.sql` → `003-customer-portal.sql` → seed, solo en una base nueva. El nuevo valor del enum se confirma en un archivo separado antes de usarlo en restricciones. Las bases existentes conservan sus datos.

Desde `Backend-H/`, con `DATABASE_URL` de la instalación correspondiente:

```sh
npm run db:migrate
```

El comando aplica todas las migraciones en orden. Con un backend Docker existente, recréalo para incluir el script nuevo y usa el volumen de migraciones que define Compose; aplica las migraciones antes de habilitar tráfico con las nuevas consultas.

También se pueden aplicar los archivos directamente con `psql -v ON_ERROR_STOP=1`, en el orden indicado. Guarda previamente una copia de seguridad de una instalación real.

En una **demo ya cargada**, aplica las migraciones y actualiza/reinicia backend y frontend con la versión que protege el portal. Solo entonces ejecuta `database/demo-customer-accounts.sql`. Añade únicamente las dos cuentas ficticias a sus fichas conocidas; no reemplaza cuentas ni contraseñas existentes y no borra reservas. Si hay un conflicto de correo o vinculación, falla y revierte la operación. No uses ese script en producción.

El seed completo `database/init/data_seed.sql` contiene las dos cuentas para instalaciones nuevas. `database/verify-demo.sql` comprueba siete cuentas (cinco empleados y dos clientes), su vinculación y las estancias de muestra. Reiniciar un contenedor con un volumen existente no vuelve a cargar el seed.

## Seguridad y contrato

- `/api/portal/*` exige customer; todas las rutas operativas exigen un rol explícito del personal.
- Cada petición comprueba rol, cuenta activa y ficha activa desde PostgreSQL. El vínculo de ficha recibido en un JWT o en el navegador no se utiliza para autorizar.
- Listados, detalle y comprobantes filtran por la ficha autenticada en SQL. Un ID ajeno devuelve 404.
- No hay autorregistro público ni asociación automática por email, para evitar apropiación de fichas existentes.
- Los DTO del portal omiten notas internas, referencias bancarias y empleados que registraron movimientos. Los comprobantes conservan sus datos de emisión y reflejan si el pago fue reembolsado.
- El portal no incluye enlaces ni formularios operativos. Ocultar menús se complementa con autorización en el servidor.

Contrato documentado en `/api-docs`, etiqueta **Guest portal**.

## Validación

La suite PostgreSQL prueba acceso propio/ajeno, token con rol y client_id falsificados, bloqueo de rutas operativas, exclusión del equipo, cuenta única y revocación por cuenta o ficha inactiva. Se ejecuta con las variables de prueba descritas en el README y `npm test -- --runInBand` dentro de `Backend-H/`.

`Frontend-H/tests/e2e/customer.spec.ts` comprueba acceso móvil, consulta de reservas y comprobantes, bloqueo del panel, cierre de sesión y creación/desactivación de acceso por el administrador. Con Chrome instalado, una API e interfaz conectadas a una demo desechable y el seed actualizado, ejecuta `E2E_ALLOW_WRITES=1 npm run test:e2e` desde `Frontend-H/`. Conserva las pruebas del personal. No lo ejecutes contra una base real: crea datos ficticios para verificar el flujo.

## Reservar desde el portal

En **Nueva reserva** o **Reservar habitación**, el huésped consulta fechas, elige una habitación y confirma su estancia. El servidor vincula automáticamente la ficha autenticada, calcula el importe y vuelve a comprobar disponibilidad dentro de una transacción. Se admite llegada desde hoy según la zona horaria del hotel, entre 1 y 365 noches. Las habitaciones bloqueadas, con tareas pendientes o con reservas solapadas no se ofrecen. La salida es exclusiva: permite estancias contiguas.

La tarifa y moneda de la consulta se verifican al confirmar. Si cambiaron o alguien reservó la habitación, se informa el conflicto y se pide consultar de nuevo. Un clic repetido sobre las mismas fechas y habitación no crea otra reserva. El formulario bloquea envíos simultáneos y no reintenta automáticamente el POST. La reserva queda confirmada y sin pago registrado; el huésped coordina el cobro con recepción.

El enlace **Ir al contenido** se mantiene para accesibilidad y solo aparece al recibir el foco del teclado, tanto en el portal como en el panel del personal.
