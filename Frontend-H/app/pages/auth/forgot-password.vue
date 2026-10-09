<template>
  <section class="mx-auto w-full max-w-md space-y-4 p-6">
    <h1 class="text-2xl font-bold">Restablecer contraseña</h1>
    <p>Solicita un enlace de recuperación para tu cuenta.</p>
    <form class="space-y-4" @submit.prevent="submit">
      <CInput v-model="email" type="email" label="Correo electrónico" autocomplete="email" required />
      <CButton type="submit" :loading="loading">Solicitar enlace</CButton>
    </form>
    <p v-if="message" role="status">{{ message }}</p>
    <NuxtLink to="/auth/login" class="underline">Volver al inicio de sesión</NuxtLink>
  </section>
</template>
<script setup lang="ts">
import { useApiClient } from '~/services/api';
definePageMeta({ layout: 'auth', middleware: 'auth' });
const api = useApiClient();
const email = ref(''); const loading = ref(false); const message = ref('');
const submit = async () => {
  loading.value = true;
  try { message.value = (await api.forgotPassword(email.value)).message; }
  catch { message.value = 'La recuperación por correo no está disponible. Contacta al administrador.'; }
  finally { loading.value = false; }
};
</script>
