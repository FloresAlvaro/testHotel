<template>
  <section class="mx-auto w-full max-w-md space-y-4 p-6">
    <h1 class="text-2xl font-bold">{{ mode === 'invite' ? 'Activa tu cuenta' : 'Nueva contraseña' }}</h1>
    <p>Elige una contraseña de al menos 8 caracteres.</p>
    <form v-if="!completed" class="space-y-4" @submit.prevent="submit">
      <CInput v-model="password" type="password" label="Nueva contraseña" autocomplete="new-password" minlength="8" required />
      <CInput v-model="confirmation" type="password" label="Confirma la contraseña" autocomplete="new-password" minlength="8" required />
      <CButton type="submit" :loading="loading" :disabled="!token">Guardar contraseña</CButton>
    </form>
    <p v-if="message" role="status">{{ message }}</p>
    <NuxtLink to="/auth/login" class="underline">Volver al inicio de sesión</NuxtLink>
  </section>
</template>
<script setup lang="ts">
import { useApiClient } from '~/services/api';
const props = defineProps<{ mode: 'invite' | 'reset' }>();
const api = useApiClient(); const route = useRoute(); const router = useRouter();
const auth = useAuthStore();
const token = ref(''); const password = ref(''); const confirmation = ref('');
const loading = ref(false); const completed = ref(false); const message = ref('');
onMounted(async () => {
  token.value = new URLSearchParams(route.hash.slice(1)).get('token') || '';
  await router.replace({ path: route.path, query: route.query, hash: '' });
  if (!token.value) message.value = 'Abre el enlace completo que recibiste para continuar.';
});
const submit = async () => {
  if (password.value !== confirmation.value) { message.value = 'Las contraseñas no coinciden'; return; }
  loading.value = true;
  try {
    const data = { token: token.value, password: password.value, confirmPassword: confirmation.value };
    const response = await (props.mode === 'invite' ? api.acceptInvitation(data) : api.resetPassword(data));
    auth.logout();
    message.value = response.message; completed.value = true;
    password.value = ''; confirmation.value = ''; token.value = '';
  } catch (error) {
    message.value = (error as { data?: { message?: string } }).data?.message || 'No se pudo guardar. El enlace puede haber expirado.';
  } finally { loading.value = false; }
};
</script>
