# Frontend Roomly

Interfaz Nuxt del sistema hotelero. Consulta el README de la raíz para iniciar PostgreSQL y la API.

## Desarrollo y comprobaciones

Requiere Node.js 22.19+ de la rama 22, 24.11+ de la rama 24 o 26+.

```powershell
npm ci
npm run dev -- --port 3001
npm run lint
npm run typecheck
npm run test:ui
npm run build
```

Configura NUXT_PUBLIC_API_BASE para el navegador y NUXT_API_INTERNAL_BASE para SSR. Por defecto apuntan a http://localhost:3000/api. El build descarga Alata y requiere acceso a los proveedores de fuentes.

## Organización

- app/components/common: controles, tablas, modales, notificaciones e indicadores de estado.
- app/components/navigation: sidebar, encabezado y menú de usuario.
- app/components/settings: una vista por pestaña de configuración.
- app/composables/useAdminSettings.ts: controlador de las pestañas; sus preferencias y exportaciones son locales al navegador.
- app/utils/navigation.ts: enlaces y visibilidad por rol; la API y los middleware siguen controlando permisos.
- app/assets/styles: todos los estilos, separados por componentes, layouts y páginas.

## Estilos

Global.css importa Tailwind, Nuxt UI, tokens.css y base.css. Los colores del tema están definidos en la raíz del documento para que también los hereden modales y notificaciones trasladados a body.

Cada componente importa su archivo con scoped. No importes todos los estilos de componentes desde global.css:

```vue
<style scoped lang="scss" src="~/assets/styles/components/common/CButton.scss"></style>
```

Usa variables compartidas para colores y medidas reutilizables. Los badges de tablas usan CStatusBadge.

## Datos y comportamiento

Los servicios realizan solicitudes y transforman respuestas. Los stores administran estado compartido. Los composables coordinan operaciones y filtros. Cuando una página muestra sus propios avisos de una mutación, invoca el store directamente para evitar repetir los avisos del composable.

CTable admite carga, error, estado vacío, paginación y rowKey (por defecto id). Las filas necesitan claves únicas y estables. CInput pasa atributos nativos al input y mantiene un número vacío como cadena vacía.

CModal usa useDialogAccessibility para Escape, foco inicial, Tab, restauración del foco y bloqueo de scroll compatible con modales anidados.

## Pruebas

npm run test:ui comprueba controles, navegación por rol, tema, menú móvil, foco de modales y mutaciones de habitaciones con el runner de Node y Vue. Usa dobles del DOM; no requiere PostgreSQL ni comprueba la apariencia en un navegador real.
