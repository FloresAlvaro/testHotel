<template>
  <main class="error-screen"><section><span class="error-code">{{ error.statusCode }}</span><h1>{{ error.statusCode === 404 ? 'Esta página no está disponible' : 'Algo no salió como esperábamos' }}</h1><p>{{ error.statusCode === 404 ? 'Revisa la dirección o vuelve a la vista general de tu hotel.' : 'Vuelve a intentarlo en unos momentos.' }}</p><button class="button-link" @click="handleError">Volver al inicio</button></section></main>
</template>
<script setup lang="ts">
import type { NuxtError } from '#app';
defineProps<{ error: NuxtError }>();
const handleError = () => clearError({ redirect: '/' });
</script>
<style scoped>
.error-screen { min-height: 100dvh; display: grid; place-items: center; padding: 32px; background: var(--bg-primary); text-align: center; }
.error-screen section { max-width: 460px; }
.error-code { display: inline-block; color: var(--accent); font-size: 12px; font-weight: 600; padding: 8px 14px; border-radius: 7px; background: var(--accent-soft); }
.error-screen h1 { font-size: 27px; line-height: 1.3; font-weight: 600; letter-spacing: -.7px; margin: 24px 0 12px; }
.error-screen p { color: var(--text-secondary); font-size: 13px; margin-bottom: 26px; }
</style>
