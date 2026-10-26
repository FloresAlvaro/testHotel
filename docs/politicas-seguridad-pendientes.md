# Políticas de identidad y retención

**Cambio posterior aprobado:** MFA ahora es opcional por administrador, con activación/desactivación propia desde ajustes. La obligatoriedad descrita en el registro inicial queda sustituida por [la política vigente](mfa-opcional.md). La retención acordada no cambia.

Política aprobada por el usuario el 24 de octubre de 2026: MFA TOTP obligatorio para administradores, códigos de recuperación y retención de sesiones vencidas siete días y enlaces de recuperación en cola veinticuatro horas. Se conserva la política actual de auditoría y respaldos.

## MFA y recuperación

`MFA_ENABLED` es verdadero por defecto; una instalación habilitada necesita `MFA_ENCRYPTION_KEY`, 32 bytes en hexadecimal generados fuera del repositorio. La API comprueba la clave al arrancar. La custodia y respaldo de esta clave debe mantenerse fuera de la base de datos y de sus dumps: perderla impide descifrar los autenticadores. No se ha introducido un proveedor externo.

Tras verificar la contraseña de un administrador, la API emite un desafío limitado de diez minutos, sin cookie ni JWT utilizable. La primera inscripción entrega URI/secreto TOTP y diez códigos de recuperación; se activa solo tras comprobar el primer código y confirmar que se guardaron los códigos de recuperación. Se usa OTPAuth mantenida y cifrado autenticado AES-256-GCM del módulo estándar de Node; los códigos de recuperación solo se almacenan como SHA-256. El navegador conserva los datos de inscripción únicamente en memoria y no se usan servicios externos de QR.

Cada desafío permite cinco intentos; el presupuesto compartido en PostgreSQL limita la cuenta a diez intentos entre desafíos vigentes y cinco desafíos pendientes. Se serializa por usuario. Los TOTP no se pueden reutilizar en el mismo intervalo y cada código de recuperación se consume atómicamente una sola vez. La inscripción y la renovación incrementan auth_version y revocan todas las sesiones anteriores. La migración 008 revoca credenciales administrativas previas; el middleware rechaza administradores sin constancia MFA. No existe desactivación de MFA administrativa en la interfaz.

Tras perder el autenticador, se puede iniciar sesión con contraseña y un código de recuperación y renovar TOTP desde ajustes. La renovación exige nuevamente contraseña y factor/código de recuperación; entrega una nueva colección de diez códigos que sustituye la anterior al confirmar. Se debe conservar al menos un código de recuperación fuera del dispositivo autenticador. Perder autenticador y todos los códigos requiere un procedimiento administrativo externo autorizado y verificación de identidad; no se ofrece un bypass web ni un restablecimiento ajeno desde la UI.

Las pruebas de línea base configuran explícitamente MFA_ENABLED=false; las regresiones MFA y E2E lo activan y usan claves/secretos exclusivamente aislados. El script E2E se niega a modificar una base que no sea vacía, de prueba y con nombre _e2e. Nunca se agregan secretos conocidos al seed de demo.

## Sesiones y limitación

La API permite consultar y revocar exclusivamente sesiones propias por UUID público, con control de propietario y CSRF. No devuelve hashes de credenciales ni CSRF de otras sesiones. Los JWT de integraciones no son sesiones de navegador.

El limitador de cuenta de contraseña usa SHA-256 del correo normalizado y memoria del proceso (ventana quince minutos): diez errores de acceso y cinco solicitudes de recuperación por cuenta, complementados con límites por IP. Antes de ejecutar réplicas se necesita un almacén compartido para ese limitador; el presupuesto MFA ya es compartido en PostgreSQL.

## Retención aplicada

El trabajador horario se activa con `SECURITY_RETENTION_ENABLED=true`. `SECURITY_SESSION_RETENTION_DAYS=7` y `SECURITY_LINK_RETENTION_HOURS=24` son los valores predeterminados de la política aprobada. Elimina sesiones con más de siete días vencidas, desafíos MFA vencidos y redacta cuerpos de recuperación antiguos en `email_outbox`. Las invitaciones vigentes no se redactan antes de caducar, aunque su correo tenga más de veinticuatro horas. Los mensajes sensibles entregados correctamente se redactan inmediatamente, como antes. No elimina reservas, pagos, auditoría ni archivos de respaldo.

Cifrar respaldos requiere acordar custodia, rotación y recuperación de una clave de respaldo; no se activa un mecanismo que deje dumps irrecuperables. Los respaldos actuales deben protegerse con los permisos y acceso operativo existentes.
