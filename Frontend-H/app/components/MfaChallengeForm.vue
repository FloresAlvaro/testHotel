<template>
  <section aria-labelledby="mfa-heading" class="space-y-5">
    <header>
      <h1 id="mfa-heading" class="text-xl font-semibold">{{ renewal ? 'Configura tu autenticador' : challenge.enrollmentRequired ? 'Protege tu cuenta de administrador' : 'Verifica tu identidad' }}</h1>
      <p class="mt-2 text-sm text-slate-600 dark:text-slate-400">{{ renewal ? 'Configura el autenticador y guarda los códigos de recuperación antes de confirmar.' : challenge.enrollmentRequired ? 'Configura una aplicación de autenticación para completar tu primer acceso.' : 'Introduce el código de tu aplicación de autenticación para continuar.' }}</p>
    </header>

    <div v-if="challenge.enrollmentRequired && !enrollment" class="space-y-3">
      <p class="text-sm">Necesitas una aplicación compatible con TOTP, como la que ya uses para tus otras cuentas. Conserva los códigos de recuperación fuera de este dispositivo.</p>
      <CButton :loading="busy" @click="enroll">Configurar autenticador</CButton>
    </div>

    <form v-if="!challenge.enrollmentRequired || enrollment" class="space-y-4" @submit.prevent="verify">
      <div v-if="enrollment" class="space-y-4">
        <div class="rounded-lg border border-slate-300 p-4 dark:border-slate-600">
          <h2 class="font-medium">1. Añade la cuenta en tu aplicación</h2>
          <p class="mt-2 text-sm">Escanea el QR con tu aplicación de autenticación o introduce la clave manualmente. Tipo: basada en tiempo (TOTP), 6 dígitos, intervalo de 30 segundos.</p>
          <img v-if="qrImage" :src="qrImage" alt="Código QR para configurar el autenticador" width="240" height="240" class="mt-3 max-w-full rounded bg-white" >
          <p v-if="qrError" class="text-sm" role="status">No se pudo generar el QR. Puedes usar la clave manual.</p>
          <p class="mt-3 text-xs font-medium">Clave de configuración</p>
          <code class="mt-1 block select-all break-all rounded bg-slate-100 p-3 text-sm dark:bg-slate-800">{{ enrollment.secret }}</code>
          <button type="button" class="mt-2 text-sm underline" @click="copyKey">Copiar clave</button>
          <p v-if="copyMessage" role="status" class="text-sm">{{ copyMessage }}</p>
          <p class="mt-2 text-xs text-slate-600 dark:text-slate-400">Esta clave permite generar tus códigos. No la compartas.</p>
        </div>
        <div class="rounded-lg border border-slate-300 p-4 dark:border-slate-600">
          <h2 class="font-medium">2. Guarda tus códigos de recuperación</h2>
          <p class="mt-2 text-sm">Cada código sirve una sola vez si pierdes el autenticador. Se muestran únicamente durante esta configuración.</p>
          <ul class="my-3 grid grid-cols-1 gap-2 font-mono text-sm sm:grid-cols-2" aria-label="Códigos de recuperación">
            <li v-for="recovery in enrollment.recoveryCodes" :key="recovery" class="select-all break-all">{{ recovery }}</li>
          </ul>
          <button type="button" class="text-sm font-medium underline" @click="downloadRecovery">Descargar códigos de recuperación</button>
          <label class="mt-4 flex items-start gap-2 text-sm">
            <input v-model="saved" type="checkbox" required class="mt-1" >
            He guardado los códigos en un lugar seguro y podré recuperarlos si pierdo el autenticador.
          </label>
        </div>
      </div>

      <label for="mfa-code" class="block text-sm font-medium">{{ useRecovery ? 'Código de recuperación' : 'Código de 6 dígitos' }}</label>
      <input id="mfa-code" ref="codeInput" v-model.trim="code" class="w-full rounded-lg border border-slate-300 bg-transparent p-3 font-mono dark:border-slate-600" :inputmode="useRecovery ? 'text' : 'numeric'" autocomplete="one-time-code" autocapitalize="none" spellcheck="false" :maxlength="useRecovery ? 16 : 6" :pattern="useRecovery ? '[a-fA-F0-9]{16}' : '[0-9]{6}'" required :disabled="busy" aria-describedby="mfa-expiry" >
      <p id="mfa-expiry" class="text-xs text-slate-600 dark:text-slate-400">El acceso pendiente vence en 10 minutos. Si vence o agotas los intentos, vuelve a introducir tu contraseña.</p>
      <CButton type="submit" :loading="busy" :disabled="busy || (Boolean(enrollment) && !saved)">{{ enrollment ? 'Activar y entrar' : 'Verificar y entrar' }}</CButton>
      <button v-if="!challenge.enrollmentRequired" type="button" class="block text-sm underline" :disabled="busy" @click="toggleRecovery">{{ useRecovery ? 'Usar mi aplicación de autenticación' : 'He perdido el acceso al autenticador' }}</button>
    </form>

    <p v-if="error" role="alert" class="text-sm text-red-700 dark:text-red-300">{{ error }}</p>
    <button type="button" class="text-sm underline" :disabled="busy" @click="emit('cancel')">{{ renewal ? 'Cancelar configuración' : 'Volver al inicio de sesión' }}</button>
  </section>
</template>

<script setup lang="ts">
import type { MfaChallenge, MfaEnrollment } from '~/types/auth';
import type { SessionData } from '~/types/generated/api';
import { useApiClient } from '~/services/api';

const props = defineProps<{ challenge: MfaChallenge; renewal?: boolean }>();
const emit = defineEmits<{ authenticated: [session: SessionData]; cancel: [] }>();
const api = useApiClient();
const enrollment = ref<MfaEnrollment | null>(null);
const qrImage=ref(''),qrError=ref(false),copyMessage=ref('');
let qrVersion=0;
watch(enrollment,async value=>{const version=++qrVersion;qrImage.value='';qrError.value=false;copyMessage.value='';if(!value)return;try{const QRCode=await import('qrcode');const image=await QRCode.toDataURL(value.uri,{width:240,margin:4,errorCorrectionLevel:'M'});if(version===qrVersion)qrImage.value=image}catch{if(version===qrVersion)qrError.value=true}});
async function copyKey(){if(!enrollment.value)return;try{await navigator.clipboard.writeText(enrollment.value.secret);copyMessage.value='Clave copiada. Pégala solo en tu aplicación de autenticación.'}catch{copyMessage.value='No se pudo copiar. Selecciona la clave y cópiala manualmente.'}}
const code = ref('');
const saved = ref(false);
const busy = ref(false);
const error = ref('');
const useRecovery = ref(false);
const codeInput = ref<HTMLInputElement | null>(null);

function describeError(failure: unknown) {
  const response = failure as { statusCode?: number; data?: { message?: string } };
  return response.statusCode === 429 ? 'Has realizado demasiados intentos. Espera y vuelve a iniciar sesión.'
    : response.data?.message || 'No se pudo verificar el acceso. Revisa el código o vuelve al inicio de sesión.';
}
async function enroll() {
  busy.value = true; error.value = '';
  try {
    const response = await api.enrollMfa(props.challenge.challengeId);
    if (!response.success || !response.data) throw new Error('No se pudo iniciar la configuración');
    enrollment.value = response.data;
    await nextTick(); codeInput.value?.focus();
  } catch (failure) { error.value = describeError(failure); }
  finally { busy.value = false; }
}
async function verify() {
  if (busy.value || (enrollment.value && !saved.value)) return;
  busy.value = true; error.value = '';
  try {
    const response = enrollment.value
      ? await api.confirmMfa(props.challenge.challengeId, code.value, saved.value)
      : await api.verifyMfa(props.challenge.challengeId, code.value.toLowerCase());
    if (!response.success || !response.data) throw new Error('No se pudo verificar el acceso');
    enrollment.value = null; code.value = ''; saved.value = false;
    emit('authenticated', response.data);
  } catch (failure) { error.value = describeError(failure); }
  finally { busy.value = false; }
}
function toggleRecovery() { useRecovery.value = !useRecovery.value; code.value = ''; error.value = ''; nextTick(() => codeInput.value?.focus()); }
function downloadRecovery() {
  if (!enrollment.value) return;
  const blob = new Blob(['Hotel — códigos de recuperación\nCada código solo puede usarse una vez. Guarda este archivo en un lugar seguro.\n\n', enrollment.value.recoveryCodes.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = url; link.download = 'hotel-codigos-recuperacion.txt'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
onMounted(() => codeInput.value?.focus());
onBeforeUnmount(() => { qrVersion++;qrImage.value=''; enrollment.value = null; code.value = ''; saved.value = false; });
</script>
