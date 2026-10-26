<template>
 <main class="auth-help"><section class="space-y-5">
  <h1 class="text-2xl font-bold">Activa tu cuenta</h1><p>Elige una contraseña de al menos 8 caracteres, con mayúscula, minúscula y número. La invitación vence a las 48 horas y se usa una sola vez.</p><details class="text-sm"><summary>Longitud máxima</summary><p>El máximo es de 72 bytes UTF-8; algunos símbolos ocupan más de un byte.</p></details>
  <form v-if="!message && token" class="space-y-4" @submit.prevent="submit">
   <label class="block">Nueva contraseña<input v-model="password" class="operation-filter block w-full mt-2" type="password" autocomplete="new-password" minlength="8" maxlength="72" required :disabled="busy"></label>
   <label class="block">Confirmar contraseña<input v-model="confirmation" class="operation-filter block w-full mt-2" type="password" autocomplete="new-password" required :disabled="busy"></label>
   <CButton type="submit" :loading="busy">Activar mi cuenta</CButton>
  </form>
  <p v-else-if="!message" role="alert">Falta el enlace de invitación. Abre el enlace que recibiste por correo.</p>
  <p v-if="error" class="operation-error" role="alert">{{ error }}</p><p v-if="message" role="status">{{ message }}</p>
  <NuxtLink to="/auth/login" class="button-link">Iniciar sesión</NuxtLink>
 </section></main>
</template>
<script setup lang="ts">
import { isValidPasswordLength } from '~/utils/validators'
import type {AcceptInvitationInput} from '~/types/generated/api'
definePageMeta({layout:false})
useHead({meta:[{name:'referrer',content:'no-referrer'}]})
const route=useRoute(),config=useRuntimeConfig(),token=ref(typeof route.query.token==='string'?route.query.token:''),password=ref(''),confirmation=ref(''),busy=ref(false),message=ref(''),error=ref('')
onMounted(()=>{if(route.query.token)void navigateTo('/auth/accept-invitation',{replace:true})})
const submit=async()=>{
 error.value='';if(!isValidPasswordLength(password.value)){error.value='Usa al menos 8 caracteres y como máximo 72 bytes UTF-8';return}if(password.value!==confirmation.value){error.value='Las contraseñas no coinciden';return}
 busy.value=true
 try{
  const body:AcceptInvitationInput={token:token.value,password:password.value}
  const result=await $fetch<{message:string}>(`${config.public.apiBase}/users/accept-invitation`,{method:'POST',body,retry:0})
  message.value=result.message;token.value='';password.value='';confirmation.value=''
 }catch(e){error.value=(e as {data?:{message?:string}}).data?.message||'No se pudo activar la cuenta. Solicita una nueva invitación.'}finally{busy.value=false}
}
</script>
<style scoped>.auth-help{min-height:100dvh;display:grid;place-items:center;padding:24px}.auth-help section{width:100%;max-width:480px;padding:28px;border:1px solid var(--border-color);border-radius:16px;background:var(--bg-primary)}</style>
