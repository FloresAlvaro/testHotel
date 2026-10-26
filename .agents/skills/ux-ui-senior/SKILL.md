---
name: ux-ui-senior
description: Auditar la experiencia de usuario y la interfaz del Hotel, priorizar problemas de usabilidad, accesibilidad y diseño adaptable, y preparar mejoras verificables. Usar para revisiones UX/UI; complementar frontend-senior al implementar cambios autorizados.
---

# Senior UX/UI del Hotel

Trabaja en español y evalúa la aplicación desde las tareas reales de recepción, gerencia, administración y huéspedes. Lee AGENTS.md y distingue una auditoría de una petición de implementación: un informe no autoriza corregir código ni modificar datos operativos.

## Contexto y cobertura

- Inventaría rutas en Frontend-H/app/pages, layouts, componentes compartidos y permisos. Revisa la versión desplegada y los cambios locales antes de atribuirle comportamientos al código.
- Examina acceso y recuperación; dashboard; huéspedes y equipo; habitaciones y disponibilidad; reservas, entrada/salida y solicitudes; pagos, recibos y caja; tareas, reportes, historial y ajustes; portal de huéspedes.
- Organiza la cobertura por tarea y rol, incluidas páginas dinámicas y estados de vacío/error/carga. Distingue lo visitado de las variantes sin datos o permisos disponibles. No afirmes revisar toda la aplicación solo por recorrer el menú de administrador.
- Respeta decisiones explícitas del usuario, incluidas alineaciones de tablas ya aprobadas. Separa un defecto de usabilidad de una preferencia estética; no propongas revertir decisiones sin explicar el beneficio y la alternativa.

## Método de revisión

- Inspecciona la interfaz renderizada con las herramientas de navegador disponibles: escritorio y móvil, formularios/modales, filtros y paginación, teclado/foco, etiquetas, mensajes y consistencia de acciones y estados. Usa código como evidencia complementaria, no como sustituto de observación visual.
- Sigue tareas de principio a fin hasta el límite autorizado. En una demo compartida, evita confirmar reservas, cobros, reembolsos, altas/bajas, cambios de contraseñas/MFA o envíos. Para probar mutaciones usa fixtures aislados si están autorizados; de otro modo documenta el límite y revisa sus contratos/estados sin ejecutarlos.
- Comprueba jerarquía y siguiente paso, lectura de importes/fechas, prevención de errores, conservación del trabajo, confirmación de consecuencias y recuperación. Identifica funcionalidades simuladas o locales que la UI presente como compartidas u operativas.
- Examina navegación móvil, desbordamiento, objetivos táctiles y listas densas con contenido realista. No confíes solo en reducir el ancho del código CSS.
- En accesibilidad distingue observaciones manuales, mediciones y pruebas con tecnologías asistivas. No certifiques conformidad ni inventes ratios de contraste, tamaños o resultados de pruebas de lectores de pantalla.
- Captura evidencias útiles sin exponer tokens, claves MFA, enlaces de recuperación ni datos personales innecesarios. No publiques capturas ni informes fuera del repositorio sin autorización.

## Informe y priorización

Por hallazgo registra ID, prioridad, pantalla/tarea y rol, evidencia o pasos de reproducción, consecuencia para el usuario y recomendación concreta. Añade un criterio verificable para considerar resuelto el problema. Indica si está observado en navegador, confirmado por código o pendiente de validar.

Prioriza según impacto y frecuencia, no cantidad de cambios visuales:

- P1: impide o hace peligrosa una tarea importante, induce errores financieros/operativos o excluye un flujo esencial.
- P2: fricción repetida, interpretación ambigua, inconsistencia o recuperación insuficiente.
- P3: refinamiento visual o editorial con impacto limitado.

Agrupa patrones compartidos y evita contar el mismo componente como defectos independientes. Entrega un orden de acción, dependencias y cobertura/limitaciones; no inventes estimaciones ni porcentajes de mejora. Conserva informes anteriores como antecedentes fechados y revalida sus hallazgos.

Si se autoriza implementar, aplica frontend-senior y, cuando cambien reglas/API, backend-senior; conserva contratos y verifica el resultado renderizado además de lint/tipos/build y pruebas de comportamiento relevantes.
