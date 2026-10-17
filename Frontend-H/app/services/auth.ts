import { useApiClient } from "./api";
import { useHotelSettings } from "../composables/useHotelSettings";
import type { RegisterRequest, UserRole } from "~/types";

/**
 * Servicio de autenticación
 */
export const useAuthService = () => {
  const authStore = useAuthStore();
  const router = useRouter();
  const api = useApiClient();
  const uiStore = useUiStore();
  const hotel = useHotelSettings();

  const login = async (email: string, password: string) => {
    try {
      uiStore.setLoading(true);
      const response = await api.login({ email, password });

      if (response.success && response.data) {
        authStore.setAuth(response.data.user, response.data.csrfToken);
        await hotel.load().catch(() => uiStore.error("No se pudo cargar la configuración del hotel"));
        uiStore.success("Sesión iniciada correctamente");
        return response.data;
      }
    } catch (error: unknown) {
      const failure = error as { statusCode?: number; data?: { message?: string } };
      const message = failure.statusCode === 403
        ? failure.data?.message || 'Tu acceso está desactivado. Contacta con recepción.'
        : failure.statusCode === 401 ? 'Email o contraseña incorrectos' : 'No se pudo iniciar sesión. Intenta nuevamente.';
      authStore.setError(message);
      uiStore.error(message);
      throw error;
    } finally {
      uiStore.setLoading(false);
    }
  };

  const register = async (
    data: Pick<RegisterRequest, "name" | "email" | "password">,
  ) => {
    try {
      uiStore.setLoading(true);
      const response = await api.register(data);
      if (!response.success || !response.data) {
        throw new Error(response.message || "No se pudo crear la cuenta");
      }
      uiStore.success("Cuenta creada correctamente");
      return response.data;
    } catch (error: unknown) {
      uiStore.error(
        error instanceof Error ? error.message : "No se pudo crear la cuenta",
      );
      throw error;
    } finally {
      uiStore.setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authStore.logout();
      await router.push("/auth/login");
      uiStore.success("Sesión cerrada");
    } catch { uiStore.error("No se pudo cerrar la sesión. Revisa tu conexión e intenta de nuevo."); }
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
    register,
    logout,
    getProfile,
    hasRole,
    isAuthenticated: computed(() => authStore.isAuthenticated),
    user: computed(() => authStore.user),
  };
};
