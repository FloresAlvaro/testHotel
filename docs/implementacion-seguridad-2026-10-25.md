# Implementación de seguridad — 25 de octubre de 2026

Trabajo sobre `develop`, base `a38dfbc`, sin commit ni publicación remota nuevos. Autorización: implementar el plan y, expresamente, TOTP obligatorio para administradores con recuperación y retención de sesiones vencidas siete días / enlaces de recuperación veinticuatro horas. La [auditoría inicial](auditoria-seguridad-2026-10-24.md) se conserva como antecedente, no como estado actual.

## Cambios implementados

| Fase | Resultado |
| --- | --- |
| S0 | PostgreSQL y Mailpit aislados; pruebas sin utilizar la demo como fixture; respaldos restaurados y verificados. |
| S1 | body-parser 1.20.9, descompresión deshabilitada en JSON/form/raw, límites explícitos y errores controlados. Stripe conserva sus bytes originales. |
| S2 | Serializador CSV común contra fórmulas; CSP de scripts con hashes, frame-ancestors none, X-Frame-Options DENY, nosniff, no-store en documentos y política de permisos. |
| S3 | Nodemailer 10.2.1, Zod 4.6.7; CI de dependencias/imágenes/secretos, acciones SHA, imágenes por digest y Dependabot. Excepción limitada de node-forge documentada. |
| S4 | Propietario, migrador, runtime y dos identidades de respaldo separados. API sin superusuario/DDL; auditoría/recibos/movimientos protegidos; migrador fuera del servidor HTTP. |
| S5 | Node 22.23.4 no root, rootfs solo lectura, capacidades eliminadas, no-new-privileges, límites y puertos loopback. npm/yarn retirados de runtime tras detectarse vulnerabilidades en esas herramientas. |
| S6 | Correlación estricta de reembolsos Stripe; Joi para habitaciones/tipos; límites IP/cuenta, presupuesto MFA compartido, liveness separado y timeouts HTTP. |
| S7 | Listado/revocación de sesiones propias; MFA TOTP obligatorio, inscripción, recuperación y renovación; secretos cifrados y códigos de un uso con hash; trabajador horario de retención. |
| S8 | Revisión independiente, regresiones, escaneos y smoke de imágenes aisladas completados. Demo desplegada y verificada, con los límites externos indicados al final. |

La revisión independiente encontró y cerró una carrera adicional: MFA podía emitir credenciales con una versión posterior a una revocación concurrente. Se conserva ahora la versión verificada y se rechaza cualquier cambio antes de emitir cookie/JWT; cuatro regresiones cubren ambos mecanismos. La validación TOTP y su contador usan un mismo instante.

## Evidencia de pruebas

- Suite backend: **169/169**, 16 suites, PostgreSQL aislado; sin omisiones. La línea base inicial había pasado 139/139.
- E2E: **18 casos aprobados** entre la suite de 17 casos y la repetición del nuevo MFA. El primer intento MFA falló por fixtures de prueba y navegación móvil; se corrigió a creación por API con correo válido y apertura del menú móvil. La repetición final cubrió inscripción, recuperación y renovación reales sin bypass de MFA.
- Frontend: lint, tipos y build aprobados; utilidades CSV/fechas **5/5**. Inspección visual de la pantalla de inscripción obligatoria.
- Contratos: `api:check` y typecheck backend aprobados; OpenAPI y tipos generados sincronizados.
- Gate de auditoría: **4/4** regresiones; errores de red, respuestas inválidas, avisos nuevos y excepciones vencidas bloquean.
- `database/security/test-roles.py --images`: aprobado. Política idempotente, CRUD/triggers, denegaciones DDL/roles/auditoría, migración, respaldo/restauración, API production y SSR autenticado con runtime restringido; uid no root y escritura en /app denegada.
- Ensayo S4.4 literal adicional: respaldo `hotel-20261025T150840Z-38/archive.dump` montado readonly y restaurado en PostgreSQL temporal sin red; política, API/runtime, SSR y MFA completos aprobados, sin cargar seed previo ni usar clave MFA operativa.
- `database/backup/test-backup.py`: aprobado; pruebas de integridad, copia externa de prueba, retención y fallos.
- Trivy de imágenes finales exportadas: **0 HIGH/CRITICAL** en sistema y bibliotecas de backend y frontend. No se concedió acceso al socket Docker al analizador.
- Trivy sobre copia de archivos versionables: **0 coincidencias de secretos**. Excluye .env, archivos ignorados e historial Git; no equivale a una revisión del historial remoto.
- Actionlint de la configuración original y YAML de workflows aprobados localmente. Se añadió además un job security-runtime para repetir en CI el smoke de roles/imágenes/MFA/restauración. GitHub Actions no se ha ejecutado ni se ha configurado protección remota de ramas en esta tarea.

Los informes temporales del 24–25/10 se encuentran en `/private/tmp/hotel-*-audit.json` y logs `hotel-security-tests-final.log`, `hotel-e2e-mfa.log`, `hotel-e2e-mfa-retry.log`. No contienen credenciales operativas impresas. No se versionan dumps, secretos ni contenido de correo.

## Despliegue y recuperación

La transición se ejecuta con [transition-demo.py](../database/security/transition-demo.py): preserva el volumen, guarda IDs de imágenes anteriores, detiene escritores, genera respaldo restaurado antes de migrar, valida checksums históricos y aplica 007/008 antes de provisionar permisos. No carga seed ni elimina volúmenes. El checkpoint local privado registra cada etapa y referencias de respaldos sin secretos.

Verificación operativa completada el 25/10:

- `/health`, `/live` y `/auth/login`: HTTP 200; HTML con CSP y no-store.
- API conectada como hotel_runtime: SUPERUSER/CREATEDB/CREATEROLE/BYPASSRLS falsos.
- Ambos procesos uid 1000, rootfs read-only, CapDrop ALL y puertos 127.0.0.1:3000/3001.
- Acceso admin exige MFA sin emitir cookie; acceso de huésped y SSR privado, listado propio y salida comprobados. No se inscribió ni reemplazó el autenticador del administrador real de demo.
- Datos conservados: 11 reservas, 11 pagos, 10 habitaciones, 7 usuarios.
- Respaldo previo restaurado: `hotel-20261025T150721Z-1/archive.dump`.
- Respaldo posterior con lector/verificador separados: `hotel-20261025T150840Z-38/archive.dump`, restaurado; sin copia externa configurada.
- Checkpoint privado: `/var/folders/9d/lt11zbd11pl9bh_0ptyg97mm0000gn/T/hotel-security-transition-20261025T150653Z-lgx56yn2.json`, etapa verified_operational.
- Imagen API: `sha256:80c451966c4b67f8ede18ed498b9d566a75ce2cde9450a884893c19c9d6b6413`; frontend: `sha256:6740ed25f615dde37e8faced4b13ba6d42644bb7bb4367f46007a36d52653a96`.

Durante la transición se recuperaron snapshots de las imágenes antiguas cuyo registro Docker había desaparecido, sin copiar variables de entorno, y se corrigió el formato YAML de tmpfs antes de completar el arranque. El procedimiento ahora rechaza montajes temporales mal interpretados antes de detener escritores. Las imágenes archivadas son para recuperación controlada, no para reexponer dependencias antiguas vulnerables.

## Límites y seguimiento

- `node-forge@1.4.0` permanece en herramientas transitivas Nuxt/listhen, sin parche compatible publicado en la revisión. No está presente en el árbol de dependencias del servidor Nuxt compilado inspeccionado. [Excepción exacta](../.github/security-exceptions.json), responsable mantenedores/security-senior, revisión antes del **7 de noviembre de 2026**. No se degradó Nuxt ni se ocultaron avisos nuevos.
- CSV se verificó por serialización y fixtures inocuos; **no se abrió en Excel/LibreOffice**. No se certifica el comportamiento de todos los importadores.
- HTTPS/HSTS y firewall productivos requieren dominio, certificados y entorno real. Hay [ejemplo de proxy](../deploy/nginx.conf.example) y [guía de despliegue](despliegue-seguro.md); la demo sigue siendo HTTP local.
- Los límites de contraseña/recuperación por cuenta usan memoria del proceso: antes de replicar API, implementar almacén compartido. El presupuesto MFA ya usa PostgreSQL.
- Respaldos locales privados, sin cifrado ni destino remoto activados. Cifrado/offsite requiere custodia y recuperación de claves y destino acordados. No se ha reducido la retención vigente de auditoría ni respaldos.
- La clave `MFA_ENCRYPTION_KEY` está fuera de Git, en configuración local protegida. Debe custodiarse separada de los dumps; no rotarla sin recifrado probado. Al siguiente acceso, un administrador aún no inscrito debe configurar su autenticador y guardar sus códigos.

Estos resultados describen las comprobaciones realizadas; no garantizan ausencia absoluta de vulnerabilidades.
