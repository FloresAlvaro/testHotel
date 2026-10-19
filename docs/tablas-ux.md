# Tablas y filtros de la interfaz

Los listados de reservas, huéspedes, pagos, equipo, cobros en línea, correos y solicitudes se paginan desde la API. La búsqueda y los filtros se aplican antes de paginar; `pagination.total` representa todos los resultados coincidentes. `pageSize` admite 1–100 y `q` un máximo de 200 caracteres. Las fechas son inclusivas y usan la fecha del hotel.

`GET /api/payments` incluye `summary` con importes decimales y cantidades agregadas de todos los resultados filtrados. Los reportes consultan los pagos del período en el servidor y exportan todas sus páginas. El promedio de ingresos considera solo cobros completados. Los filtros de método afectan detalle, resumen y gráficos.

`GET /api/operations/email-status` devuelve los mensajes en `data`, la paginación en `pagination` y `configured`/`demo` en la raíz. Los pagos en línea incluyen huésped, ID y fecha. Las solicitudes también incluyen `pagination`.

En Reservas, «Esta semana» abarca lunes–domingo; «Este mes» incluye el año; «Hoy» utiliza la zona del hotel. La ocupación actual solo cuenta habitaciones ocupadas: una reserva futura se representa como reservada, sin marcar 100% de ocupación.

Las tablas muestran carga y errores por separado del estado vacío, indican los resultados de paginación y ofrecen limpieza de filtros. Las acciones permanecen visibles al desplazar tablas anchas; el calendario mantiene fija la habitación. La ficha del huésped traduce los estados y enlaza al detalle de cada reserva. Equipo solicita confirmación antes de modificar un acceso.

Caja conserva el alcance indicado de los últimos 100 turnos, con búsqueda local, filtro de estado y páginas de 10; las diferencias se destacan con una etiqueta además del color.

## Verificación

- Frontend: `npm run lint`, `npm run typecheck`, `npm run build` desde `Frontend-H/`.
- Fechas: `node --experimental-strip-types --test Frontend-H/tests/unit/table-dates.test.mjs` desde la raíz, con Node 22.
- Backend: `npm test -- --runInBand` con variables de prueba del README. La regresión de listados crea 106 pagos y comprueba páginas posteriores, resumen completo y períodos históricos.
- Las integraciones necesitan exclusivamente la base aislada de `docker-compose.test.yml`; nunca deben apuntar a la demo.
