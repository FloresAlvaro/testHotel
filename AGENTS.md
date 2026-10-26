# Agentes del proyecto Hotel

Comunícate en español salvo otra preferencia. El frontend está en `Frontend-H/`, el backend en `Backend-H/` y el esquema PostgreSQL en `database/init/`.

## Skills locales

- **frontend-senior**: para implementar, corregir o revisar Nuxt/Vue, TypeScript, componentes, estado y UX/UI, lee `.agents/skills/frontend-senior/SKILL.md`. Invocación: `$frontend-senior`.
- **backend-senior**: para implementar, corregir o revisar Express, APIs, autorización, validación y PostgreSQL, lee `.agents/skills/backend-senior/SKILL.md`. Invocación: `$backend-senior`.
- **ux-ui-senior**: para auditar usabilidad, accesibilidad, navegación y diseño adaptable, lee `.agents/skills/ux-ui-senior/SKILL.md`. Invocación: `$ux-ui-senior`. Entrega hallazgos priorizados; una revisión no autoriza implementar cambios.
- **security-senior**: para auditorías, vulnerabilidades y correcciones de seguridad del Hotel, lee `.agents/skills/security-senior/SKILL.md`. Invocación: `$security-senior`. El plan de implementación está en `docs/plan-seguridad.md`.

En tareas que atraviesen ambas capas, aplica ambas especializaciones y comprueba los contratos. Estas skills instruyen al agente actual; no requieren crear subagentes ni chats nuevos.

En tareas de seguridad, aplica `security-senior` y complementa con la especialización de cada capa afectada. Una auditoría o un plan no implican ejecutar correcciones ni modificar el entorno operativo.

## Convenciones

Conserva el stack y las convenciones existentes. Consulta dependencias y scripts de cada carpeta, el `README.md` raíz y `docker-compose.yml` para arranque. Mantén la separación entre URL interna SSR y URL pública de la API. No expongas secretos.

Frontend: desde `Frontend-H/`, ejecuta `npm run lint`, `npm run typecheck` o `npm run build` según el cambio. Backend: desde `Backend-H/`, ejecuta `npm test -- --runInBand` con las variables de prueba del README. Informa las comprobaciones ejecutadas y las pendientes.
