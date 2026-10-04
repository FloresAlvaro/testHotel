/**
 * Middleware de autorización para receptionist
 * Permite acceso a recepcionista, manager y admin
 */
export default defineNuxtRouteMiddleware(() => {
  if (import.meta.server) return;

  const authStore = useAuthStore();
  const uiStore = useUiStore();

  if (!authStore.isAuthenticated) {
    uiStore.error("Debes iniciar sesión primero");
    return navigateTo("/auth/login");
  }

  // Todos los roles autenticados tienen acceso (receptionist, manager, admin)
});
