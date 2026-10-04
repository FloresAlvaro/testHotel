/**
 * Middleware de autorización para manager
 * Permite acceso a manager y admin
 */
export default defineNuxtRouteMiddleware(() => {
  if (import.meta.server) return;

  const authStore = useAuthStore();
  const uiStore = useUiStore();

  if (!authStore.isAuthenticated) {
    uiStore.error("Debes iniciar sesión primero");
    return navigateTo("/auth/login");
  }

  if (!authStore.isManager && !authStore.isAdmin) {
    uiStore.error("No tienes permisos para acceder a esta sección");
    return navigateTo("/");
  }
});
