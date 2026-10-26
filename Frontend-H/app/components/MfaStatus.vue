<template>
  <section aria-labelledby="mfa-status-title" class="space-y-3 rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50">
    <h3 id="mfa-status-title" class="font-medium">Autenticación de dos factores</h3>
    <p v-if="loading" role="status" class="text-sm">Consultando la protección de tu cuenta…</p>
    <p v-else-if="error" role="alert" class="text-sm text-red-700 dark:text-red-300">{{ error }}</p>
    <template v-else-if="status">
      <p class="text-sm font-medium">{{ status.enabled ? 'Autenticador configurado' : 'MFA desactivado' }}</p>
      <p class="text-sm">MFA es opcional para cada administrador. Cuando está activado, se solicita un segundo factor al iniciar sesión.</p>
      <p v-if="status.enabled" class="text-sm">Códigos de recuperación disponibles: {{ status.recoveryCodesRemaining }}. Guarda los códigos originales en un lugar seguro. Cada uno solo puede usarse una vez.</p>
      <p v-if="status.enabled && status.recoveryCodesRemaining === 0" role="alert" class="text-sm text-amber-800 dark:text-amber-200">No tienes códigos de recuperación disponibles. Conserva el acceso a tu autenticador y contacta al administrador del sistema antes de cambiar de dispositivo.</p>
      <p class="text-xs text-slate-600 dark:text-slate-400">La clave y los códigos originales no se muestran después de la configuración. Nunca los compartas por correo o mensajería.</p>
    </template>
    <CButton variant="secondary" size="sm" :loading="loading" @click="load">Actualizar estado</CButton>
    <form v-if="status && !status.enabled && isAdmin && !challenge" class="space-y-3" @submit.prevent="enable">
      <p class="text-sm">Puedes entrar con tu contraseña. Activa MFA si quieres añadir un código de autenticación a tus accesos.</p>
      <label for="mfa-enable-password" class="block text-sm font-medium">Contraseña actual</label>
      <input id="mfa-enable-password" v-model="password" type="password" autocomplete="current-password" required class="w-full rounded border border-slate-300 bg-transparent p-2 dark:border-slate-600" :disabled="renewing" >
      <CButton type="submit" :loading="renewing">Activar MFA</CButton>
    </form>
    <template v-if="status?.enabled && isAdmin">
      <h4 class="pt-3 font-medium">Administrar MFA</h4>
      <p class="text-sm">Para cambiar el autenticador o desactivar MFA, confirma tu contraseña y un código actual o de recuperación. Se cerrarán tus otras sesiones al completar el cambio. Al desactivarlo entrarás únicamente con contraseña.</p>
      <form v-if="!challenge" class="space-y-3" @submit.prevent="disabling ? disable() : renew()">
        <label for="mfa-renew-password" class="block text-sm font-medium">Contraseña actual</label>
        <input id="mfa-renew-password" v-model="password" class="w-full rounded border border-slate-300 bg-transparent p-2 dark:border-slate-600" type="password" autocomplete="current-password" required :disabled="renewing" >
        <label for="mfa-renew-code" class="block text-sm font-medium">Código del autenticador o de recuperación</label>
        <input id="mfa-renew-code" v-model.trim="code" class="w-full rounded border border-slate-300 bg-transparent p-2 font-mono dark:border-slate-600" autocomplete="one-time-code" autocapitalize="none" spellcheck="false" pattern="([0-9]{6}|[a-fA-F0-9]{16})" maxlength="16" required :disabled="renewing" >
        <CButton type="submit" variant="secondary" :loading="renewing" @click="disabling = false">Configurar nuevo autenticador</CButton>
        <CButton type="submit" variant="danger" :loading="renewing" @click="disabling = true">Desactivar MFA</CButton>
      </form>
    </template>
    <MfaChallengeForm v-if="challenge" :challenge="challenge" renewal @authenticated="completeRenewal" @cancel="challenge = null" />
    <p v-if="renewalError" role="alert" class="text-sm text-red-700 dark:text-red-300">{{ renewalError }}</p>
    <p v-if="renewalComplete" role="status" class="text-sm">{{ completionMessage }}</p>
  </section>
</template>
<script setup lang="ts">
import { useApiClient } from '~/services/api';
import type { MfaStatusResponse, SessionData } from '~/types/generated/api';
import type { MfaChallenge } from '~/types/auth';
import { useAuthService } from '~/services/auth';
const api = useApiClient();
const status = ref<MfaStatusResponse['data'] | null>(null);
const loading = ref(false);
const error = ref('');
const password = ref(''), code = ref(''), renewalError = ref('');
const challenge = ref<MfaChallenge | null>(null);
const renewing = ref(false), renewalComplete = ref(false);
const auth = useAuthService();
const isAdmin = computed(() => useAuthStore().isAdmin);
const disabling = ref(false), completionMessage = ref('');
async function enable() {
  renewing.value = true; renewalError.value = ''; renewalComplete.value = false;
  try { challenge.value = (await api.enableMfa(password.value)).data; password.value = ''; }
  catch { renewalError.value = 'No se pudo activar MFA. Revisa tu contraseña e intenta de nuevo.'; }
  finally { renewing.value = false; }
}
async function disable() {
  renewing.value = true; renewalError.value = ''; renewalComplete.value = false;
  try {
    await auth.completeSession((await api.disableMfa(password.value,code.value.toLowerCase())).data);
    password.value = ''; code.value = ''; completionMessage.value = 'MFA desactivado. Puedes volver a activarlo cuando quieras.';
    renewalComplete.value = true; await load();
  } catch { renewalError.value = 'No se pudo desactivar MFA. Revisa tu contraseña y utiliza un código válido que no hayas usado antes.'; }
  finally { renewing.value = false; }
}
async function renew() {
  renewing.value = true; renewalError.value = ''; renewalComplete.value = false;
  try {
    const response = await api.renewMfa(password.value, code.value.toLowerCase());
    if (!response.success) throw new Error('No se pudo iniciar la renovación.');
    challenge.value = response.data; password.value = ''; code.value = '';
  } catch { renewalError.value = 'No se pudo iniciar la renovación. Revisa la contraseña y utiliza un código válido que no hayas usado antes.'; }
  finally { renewing.value = false; }
}
async function completeRenewal(session: SessionData) {
  await auth.completeSession(session); challenge.value = null; renewalComplete.value = true; completionMessage.value = status.value?.enabled ? 'Autenticador actualizado. Los códigos anteriores ya no funcionan.' : 'MFA activado. Se solicitará un código al iniciar sesión.';
  await load();
}
async function load() {
  loading.value = true; error.value = '';
  try {
    const response = await api.getMfaStatus();
    if (!response.success) throw new Error('No se pudo consultar el segundo factor.');
    status.value = response.data;
  } catch { error.value = 'No se pudo consultar el segundo factor. Actualiza el estado para volver a intentarlo.'; }
  finally { loading.value = false; }
}
onMounted(load);
onBeforeUnmount(() => { password.value = ''; code.value = ''; challenge.value = null; });
</script>
