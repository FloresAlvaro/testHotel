<template>
  <div class="workspace-shell">
    <a href="#workspace-content" class="skip-link">Ir al contenido</a>
    <button v-if="mobileMenuOpen" class="navigation-backdrop" aria-label="Cerrar navegación" tabindex="-1" @click="uiStore.closeMobileMenu" />
    <aside id="workspace-navigation" ref="sidebar" class="workspace-sidebar" :class="{ 'is-open': mobileMenuOpen }" :inert="isMobile && !mobileMenuOpen">
      <div class="workspace-brand-row">
        <NuxtLink to="/dashboard" class="workspace-brand" aria-label="Roomly, vista general">
          <span class="workspace-logo">r<span>.</span></span><span>roomly<span class="brand-label">Hotel workspace</span></span>
        </NuxtLink>
        <button class="icon-button mobile-only" aria-label="Cerrar navegación" @click="uiStore.closeMobileMenu"><Icon name="system-uicons:cross" /></button>
      </div>
      <div class="workspace-property"><Icon name="system-uicons:home" /><div><strong>{{ hotel.settings.value.hotel_name }}</strong><span>Gestión y hospitalidad</span></div></div>
      <nav class="workspace-navigation" aria-label="Navegación principal">
        <div v-for="group in navigation" :key="group.label" class="navigation-group">
          <p class="navigation-label">{{ group.label }}</p>
          <NavLink v-for="item in group.items" :key="item.href" :href="item.href" :label="item.label" :icon="item.icon" :active="isActive(item.href)" />
        </div>
      </nav>
      <div class="workspace-account">
        <span class="account-avatar">{{ initials }}</span>
        <div class="account-copy"><strong>{{ user?.name || 'Mi cuenta' }}</strong><span>{{ roleLabel }}</span></div>
        <button class="icon-button" aria-label="Cerrar sesión" title="Cerrar sesión" @click="logout"><Icon name="system-uicons:exit-right" /></button>
      </div>
    </aside>
    <div class="workspace-main" :inert="isMobile && mobileMenuOpen">
      <header class="workspace-topbar">
        <div class="topbar-location"><button ref="menuButton" class="icon-button mobile-only" aria-label="Abrir navegación" aria-controls="workspace-navigation" :aria-expanded="mobileMenuOpen" @click="uiStore.toggleMobileMenu"><Icon name="system-uicons:menu-hamburger" /></button><span class="topbar-root">Workspace</span><Icon name="system-uicons:chevron-right" class="breadcrumb-divider" /><span>{{ sectionLabel }}</span></div>
        <div class="topbar-tools"><span class="workspace-role">{{ roleLabel }}</span><button class="icon-button" :aria-label="theme === 'dark' ? 'Activar tema claro' : 'Activar tema oscuro'" :title="theme === 'dark' ? 'Tema claro' : 'Tema oscuro'" @click="uiStore.toggleTheme"><Icon :name="theme === 'dark' ? 'system-uicons:sun' : 'system-uicons:moon'" /></button></div>
      </header>
      <main id="workspace-content" class="workspace-content" tabindex="-1"><div class="workspace-page"><slot /></div></main>
    </div>
  </div>
</template>

<script setup lang="ts">
const hotel = useHotelSettings();
const uiStore = useUiStore();
const authStore = useAuthStore();
const router = useRouter();
const route = computed(() => router.currentRoute.value);
const { logout } = useAuth();
const user = computed(() => authStore.user);
const theme = computed(() => uiStore.theme);
const mobileMenuOpen = computed(() => uiStore.mobileMenuOpen);
const isMobile = ref(false);
const sidebar = ref<HTMLElement | null>(null);
const menuButton = ref<HTMLButtonElement | null>(null);
const roleLabel = computed(() => ({ admin: 'Administrador', manager: 'Gerente', receptionist: 'Recepción', customer: 'Huésped' }[user.value?.role || 'receptionist']));
const initials = computed(() => user.value?.name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase() || 'R');
const navigation = computed(() => {
  const manager = authStore.isAdmin || authStore.isManager;
  return [
    { label: 'General', items: [{ label: 'Vista general', href: '/dashboard', icon: 'system-uicons:grid' }] },
    { label: 'Operación', items: [
      { label: 'Reservas', href: '/reservations', icon: 'system-uicons:calendar' },
      { label: 'Solicitudes de huéspedes', href: '/operations/requests', icon: 'system-uicons:clipboard' },
      ...(manager ? [{ label: 'Pagos en línea', href: '/operations/online-payments', icon: 'system-uicons:credit-card' }] : []),
      { label: 'Calendario', href: '/operations/calendar', icon: 'system-uicons:calendar-date' },
      { label: 'Limpieza y mantenimiento', href: '/operations/tasks', icon: 'system-uicons:clipboard' },
      { label: 'Caja', href: '/operations/cash', icon: 'system-uicons:wallet' },
      { label: 'Entradas y salidas', href: '/checkin', icon: 'system-uicons:enter' },
      ...(manager ? [{ label: 'Habitaciones', href: '/rooms', icon: 'system-uicons:home' }] : []),
      { label: 'Huéspedes', href: '/clients', icon: 'system-uicons:users' },
      { label: 'Pagos', href: '/payments', icon: 'system-uicons:coin' }
    ] },
    ...(manager ? [{ label: 'Análisis', items: [
      { label: 'Ingresos', href: '/reports', icon: 'system-uicons:graph-bar' },
      { label: 'Ocupación', href: '/reports/occupancy', icon: 'system-uicons:pie-half' },
      { label: 'Historial de cambios', href: '/operations/audit', icon: 'system-uicons:files-history' }
    ] }] : []),
    ...(authStore.isAdmin ? [{ label: 'Administración', items: [
      { label: 'Equipo', href: '/admin/settings?tab=users', icon: 'system-uicons:user' },
      { label: 'Presentación y correo', href: '/operations/property', icon: 'system-uicons:image' },
      { label: 'Configuración', href: '/admin/settings', icon: 'system-uicons:settings' }
    ] }] : [])
  ];
});
const isActive = (href: string) => {
  if (href.includes('tab=users')) return route.value.path === '/admin/settings' && route.value.query.tab === 'users';
  if (href === '/admin/settings') return route.value.path === href && route.value.query.tab !== 'users';
  if (href === '/reports') return route.value.path === href;
  return route.value.path === href || route.value.path.startsWith(href + '/');
};
const sectionLabel = computed(() => navigation.value.flatMap(g => g.items).find(i => isActive(i.href))?.label || 'Roomly');
useHead({ title: computed(() => `${sectionLabel.value} · Roomly`) });
let media: MediaQueryList | undefined;
let previousOverflow = '';
const resize = () => { isMobile.value = media?.matches || false; if (!isMobile.value) uiStore.closeMobileMenu(); };
const handleKeyboard = (event: KeyboardEvent) => {
  if (!mobileMenuOpen.value || !isMobile.value) return;
  if (event.key === 'Escape') { uiStore.closeMobileMenu(); return; }
  if (event.key === 'Tab') {
    const items = sidebar.value?.querySelectorAll<HTMLElement>('a, button:not([disabled])');
    const first = items?.[0], last = items?.[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }
};
watch(() => route.value.fullPath, () => uiStore.closeMobileMenu());
watch(mobileMenuOpen, async (open) => {
  if (!import.meta.client) return;
  if (open) { previousOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden'; await nextTick(); sidebar.value?.querySelector<HTMLElement>('a')?.focus(); }
  else { document.body.style.overflow = previousOverflow; if (isMobile.value) menuButton.value?.focus(); }
});
onMounted(() => { hotel.load().catch(() => uiStore.error('No se pudo cargar la configuración del hotel')); media = window.matchMedia('(max-width: 900px)'); resize(); media.addEventListener('change', resize); document.addEventListener('keydown', handleKeyboard); });
onBeforeUnmount(() => { media?.removeEventListener('change', resize); document.removeEventListener('keydown', handleKeyboard); document.body.style.overflow = previousOverflow; uiStore.closeMobileMenu(); });
</script>

<style scoped>
.workspace-shell { display: flex; min-height: 100dvh; background: var(--bg-primary); }
.workspace-sidebar { position: fixed; inset: 0 auto 0 0; width: 232px; display: flex; flex-direction: column; border-right: 1px solid var(--border-color); background: var(--bg-secondary); z-index: 40; }
.workspace-brand-row { height: 88px; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; }
.workspace-brand { display: flex; align-items: center; gap: 10px; font-size: 24px; font-weight: 650; letter-spacing: -1px; color: var(--text-primary); text-decoration: none; }
.workspace-logo { display: grid; place-content: center; width: 34px; height: 36px; color: white; background: #242733; border-radius: 10px; font-size: 29px; line-height: 1; position: relative; }
.workspace-logo span { position: absolute; color: #a8aaff; right: 5px; bottom: 3px; font-size: 21px; }
.brand-label { display: block; font-size: 10px; line-height: 1.4; letter-spacing: .2px; font-weight: 400; color: var(--text-secondary); }
.workspace-property { display: flex; align-items: center; gap: 11px; margin: 4px 16px 10px; padding: 12px; border: 1px solid var(--border-color); border-radius: 9px; background: var(--surface-subtle); }
.workspace-property > :first-child { font-size: 20px; color: var(--text-secondary); }
.workspace-property strong, .workspace-property span { display: block; }
.workspace-property strong { font-size: 12px; font-weight: 600; }
.workspace-property span { font-size: 10px; color: var(--text-secondary); margin-top: 2px; }
.workspace-navigation { flex: 1; overflow-y: auto; padding: 4px 12px 20px; }
.navigation-group { margin-top: 20px; }
.navigation-label { color: var(--text-tertiary); font-size: 10px; letter-spacing: .08em; text-transform: uppercase; padding: 0 12px; margin-bottom: 9px; font-weight: 600; }
.workspace-account { display: flex; align-items: center; gap: 10px; border-top: 1px solid var(--border-color); padding: 18px 16px; }
.account-avatar { display: grid; place-items: center; background: var(--accent-soft); color: var(--accent); width: 34px; height: 34px; border-radius: 50%; font-size: 11px; font-weight: 600; flex-shrink: 0; }
.account-copy { flex: 1; min-width: 0; }
.account-copy strong { display: block; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-size: 11px; font-weight: 600; }
.account-copy span { display: block; font-size: 10px; color: var(--text-secondary); margin-top: 3px; }
.workspace-main { flex: 1; margin-left: 232px; min-width: 0; }
.workspace-topbar { height: 64px; border-bottom: 1px solid var(--border-color); background: var(--bg-secondary); display: flex; align-items: center; justify-content: space-between; padding: 0 36px; }
.topbar-location, .topbar-tools { display: flex; align-items: center; gap: 12px; font-size: 12px; }
.topbar-root, .breadcrumb-divider { color: var(--text-tertiary); }
.workspace-role { font-size: 11px; color: var(--text-secondary); }
.workspace-content { padding: 36px clamp(20px, 3vw, 48px) 64px; outline: none; }
.workspace-page { max-width: 1320px; margin: 0 auto; }
.mobile-only, .navigation-backdrop { display: none; }
@media (max-width: 900px) { .workspace-sidebar { transform: translateX(-100%); visibility: hidden; transition: transform .2s ease; width: 264px; } .workspace-sidebar.is-open { transform: translateX(0); visibility: visible; } .workspace-main { margin-left: 0; } .mobile-only { display: inline-flex; } .navigation-backdrop { display: block; position: fixed; inset: 0; z-index: 39; border: 0; background: #11182770; backdrop-filter: blur(2px); } .workspace-topbar { padding: 0 20px; } }
@media (max-width: 520px) { .workspace-content { padding: 24px 16px 40px; } .workspace-topbar { padding: 0 12px; height: 60px; } .workspace-role, .topbar-root, .breadcrumb-divider { display: none; } }
</style>
