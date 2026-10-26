# MFA opcional por administrador

Por solicitud posterior del usuario, MFA pasa de obligatorio a opcional para cada administrador. Esta decisión sustituye la política de obligatoriedad del plan inicial. Los factores ya inscritos permanecen activos; no se borran ni deshabilitan automáticamente al actualizar.

En **Configuración → Seguridad → Autenticación de dos factores**:

- **Activar MFA**: confirmar contraseña, configurar autenticador y guardar los diez códigos de recuperación. Solo queda activo tras verificar el primer TOTP.
- **Desactivar MFA**: confirmar contraseña y un TOTP vigente o código de recuperación sin usar. Se elimina el secreto y los códigos, se incrementa auth_version y se revocan las otras sesiones y desafíos. La sesión actual se renueva para seguir utilizando la aplicación.
- **Configurar nuevo autenticador** conserva el flujo de renovación existente.

Sin MFA inscrito se inicia sesión con contraseña. Con MFA activo se sigue exigiendo el segundo factor en cada acceso. Cada administrador administra únicamente su propia cuenta; personal y huéspedes no pueden utilizar estas operaciones. La API comprueba autorización, origen y CSRF en el servidor, además de reautenticación; los controles visuales no son el límite de permisos.

Endpoints nuevos: POST /api/users/mfa/enable (contraseña, devuelve desafío de inscripción) y POST /api/users/mfa/disable (contraseña + código, devuelve sesión renovada). No requiere nueva migración ni cambios de roles PostgreSQL. MFA_ENABLED sigue habilitando la capacidad del servidor, no la obligatoriedad del segundo factor para cuentas sin inscripción.

Pruebas: regresiones de contraseña/código incorrectos, CSRF, revocación, eliminación de factores/códigos y acceso posterior solo con contraseña; comprobación de roles y flujo E2E de los controles. Verificado: 170/170 pruebas backend; lint, tipos, build y contratos correctos; E2E de activación, recuperación, renovación y desactivación aprobado; smoke de imágenes con rol runtime restringido aprobado. Demo actualizada e interfaz inspeccionada. Respaldo restaurado previo: hotel-20261025T153034Z-79/archive.dump. No se modificó ningún factor real durante la verificación.
