# Controles de seguridad de CI

Implementación de S3.2 del [plan](plan-seguridad.md), 24 de octubre de 2026. Responsable: mantenedores del Hotel con `security-senior`.

El workflow `Seguridad del hotel` se ejecuta en push, pull request, manualmente y cada lunes. No requiere credenciales de la aplicación ni usa la base de la demo. Deben configurarse sus checks como obligatorios en la protección de la rama en GitHub; un archivo YAML no cambia esa configuración remota.

## Dependencias y deuda conocida

`node scripts/security/audit-dependencies.mjs Backend-H` y su equivalente frontend consultan el lockfile mediante `npm audit --json --ignore-scripts`, sin instalar dependencias. Los advisories originales se cuentan una vez; los paquetes padres afectados no se cuentan como vulnerabilidades independientes. Cualquier aviso nuevo, incluso de severidad baja, bloquea. JSON inválido, fallo de red o respuesta incompatible también bloquean.

La única excepción inicial está en `.github/security-exceptions.json`: node-forge **1.4.0**, [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv). Se limita a ese advisory, paquete, versión y carpeta; es visible en cada ejecución y vence el **7 de noviembre de 2026**. La revisión encontró un consumidor transitivo de certificados TLS locales en listhen, sin verificación de firmas externas de usuarios en la aplicación. Esto reduce la alcanzabilidad observada; no elimina el defecto de la dependencia. No se usa `audit fix --force`, no se degrada Nuxt y no se ignoran todos los avisos de un paquete. Si cambia el consumidor o aparece un parche compatible, revisar inmediatamente.

Para una excepción nueva se exige advisory, versión exacta, razón de alcanzabilidad, mitigación, responsable y fecha de revisión corta; debe aprobarse mediante revisión de código. La excepción no autoriza exponer un flujo vulnerable. No extender automáticamente la fecha al vencer.

## Imágenes y secretos

Se construyen las imágenes finales de ambos Dockerfiles y Trivy analiza paquetes del sistema operativo y bibliotecas de la imagen final. HIGH/CRITICAL bloquean aunque no tengan parche; no hay exclusión general `ignore-unfixed`. El gate npm también comprueba las bibliotecas JavaScript del proyecto, incluidas dependencias de build/desarrollo. La ejecución puede revelar deuda adicional de la imagen: el job debe fallar hasta corregirla o aprobar una excepción específica con evidencia; no se fuerza un resultado verde.

El scanner de secretos Trivy analiza el árbol actual, excluyendo `.git` y `node_modules`. Guarda el resultado JSON solo en `/tmp` del runner efímero, sin publicarlo como artefacto ni imprimir coincidencias, y muestra únicamente el número de hallazgos. Cualquier coincidencia falla el job. No cubre secretos ya borrados del historial: si se sospecha una filtración, hace falta revisar el historial y revocar la credencial. Nunca agregar un secreto real para probar el pipeline.

Las acciones se fijan por SHA completo. Las imágenes de servicios de CI usan digest del índice multiplataforma. Las referencias se verificaron contra repositorios oficiales con `git ls-remote` y contra el registro con `docker buildx imagetools inspect`; la acción Trivy fija también sus acciones compuestas por SHA. Trivy se fija a `v0.69.3`; sus bases de vulnerabilidades se actualizan durante el análisis. Un fallo de descarga de esas bases falla el análisis.

## Actualización

Dependabot abre propuestas semanales para npm de ambas capas, acciones y Dockerfiles; no hay automerge. Revisar las nuevas versiones, ejecutar suites y scans, y verificar que los comentarios de versión coinciden con los SHA. Los digests de imágenes de servicios en YAML/Compose deben revisarse semanalmente con los mantenedores: Dependabot de Dockerfile no garantiza actualizar esos campos. Comparar `docker buildx imagetools inspect <tag>` y revisar cambios de la imagen antes de cambiar el digest; ejecutar la matriz de pruebas después. Los cambios a workflows y excepciones requieren revisión humana y permisos de escritura restringidos.

Fuentes primarias: [seguridad de GitHub Actions](https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions), [configuración Dependabot](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/dependabot-options-reference), [Trivy Action fijada](https://github.com/aquasecurity/trivy-action/tree/57a97c7e7821a5776cebc9bb87c984fa69cba8f1). La ejecución remota y la protección de rama deben comprobarse en GitHub tras publicar los cambios; las comprobaciones locales no sustituyen esa evidencia.

## Validación local del 24 de octubre de 2026

- `actionlint v1.7.12`, descargado del repositorio oficial con checksum verificado: ambos workflows válidos, también después de añadir MFA al entorno E2E.
- Gate real npm: backend sin avisos; frontend con un advisory independiente de node-forge, registrado explícitamente en la excepción temporal. La salida no se presenta como auditoría limpia.
- Cuatro pruebas del gate aprobadas: excepción exacta visible, rechazo de avisos nuevos/otra versión/excepción vencida, fallo de red/JSON inválido y respuesta limpia válida.
- YAML de workflows y Dependabot analizado correctamente. Lint, tipos y build frontend aprobados al integrar las pantallas MFA. Las nuevas pruebas E2E exigen MFA real; no hay omisión del segundo factor en el código de la aplicación.
- Pendiente en esta validación local: ejecución de Trivy en los runners GitHub y configuración remota de protección de rama. Las imágenes no se certifican sin ese resultado.

Actualización local del 25/10: se analizaron imágenes exportadas sin acceso al socket Docker; backend y frontend sin hallazgos HIGH/CRITICAL tras retirar npm/yarn de runtime. El árbol versionable dio cero coincidencias de secretos; no incluye el historial Git. El gate npm mantiene la única excepción explícita anterior.
