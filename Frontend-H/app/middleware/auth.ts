import { postLoginPath } from '~/utils/authNavigation';
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
    "/auth/reset-password",
    "/auth/accept-invitation",
  ];

  const authStore = useAuthStore();

  // ==================== LÓGICA ====================

  // Si está en ruta pública y ya está autenticado, redirigir a home
  if (publicRoutes.includes(to.path) && authStore.isAuthenticated) {
    return navigateTo(postLoginPath(authStore.user?.role));
  }

  // Si intenta acceder a ruta privada sin autenticación
  if (!publicRoutes.includes(to.path) && !authStore.isAuthenticated) {
    // Guardar URL destino para redirigir después de login
    const redirectUrl = to.fullPath;
    if(import.meta.client) sessionStorage.setItem("redirectUrl", redirectUrl);

    // Redirigir a login
    return navigateTo({
      path: "/auth/login",
      query: { redirect: to.fullPath },
    });
  }

  if (authStore.isAuthenticated && !publicRoutes.includes(to.path)) {
    const portal = to.path === '/portal' || to.path.startsWith('/portal/');
    if (authStore.isCustomer && !portal) return navigateTo('/portal');
    if (!authStore.isCustomer && portal) return navigateTo('/dashboard');
  }

});
