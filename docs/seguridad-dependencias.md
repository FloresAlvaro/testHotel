# Revisión de dependencias — 22 de octubre de 2026

Se revisaron los 21 paquetes señalados por `npm audit` en el frontend. El número
incluye paquetes afectados indirectamente por las mismas dependencias; no son
21 vulnerabilidades independientes. Los informes JSON completos quedan en
`.backups/dependency-audit-*.json`, fuera de Git.

## Correcciones y alcance

Nuxt se actualizó de 4.5.2 a 4.6.2. El proyecto usa reglas `/auth/**` para enviar
`Referrer-Policy: no-referrer` y `Cache-Control: no-store`; la corrección de
[GHSA-vjh5-4x84-xrqp](https://github.com/nuxt/nuxt/security/advisories/GHSA-vjh5-4x84-xrqp)
evita que esas reglas se omitan al variar las mayúsculas de una ruta.
Una regresión HTTP comprueba las rutas normales y sus variantes en mayúsculas.

La misma versión corrige
[GHSA-xfq5-w38q-pc2x](https://github.com/nuxt/nuxt/security/advisories/GHSA-xfq5-w38q-pc2x).
No se encontró uso de server islands ni `useHeadSafe` con datos externos en esta
aplicación. También se corrige el aviso de NuxtLink del árbol anterior.

Se actualizaron las dependencias transitivas compatibles. `source-map-js`, que
estaba presente en el servidor de producción, pasó a 1.2.2. Se aplica un override
limitado a `fontless → esbuild ^0.28.2`, porque fontless 0.2.1 solicita ^0.27.0 y
esa rama no incluye el parche del
[servidor de desarrollo de Windows](https://github.com/evanw/esbuild/security/advisories/GHSA-g7r4-m6w7-qqqr).
Se verificó su compatibilidad mediante instalación limpia y compilación Docker.
El override puede retirarse cuando el paquete padre use una versión corregida.

| Paquete señalado originalmente | Resultado | Alcance observado |
| --- | --- | --- |
| `@modelcontextprotocol/client` | 2.3.1, sin aviso | Herramientas de desarrollo; sin integración MCP en la aplicación |
| `@modelcontextprotocol/server` | 2.3.1, sin aviso | Herramientas de desarrollo; sin servidor MCP de la aplicación |
| `@nuxt/cli` | 4.0.1, sin aviso | CLI de construcción/desarrollo |
| `@nuxt/devtools` | 3.4.4, sin aviso | Desarrollo; no incluido en runtime Docker |
| `@nuxt/nitro-server` | 4.6.2; corregido aviso propio | Conserva aviso transitivo de herramientas |
| `@nuxt/vite-builder` | 4.6.2 | Conserva aviso transitivo de herramientas |
| `@simple-git/argv-parser` | Eliminado del árbol | Dependencia anterior de devtools |
| `braces` | 3.0.3; sin parche publicado | Patrones de archivos de herramientas; ausente del runtime Docker |
| `esbuild` | 0.28.2, sin aviso | Compilación/desarrollo |
| `fast-glob` | 3.3.3 | Aviso transitivo de braces; construcción |
| `globby` | 16.2.4 | Aviso transitivo de braces; construcción |
| `launch-editor` | 2.14.2, sin aviso | Integración del editor en desarrollo |
| `listhen` | 1.10.1 | Aviso transitivo de node-forge; CLI/desarrollo |
| `micromatch` | 4.0.8 | Aviso transitivo de braces; construcción |
| `nitropack` | 2.13.5 | Conserva avisos transitivos de herramientas |
| `node-forge` | 1.4.0; sin parche publicado | Dependencia de listhen; ausente del runtime Docker |
| `nuxt` | 4.6.2; corregidos avisos propios | Conserva avisos transitivos de herramientas |
| `shell-quote` | 1.12.0, sin aviso | Herramientas de desarrollo |
| `simple-git` | Eliminado del árbol | Dependencia anterior de devtools |
| `source-map-js` | 1.2.2, sin aviso | Presente en el servidor de producción |
| `vite` | 8.3.5, sin aviso | Desarrollo/construcción |

## Avisos residuales

El lockfile completo registra **11 avisos altos**, sin críticos, moderados o
bajos. Son los dos problemas sin parche de
[braces](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) y
[node-forge](https://github.com/advisories/GHSA-86w9-cpqp-85rv), propagados por
`micromatch`, `fast-glob`, `globby`, `listhen`, `nitropack`, `@nuxt/nitro-server`,
`nuxt`, `@nuxt/vite-builder` y el nuevo paquete interno `@nuxt/vite-server`.

No se ocultaron los avisos ni se usó `npm audit fix --force`, que propone
retroceder Nuxt a una versión anterior a las correcciones de seguridad.
En este proyecto no se aceptan patrones de archivos o firmas RSA de usuarios
mediante estas bibliotecas. Nitro importa globby/listhen en su núcleo de
construcción y CLI, mientras el contenedor final ejecuta únicamente `.output`.
El inventario recursivo del contenedor final no contiene ninguno de los 11
paquetes residuales. Hay que seguir revisando sus parches y evitar exponer los
servidores de desarrollo a redes no confiables.

La auditoría del manifiesto de versiones exactas generado en
`.output/server/package.json` devuelve **0 avisos**. Para generar solo su lockfile
temporal se toleraron las entradas de binarios de varias plataformas con
`npm install --package-lock-only --ignore-scripts --omit=dev --no-audit --force`;
no se instalaron dependencias ni se modificó la imagen probada. Este análisis
cubre las dependencias externas; Nuxt también incorpora código al compilar, por
lo que se verificó además la versión corregida y la regresión de cabeceras.

El backend desplegado devuelve **0 avisos con `npm audit --omit=dev`**. Su árbol
completo registra 30 avisos derivados de braces a través de Jest 29/nodemon 3,
excluidos por `npm ci --omit=dev` en su Dockerfile. No se migró Jest ni se degradó
nodemon para eliminar un contador de avisos de desarrollo.

## Comprobaciones

- Backend: 139 pruebas aprobadas, incluidas integración y migraciones, usando
  PostgreSQL temporal separado de los datos del hotel.
- Frontend: lint y comprobación de tipos aprobados; `npm ci` y compilación de
  producción completados en Linux con el Dockerfile del proyecto.
- E2E: **15 pruebas aprobadas** en Chrome: sesión HttpOnly y salida, invitaciones y correo, portal móvil,
  reservas, check-in/check-out, cobro y comprobante, limpieza, caja,
  solicitudes y cabeceras de seguridad sobre datos ficticios aislados.
- Se corrigió el selector antiguo del calendario en la prueba de estancia:
  el nombre accesible ya incluye «Finalizada»; también se comprueba el destino
  del enlace. No se cambió el comportamiento de la pantalla.
- Despliegue: se reemplazó únicamente el frontend de `hotel-demo` por la imagen
  probada. API y PostgreSQL responden correctamente, y la regresión de cabeceras
  también pasa contra `http://localhost:3001`. Las 21 tablas conservaron sus
  conteos y huellas de contenido exactos antes/después del despliegue.
  Respaldo previo restaurado y verificado: `hotel-20261023T013158Z-41`, con copia
  local en `.backups/`. Los entornos de integración y E2E se retiraron al terminar.

Los resultados corresponden a los avisos disponibles en esta revisión; no
equivalen a una garantía de ausencia de futuras vulnerabilidades.
