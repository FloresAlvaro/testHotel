<template>
  <main class="min-h-screen flex items-center justify-center p-6">
    <section class="w-full max-w-md space-y-4 text-center">
      <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Restablecer contraseña</h1>
      <p class="text-slate-600 dark:text-slate-300">
        El sistema no cuenta con recuperación automática. Contacta a un administrador para restablecer el acceso.
      </p>
      <NuxtLink to="/auth/login" class="inline-flex rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700">
        Volver al inicio de sesión
      </NuxtLink>
    </section>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth', middleware: 'auth' });
</script>