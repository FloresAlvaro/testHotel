# Rediseño del frontend

La interfaz usa una base común de superficies neutras, acento índigo, tipografía del sistema y espaciado uniforme. Los estilos de navegación viven en `NavLink.vue`; el layout no vuelve a definir el aspecto de sus enlaces.

## Cambios

- Navegación agrupada en General, Operación, Análisis y Administración, con opciones según el rol. La selección sigue ruta y parámetros, incluyendo Equipo/Configuración y los dos informes.
- Layout con una barra superior compacta, contenido centrado y menú móvil con cierre al navegar, Escape, gestión de foco y fondo inerte mientras está abierto.
- Dashboard con indicadores, llegadas, próximas reservas, distribución real de habitaciones y accesos rápidos.
- Encabezados, tarjetas, tablas, botones, inputs y estados vacíos compartidos en las pantallas de operaciones, reportes y administración.
- Habitaciones sin cabeceras de colores saturados. Los detalles se abren en una ventana, evitando un enlace a una ruta inexistente.
- Formularios de habitación y reserva dentro de ventanas reales, no al final de las listas. Selectores con nombres para huéspedes, habitaciones, tipos y reservas, en lugar de campos de identificadores.
- Ventanas mediante `dialog`, con tamaños efectivos, cierre con Escape y foco gestionado por el navegador. Avisos visibles para las acciones del sistema.
- Acceso, recuperación informativa, solicitud de cuenta y pantalla de error adaptados al mismo sistema visual.
- Temas claro y oscuro basados en variables compartidas, incluidos los formularios que se renderizan fuera del layout.
- Fechas ISO normalizadas para las llegadas y el día local de los cobros; moneda predeterminada BOB. Los gráficos muestran fechas cortas y datos reales en lugar de un panel de ejemplo.

## Comprobaciones

Pasaron `npm run lint`, `npm run typecheck` y `npm run build`. Se comprobaron además las utilidades de fechas ISO, noches, fecha local y moneda.

La revisión en navegador utilizó PostgreSQL de demo aislado y cuentas de administrador, gerente y recepción. Se inspeccionaron dashboard, habitaciones, reservas, formularios, ingresos, administración, entradas y salidas, con temas claro/oscuro y anchos de 1440 y 390 px. Se comprobó el foco del menú móvil, cierre al navegar, ausencia de desbordamiento horizontal de la página de reservas y selección única del enlace de navegación. También se abrió la compilación de producción.

No se modificaron datos de la base habitual del hotel. La revisión de formularios no incluyó crear cobros ni registrar entradas/salidas nuevas.
