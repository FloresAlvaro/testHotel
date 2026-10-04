import { useAuthService } from "../services/auth";
import { getDefaultRouteForRole } from "~/utils/authRoutes";

export const useAuth = () => {
  const authStore = useAuthStore();
  const authService = useAuthService();
  const router = useRouter();

  // ==================== STATE ====================
  const isAuthenticated = computed(() => authStore.isAuthenticated);
  const user = computed(() => authStore.user);
  const token = computed(() => authStore.token);
  const loading = ref(false);

  // ==================== ROLES ====================
  const userRole = computed(() => authStore.userRole);
  const isAdmin = computed(() => authStore.isAdmin);
  const isManager = computed(() => authStore.isManager);
  const isReceptionist = computed(() => authStore.isReceptionist);

  // ==================== MÉTODOS ====================

  /**
   * Iniciar sesión
   */
  const login = async (email: string, password: string) => {
    loading.value = true;
    try {
      return await authService.login(email, password);
    } finally {
      loading.value = false;
    }
  };

  /**
   * Cerrar sesión
   */
  const logout = () => {
    authService.logout();
  };

  /**
   * Verificar si tiene un rol específico
   */
  const hasRole = (role: string | string[]) => {
    if (!user.value) return false;

    if (Array.isArray(role)) {
      return role.includes(user.value.role);
    }

    return user.value.role === role;
  };

  /**
   * Verificar si tiene permisos para una acción
   */
  const hasPermission = (permission: string) => {
    const permissions: Record<string, string[]> = {
      admin: [
        "view_users",
        "create_user",
        "edit_user",
        "delete_user",
        "view_reports",
        "edit_settings",
      ],
      manager: [
        "view_clients",
        "create_client",
        "edit_client",
        "view_reservations",
        "create_reservation",
        "view_payments",
        "create_payment",
        "view_reports",
      ],
      receptionist: [
        "view_clients",
        "create_client",
        "view_reservations",
        "create_reservation",
        "checkin_checkout",
        "view_payments",
        "create_payment",
      ],
    };

    if (!user.value) return false;

    const userPermissions = permissions[user.value.role] || [];
    return userPermissions.includes(permission);
  };

  /**
   * Cargar perfil del usuario actual
   */
  const loadProfile = async () => {
    loading.value = true;
    try {
      const userData = await authService.getProfile();
      if (!userData) {
        throw new Error("No se pudo cargar el perfil del usuario");
      }
      authStore.setAuth(userData, token.value || "");
      return userData;
    } catch (error: unknown) {
      console.error("Error cargando perfil:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Verificar si la sesión es válida
   */
  const isSessionValid = () => {
    return isAuthenticated.value && user.value && token.value;
  };

  /**
   * Redirigir según rol
   */
  const redirectByRole = async () => {
    if (!isAuthenticated.value) {
      await router.push("/auth/login");
      return;
    }

    await router.push(getDefaultRouteForRole(user.value?.role));
  };

  /**
   * Cerrar sesión y redirigir
   */
  const logoutAndRedirect = () => {
    logout();
    router.push("/auth/login");
  };

  return {
    // State
    isAuthenticated,
    user,
    token,
    loading: readonly(loading),

    // Computed
    userRole,
    isAdmin,
    isManager,
    isReceptionist,

    // Methods
    login,
    logout,
    logoutAndRedirect,
    hasRole,
    hasPermission,
    loadProfile,
    isSessionValid,
    redirectByRole,
  };
};
