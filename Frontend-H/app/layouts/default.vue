<template>
  <div class="app-wrapper">
    <AppSidebar />
    <div class="main-wrapper">
      <AppHeader />
      <main class="content"><div class="content-inner"><slot /></div></main>
      <footer class="footer"><p>© {{ new Date().getFullYear() }} Roomly. Todos los derechos reservados.</p></footer>
    </div>
    <button v-if="uiStore.sidebarOpen" type="button" aria-label="Cerrar menú" class="mobile-overlay" @click="uiStore.closeSidebar" />
  </div>
</template>

<script setup lang="ts">
const uiStore = useUiStore();
const route = useRoute();
onMounted(() => {
  if (window.matchMedia('(max-width: 768px)').matches) uiStore.closeSidebar();
});
watch(() => route.fullPath, () => {
  if (import.meta.client && window.matchMedia('(max-width: 768px)').matches) uiStore.closeSidebar();
});
</script>

<style scoped lang="scss" src="~/assets/styles/layouts/default.scss"></style>
