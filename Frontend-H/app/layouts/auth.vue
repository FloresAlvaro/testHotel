<template>
  <main :class="['auth-shell', { dark: theme === 'dark' }]">
    <section class="auth-visual" aria-labelledby="visual-title">
      <div class="visual-content">
        <NuxtLink to="/" class="visual-brand" aria-label="Roomly, inicio">
          <span class="brand-mark">R</span>
          <span>Roomly</span>
        </NuxtLink>

        <div class="visual-copy">
          <p class="visual-eyebrow">EL PORTAL DE TU HOTEL</p>
          <h1 id="visual-title">Bienvenido de nuevo</h1>
          <p>Reservas, huéspedes y cada detalle de la operación, siempre a mano.</p>
        </div>

        <div class="visual-caption">
          <span class="caption-mark" aria-hidden="true">✓</span>
          <span>Acceso privado para el equipo del hotel</span>
        </div>
      </div>
    </section>

    <section class="auth-panel" aria-label="Acceso al sistema">
      <header class="auth-topbar">
        <span/>
        <button
          class="theme-toggle"
          type="button"
          :aria-label="theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'"
          :title="theme === 'dark' ? 'Tema claro' : 'Tema oscuro'"
          @click="uiStore.toggleTheme"
        >
          <Icon :name="theme === 'dark' ? 'system-uicons:sun' : 'system-uicons:moon'" size="19" />
        </button>
      </header>

      <div class="auth-content">
        <slot />
      </div>

      <footer class="auth-footer">
        <span>© 2026 Roomly</span>
        <span>Acceso protegido</span>
      </footer>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed } from "vue";

const uiStore = useUiStore();
const theme = computed(() => uiStore.theme);
</script>

<style scoped lang="scss" src="./auth.scss"></style>