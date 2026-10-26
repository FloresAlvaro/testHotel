# Plan de seguridad del sistema Hotel

Preparado el 24 de octubre de 2026, sobre `a38dfbc`. Responsable técnico: especialización [`security-senior`](../.agents/skills/security-senior/SKILL.md), con `backend-senior` y `frontend-senior` en su respectiva capa.

Línea base: [auditoría del 24 de octubre](auditoria-seguridad-2026-10-24.md). El usuario autorizó su implementación. El estado y las evidencias actuales están en [implementación del 25 de octubre](implementacion-seguridad-2026-10-25.md); la auditoría inicial conserva el estado histórico. Los paquetes y avisos de la auditoría se deben volver a consultar al comenzar cada tarea.

## Secuencia y seguimiento

Cada tarea se entrega como un cambio revisable independiente, con pruebas y reversión. El orden evita que los cambios de infraestructura retrasen la corrección urgente del parser.

| Fase | Prioridad | Entrega | Dependencia | Estado |
| --- | --- | --- | --- | --- |
| S0 | P0 | Línea base reproducible y pruebas aisladas | — | Implementado y probado localmente |
| S1 | P0 | Cerrar la caída del parser HTTP | S0 | Implementado y probado localmente |
| S2 | P1 | Neutralizar CSV y proteger documentos Nuxt | S0; después de S1 en la ejecución inicial | Implementado y probado localmente |
| S3 | P1 | Dependencias y controles de CI | S1; después de S2 en la ejecución inicial | Implementado; excepción node-forge y CI remoto pendiente |
| S4 | P1 | Separar privilegios PostgreSQL | S0, S1; integrar después de S3 | Desplegado y verificado en demo |
| S5 | P1 | Contenedores y exposición de red | S4 validada | Desplegado y verificado en demo |
| S6 | P2 | Integridad de pagos, límites y validación | S1–S5 | Implementado y probado localmente |
| S7 | P2 | Sesiones, MFA y ciclo de vida de datos | S4, S6 | Implementado y probado localmente |
| S8 | P1 | Reauditoría y aceptación del despliegue | Fases anteriores del alcance acordado | Desplegado y verificado en demo |

P0: primera corrección. P1: protección necesaria para preparar una exposición operativa controlada. P2: ampliaciones que requieren definir políticas o flujos de producto. No son fechas ni promesas de duración; cada tarea se estima tras confirmar su alcance.

## S0 — Preparar una línea base reproducible

- [x] **S0.1** Registrar commit, estado Git, versiones efectivas y entorno. Revisar entradas HTTP, permisos y avisos con sus fuentes oficiales; conservar evidencias sin secretos.
- [x] **S0.2** Ejecutar las suites contra PostgreSQL aislado. La auditoría anterior pasó 94 pruebas, pero omitió 45 integraciones; resolver este hueco antes de dar por cerrada una fase de seguridad.
- [x] **S0.3** Preparar entorno E2E separado de la demo, con Mailpit y proveedor de pagos de prueba. Reutilizar el workflow actual y las variables del README.
- [x] **S0.4** Antes de cambios operativos de datos o roles, generar respaldo y restauración verificada, registrar referencia del archivo y ensayar recuperación en una base nueva. Conservar `.env` existente; no imprimir ni guardar credenciales en el plan.

**Aceptación:** suites aisladas ejecutadas, omisiones explicadas, pasos de reproducción y respaldo documentados. No se reutilizó la base de la demo como base de pruebas.

## S1 — Cerrar el riesgo de caída del backend

Responsable: seguridad + backend. Hallazgo 1 de la auditoría.

- [x] **S1.1** Revisar `Backend-H/src/app.js`, Express y el lockfile. Resolver el advisory de body-parser con una versión compatible corregida; la referencia mínima de la auditoría es 1.20.9 para la rama 1.x. Verificar la versión efectiva instalada y desplegada, no solo `package.json`.
- [x] **S1.2** Confirmar si se requieren cuerpos comprimidos. Si no, deshabilitar `inflate` de JSON, URL encoded y raw de Stripe. Mantener límites de tamaño explícitos y errores 4xx controlados, sin filtrar trazas.
- [x] **S1.3** Conservar el webhook Stripe antes del parser JSON y la firma sobre bytes originales. No resolver la vulnerabilidad transformando el cuerpo firmado.
- [x] **S1.4** Agregar regresión en proceso hijo o contenedor desechable: entradas comprimidas defectuosas, entrada sobredimensionada, JSON inválido, petición JSON normal y webhook de prueba. Verificar que el servidor sigue respondiendo tras cada error; incluir rutas sin autenticación y fuera de `/api`.

**Archivos previstos:** `Backend-H/src/app.js`, manifiestos/lockfile backend, manejo de errores y pruebas de regresión pertinentes.

**Aceptación:** caso que antes exponía el fallo rechazado o procesado con seguridad; proceso vivo; autenticación y webhook normales siguen funcionando; aviso resuelto o mitigación comprobada y documentada. Reconstruir backend y verificar `/health`.

**Reversión:** conservar la imagen previa y una imagen de contingencia con la mitigación probada. No volver a exponer sin protección la versión vulnerable como respuesta a un fallo del despliegue.

## S2 — CSV y cabeceras del frontend

Responsable: seguridad + frontend. Hallazgos 3 y 4. Entregar S2.1 y S2.2 por separado.

- [x] **S2.1 — Exportaciones:** extraer un serializador común para ingresos y ocupación. Neutralizar fórmulas en texto con prefijos peligrosos y controles/espacios relevantes, mantener comillas, separadores, Unicode y valores numéricos legítimos. No alterar los nombres almacenados ni añadir una dependencia de hojas de cálculo solo por conveniencia.
- [x] Añadir casos inocuos como `=1+1`, `+1+1`, `-1+1`, `@SUM(1)`, tabulaciones y saltos de línea; probar comillas, acentos e importes. Comprobar al abrir en las hojas de cálculo admitidas o documentar explícitamente lo no validado. Si CSV no permite garantizar el comportamiento requerido, evaluar XLSX con celdas textuales explícitas como una decisión separada.
- [x] **S2.2 — Documentos Nuxt:** aplicar `frame-ancestors`, X-Frame-Options coherente y `nosniff` a documentos públicos y privados. Comprobar reglas de `/auth/**`, redirecciones y respuestas de error; el Helmet de Express no sustituye esta protección.
- [x] Revisar caché de HTML privado con sesión y sin sesión. Añadir `no-store` donde corresponda y verificar que no se comparte información entre usuarios.
- [x] Diseñar la CSP de scripts/estilos con los requisitos reales de Nuxt, imágenes y pagos. Evitar una lista permisiva indiscriminada; comprobar hidratación y consola.
- [ ] Aplicar y comprobar HSTS en el punto HTTPS real cuando exista ese despliegue. El ejemplo de proxy está preparado; la demo local continúa en HTTP.

**Archivos previstos:** utilidad CSV frontend, `pages/reports/`, `nuxt.config.ts` o middleware Nitro, pruebas unitarias y `tests/e2e/security-headers.spec.ts`.

**Aceptación:** texto de prueba permanece inerte en el formato/cliente validado; importes y reportes correctos; headers presentes en el servidor compilado, iframe externo bloqueado y login/portal operativos.

**Reversión:** poder retirar una directiva CSP incompatible manteniendo la protección contra enmarcado. Si falla la protección CSV, deshabilitar temporalmente la exportación afectada en vez de restaurar el comportamiento inseguro.

## S3 — Dependencias y prevención en CI

Responsable: seguridad + ambas capas.

- [x] **S3.1** Volver a ejecutar audit backend/frontend, distinguir producción, desarrollo y build y trazar consumidores. La auditoría identificó Nodemailer, Zod y node-forge además de body-parser; los avisos propagados no son fallos independientes.
- [x] Actualizar de forma compatible y regenerar lockfiles. Confirmar si node-forge tiene parche o si se debe resolver su consumidor transitivo; documentar alcance y mitigación cuando no exista solución compatible. No aplicar la sugerencia de degradar Nuxt ni `audit fix --force` sin análisis.
- [x] Probar envío de correo a Mailpit, validación de destinatarios, recuperación e invitaciones, Nuxt compilado y rutas protegidas. Evitar envíos reales.
- [x] **S3.2** Añadir análisis de dependencias, imágenes y secretos a CI; fijar acciones por SHA e imágenes por digest con un proceso de actualización. Separar nueva introducción de vulnerabilidades de deuda conocida.
- [x] Definir política de excepciones: advisory, versión, razón de alcanzabilidad, mitigación, responsable y fecha de revisión. Un fallo del servicio de auditoría no debe reportarse como un resultado limpio. No registrar secretos en logs ni artefactos.

**Archivos previstos:** manifiestos/lockfiles, `.github/workflows/checks.yml` o workflow de seguridad separado, configuración de actualización automática y documentación.

**Aceptación:** instalación limpia reproducible, árbol efectivo comprobado, regresiones funcionales aprobadas, informes de CI visibles y excepciones explícitas. No se exige un número cero artificial mediante supresiones o downgrades.

**Reversión:** restaurar el conjunto coherente manifiesto/lockfile/imagen; mantener la mitigación de S1 y las excepciones con fecha de revisión.

## S4 — Privilegios mínimos en PostgreSQL

Responsable: seguridad + backend. Hallazgo 2. Preparar código/scripts y probarlos antes de cambiar el entorno existente.

- [x] **S4.1** Inventariar operaciones SQL reales: tablas/secuencias, funciones, triggers de auditoría, configuración de contexto, extensiones y DDL de migraciones. Diseñar roles separados de inicialización, propietario/migración, API runtime y respaldo.
- [x] **S4.2** Preparar grants/revokes idempotentes para instalaciones nuevas y existentes. Runtime sin SUPERUSER, CREATEDB, CREATEROLE ni BYPASSRLS y sin propiedad de objetos que le permita ampliar sus permisos. Configurar privilegios por defecto para objetos futuros.
- [x] Proteger escritura/borrado de la auditoría sin romper sus triggers. Si una función requiere privilegios elevados, limitar propietario, `search_path`, nombres cualificados y EXECUTE público; no convertir todos los triggers en SECURITY DEFINER por defecto.
- [x] **S4.3** Separar configuración de runtime/migración/respaldo sin valores de secretos en Git. Revisar el runner `Backend-H/scripts/migrate.js`, sus checksums y el procedimiento de despliegue. No editar migraciones ya aplicadas.
- [x] Adaptar respaldos: el servicio actual crea una base temporal para comprobar la restauración. Separar lectura/dump y restauración administrativa de prueba, o justificar privilegios específicos del servicio aislado. No conceder CREATEDB al runtime para facilitar esa prueba.
- [x] **S4.4** Ensayar sobre una copia restaurada; probar CRUD autorizado, sesiones, portal, auditoría, reserva concurrente, pagos y jobs con el rol restringido. Probar también que no puede crear roles/bases, modificar esquema ni alterar la auditoría directamente.

**Aceptación:** permisos efectivos verificados con la conexión real de la API; flujos e integraciones funcionan; respaldo/restore verificados; instalación vacía y actualización existente ensayadas. Las suites que crean esquemas pueden usar su rol de fixtures, pero eso no sustituye las pruebas de runtime restringido.

**Reversión:** conservar credenciales administrativas fuera de la API y referencia del respaldo verificado. Mantener el rol anterior hasta validar el nuevo, con un procedimiento de reconexión controlada. No eliminar volúmenes, revocar el último acceso administrativo ni borrar roles/objetos automáticamente durante el ensayo.

## S5 — Contenedores y red

Responsable: seguridad + ambas capas. Hallazgo 5 y exposición de demo.

- [x] **S5.1** Ejecutar procesos Node con usuario no privilegiado; ajustar ownership y permisos de los archivos necesarios. Verificar lectura de migraciones y manifiestos de respaldos sin otorgar escritura innecesaria.
- [x] **S5.2** Evaluar rootfs de solo lectura, tmpfs mínimos, `no-new-privileges`, eliminación de capacidades y límites de CPU/memoria/procesos. Descubrir las necesidades reales de Nuxt, imágenes y módulos nativos antes de habilitarlos.
- [x] **S5.3** Para demo local, enlazar frontend/API a loopback mediante configuración compatible. Mantener la comunicación interna entre servicios y la separación de URL SSR/pública. Para producción documentar proxy HTTPS, firewall, orígenes y secretos; comprobar ese entorno cuando esté disponible.
- [x] Evitar activar seed, proveedor demo y cuentas de demostración en un despliegue público operativo.

**Aceptación:** uid distinto de cero en Node, ausencia de capacidades innecesarias y escritura limitada; login, SSR, imágenes, cola, migraciones y respaldo funcionan; puertos comprobados desde los límites de red definidos. No se presupone que un puerto local cerrado pruebe el firewall de producción.

**Reversión:** revertir de forma granular el permiso o montaje incompatible, con diagnóstico de la ruta necesaria; no solucionar un fallo volviendo indiscriminadamente a root o desactivando el aislamiento completo.

## S6 — Pagos, disponibilidad y validación

Responsable: seguridad + backend, frontend cuando cambien contratos.

- [x] **S6.1 — Reembolsos:** convertir el riesgo condicionado de la auditoría en casos de prueba. Guardar/correlacionar el ID de reembolso esperado y cotejar importe, moneda y estado acumulado. Probar reembolsos parciales externos, eventos duplicados/fuera de orden, concurrencia y reintentos con proveedor simulado. No usar dinero ni webhooks de terceros reales.
- [x] **S6.2 — Abuso:** definir límites por IP/cuenta y ruta, tamaños y timeouts; evitar revelar existencia de cuentas. Mantener protegidas rutas de recuperación/login y limitar coste de `/health`; separar liveness/readiness si corresponde. Añadir almacén compartido solo si el despliegue lo necesita y se acuerda su operación.
- [x] **S6.3 — Entradas:** sustituir coerciones ambiguas de habitaciones/tipos por esquemas de tipos/límites coherentes. Mantener consultas parametrizadas y listas internas de identificadores. Probar entradas inválidas y respuestas 4xx, sin cargas destructivas.
- [x] Ampliar matriz de autorización/IDOR: admin, manager, receptionist, customer y anónimo; lectura y mutación de recursos propios/ajenos; CSRF, origen y revocación tras cambios de rol/estado.

**Aceptación:** no se liquida dos veces ni se marca completo un reembolso parcial; permisos y saldos consistentes; errores controlados y límites comprobados con cargas acotadas en entorno aislado. Contratos y consumidores sincronizados.

**Reversión:** deshabilitar la operación afectada mediante una opción explícita si la integridad no puede garantizarse. Las migraciones de estado deben permitir recuperar eventos pendientes sin duplicar cobros/reembolsos.

## S7 — Sesiones, MFA y datos sensibles

Responsable: seguridad + ambas capas. Definir políticas de producto antes de implementarlas.

- [x] **S7.1** Implementar listado y revocación de sesiones propias y, si se acuerda, administración con permisos específicos. Nunca mostrar el token o el secreto CSRF en el listado; respetar `auth_version` y evitar IDOR.
- [x] **S7.2** Diseñar MFA para administradores: inscripción, verificación, recuperación y pérdida del segundo factor; límites de intentos, protección de secretos y códigos de recuperación con hash. Probar que no bloquea al último administrador sin mecanismo de recuperación. No elegir un proveedor externo ni su coste sin acordarlo.
- [x] **S7.3** Definir y aplicar retención de enlaces/tokens en cola de correo, sesiones vencidas, auditoría y respaldos. Eliminar secretos del contenido vencido sin perder la trazabilidad necesaria; fijar propiedad y permisos de dumps/artefactos.
- [x] Evaluar cifrado de respaldos según destino y amenaza: evaluación y requisitos documentados; no se activó sin acordar destino y custodia.
- [ ] Acordar y activar cifrado/offsite y verificar restauración cifrada cuando se defina ese alcance operativo.

**Aceptación:** flujos E2E y de recuperación aprobados con cuentas ficticias; revocaciones efectivas; trabajos de purga/cifrado verificados en copias aisladas. La política de retención y las claves operativas requieren una decisión explícita antes de aplicarse a datos existentes.

## S8 — Cierre de cada versión de seguridad

- [x] Reauditar las rutas y configuraciones modificadas con `security-senior` y comprobar la versión efectiva de cada contenedor.
- [x] Ejecutar la matriz aplicable de pruebas, incluidas integraciones y E2E del alcance. Registrar ejecución/resultado y explicar cualquier omisión; no marcar tareas pendientes como aprobadas.
- [x] Mantener un registro de hallazgos con ID, estado, commit, pruebas y riesgo residual. Preservar la auditoría fechada como evidencia histórica; enlazar las correcciones en un seguimiento nuevo.
- [x] Aplicar al entorno autorizado solo cambios ya probados, con respaldo y reversión. Comprobar salud, login, permisos, exportaciones, recibos, correo de prueba y backups tras desplegar.

**Aceptación:** sin P0 abierto; P1 del alcance cerrados o con una excepción explícita, responsable y fecha; P2 restantes identificados. No declarar “aplicación totalmente segura” ni sustituir pruebas por un audit limpio.

## Matriz de comprobaciones

| Área | Comprobación | Entorno |
| --- | --- | --- |
| Backend | `npm test -- --runInBand`, con variables de prueba del README | `Backend-H/`; `TEST_DATABASE_URL` aislada |
| Contratos | `npm run api:generate` si cambia contrato; `npm run api:check`; `npm run typecheck` | `Backend-H/` |
| Frontend | `npm run lint`, `npm run typecheck`, `npm run build` | `Frontend-H/`; dependencias instaladas desde su lockfile |
| Fechas y CSV | Pruebas unitarias de utilidades; comprobar texto inerte en clientes admitidos | Fixtures locales |
| E2E | `npm run test:e2e` con variables/servicios del workflow y preparación aislada | Nunca usar la demo para `e2e:prepare` |
| Dependencias | `npm audit --json --ignore-scripts` y árbol transitivo, en cada carpeta | Solo consulta; contrastar fuentes oficiales actuales |
| Backup | `python3 database/backup/test-backup.py` y verificación de restauración del entorno autorizado | Contenedores/bases de prueba; no sobrescribir base existente |
| Despliegue | Puertos, uid, privilegios SQL, montajes, cabeceras y versión instalada | Lecturas del entorno autorizado |

## Primera implementación propuesta

Comenzar por **S0 y S1**, en un cambio pequeño: reproducir la línea base en entorno aislado, resolver body-parser/descompresión y probar supervivencia del proceso y webhook. Después continuar con **S2.1 (CSV)** y **S2.2 (cabeceras Nuxt)** como cambios separados. Las fases de PostgreSQL y contenedores requieren su propio ensayo de transición antes de tocar la demo existente.

## Seguimiento de implementación

La tabla resume la implementación y el despliegue. El registro enlazado aporta la evidencia de los criterios originales y las validaciones externas pendientes. El registro enlazado distingue código implementado, pruebas ejecutadas y límites pendientes (CI remoto, HTTPS real, importadores CSV y cifrado/offsite).

- [ ] Ejecutar los workflows en GitHub y configurar/verificar protección de rama tras publicar los cambios; la validación local y los escaneos ya están registrados.
