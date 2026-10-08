<template>
          <div ref="menu" class="user-menu">
            <button
              ref="trigger" class="user-btn"
              type="button" aria-haspopup="true" :aria-expanded="showUserMenu"
              @click="showUserMenu = !showUserMenu"
            >
              <span class="avatar">{{ userInitials }}</span>
              <span class="user-info">
                <strong>{{ user?.name }}</strong>
                <small>{{ userRoleLabel }}</small>
              </span>
            </button>

            <!-- Dropdown -->
            <Transition name="fade">
              <div v-if="showUserMenu" class="user-dropdown" @keydown.esc="closeMenu">
                <NuxtLink v-if="isAdmin" to="/admin/settings" class="dropdown-item" @click="showUserMenu = false">⚙️ Configuración</NuxtLink>
                <hr >
                <button
                  type="button"
                  class="dropdown-item"
                  @click="handleLogout"
                >
                  🚪 Cerrar sesión
                </button>
              </div>
            </Transition>
          </div>
</template>

<script setup lang="ts">
const authStore = useAuthStore();
const { logout } = useAuth();
const showUserMenu = ref(false);
const menu = ref<HTMLElement | null>(null);
const trigger = ref<HTMLButtonElement | null>(null);
const user = computed(() => authStore.user);
const isAdmin = computed(() => authStore.isAdmin);
const userInitials = computed(() => {
  if (!user.value?.name) return '?';
  return user.value.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
});

const userRoleLabel = computed(() => {
  const roles: Record<string, string> = {
    admin: 'Administrador',
    manager: 'Gerente',
    receptionist: 'Recepcionista'
  };
  return roles[user.value?.role || ''] || 'Usuario';
});

const closeMenu = () => { showUserMenu.value = false; trigger.value?.focus(); };
const handleLogout = () => { showUserMenu.value = false; logout(); };
const handleOutsideClick = (event: MouseEvent) => {
  if (event.target instanceof Node && !menu.value?.contains(event.target)) showUserMenu.value = false;
};
const handleEscape = (event: KeyboardEvent) => { if (event.key === 'Escape' && showUserMenu.value) closeMenu(); };
onMounted(() => { document.addEventListener('click', handleOutsideClick); document.addEventListener('keydown', handleEscape); });
onBeforeUnmount(() => { document.removeEventListener('click', handleOutsideClick); document.removeEventListener('keydown', handleEscape); });
</script>

<style scoped lang="scss" src="~/assets/styles/components/navigation/user-menu.scss"></style>
