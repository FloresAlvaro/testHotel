<template>
  <section class="space-y-5" aria-labelledby="access-title">
    <Icon name="system-uicons:lock" size="36" class="access-icon" />
    <h1 id="access-title" class="text-2xl font-semibold">Solicita tu acceso</h1>
    <p class="text-slate-600 dark:text-slate-300">El hotel activa las cuentas de huéspedes y del equipo. Si ya tienes una reserva, contacta con recepción para solicitar acceso a tus estancias y comprobantes.</p>
    <NuxtLink to="/auth/login" class="button-link">Volver al inicio de sesión</NuxtLink>
  </section>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth', middleware: 'auth' });
</script>
