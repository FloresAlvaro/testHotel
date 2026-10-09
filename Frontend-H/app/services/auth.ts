import { useApiClient } from "./api";
import type { UserRole } from "~/types";

/**
 * Servicio de autenticación
 */
export const useAuthService = () => {
  const authStore = useAuthStore();
  const router = useRouter();
  const api = useApiClient();
  const uiStore = useUiStore();

  const login = async (email: string, password: string) => {
    try {
      uiStore.setLoading(true);
      const response = await api.login({ email, password });

      if (response.success && response.data) {
        authStore.setAuth(response.data.user, response.data.token);
        uiStore.success("Sesión iniciada correctamente");
        return response.data;
      }
      throw new Error(response.message || "No se pudo iniciar sesión");
    } catch (error: unknown) {
      const statusCode =
        error && typeof error === "object" && "statusCode" in error
          ? error.statusCode
          : error && typeof error === "object" && "status" in error
            ? error.status
            : undefined;
      const message =
        statusCode === 429
          ? "Demasiados intentos. Espera unos minutos y vuelve a intentar."
          : statusCode === 401
            ? "Email o contraseña incorrectos"
            : statusCode === 403
              ? "Esta cuenta está inactiva o no tiene acceso"
              : typeof statusCode === "number" && statusCode >= 500
                ? "El servidor no está disponible. Inténtalo nuevamente en unos momentos."
                : "No se pudo iniciar sesión. Comprueba la conexión e inténtalo nuevamente.";
      authStore.setError(message);
      uiStore.error(message);
      throw error;
    } finally {
      uiStore.setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logoutSession();
      authStore.logout();
      await router.push('/auth/login');
      uiStore.success('Sesión cerrada');
    } catch { uiStore.error('No se pudo cerrar la sesión. Comprueba la conexión e inténtalo de nuevo.'); }
  };

  const getProfile = async () => {
    try {
      const response = await api.getProfile();

      if (response.success && response.data) {
        return response.data;
      }
    } catch (error) {
      console.error("Error obteniendo perfil:", error);
      throw error;
    }
  };

  const hasRole = (role: UserRole | UserRole[]) => {
    if (!authStore.user) return false;

    if (Array.isArray(role)) {
      return role.includes(authStore.user.role);
    }

    return authStore.user.role === role;
  };

  return {
    login,
    logout,
    getProfile,
    hasRole,
    isAuthenticated: computed(() => authStore.isAuthenticated),
    user: computed(() => authStore.user),
  };
};
