# Implementación UX/UI — 25 de octubre de 2026

Implementación de los diez grupos de mejora de `auditoria-ux-ui-2026-10-25.md`, conservando las alineaciones de tablas aprobadas y las protecciones de seguridad existentes. Cambios comprobados localmente y desplegados en la demo Docker `hotel-demo`. La publicación Git se registra en el historial del repositorio. No hay migraciones nuevas para estas mejoras.

## Cambios por hallazgo

| ID | Implementación |
| --- | --- |
| UX-01 | Habitaciones usa búsqueda, estado, piso y paginación en servidor, con total real y recuperación de errores. Se puede filtrar cualquier piso, incluido cero. Tipos de habitación también admite búsqueda paginada. Los selectores de huésped, reserva y tipo ofrecen búsqueda remota, páginas y conservación de la selección aunque no aparezca en la búsqueda actual. Las habitaciones de una nueva reserva proceden de la disponibilidad por fechas, sin el corte anterior de cien registros. |
| UX-02 | Contado inicialmente vacío; revisión del turno, moneda, esperado, contado y diferencia antes del cierre. Confirmación explícita de faltante/sobrante y posibilidad de volver a contar. Cero sigue siendo válido cuando se introduce deliberadamente. Los errores se muestran dentro de la revisión y se conserva el importe. |
| UX-03 | Fechas antes de elegir habitación; se vuelve a consultar disponibilidad y se excluye mantenimiento. Las notas y el huésped se conservan al cambiar fechas. En pagos se muestran reserva, total, cobrado, saldo y pagos pendientes de confirmar; monto sugerido editable, actualización de saldo y máximo visible. Se mantienen las validaciones y transacciones del servidor frente a cambios concurrentes. |
| UX-04 | El alcance local de las preferencias se explica antes de los controles; Push figura como pendiente y está deshabilitado. Los correos transaccionales siguen siendo independientes. No se presenta como implementado un nuevo sistema de notificaciones. |
| UX-05 | Confirmación de descarte al cerrar por Escape, fondo o botón y al navegar con reservas, huéspedes, habitaciones o pagos modificados. Protección de salida en configuración y presentación. Los borradores se conservan en memoria; no se guardan datos personales en almacenamiento persistente. Se permite salir después de guardar correctamente. |
| UX-06 | En móvil, reservas presenta tarjetas con huésped, ID, habitación, fechas, estado, total y acciones juntos. La tabla de escritorio conserva las alineaciones existentes. |
| UX-07 | Filtro sin coincidencias ofrece limpiar filtros. Recuperación verifica el enlace antes de pedir contraseña y permite solicitar otro si falta, venció o ya se usó. Solicitar acceso muestra teléfono/correo configurados por el hotel mediante un endpoint público limitado a esos datos. |
| UX-08 | Etiquetas de reservas compartidas entre detalle, lista, calendario y portal: Confirmada, En estancia, Finalizada y Cancelada. Estados de pagos en línea compartidos, sin mostrar enums técnicos como alternativa. Corregido el plural de noches en el resumen del portal y simplificada la ayuda principal de contraseña, conservando el límite real en ayuda secundaria. |
| UX-09 | Inscripción MFA con QR generado localmente, clave manual, acción de copiar y respuesta accesible. No se envía la clave a un generador externo. Se mantienen verificación TOTP y confirmación de guardado de códigos de recuperación. MFA sigue siendo opcional por administrador. |
| UX-10 | Portal móvil con bienvenida compacta, acceso directo a reserva/saldo/comprobantes y listado de estancias antes de información secundaria. Fotografía de bienvenida oculta en móvil, conservada en escritorio. «Mis estancias» enlaza al listado. |

Se corrigió además una pérdida de entrada detectada durante la validación: los controles compartidos esperan a que el cliente esté listo antes de permitir interacción, evitando introducir texto que luego desaparezca durante la hidratación. El formulario de habitación normaliza los valores numéricos antes de preparar el payload.

## Contratos y seguridad

- `GET /api/rooms`: búsqueda `q`, estado, piso y paginación validados. `GET /api/room-types`: búsqueda y paginación validadas. Filtros SQL parametrizados y totales calculados con los mismos filtros que las filas.
- `GET /api/hotel/contact`: solo `hotel_name`, `phone` y `email`. No expone reglas operativas ni datos de huéspedes.
- `POST /api/users/reset-password/check`: recibe el token en el cuerpo y devuelve solo `data.valid`; no consume el enlace ni identifica la cuenta. Mantiene límite de solicitudes y caché deshabilitada. El cambio de contraseña sigue revalidando el token bajo transacción.
- OpenAPI regenerado y comprobado. URL interna SSR y URL pública de API conservadas.
- Generador QR local `qrcode` 1.5.4. El control de dependencias no detectó advisories nuevos sin excepción válida; sigue vigente la excepción previa de `node-forge` documentada en seguridad, hasta el 7 de noviembre de 2026.

## Validación

- Backend: **173/173 pruebas**, incluidas integraciones PostgreSQL de búsqueda global, varias páginas, piso cero, filtros inválidos, contacto público y comprobación de recuperación sin consumo del token.
- Frontend: ESLint, tipos Nuxt, compilación de producción y `git diff --check` correctos.
- Escenarios E2E: inventario de más de diez habitaciones; más de cien huéspedes, reservas y tipos; selección fuera de la primera página; selección conservada tras cambiar búsqueda; disponibilidad al cambiar fechas; Escape sin pérdida del borrador; límite del pago; caja cuadrada, faltante, sobrante y cero explícito; navegación con borrador de huésped y guardado posterior; identidad de reservas y jerarquía del portal a 390 × 844; recuperación sin enlace/inválida y canales de contacto.
- Flujo completo de estancia repetido en la compilación de producción: alta de huésped → reserva → entrada → cobro → comprobante → salida → limpieza → arqueo.
- Cabeceras de producción y recuperación: **6/6** comprobaciones correctas, incluida hidratación con CSP sin `unsafe-inline` de scripts.
- MFA: inscripción y renovación en cuenta ficticia, recuperación y desactivación; QR PNG local y comprobación de carga real de la imagen bajo CSP.
- Capturas de fixtures para revisión: `/private/tmp/hotel-ux-reservas-mobile.png` y `/private/tmp/hotel-ux-portal-mobile.png`. No se incluyen capturas de claves MFA ni códigos de recuperación.

Se usaron bases PostgreSQL E2E desechables y servidores locales independientes de la demo. No se reservaron habitaciones, cobraron pagos, cerraron cajas ni cambiaron factores de cuentas operativas. Las pruebas se repitieron después de adaptar las aserciones a la búsqueda paginada y las etiquetas traducidas; los reintentos no se consideran evidencia de un despliegue.

## Límites y siguientes comprobaciones de producto

- Pendiente revisión por usuarios de recepción/huéspedes. No se ha medido tiempo de tarea ni certificado accesibilidad.
- El QR se comprobó en navegador y la clave se verificó mediante un TOTP generado en la prueba; no se probó el escaneo con cámara de un teléfono físico.
- El patrón móvil de tarjetas se aplicó a Reservas. La extensión opcional a pagos, transacciones e historial requiere su propia revisión de densidad; esas tablas conservan su funcionamiento y alineaciones.
- La reserva editada conserva su habitación y la validación de disponibilidad del servidor. La consulta previa de habitaciones aplica al alta de reservas.
- Las preferencias de notificación siguen siendo locales y no controlan entregas. Su alcance está indicado explícitamente; conectar preferencias a envíos reales es una funcionalidad distinta.

## Actualización de la demo Docker

- Reconstruidos backend y frontend y recreados sus contenedores. Los cinco servicios de `hotel-demo` están activos; no se eliminaron volúmenes ni se regeneró el seed.
- Respaldo previo restaurado y verificado: `hotel-20261026T025148Z-7/archive.dump` (identificador en UTC). Imágenes anteriores conservadas como `hotel-rollback/backend:before-ux-20261025` y `hotel-rollback/frontend:before-ux-20261025`.
- Historial de ocho migraciones verificado y permisos de roles reaplicados. Smoke de imágenes en entorno aislado: política de roles, CRUD/triggers/sesiones, restauración, MFA y SSR autenticado correctos.
- Comprobación operativa: salud API/BD, contacto, acceso de demo, paginación de habitaciones/tipos/reservas, consulta de MFA y cabeceras del frontend correctos. Conteos posteriores: 11 reservas, 11 pagos y 10 habitaciones. No se realizaron operaciones de negocio durante esta verificación.
- Escaneo del árbol versionable: cero coincidencias de secretos. `.env` y archivos ignorados excluidos. Auditoría de dependencias sin advisories nuevos sin excepción válida; se conserva la excepción previa documentada de node-forge.
