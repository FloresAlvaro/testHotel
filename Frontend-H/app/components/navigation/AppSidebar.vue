<template>
    <aside id="app-sidebar" :class="['sidebar', { 'sidebar-closed': !sidebarOpen, 'sidebar-compact': sidebarCompact }]">
      <div class="sidebar-header">
        <div class="logo">
          <h1><span class="logo-mark">🏨</span><span class="logo-name">Roomly</span></h1>
        </div>
        <button
          type="button"
          class="sidebar-collapse-toggle"
          :aria-label="sidebarCompact ? 'Expandir menú' : 'Contraer menú'"
          :title="sidebarCompact ? 'Expandir menú' : 'Contraer menú'"
          @click="uiStore.toggleSidebarCompact"
        >
          <Icon :name="sidebarCompact ? 'system-uicons:chevron-right' : 'system-uicons:chevron-left'" size="18" />
        </button>
        <button
          class="sidebar-toggle-mobile"
          type="button" aria-label="Cerrar menú"
          @click="uiStore.closeSidebar"
        >
          ✕
        </button>
      </div>

      <!-- Navegación -->
      <nav class="sidebar-nav" aria-label="Navegación principal">
        <NavLink
v-for="item in navigation" :key="item.id" :icon="item.icon" :label="item.label"
          :href="item.href" :compact="sidebarCompact" :active="isActive(item)" />
      </nav>

      <!-- Footer del sidebar -->
      <div class="sidebar-footer">
        <button
          class="theme-toggle"
          :aria-label="theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'"
          @click="uiStore.toggleTheme"
        >
          <Icon :name="theme === 'dark' ? 'system-uicons:sun' : 'system-uicons:moon'" size="18" />
        </button>
      </div>
    </aside>
</template>

<script setup lang="ts">
import { getNavigationItems, type NavigationItem } from '~/utils/navigation';
const uiStore = useUiStore();
const authStore = useAuthStore();
const route = useRoute();
const sidebarOpen = computed(() => uiStore.sidebarOpen);
const sidebarCompact = computed(() => uiStore.sidebarCompact);
const theme = computed(() => uiStore.theme);
const navigation = computed(() => getNavigationItems(authStore.user?.role));
const isActive = (item: NavigationItem) => item.id === 'users'
  ? route.path === '/admin/settings' && route.query.tab === 'users'
  : item.id === 'settings' ? route.path === '/admin/settings' && route.query.tab !== 'users'
  : route.path === item.href || route.path.startsWith(`${item.href}/`);
</script>

<style scoped lang="scss" src="~/assets/styles/components/navigation/sidebar.scss"></style>
