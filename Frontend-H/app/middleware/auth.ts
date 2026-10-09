/**
 * Middleware de autenticación
 * Protege rutas que requieren usuario autenticado
 * Redirige a login si no está autenticado
 */
export default defineNuxtRouteMiddleware((to) => {
  // ==================== RUTAS PÚBLICAS ====================
  const publicRoutes = [
    "/auth/login",
    "/auth/register",
    "/auth/forgot-password",
    "/auth/accept-invitation",
    "/auth/reset-password",
  ];

  if (import.meta.server) return;

  if (["/auth/accept-invitation", "/auth/reset-password"].includes(to.path)) return;
  const authStore = useAuthStore();

  // ==================== LÓGICA ====================

  // Si está en ruta pública y ya está autenticado, redirigir a home
  if (publicRoutes.includes(to.path) && authStore.isAuthenticated) {
    return navigateTo(getDefaultRouteForRole(authStore.user?.role));
  }

  // Si intenta acceder a ruta privada sin autenticación
  if (!publicRoutes.includes(to.path) && !authStore.isAuthenticated) {
    // Guardar URL destino para redirigir después de login
    const redirectUrl = to.fullPath;
    sessionStorage.setItem("redirectUrl", redirectUrl);

    // Redirigir a login
    return navigateTo({
      path: "/auth/login",
      query: { redirect: to.fullPath },
    });
  }

});
