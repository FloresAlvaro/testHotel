# Módulos operativos

El arranque del sistema y de la demo está documentado en el [README](../README.md). La recuperación de contraseña por correo ya está disponible cuando SMTP está configurado.

## Instalación con datos existentes

Haz una copia de seguridad antes de aplicar cambios en una instalación real. La migración conserva reservas, huéspedes, pagos y usuarios. No ejecutes el seed sobre una base con datos.

Desde `Backend-H/`, con `DATABASE_URL` configurada:

```sh
npm run db:migrate
```

Con Docker Compose existente, desde la raíz:

```sh
docker compose up -d db backups
docker compose exec -T backups sh /scripts/backup.sh
docker compose build backend frontend
docker compose run --rm migrate
docker compose exec -T db sh /security/provision.sh
docker compose up -d backend frontend backups
```

Continúa después del respaldo solo si su restauración fue verificada. Para la
demo usa la [secuencia completa](demo.md#actualizar-una-demo-existente), siempre
con `-p hotel-demo` y ambos archivos Compose. No elimines volúmenes ni ejecutes
SQL histórico manualmente: el runner conserva el orden y los checksums.

## Uso y reglas

- **Configuración**: solo el administrador guarda; el resto del equipo consulta. Nombre y moneda se usan en la interfaz y comprobantes. Horarios y zona horaria se comparten; la hora de salida se usa para calcular retrasos. Una versión evita sobrescribir cambios de otra sesión. Al recibir un conflicto, «Recargar configuración» recarga la configuración del servidor. La moneda no se cambia cuando ya hay reservas o turnos, porque no se realiza conversión de importes.
- **Caja**: cada empleado abre su turno con un fondo inicial. Para completar o reembolsar pagos se necesita un turno propio abierto. Se mantienen los permisos existentes: admin/manager confirman y reembolsan pagos. El cierre registra efectivo contado, esperado, diferencia y totales por medio. Tarjetas, transferencias y cheques se informan separados del efectivo. El bloqueo transaccional asegura que un cobro concurrente queda incluido en el cierre o se rechaza porque el turno ya cerró. No se editan cierres.
- **Comprobantes**: se generan al completar el pago y se abren desde su detalle. Se imprimen desde el navegador. Son comprobantes internos, sin integración fiscal. La instantánea conserva los datos originales aunque cambie el hotel o se reembolse el pago. La migración reconstruye comprobantes de pagos históricos, marcados como tales; no inventa turnos ni movimientos históricos de caja.
- **Calendario**: vista de siete noches, navegación por semanas, habitaciones paginadas y enlaces a reservas. La salida es exclusiva; reservas contiguas no se solapan. Las habitaciones actualmente bloqueadas se señalan como tales; el bloqueo no representa una programación futura de mantenimiento.
- **Tareas**: cada check-out genera una limpieza automáticamente. Admin/manager crean tareas de limpieza o mantenimiento y asignan empleados activos. El responsable actualiza su tarea; admin/manager pueden actualizar y reasignar. La habitación vuelve a estar disponible cuando se completan todas sus tareas y se recalcula su situación de reservas. No se puede habilitar manualmente una habitación con tareas pendientes. Una tarea creada durante una estancia conserva la habitación ocupada; al salir queda bloqueada para limpieza y mantenimiento.
- **Historial**: admin/manager filtran por sección, acción, responsable, registro y fechas. Se registran cambios de reservas, pagos, habitaciones, tipos, huéspedes, empleados, check-in/out, configuración, tareas y turnos mediante triggers dentro de la transacción. Las contraseñas nunca se guardan en el historial. Los cambios SQL sin contexto de aplicación figuran como sistema/migración. No hay endpoint para modificar o borrar auditoría.

Las preferencias de notificaciones y las exportaciones de preferencias siguen siendo locales y su interfaz lo indica; no son servicios de envío ni copias de seguridad de la base.

El límite general de API respeta `RATE_LIMIT_MAX_REQUESTS` también en producción (1000 solicitudes por 15 minutos e IP de forma predeterminada). El acceso tiene un límite separado de 20 intentos fallidos por 15 minutos; los accesos correctos no lo consumen. Esto permite navegar por los módulos sin agotar el anterior límite fijo de 50.

API y cuerpos de petición: `/api-docs` y `/api-docs.json`, etiqueta **Operations**.

## Pruebas repetibles

Backend: configura `DATABASE_URL`, `TEST_DATABASE_URL` y `JWT_SECRET` de prueba (al menos 32 caracteres) y ejecuta `npm test -- --runInBand` en `Backend-H/`. La suite PostgreSQL crea y elimina su propio esquema; usa una base desechable. Comprueba permisos, saldos, concurrencia, versión de configuración, caja, reembolsos, recibos inmutables, limpieza, calendario y auditoría.

Frontend: `npm run lint`, `npm run typecheck`, `npm run build`.

En la API de pruebas usa `RATE_LIMIT_MAX_REQUESTS=10000` para que las ejecuciones repetidas no agoten el límite compartido de localhost. Mantén el límite habitual de producción.

Pruebas de navegador con Chrome instalado, una API en 3300 y la interfaz compilada en 3311, **ambas conectadas a una demo desechable**:

```sh
E2E_ALLOW_WRITES=1 npm run test:e2e
```

Opcionales: `E2E_BASE_URL`, `E2E_API_URL`, `E2E_EMAIL`, `E2E_PASSWORD`. Los valores por defecto usan la demo local y su administrador. Las pruebas crean datos ficticios identificados con E2E y no los eliminan; usa una base de prueba nueva para cada ejecución. Sin `E2E_ALLOW_WRITES=1` se omiten para evitar escribir accidentalmente sobre otra instalación.

El flujo de navegador crea huésped y reserva, registra entrada, abre caja, cobra, consulta comprobante, registra salida, finaliza limpieza y cierra caja. Otra prueba comprueba configuración entre dos sesiones y menú móvil. Los fallos guardan captura y traza en `Frontend-H/test-results/` (ignorados por Git).
