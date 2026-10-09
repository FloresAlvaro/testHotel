<template>
  <section class="space-y-3">
    <h3 class="font-semibold">Sesiones activas</h3>
    <p v-if="message" role="status">{{ message }}</p>
    <ul class="space-y-2">
      <li v-for="session in sessions" :key="session.id" class="flex items-center justify-between gap-3 rounded border p-3">
        <div><p>{{ session.current ? 'Esta sesión' : 'Otra sesión' }}</p>
          <p class="text-sm">{{ session.user_agent || 'Dispositivo desconocido' }}</p>
          <p class="text-sm">{{ new Date(session.created_at).toLocaleString() }}</p></div>
        <CButton :disabled="loading" @click="revoke(session.id, session.current)">Cerrar sesión</CButton>
      </li>
    </ul>
    <CButton :disabled="loading" @click="closeAll">Cerrar todas mis sesiones</CButton>
  </section>
</template>
<script setup lang="ts">
import { useApiClient } from '~/services/api';
import type { AccountSession } from '~/types';
const api = useApiClient(); const auth = useAuthStore();
const sessions = ref<AccountSession[]>([]); const loading = ref(false); const message = ref('');
const load = async () => { sessions.value = (await api.getSessions()).data || []; };
onMounted(() => load().catch(() => { message.value = 'No se pudieron cargar las sesiones'; }));
const clear = async () => { auth.logout(); await navigateTo('/auth/login'); };
const revoke = async (id: string, current: boolean) => {
  loading.value = true;
  try { await api.revokeSession(id); if (current) await clear(); else await load(); }
  catch { message.value = 'No se pudo cerrar la sesión'; }
  finally { loading.value = false; }
};
const closeAll = async () => {
  loading.value = true;
  try { await api.logoutAllSessions(); await clear(); }
  catch { message.value = 'No se pudieron cerrar las sesiones'; }
  finally { loading.value = false; }
};
</script>
