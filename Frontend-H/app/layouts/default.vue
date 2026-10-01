<template>
  <div class="app-wrapper" :class="{ dark: theme === 'dark' }">
    <!-- Sidebar -->
    <aside :class="['sidebar', { 'sidebar-closed': !sidebarOpen }]">
      <div class="sidebar-header">
        <div class="logo">
          <h1>🏨 HotelSys</h1>
        </div>
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
            icon="👥"
            label="Dashboard"
            href="/"
            :active="route.path === '/'"
          />
          <NavLink
            icon="👤"
            label="Usuarios"
            href="/admin/settings?tab=users"
            :active="route.path.startsWith('/admin/settings') && route.query.tab === 'users'"
          />
          <NavLink
            icon="⚙️"
            label="Configuración"
            href="/admin/settings"
            :active="route.path.startsWith('/admin')"
          />
          <NavLink
            icon="📊"
            label="Reportes"
            href="/reports"
            :active="route.path.startsWith('/reports')"
          />
        </template>

        <!-- Para Manager -->
        <template v-if="isManager || isAdmin">
          <NavLink
            icon="🛏️"
            label="Habitaciones"
            href="/rooms"
            :active="route.path.startsWith('/rooms')"
          />
          <NavLink
            icon="📅"
            label="Reservas"
            href="/reservations"
            :active="route.path.startsWith('/reservations')"
          />
          <NavLink
            icon="💰"
            label="Pagos"
            href="/payments"
            :active="route.path.startsWith('/payments')"
          />
          <NavLink
            icon="📊"
            label="Reportes"
            href="/reports"
            :active="route.path.startsWith('/reports')"
          />
        </template>

        <!-- Para Recepcionista -->
        <template v-if="isReceptionist || isManager || isAdmin">
          <NavLink
            icon="👥"
            label="Clientes"
            href="/clients"
            :active="route.path.startsWith('/clients')"
          />
          <NavLink
            icon="🔑"
            label="Check-in/out"
            href="/checkin"
            :active="route.path.startsWith('/checkin')"
          />
          <NavLink
            icon="📅"
            label="Mis Reservas"
            href="/reservations"
            :active="route.path.startsWith('/reservations')"
          />
        </template>
      </nav>

      <!-- Footer del sidebar -->
      <div class="sidebar-footer">
        <button class="theme-toggle" @click="uiStore.toggleTheme">
          {{ theme === 'dark' ? '☀️' : '🌙' }}
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
        <p>&copy; 2026 HotelSys. Todos los derechos reservados.</p>
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

<style scoped lang="scss">
.app-wrapper {
  display: flex;
  height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: background-color 0.3s, color 0.3s;

  &.dark {
    --bg-primary: #1a1a1a;
    --bg-secondary: #2d2d2d;
    --text-primary: #ffffff;
    --text-secondary: #b0b0b0;
    --border-color: #404040;
    --sidebar-bg: #242424;
  }

  &:not(.dark) {
    --bg-primary: #f5f5f5;
    --bg-secondary: #ffffff;
    --text-primary: #1a1a1a;
    --text-secondary: #666666;
    --border-color: #e0e0e0;
    --sidebar-bg: #ffffff;
  }
}

// ==================== SIDEBAR ====================
.sidebar {
  width: 280px;
  background: var(--sidebar-bg);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    position: fixed;
    left: 0;
    top: 0;
    height: 100vh;
    z-index: 999;
    transform: translateX(-100%);

    &:not(.sidebar-closed) {
      transform: translateX(0);
    }
  }
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;

  .logo h1 {
    margin: 0;
    font-size: 1.5rem;
    color: var(--text-primary);
  }
}

.sidebar-toggle-mobile {
  display: none;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;

  @media (max-width: 768px) {
    display: block;
  }
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 10px 0;

  a {
    display: flex;
    align-items: center;
    padding: 12px 20px;
    color: var(--text-primary);
    text-decoration: none;
    transition: background 0.2s;
    border-left: 3px solid transparent;

    &:hover {
      background: var(--bg-secondary);
    }

    &.active {
      background: rgba(59, 130, 246, 0.1);
      border-left-color: #3b82f6;
      color: #3b82f6;
      font-weight: 600;
    }

    span:first-child {
      font-size: 1.2rem;
      margin-right: 12px;
    }
  }
}

.sidebar-footer {
  padding: 20px;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: center;

  .theme-toggle {
    background: none;
    border: 2px solid var(--border-color);
    padding: 8px 16px;
    font-size: 1.2rem;
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.2s;

    &:hover {
      background: var(--bg-secondary);
      border-color: #3b82f6;
    }
  }
}

// ==================== MAIN WRAPPER ====================
.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

// ==================== HEADER ====================
.header {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;

    .sidebar-toggle {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      display: none;

      @media (max-width: 768px) {
        display: block;
      }
    }

    h2 {
      margin: 0;
      font-size: 1.5rem;
      color: var(--text-primary);
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 20px;
  }
}

// ==================== NOTIFICACIONES ====================
.notifications {
  position: relative;

  .notification-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    position: relative;

    .badge {
      position: absolute;
      top: -5px;
      right: -5px;
      background: #ef4444;
      color: white;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: bold;
    }
  }
}

// ==================== USER MENU ====================
.user-menu {
  position: relative;

  .user-btn {
    background: none;
    border: 1px solid var(--border-color);
    padding: 8px 12px;
    cursor: pointer;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 12px;
    transition: all 0.2s;

    &:hover {
      background: var(--bg-primary);
      border-color: #3b82f6;
    }

    .avatar {
      width: 36px;
      height: 36px;
      background: #3b82f6;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 0.9rem;
    }

    .user-info {
      display: flex;
      flex-direction: column;
      align-items: flex-start;

      strong {
        color: var(--text-primary);
        font-size: 0.95rem;
      }

      small {
        color: var(--text-secondary);
        font-size: 0.8rem;
      }
    }
  }

  .user-dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    margin-top: 8px;
    min-width: 200px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    z-index: 100;

    .dropdown-item {
      display: block;
      width: 100%;
      padding: 12px 16px;
      text-align: left;
      background: none;
      border: none;
      color: var(--text-primary);
      cursor: pointer;
      transition: background 0.2s;
      font-size: 0.95rem;

      &:hover {
        background: var(--bg-primary);
      }
    }

    hr {
      margin: 8px 0;
      border: none;
      border-top: 1px solid var(--border-color);
    }
  }
}

// ==================== CONTENT ====================
.content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: var(--bg-primary);

  .content-inner {
    max-width: 1400px;
    margin: 0 auto;
  }
}

// ==================== FOOTER ====================
.footer {
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
  padding: 16px 20px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.9rem;

  p {
    margin: 0;
  }
}

// ==================== MOBILE OVERLAY ====================
.mobile-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 99;

  @media (max-width: 768px) {
    display: block;
  }
}

// ==================== TRANSICIONES ====================
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>