/**
 * Middleware de autorización para admin
 * Solo permite acceso a usuarios con rol admin
 */
export default defineNuxtRouteMiddleware(() => {
  if (import.meta.server) return;

  const authStore = useAuthStore();
  const uiStore = useUiStore();

  // ==================== VERIFICACIÓN ====================

  // Si no está autenticado
  if (!authStore.isAuthenticated) {
    uiStore.error("Debes iniciar sesión primero");
    return navigateTo("/auth/login");
  }

  // Si no es admin
  if (!authStore.isAdmin) {
    uiStore.error("No tienes permisos para acceder a esta sección");
    return navigateTo("/");
  }

  // ✅ Permitir acceso
});
