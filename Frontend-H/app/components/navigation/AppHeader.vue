<template>
      <header class="header">
        <div class="header-left">
          <button
            class="sidebar-toggle"
            type="button" aria-label="Abrir o cerrar menú" aria-controls="app-sidebar" :aria-expanded="sidebarOpen"
            @click="uiStore.toggleSidebar"
          >
            ☰
          </button>
          <h2>{{ pageTitle }}</h2>
        </div>

        <div class="header-right">
          <!-- Notificaciones (opcional) -->
          <span v-if="notificationCount" class="notifications" :title="`${notificationCount} avisos activos`">
            <Icon name="system-uicons:bell" aria-hidden="true" />
            <span>{{ notificationCount }}</span>
          </span>

          <!-- Usuario -->
          <UserMenu />
        </div>
      </header>
</template>

<script setup lang="ts">
const uiStore = useUiStore();
const route = useRoute();
const sidebarOpen = computed(() => uiStore.sidebarOpen);
const notificationCount = computed(() => uiStore.notifications.length);
const pageTitle = computed(() => {
  if (route.path === '/admin/settings' && route.query.tab === 'users') return 'Usuarios';
  const titles: Record<string, string> = { dashboard: 'Dashboard', clients: 'Clientes', rooms: 'Habitaciones', reservations: 'Reservas', payments: 'Pagos', checkin: 'Check-in/Check-out', reports: 'Reportes', admin: 'Configuración' };
  return titles[route.path.split('/')[1] || 'dashboard'] || 'Roomly';
});
</script>

<style scoped lang="scss" src="~/assets/styles/components/navigation/header.scss"></style>
