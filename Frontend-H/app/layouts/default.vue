<template>
  <div class="app-wrapper" :class="{ dark: theme === 'dark' }">
    <!-- Sidebar -->
    <aside :class="['sidebar', { 'sidebar-closed': !sidebarOpen, 'sidebar-compact': sidebarCompact }]">
      <div class="sidebar-header">
        <div class="logo">
          <h1><span class="logo-mark">🏨</span><span class="logo-name">Roomly</span></h1>
        </div>
        <button
          class="sidebar-collapse-toggle"
          :aria-label="sidebarCompact ? 'Expandir menú' : 'Contraer menú'"
          :title="sidebarCompact ? 'Expandir menú' : 'Contraer menú'"
          @click="uiStore.toggleSidebarCompact"
        >
          <Icon :name="sidebarCompact ? 'system-uicons:chevron-right' : 'system-uicons:chevron-left'" size="18" />
        </button>
        <button
          class="sidebar-toggle-mobile"
          @click="uiStore.toggleMobileMenu"
        >
          ✕
        </button>
      </div>

      <!-- Navegación -->
      <nav class="sidebar-nav">
        <!-- Para Admin -->
        <template v-if="isAdmin">
          <NavLink
            icon="system-uicons:users"
            label="Usuarios"
            href="/admin/settings?tab=users"
            :compact="sidebarCompact"
            :active="route.path.startsWith('/admin/settings') && route.query.tab === 'users'"
          />
          <NavLink
            icon="system-uicons:settings"
            label="Configuración"
            href="/admin/settings"
            :compact="sidebarCompact"
            :active="route.path.startsWith('/admin') && route.query.tab !== 'users'"
          />
        </template>

        <!-- Para Manager -->
        <template v-if="isManager || isAdmin">
          <NavLink
            icon="system-uicons:grid"
            label="Dashboard"
            href="/dashboard"
            :compact="sidebarCompact"
            :active="route.path === '/' || route.path === '/dashboard'"
          />
          <NavLink
            icon="system-uicons:home"
            label="Habitaciones"
            href="/rooms"
            :compact="sidebarCompact"
            :active="route.path.startsWith('/rooms')"
          />
          <NavLink
            icon="system-uicons:calendar"
            label="Reservas"
            href="/reservations"
            :compact="sidebarCompact"
            :active="route.path.startsWith('/reservations')"
          />
          <NavLink
            icon="system-uicons:coin"
            label="Pagos"
            href="/payments"
            :compact="sidebarCompact"
            :active="route.path.startsWith('/payments')"
          />
          <NavLink
            icon="system-uicons:graph-bar"
            label="Reportes"
            href="/reports"
            :compact="sidebarCompact"
            :active="route.path.startsWith('/reports')"
          />
        </template>

        <!-- Para Recepcionista -->
        <template v-if="isReceptionist || isManager || isAdmin">
          <NavLink
            icon="system-uicons:users"
            label="Clientes"
            href="/clients"
            :compact="sidebarCompact"
            :active="route.path.startsWith('/clients')"
          />
          <NavLink
            icon="system-uicons:lock"
            label="Check-in/out"
            href="/checkin"
            :compact="sidebarCompact"
            :active="route.path.startsWith('/checkin')"
          />
          <NavLink
            v-if="isReceptionist"
            icon="system-uicons:calendar"
            label="Mis Reservas"
            href="/reservations"
            :compact="sidebarCompact"
            :active="route.path.startsWith('/reservations')"
          />
        </template>
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

    <!-- Main content -->
    <div class="main-wrapper">
      <!-- Header -->
      <header class="header">
        <div class="header-left">
          <button
            class="sidebar-toggle"
            @click="uiStore.toggleSidebar"
          >
            ☰
          </button>
          <h2>{{ pageTitle }}</h2>
        </div>

        <div class="header-right">
          <!-- Notificaciones (opcional) -->
          <div class="notifications">
            <button class="notification-btn">
              🔔
              <span v-if="hasNotifications" class="badge">
                {{ notificationCount }}
              </span>
            </button>
          </div>

          <!-- Usuario -->
          <div class="user-menu">
            <button
              class="user-btn"
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
              <div v-if="showUserMenu" class="user-dropdown">
                <a href="#" class="dropdown-item">
                  👤 Perfil
                </a>
                <a href="#" class="dropdown-item">
                  ⚙️ Configuración
                </a>
                <hr >
                <button
                  class="dropdown-item"
                  @click="handleLogout"
                >
                  🚪 Cerrar sesión
                </button>
              </div>
            </Transition>
          </div>
        </div>
      </header>

      <!-- Content -->
      <main class="content">
        <div class="content-inner">
          <slot />
        </div>
      </main>

      <!-- Footer -->
      <footer class="footer">
        <p>&copy; 2026 Roomly. Todos los derechos reservados.</p>
      </footer>
    </div>

    <!-- Mobile overlay -->
    <div
      v-if="mobileMenuOpen"
      class="mobile-overlay"
      @click="uiStore.closeMobileMenu"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

// Stores
const uiStore = useUiStore();
const authStore = useAuthStore();

// Router
const route = useRoute();

// Composables
const { logout } = useAuth();

// ==================== STATE ====================
const showUserMenu = ref(false);

// ==================== COMPUTED ====================
const sidebarOpen = computed(() => uiStore.sidebarOpen);
const sidebarCompact = computed(() => uiStore.sidebarCompact);
const mobileMenuOpen = computed(() => uiStore.mobileMenuOpen);
const theme = computed(() => uiStore.theme);
const user = computed(() => authStore.user);
const isAdmin = computed(() => authStore.isAdmin);
const isManager = computed(() => authStore.isManager);
const isReceptionist = computed(() => authStore.isReceptionist);

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

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    '/': 'Dashboard',
    '/dashboard': 'Dashboard',
    '/clients': 'Clientes',
    '/rooms': 'Habitaciones',
    '/reservations': 'Reservas',
    '/payments': 'Pagos',
    '/checkin': 'Check-in/Check-out',
    '/reports': 'Reportes',
    '/admin/users': 'Usuarios',
    '/admin/settings': 'Configuración',
    '/admin/reports': 'Reportes'
  };
  return titles[route.path] || 'Página';
});

const hasNotifications = computed(() => {
  return uiStore.notifications.length > 0;
});

const notificationCount = computed(() => {
  return uiStore.notifications.filter((n) => n.type !== 'info').length;
});

// ==================== MÉTODOS ====================
const handleLogout = () => {
  showUserMenu.value = false;
  logout();
};

const handleOutsideClick = (event: MouseEvent) => {
  if (event.target instanceof Element && !event.target.closest('.user-menu')) {
    showUserMenu.value = false;
  }
};

onMounted(() => document.addEventListener('click', handleOutsideClick));
onBeforeUnmount(() => document.removeEventListener('click', handleOutsideClick));

// Cerrar sidebar en mobile al navegar
watch(
  () => route.path,
  () => {
    if (import.meta.client && window.innerWidth < 768) {
      uiStore.closeSidebar();
    }
  }
);
</script>

<style scoped lang="scss" src="./default.scss"></style>