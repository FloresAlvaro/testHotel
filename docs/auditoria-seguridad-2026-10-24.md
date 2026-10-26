# Auditoría de seguridad del sistema Hotel

Fecha: 24 de octubre de 2026. Revisión: `a38dfbc75608f62c0e8102f23a873d027805b371`.

## Alcance y resultado

Revisión estática de Frontend-H, Backend-H, esquema/migraciones PostgreSQL, Docker, respaldos y CI; comprobaciones no destructivas y consulta actual de avisos npm. Se aplicaron las especializaciones locales backend-senior y frontend-senior. No se modificó la aplicación, dependencias, contenedores ni datos. Este documento es el único archivo añadido.

Se identificó **una vulnerabilidad de disponibilidad de prioridad alta con ruta alcanzable**, además de debilidades de aislamiento, exportación y protección del frontend. No se encontró una ruta confirmada de SQL injection, command injection, XSS almacenado o acceso de un huésped a reservas ajenas. Esto no certifica ausencia de vulnerabilidades.

La **inyección de dependencias** es un patrón de diseño válido. Los ataques relevantes aquí son inyección SQL/comandos/fórmulas, dependencias vulnerables y compromiso de la cadena de suministro; se revisaron esas categorías.

## Hallazgos priorizados

### 1. Alta: el parser HTTP vulnerable es alcanzable sin autenticación

- Evidencia: `Backend-H/package-lock.json:1840` fija body-parser 1.20.8; Express 4.22.3 lo utiliza. `Backend-H/src/app.js:60` y `:61` habilitan JSON y URL encoded con descompresión predeterminada antes de montar las rutas/autenticación (`:70`). El parser también actúa fuera de `/api`, donde el limitador de `:48` no aplica.
- Aviso confirmado del mantenedor: [GHSA-27r3-jxmh-p828](https://github.com/expressjs/body-parser/security/advisories/GHSA-27r3-jxmh-p828), publicado el 22 de octubre. Afecta a versiones anteriores a 1.20.9 y describe una excepción no capturada al procesar determinados cuerpos comprimidos.
- Escenario: un cliente con acceso HTTP a la API envía un cuerpo comprimido especialmente formado. No necesita iniciar sesión. Según el aviso y la configuración alcanzable, puede terminar el proceso Node y afectar a todas las sesiones. La política de reinicio de Docker no evita interrupciones repetidas.
- Verificación: versión, código del parser y orden de middleware inspeccionados; **no se envió el cuerpo que provoca la caída**.
- Corrección: actualizar el lockfile a body-parser 1.20.9 o posterior compatible mediante Express/dependencia transitoria, y reconstruir. Si no se requieren cuerpos comprimidos, desactivar `inflate` en todos los parsers, incluido `express.raw` de Stripe. Agregar una regresión en proceso aislado; comprobar que una entrada defectuosa devuelve 4xx y no finaliza el servidor.

### 2. Media, impacto alto condicionado: la API utiliza una cuenta PostgreSQL superusuario

- Evidencia: `docker-compose.yml:8` y `:49` reutilizan POSTGRES_USER tanto para inicializar PostgreSQL como para conectar la API. La comprobación de solo lectura realizada desde Docker confirmó `rolsuper`, `rolcreatedb`, `rolcreaterole` y `rolbypassrls` activos para la cuenta utilizada. No se publican contraseñas.
- Escenario: una futura inyección SQL, una dependencia comprometida o acceso al proceso backend obtiene privilegios sobre todo el servidor PostgreSQL, roles y auditoría. **No constituye por sí sola una inyección SQL actualmente demostrada**.
- Impacto: amplifica una intrusión de aplicación hasta control del servidor de datos y sus respaldos accesibles; la auditoría almacenada en la misma base puede alterarse.
- Corrección: separar roles de inicialización/migración, respaldo y runtime. La API debe usar un rol sin SUPERUSER/CREATEDB/CREATEROLE/BYPASSRLS y con permisos mínimos por tabla/secuencia. Ejecutar migraciones con credenciales separadas y revisar permisos de funciones y auditoría.

### 3. Media: inyección de fórmulas en CSV de ingresos y ocupación

- Evidencia: `Frontend-H/app/pages/reports/index.vue:315` exporta `client_name`; `:319` solo duplica comillas. `Frontend-H/app/pages/reports/occupancy.vue:290` y `:293` hacen lo mismo para habitación/tipo. `Backend-H/src/validators/clientValidator.js:4` acepta nombres que empiezan con `=`.
- Verificación local inocua: el esquema aceptó el nombre `=1+1` y el serializador generó la celda `"=1+1"`. Las comillas CSV delimitan la celda, pero no fuerzan texto en una hoja de cálculo. No se creó un cliente, no se abrió Excel ni se ejecutó una fórmula externa.
- Escenario: personal con permiso de crear/editar huéspedes —o un dato de huésped recibido e introducido por recepción— introduce un valor que una hoja de cálculo interpreta como fórmula. Un administrador/manager exporta y abre el archivo. En ocupación el atacante necesita permisos para modificar habitaciones/tipos.
- Impacto: manipulación de reportes y, dependiendo de la hoja de cálculo y sus avisos/permisos, enlaces o solicitudes externas. No se afirma ejecución de comandos automática.
- Corrección: usar un serializador común que neutralice prefijos de fórmula (`=`, `+`, `-`, `@` y controles relevantes) en datos textuales y compruebe comportamiento en las hojas admitidas; preferir XLSX con celdas textuales explícitas. Mantener importes numéricos correctamente tipados.

### 4. Media: frontend sin protección contra enmarcado

- Evidencia estática: `Frontend-H/nuxt.config.ts:20` solo añade dos cabeceras a `/auth/**`; no existen middleware de seguridad propios en el servidor Nuxt. Evidencia HTTP en Docker: GET `/auth/login` devuelve 200 sin CSP ni X-Frame-Options; también falta X-Content-Type-Options. El Helmet del backend protege respuestas de API, no el documento servido por Nuxt.
- Escenario: una página externa puede intentar incluir la interfaz en un iframe. Para acciones autenticadas, el éxito depende de cookies SameSite, relación entre sitios y navegación del navegador; un sitio hermano comprometido tiene un escenario distinto de un dominio totalmente ajeno. No se demostró un clic fraudulento sobre una sesión real.
- Impacto: superficie de clickjacking/UI redressing y menor defensa frente a una eventual inyección. La ausencia de CSP no demuestra XSS.
- Corrección: añadir CSP con `frame-ancestors 'none'` o una lista estricta de orígenes requeridos, X-Frame-Options y `nosniff` a los documentos Nuxt. Diseñar y probar CSP de scripts para Nuxt sin romper hidratación. Mantener `no-store` en contenido autenticado. Configurar HSTS en el terminador HTTPS de producción, no inferir su ausencia como fallo en una demo HTTP.

### 5. Media, defensa en profundidad: frontend y backend se ejecutan como root

- Evidencia: `Backend-H/Dockerfile:1` y `Frontend-H/Dockerfile:11` utilizan imágenes Node sin `USER` de runtime. Docker confirmó uid=0 en ambos procesos; contenedores no privilegiados pero con raíz escribible.
- Escenario: tras comprometer Node por otra vulnerabilidad, el atacante dispone de root dentro del contenedor y puede modificar el sistema de archivos de este. **No se ha demostrado escape del contenedor ni acceso root al host**.
- Corrección: copiar archivos con ownership adecuado y ejecutar como usuario no privilegiado; rootfs de solo lectura con tmpfs específicos, `no-new-privileges`, eliminación de capacidades y límites de recursos compatibles con Nuxt/Node. El backend monta respaldos de solo lectura, pero igualmente puede leer su contenido si se compromete.

## Dependencias: separar avisos de explotabilidad

`npm audit --json --ignore-scripts` completó con acceso de red autorizado en ambas carpetas. No se ejecutó `audit fix` ni instalación. El primer intento falló por DNS en el sandbox; se repitió correctamente.

| Componente fijado | Resultado audit | Evaluación de alcanzabilidad |
| --- | --- | --- |
| Backend body-parser 1.20.8 | Alta | Ruta de parser público confirmada; hallazgo 1. |
| Backend nodemailer 10.1.2 | Moderada, tres avisos del parser de direcciones | Se usa para enviar correos, pero Joi rechaza las tres formas de direcciones especiales comprobadas localmente; no se confirmó redirección de un correo real con las entradas admitidas. Actualizar a 10.1.4 o posterior compatible. |
| Frontend node-forge 1.4.0 | Alta, propagada por listhen/nitropack/Nuxt | No se encontró verificación RSA PKCS#1 v1.5 sobre firmas de atacante en código de aplicación. listhen usa forge para certificados; no es prueba de explotación de esta firma en la demo. |
| Frontend zod 4.6.5 | Alta | No se encontró una llamada de aplicación que valide colecciones externas sin límite con Zod; la dependencia sí está fijada en el lockfile. Actualizar a 4.6.6 o posterior compatible y verificar consumidores transitorios. |

Totales npm: backend **2 paquetes** (1 alto, 1 moderado); frontend **8 registros altos**. Los ocho incluyen propagación del mismo problema por padres transitivos: **no representan ocho ataques independientes confirmados**. La sugerencia automática de npm de bajar Nuxt a 4.1.3 no debe aplicarse sin analizar compatibilidad; resolver el árbol real y reconstruir con versiones mantenidas.

Fuentes de avisos:

- [Nodemailer: comentario anidado](https://github.com/nodemailer/nodemailer/security/advisories/GHSA-8c8m-p3m8-cjg8), [separador de grupo](https://github.com/advisories/GHSA-m943-m63m-w62w), [local part entre comillas](https://github.com/advisories/GHSA-85x2-q946-cp5h).
- [node-forge: GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv) y [Zod: GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5), identificados por el servicio de avisos npm. Los enlaces a los repositorios de mantenedores de estos dos avisos devolvieron 404 en la consulta; no se atribuye explotabilidad de producción sin análisis adicional.

## Riesgos y mejoras adicionales, sin exploit confirmado

- **Exposición de demo por red:** Compose publica backend 3000 y frontend 3001 en todas las interfaces; Docker lo confirmó. PostgreSQL y Mailpit están ligados a loopback. Si se desea demo solo local, enlazar también API y frontend a 127.0.0.1; en producción usar proxy HTTPS/firewall y no publicar una demo con cuentas conocidas en una red no confiable. No se inspeccionó el firewall del host.
- **Límites de disponibilidad:** limitadores en memoria por IP, sin límite por cuenta ni almacén compartido. Reducen ataques básicos pero no intentos distribuidos; usuarios detrás del mismo proxy/IP pueden bloquearse mutuamente. Las rutas fuera de `/api` y salud no usan el limitador global; `/health` abre una consulta real por solicitud. No se hizo prueba de carga.
- **Reembolsos Stripe:** `onlinePaymentService.js:88-90` marca todo el pago como reembolsado a partir de `refund.updated` sin comprobar id del reembolso esperado ni importe; solo actúa si el pago local está `refund_pending`. Una operación parcial externa concurrente al reembolso local puede desincronizar la contabilidad. Requiere un evento Stripe genuino y ese estado previo: no permite falsificar webhooks sin firma. Vincular el refund esperado y reconciliar importe/currency acumulados. No se probaron Stripe ni dinero real.
- **Recuperación/invitaciones:** tokens aleatorios almacenados como hash, de un uso y con expiración; la cola conserva el enlace en claro hasta que el envío finaliza. Fallos prolongados de SMTP dejan enlaces vencidos en tablas/respaldos hasta que se purguen. Aplicar retención y minimización de la cola y de respaldos con datos personales; cifrado según el entorno.
- **Supply chain:** CI usa `npm ci`, permisos de repositorio de solo lectura y lockfiles, pero no incluye audit/SCA, análisis de imágenes ni detección de secretos; acciones y bases Docker referenciadas por etiquetas mutables. Fijar acciones por SHA e imágenes por digest con actualización automatizada; añadir análisis y una política de triage, evitando bloquear por avisos no alcanzables sin evaluación.
- **Validación desigual:** habitaciones/tipos mantienen validaciones manuales con coerción de parseInt/parseFloat, a diferencia de los esquemas Joi de otras áreas. No se confirmó inyección, pero conviene DTO/esquema uniforme de tipos y límites para impedir entradas ambiguas y errores de datos.
- **MFA y administración de sesiones:** no implementados; la interfaz lo declara. Recomendable MFA para administradores y revocación/listado de sesiones antes de exposición pública. No se presenta como bypass existente.

## Controles revisados con resultado favorable

- Consultas de valores parametrizadas; identificadores dinámicos de listados y actualizaciones proceden de listas internas. No se localizaron `eval`, ejecución de comandos del usuario ni carga de módulos desde entradas HTTP.
- Portal restringido al rol customer y filtrado SQL por `client_id` obtenido de la cuenta actual; pagos online también por usuario. No se confía en el rol/cliente enviado por el navegador para autorizar.
- Autenticación consulta usuario activo y `auth_version` en cada solicitud. Cambio de contraseña/desactivación invalida credenciales anteriores mediante versión.
- Cookies aleatorias HttpOnly, SameSite=Lax y Secure cuando APP_URL es HTTPS; CSRF de sesión verificado en mutaciones. Login de navegador requiere cabecera específica y valida origen. JWT Bearer separado para consumidores existentes; no se encontró token de sesión guardado en localStorage.
- Recuperación responde sin revelar si existe la cuenta; tokens de recuperación/invitación aleatorios, hash y expiración, consumo con bloqueo. Invitaciones solo admin y requieren que el creador siga siendo admin activo al aceptarlas.
- Contraseñas bcrypt con límite de 72 bytes; no se devolvieron hashes en DTO revisados y auditoría los elimina.
- Stripe valida firma con bytes originales y coteja importe/moneda; idempotencia, transacciones y bloqueos protegen liquidaciones repetidas. SMTP exige TLS fuera de demo, tiene timeouts y deshabilita acceso a archivos/URLs.
- Vue interpola texto en vez de v-html; no se encontraron sinks directos de HTML no confiable. Imágenes de presentación usan img en navegador; no se confirmó SSRF de backend a URLs arbitrarias.
- Respaldos emplean umask restrictivo, restauración aislada, manifiestos y hashes; `restore.sh` exige base nueva y no sobrescribe la operativa. Backend no ofrece descarga/restauración arbitraria desde HTTP.

## Comprobaciones y limitaciones

- Lectura de rutas, autorización, controladores, modelos, servicios, validadores, esquema/migraciones, frontend, Docker y CI.
- Pruebas backend con DATABASE_URL/JWT_SECRET de prueba y healthcheck deshabilitado: **10 suites y 94 pruebas pasaron; 2 suites y 45 pruebas de integración omitidas** al no configurar TEST_DATABASE_URL. No se usó la base operativa para pruebas.
- Dos consultas completas npm audit; versiones contrastadas con lockfiles y código instalado. Código de aplicación y dependencias sin cambios.
- Comprobación local inocua de fórmula CSV y rechazo Joi de tres formas de direcciones del aviso Nodemailer, sin persistencia ni correo.
- Agente coordinador verificó Docker, identidad no secreta de roles PostgreSQL, uid de procesos y cabeceras HTTP de login/health; no se ejecutaron ataques a la demo. GET health devolvió 200.
- No se ejecutaron pruebas de carga, payload de caída, explotación de XSS/CSRF, ataques contra terceros, escaneo de puertos externos, flujos Stripe reales ni correos reales. No se auditaron infraestructura cloud, proxy/firewall/certificados de producción ni historial Git completo de secretos. No se efectuó análisis CVE de imágenes del sistema operativo.
- No se ejecutaron lint/build frontend porque no se cambió código. El resultado es una auditoría con evidencia y límites, no una certificación ni garantía de seguridad total.

## Orden de corrección recomendado

1. Resolver body-parser y reconstruir el backend; comprobar versión efectiva y regresión de proceso aislado.
2. Separar rol PostgreSQL del runtime y retirar root en contenedores; cerrar exposición de demo si corresponde.
3. Neutralizar CSV y añadir cabeceras del documento Nuxt.
4. Actualizar Nodemailer/Zod y resolver node-forge con análisis de compatibilidad; automatizar detección y triage.
5. Endurecer reembolsos, límites, sesiones/MFA y retención de información sensible con pruebas de integración aisladas.
