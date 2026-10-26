# Auditoría UX/UI del Hotel — 25 de octubre de 2026

Revisión realizada por el subagente `auditoria_ux_ui`, actuando como senior UX/UI y siguiendo las especializaciones locales `ux-ui-senior` y `frontend-senior`. Es una auditoría: no se modificó código de aplicación ni se guardaron reservas, pagos, arqueos, cuentas, contraseñas, preferencias o factores MFA.

## Resultado y prioridades

La aplicación dispone de una base visual consistente, navegación diferenciada por rol, textos de carga, ayudas de desplazamiento horizontal y comprobantes que aclaran su carácter no fiscal. Las mayores mejoras no requieren rediseñar todo: primero conviene asegurar que los operadores puedan encontrar todos sus registros y prevenir errores antes de confirmar operaciones.

Se identifican **10 grupos de mejora**, con dos P1 condicionados a volumen o estado operativo y ocho P2. No se identificó una operación financiera errónea ejecutada: las consecuencias de caja y los límites de volumen se deducen del código y se señalan expresamente.

| Orden | ID | Prioridad | Mejora | Evidencia |
| --- | --- | --- | --- | --- |
| 1 | UX-01 | P1 | Inventario y selectores completos, con búsqueda y paginación | Código; interfaz actual como referencia |
| 2 | UX-02 | P1 | Prevenir un cierre de caja con importe contado predeterminado | Código; variante de turno abierto no disponible |
| 3 | UX-03 | P2 | Disponibilidad y saldo visibles antes de registrar reservas/cobros | Formulario de reserva observado; código de ambos formularios |
| 4 | UX-04 | P2 | Aclarar o completar el efecto de preferencias Email/Push | Pantalla observada + código |
| 5 | UX-05 | P2 | Proteger borradores al cerrar modales o abandonar formularios | Reproducido sin guardar |
| 6 | UX-06 | P2 | Mantener identidad del registro al operar tablas desde móvil | Reproducido a 390 × 844 |
| 7 | UX-07 | P2 | Ofrecer siguientes pasos correctos en vacíos y acceso inválido | Tres casos observados |
| 8 | UX-08 | P2 | Traducir estados técnicos y unificar vocabulario operativo | Detalle de reserva observado + código |
| 9 | UX-09 | P2 | Simplificar la configuración opcional de MFA | Código; inscripción real no ejecutada |
| 10 | UX-10 | P2 | Acercar estancias/comprobantes a la entrada del portal móvil | Portal observado a 390 × 844 |

P1 significa que una tarea importante puede quedar impedida o producir una consecuencia operativa relevante bajo la condición indicada. P2 representa fricción repetida, interpretación ambigua o recuperación insuficiente. El orden responde a impacto, no a una estimación de esfuerzo.

## Hallazgos detallados

### UX-01 — El inventario y algunos selectores dependen de la primera página

**Rol/tarea:** recepción y gerencia, localizar habitación, huésped o reserva para operar.

**Confirmado por código; condicionado al volumen.** `pages/rooms/index.vue:230` llama `fetchRooms()` sin parámetros; `composables/useRooms.ts:49` establece página 1 y tamaño 10, y `stores/rooms.ts:44` conserva esos valores al pedir la API. La pantalla no presenta paginación y `index.vue:155` calcula el total con la longitud de esa página; búsqueda, estado y piso filtran ese subconjunto. Con más de diez habitaciones, pueden faltar habitaciones y el total mostrado no representar el inventario. La demo tiene diez: no se creó una undécima para reproducirlo.

Un segundo límite relacionado está en `forms/FReservationForm.vue:100`: huéspedes y habitaciones se cargan solo mediante `getClients(1,100)` y `getRooms(1,100)`. `forms/FPaymentForm.vue:104` carga solo `getReservations(1,100)`, y `FRoomForm.vue:66` hace lo mismo con tipos. Los selectores nativos observados no permiten buscar en otras páginas. Esto puede impedir seleccionar un registro existente cuando el volumen supera el límite; no se reprodujo con un conjunto de más de cien registros durante esta revisión.

**Propuesta:** paginación/filtros de habitaciones respaldados por servidor y total real; selectores con búsqueda remota y selección conservada, en lugar de incrementar indefinidamente el tamaño de página.

**Aceptación:** con 11+ habitaciones y 101+ huéspedes/reservas en fixtures aislados, localizar y seleccionar registros fuera de la primera página y conservar filtros, selección y total correcto. Verificar también un registro previamente seleccionado que no aparezca en la primera búsqueda.

### UX-02 — El arqueo puede empezar con cero y cerrarse sin revisar la diferencia

**Rol/tarea:** persona con turno abierto, cerrar caja.

**Riesgo confirmado por código, no cierre ejecutado.** En `operations/cash.vue:14`, `counted` se inicializa en 0. El formulario de turno abierto (`cash.vue:6`) lo admite mediante `min=0` y `required`; cero satisface ambos. `close()` (`cash.vue:26`) envía el importe directamente. La diferencia se destaca en el historial después del cierre, pero no hay una revisión previa diferenciada. Podría cerrarse un turno con cero contado sin que el operador lo haya introducido deliberadamente.

La revisión visual encontró el estado sin turno abierto, tanto en administrador como en recepción. No se abrió ni cerró caja para demostrar la variante.

**Propuesta:** importe contado inicialmente vacío, moneda junto al campo, vista previa esperado/contado/diferencia y una confirmación específica cuando existe diferencia. Mantener cero como valor válido si se introduce de forma explícita.

**Aceptación:** no se puede cerrar sin introducir el contado; cero explícito sigue siendo válido; antes de confirmar se identifica el turno y se ve la diferencia. Pruebas con caja cuadrada, faltante, sobrante y cero en entorno aislado.

### UX-03 — Se pide elegir antes de mostrar disponibilidad o contexto monetario suficiente

**Rol/tarea:** recepción al reservar o cobrar.

**Reserva observada y código confirmado.** El modal “Nueva reserva” muestra huésped y habitación antes de las fechas. Sus habitaciones proceden del inventario, no de una consulta de disponibilidad para el intervalo elegido (`forms/FReservationForm.vue`). El importe se calcula por noches y precio; el conflicto se conoce al intentar guardar. Las habitaciones en mantenimiento aparecen deshabilitadas, una protección útil que debe mantenerse. A diferencia de este formulario, el portal del huésped sí consulta disponibilidad antes de elegir habitación.

**Cobro confirmado por código.** `forms/FPaymentForm.vue:4–53` permite elegir reserva y monto, pero no presenta al lado el total acordado, pagado, pendiente y moneda de la reserva. La API protege el sobrepago; no se afirma que sea posible eludirla. La fricción es tener que recordar o consultar el saldo en otro lugar y descubrir restricciones al enviar.

**Propuesta:** fechas → habitaciones disponibles → resumen en recepción; reutilizar el concepto del portal. En pago, resumen de reserva y saldo junto al monto, sugerencia editable y límites coherentes con el servidor. Los mensajes de cambio de disponibilidad deben conservar el resto del formulario.

**Aceptación:** no se ofrece como disponible una habitación ocupada en el intervalo consultado; un cambio de fechas vuelve a comprobar opciones. El operador conoce moneda y saldo antes de confirmar un cobro y recibe una explicación específica cuando cambiaron.

### UX-04 — Las preferencias Email/Push parecen operativas, pero solo se almacenan localmente

**Rol/tarea:** administrador que quiere controlar avisos.

**Pantalla observada y código confirmado.** `admin/settings.vue`, pestaña Notificaciones, ofrece categorías con casillas Email/Push y “Guardar Preferencias”. `saveNotifications()` (`settings.vue:524`) solo escribe `hotel-notifications` en localStorage; el mensaje posterior aclara “en este navegador”. No se encontró un consumidor que conecte esas preferencias con entrega de correo o notificaciones push; también se exportan como preferencias locales. No se modificaron casillas ni se guardó esta configuración.

La aplicación sí tiene entrega de correo transaccional: el problema no es que todo el correo sea ficticio, sino que estas preferencias no controlan ese sistema y la limitación no resulta clara antes de interactuar.

**Propuesta:** indicar alcance y efecto al principio de la pantalla. Si son una función pendiente, no ofrecer un control operativo de Push; si deben funcionar, persistir por usuario y conectarlas a eventos reales con autorización y estados de entrega. Separar avisos imprescindibles de preferencias opcionales.

**Aceptación:** se entiende antes de guardar dónde se conserva cada opción y qué cambia realmente; una opción presentada como operativa modifica de forma comprobable el envío correspondiente en pruebas aisladas.

### UX-05 — Un cierre accidental puede borrar trabajo de un formulario

**Rol/tarea:** recepción durante una reserva; patrón compartido de modales.

**Reproducido.** En Nueva reserva se escribió únicamente una nota de borrador, se pulsó Escape y se reabrió el modal: la nota ya no estaba y no se pidió confirmar el descarte. No se guardó ningún registro. `common/CModal.vue` cierra por Escape y, por defecto, al pulsar el fondo; el formulario de reserva se vuelve a crear al abrirlo. No se encontró una protección transversal de cambios pendientes al navegar.

**Propuesta:** detectar cambios respecto del estado inicial; permitir “Seguir editando” o “Descartar”, conservando la accesibilidad de Escape. Aplicarlo primero a reservas, huéspedes, configuración y presentación del hotel. No mostrar confirmaciones si nada cambió o el guardado ya terminó.

**Aceptación:** Escape, fondo, botón de cierre y navegación no descartan silenciosamente un formulario modificado. El foco regresa al control correcto al cancelar el descarte.

### UX-06 — En móvil se pierde la identidad mientras siguen visibles las acciones

**Rol/tarea:** recepción o gerencia al consultar tablas densas desde teléfono.

**Reproducido en Reservas a 390 × 844.** Inicialmente se ven ID, cliente, habitación y acciones. Al desplazar horizontalmente para ver estado y total, cliente/habitación salen del área visible mientras las acciones permanecen fijas a la derecha. Las columnas sí están disponibles mediante desplazamiento y existe una ayuda textual: no se afirma que estén eliminadas. El problema es relacionar “Ver/Editar” con el huésped correcto después del desplazamiento, especialmente en varias filas parecidas.

**Propuesta:** en móvil, un resumen expandible por reserva con identidad, fechas y estado, o conservar un identificador útil fijo al desplazar. Considerar el mismo patrón para pagos, transacciones e historial. Mantener las alineaciones de tablas que el usuario ya aprobó; este hallazgo no propone revertir el centrado.

**Aceptación:** al consultar un importe o accionar una fila se puede identificar siempre a qué reserva/persona pertenece, sin memorizar su posición. Verificar con nombres largos y dos registros del mismo huésped.

### UX-07 — Algunos estados vacíos y de acceso no orientan al siguiente paso correcto

**Observado en navegador, con tres manifestaciones del mismo patrón:**

1. **Habitaciones filtradas:** buscar un texto sin coincidencias produce “Mostrando 0 de 10 habitaciones” y “No hay habitaciones que coincidan con los filtros”, pero la llamada a la acción es “Agregar Primera Habitación”. Sí existe “Limpiar Filtros”; el problema es el mensaje/CTA de alta inicial cuando ya hay inventario. Fuente: `rooms/index.vue:90–105`.
2. **Recuperación sin enlace:** `/auth/reset-password` sin token muestra dos campos de contraseña y “Guardar contraseña”. La variante de invitación sin token sí explica que falta el enlace y no ofrece un formulario utilizable. No se introdujo ni cambió una contraseña. Proponer estado de enlace ausente/vencido con una acción para solicitar otro, antes de pedir datos que no podrán guardarse.
3. **Solicitud de acceso:** “Contacta al hotel” lleva a `/auth/register`, donde se pide contactar con recepción, pero no se ofrece un teléfono, correo o canal clicable. El portal autenticado sí tiene contacto telefónico. Proponer un canal público configurado por el hotel y un retorno claro al acceso.

**Aceptación:** distinguir inventario vacío de filtro sin resultados; distinguir enlace ausente/vencido de formulario válido; poder contactar con recepción desde la ruta a la que invita el CTA. Estas comprobaciones no deben enviar correo ni crear cuentas durante la auditoría.

### UX-08 — Persisten estados técnicos y vocabulario inconsistente

**Observado.** En el detalle de una reserva confirmada aparecen simultáneamente “Confirmada” y `confirmed`. `pages/reservations/[id].vue` traduce el texto principal pero imprime `reservation.status` directamente en el distintivo. En distintas pantallas se mezclan Huésped/Cliente, Entrada/Check-in y Salida/Check-out. La mezcla no demuestra un fallo de datos, pero obliga a interpretar términos diferentes para la misma tarea.

**Propuesta:** un catálogo compartido de etiquetas y estados, y vocabulario consistente por audiencia. Mantener IDs técnicos en detalles avanzados de auditoría cuando sean útiles, con una etiqueta legible al lado.

**Aceptación:** ningún distintivo operativo presenta enums sin traducir; los textos y ayudas nombran de la misma forma la misma acción. Revisar también plurales como “1 noches” en resultados de disponibilidad.

**Observación menor condicionada al navegador:** en la sesión del auditor, algunos campos nativos de fecha se muestran MM/DD/YYYY mientras las tablas usan DD/MM. El formato del input depende del navegador/OS, no se atribuye a un formato fijo del sistema. Añadir contexto claro, una vista legible de la fecha elegida y pruebas con locales distintos; no prometer que HTML permite forzar idéntica presentación en todos los navegadores.

### UX-09 — La inscripción opcional de MFA aún puede simplificarse

**Confirmado por código; no se inició una inscripción real.** `components/MfaChallengeForm.vue` presenta una clave manual y descarga de códigos, pero no QR local ni una acción accesible para copiar la clave. Tras la decisión reciente del usuario, MFA ya es opcional por administrador; esto no se presenta como una obligación todavía vigente.

**Propuesta:** QR generado localmente, clave manual como alternativa, “Copiar clave” con confirmación accesible, instrucciones cortas y un código de ejemplo visualmente distinguible. Mantener la verificación del TOTP y el guardado de recuperación. En acceso, explicar la regla de contraseña en lenguaje cotidiano y relegar “72 bytes UTF-8” a una ayuda secundaria, conservando la validación real.

**Aceptación:** una cuenta ficticia puede inscribirse por QR y por clave manual, con teclado y móvil; el secreto no se envía a un servicio externo ni queda en logs. No activar/desactivar factores de cuentas operativas para validar la mejora.

### UX-10 — La bienvenida del portal desplaza las tareas habituales del huésped en móvil

**Observado a 390 × 844.** La fotografía y el bloque “Tu descanso empieza aquí” ocupan buena parte de las primeras pantallas; Mis reservas, pagos y comprobantes quedan más abajo. El bloque tiene información de estancia y un acceso a su reserva, por lo que no se considera contenido inútil. La mejora consiste en reducir desplazamiento para alguien que vuelve para comprobar saldo, cambios o un recibo.

**Propuesta:** resumen compacto de la estancia vigente/próxima con acciones directas a reserva y comprobantes; mantener la presentación visual como contenido secundario. “Mis estancias” puede llevar al listado real o a su ancla, en lugar de la misma cabecera de bienvenida.

**Aceptación:** en móvil se alcanza la reserva/saldo/comprobante principal sin atravesar primero un bloque promocional largo; no se pierde la opción de reservar una próxima estancia.

## Cobertura de las 33 plantillas

`D` = navegación/árbol de accesibilidad en escritorio; `M` = viewport 390 × 844. “Visual” no implica que se haya confirmado una operación. Se consultaron fuentes de las 33 plantillas y componentes compartidos. En listados/detalles se utilizó información de demo existente, sin transcribir datos personales en este informe.

| Plantilla/ruta | Cobertura | Alcance y límite |
| --- | --- | --- |
| `/` | D, visual | Redirige a dashboard con sesión admin. |
| `/dashboard` | D/M, visual | Admin; acceso y menú también con gerente y recepción. |
| `/auth/login` | M, visual | Acceso y salida de roles disponibles, sin cambiar credenciales. |
| `/auth/register` | M, visual | Instrucciones para solicitar acceso; no alta. |
| `/auth/forgot-password` | M, visual | Formulario, sin envío. |
| `/auth/reset-password` | M, visual | Variante sin token; sin introducir nueva contraseña. |
| `/auth/accept-invitation` | M, visual | Variante sin token; sin aceptar invitación. |
| `/admin/settings` | D, visual + código | General, Equipo, Notificaciones, Exportaciones y Seguridad; sin guardar. MFA solo lectura de código/estado. |
| `/checkin` | D, visual | Lista de entradas; no registrar entrada. |
| `/checkin/pending` | D, visual | Salidas vencidas; no registrar salida. |
| `/clients` | D/M, visual | Listado y enlaces existentes. |
| `/clients/create` | D, visual | Formulario sin guardar. |
| `/clients/[id]` | M, visual | Ficha existente, reservas y acceso; sin editar/desactivar. |
| `/rooms` | D/M, visual | Tarjetas, filtros y vacío sin resultados; sin crear/mantenimiento. |
| `/reservations` | D/M, visual | Tabla, desplazamiento; modal y pérdida de borrador sin guardar. |
| `/reservations/[id]` | M, visual | Reserva existente, estado/precios/acciones; sin entrada/salida/pago. |
| `/payments` | D/M, visual | Tabla y navegación al detalle; formulario complementado por código. |
| `/payments/[id]` | M, visual | Pago existente y enlace a comprobante; sin reembolso. |
| `/payments/receipt/[id]` | M, visual | Comprobante existente; sin imprimir. |
| `/reports` | D, visual | Filtros, indicadores/gráficos y tabla; sin descargar. |
| `/reports/occupancy` | D, visual | Distribución, tipos y tabla; sin descargar. |
| `/operations/audit` | D, visual | Filtros y listado; no alterar datos. |
| `/operations/calendar` | D, visual | Intervalo visible y legibilidad; no cambiar reservas. |
| `/operations/cash` | D/M, visual + código | Estado sin turno de admin/recepción. Cierre con turno abierto solo código. |
| `/operations/online-payments` | D, visual | Tabla y filtros; sin reembolsar. |
| `/operations/property` | D, visual | Presentación, correo y respaldo; sin guardar/reintentar envíos. |
| `/operations/requests` | D, visual | Bandeja y estados; sin responder/aprobar. |
| `/operations/tasks` | D, visual | Alta, responsables y acciones existentes; sin crear/asignar/finalizar. |
| `/portal` | M, visual | Huésped: próxima estancia, lista y ayuda. |
| `/portal/book` | M, visual | Consulta de disponibilidad y selección hasta resumen; NO confirmar reserva. |
| `/portal/reservations/[id]` | M, visual | Variantes con/sin pagos y solicitudes existentes; NO solicitar cambios ni generar checkout. |
| `/portal/receipts/[id]` | M, visual | Recibo propio existente; sin imprimir. |
| `/portal/payments/[id]` | Código | No se creó un checkout para acceder a un pago nuevo. Estado de simulación y errores revisado en fuente; pendiente inspección de un enlace propio existente/fixture aislado. |

### Roles y límites de validación

- **Administrador:** cobertura amplia de módulos y ajustes.
- **Recepción:** acceso, dashboard, menú adaptado y caja sin turno; componentes compartidos revisados desde admin. No se afirma probar todos los módulos nuevamente con este rol.
- **Gerente:** acceso, dashboard y menú adaptado. No se afirma una matriz completa de autorización: eso pertenece a una revisión de permisos.
- **Huésped:** portal, disponibilidad, resumen y detalles/comprobantes propios.
- Se observaron estados de carga, vacíos y enlaces ausentes; no se forzaron fallos de red, corrupción de datos ni respuestas del servidor.
- Teclado: Escape de modal y existencia de enlaces/etiquetas en el árbol de accesibilidad. No se realizó una evaluación completa con lector de pantalla ni se certifica WCAG.
- No se inspeccionaron todas las pantallas en tema oscuro ni con zoom alto. No se midieron ratios de contraste ni porcentajes de mejora. Los controles pequeños y tipografía densa merecen pruebas de uso, pero no se califican automáticamente como incumplimiento por estar por debajo de 44 px.
- No se ejecutaron lint/build/tests: no se cambió la aplicación. Se verificó el informe y la correspondencia de las fuentes citadas.
- No se cambiaron tema ni preferencias. Al terminar se restauraron viewport por defecto y sesión admin, y se descartaron los campos locales de auditoría sin guardar.

## Evidencia y orden de acción

Captura sin claves, enlaces de recuperación ni nombres de huéspedes: `/private/tmp/hotel-ux-empty-rooms-mobile.png`. Documenta UX-07: cero coincidencias sobre diez habitaciones junto a “Agregar Primera Habitación”.

1. Resolver la integridad de navegación/datos de UX-01 y el cierre deliberado de UX-02 con fixtures de volumen y caja; requieren coordinar frontend/backend.
2. Unificar la prevención de errores y conservación de trabajo de UX-03/UX-05. Diseñar un patrón compartido para formularios y modales.
3. Corregir expectativas funcionales y estados recuperables de UX-04/UX-07; son cambios concretos de flujo/copy, no un rediseño global.
4. Probar UX-06 con recepción desde móvil y varias reservas parecidas; conservar las alineaciones ya aprobadas.
5. Simplificar UX-08/UX-09 y validar UX-10 con huéspedes que buscan una reserva o comprobante. Repetir pruebas representativas en lugar de medir el éxito por cantidad de cambios visuales.

Las propuestas requieren autorización de implementación. El informe distingue mejoras comprobadas de riesgos condicionados y no afirma que se hayan probado mutaciones ni todas las variantes de datos.
