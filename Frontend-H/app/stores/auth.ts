import { defineStore } from 'pinia';
import type { User } from '~/types';
import type { SessionResponse } from '~/types/generated/api';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const csrfToken = ref<string | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const isAuthenticated = computed(() => !!user.value);
  const userRole = computed(() => user.value?.role || null);
  const isAdmin = computed(() => user.value?.role === 'admin');
  const isManager = computed(() => user.value?.role === 'manager');
  const isCustomer = computed(() => user.value?.role === 'customer');
  const isReceptionist = computed(() => user.value?.role === 'receptionist');
  const setAuth = (userData: User, csrf?: string) => {
    user.value = userData;
    if (csrf) csrfToken.value = csrf;
  };
  const clearSession = () => { user.value = null; csrfToken.value = null; error.value = null; };
  const restoreSession = async () => {
    const config = useRuntimeConfig();
    const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined;
    if(import.meta.client) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
    try {
      const response = await $fetch<SessionResponse>('/users/session', {
        baseURL: import.meta.server ? config.apiInternalBase : config.public.apiBase,
        credentials: 'include', headers, retry: 0,
      });
      setAuth(response.data.user, response.data.csrfToken);
    } catch { clearSession(); }
  };
  const logout = async () => {
    const config = useRuntimeConfig();
    try {
      await $fetch('/users/session', {baseURL:config.public.apiBase, method:'DELETE',credentials:'include',retry:0,
        headers:{'X-Hotel-Request':'1','X-Hotel-CSRF':csrfToken.value || ''}});
      clearSession();
    } catch (failure) {
      if((failure as {statusCode?:number}).statusCode===401) {clearSession();return;}
      throw failure;
    }
  };
  return {user,csrfToken,loading,error,isAuthenticated,userRole,isAdmin,isManager,isReceptionist,isCustomer,
    setAuth,clearSession,restoreSession,logout,clearError:()=>{error.value=null;},setError:(msg:string)=>{error.value=msg;}};
});
