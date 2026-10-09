import { defineStore } from "pinia";
import type { User } from "~/types";

export const useAuthStore = defineStore("auth", () => {
  // State
  const user = ref<User | null>(null);
  const token = ref<string | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Computed
  const isAuthenticated = computed(() => !!user.value);
  const userRole = computed(() => user.value?.role || null);
  const isAdmin = computed(() => user.value?.role === "admin");
  const isManager = computed(() => user.value?.role === "manager");
  const isReceptionist = computed(() => user.value?.role === "receptionist");

  // Actions
  const setAuth = (userData: User, userToken?: string) => {
    user.value = userData;
    token.value = userToken || null;
    if (import.meta.client) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
    }
  };

  const logout = () => {
    user.value = null;
    token.value = null;
    error.value = null;
    if (import.meta.client) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
    }
  };

  const loadFromStorage = async () => {
    if (!import.meta.client) return;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    try {
      const config = useRuntimeConfig();
      const response = await $fetch<{ data: User }>('/users/profile', { baseURL: config.public.apiBase, credentials: 'include', retry: 0 });
      user.value = response.data;
    } catch { logout(); }
  };

  const clearError = () => {
    error.value = null;
  };

  const setError = (msg: string) => {
    error.value = msg;
  };

  return {
    // State
    user,
    token,
    loading,
    error,

    // Computed
    isAuthenticated,
    userRole,
    isAdmin,
    isManager,
    isReceptionist,

    // Methods
    setAuth,
    logout,
    loadFromStorage,
    clearError,
    setError,
  };
});
