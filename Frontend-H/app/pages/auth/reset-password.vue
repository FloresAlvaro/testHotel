<template>
 <main class="auth-help"><section class="space-y-5">
  <h1 class="text-2xl font-bold">Nueva contraseña</h1>
  <p v-if="checking" role="status">Comprobando el enlace de recuperación…</p>
  <template v-else-if="valid && !message">
   <p>Usa al menos 8 caracteres, con mayúscula, minúscula y número.</p>
   <details class="text-sm"><summary>Longitud máxima de la contraseña</summary><p>El límite es de 72 bytes UTF-8. Las tildes y otros símbolos pueden ocupar más de un byte.</p></details>
   <form class="space-y-4" @submit.prevent="submit">
    <label class="block">Nueva contraseña<input v-model="password" class="operation-filter block w-full mt-2" type="password" autocomplete="new-password" minlength="8" maxlength="72" required :disabled="busy"></label>
    <label class="block">Confirmar contraseña<input v-model="confirmation" class="operation-filter block w-full mt-2" type="password" autocomplete="new-password" required :disabled="busy"></label>
    <CButton type="submit" :loading="busy">Guardar contraseña</CButton>
   </form>
  </template>
  <div v-else-if="!message" class="space-y-4">
   <p>{{ !token?'Falta el enlace de recuperación. Abre el enlace que recibiste por correo o solicita uno nuevo.':checkFailed?'No se pudo comprobar el enlace. Reintenta la consulta o solicita otro.':'El enlace no es válido, ya se usó o venció. Solicita uno nuevo.' }}</p>
   <CButton v-if="checkFailed" variant="secondary" @click="checkLink">Reintentar</CButton>
   <NuxtLink to="/auth/forgot-password" class="button-link">Solicitar otro enlace</NuxtLink>
  </div>
  <p v-if="error" class="operation-error" role="alert">{{ error }}</p><p v-if="message" role="status">{{ message }}</p>
  <NuxtLink to="/auth/login" class="button-link">Iniciar sesión</NuxtLink>
 </section></main>
</template>
<script setup lang="ts">
import { isValidPasswordLength } from '~/utils/validators'
definePageMeta({layout:'auth',middleware:'auth'})
const config=useRuntimeConfig(),route=useRoute(),password=ref(''),confirmation=ref(''),busy=ref(false),message=ref(''),error=ref('')
const token=ref(typeof route.query.token==='string'?route.query.token:''),checking=ref(false),valid=ref(false),checkFailed=ref(false)
useHead({meta:[{name:'referrer',content:'no-referrer'},{name:'robots',content:'noindex,nofollow'}]})
const checkLink=async()=>{
 valid.value=false;checkFailed.value=false
 if(!/^[a-fA-F0-9]{64}$/.test(token.value))return
 checking.value=true
 try{valid.value=(await $fetch<{data:{valid:boolean}}>(`${config.public.apiBase}/users/reset-password/check`,{method:'POST',body:{token:token.value},retry:0})).data.valid}
 catch{checkFailed.value=true}finally{checking.value=false}
}
onMounted(async()=>{if(token.value)await navigateTo('/auth/reset-password',{replace:true});await checkLink()})
const submit=async()=>{
 if(busy.value||!valid.value)return
 error.value=''
 if(!isValidPasswordLength(password.value)){error.value='La contraseña es demasiado corta o supera el límite. Consulta la ayuda de longitud.';return}
 if(password.value!==confirmation.value){error.value='Las contraseñas no coinciden';return}
 busy.value=true
 try{const r=await $fetch<{message:string}>(`${config.public.apiBase}/users/reset-password`,{method:'POST',body:{token:token.value,password:password.value},retry:0});message.value=r.message;password.value='';confirmation.value='';token.value='';valid.value=false}
 catch(e){error.value=(e as {data?:{message?:string}}).data?.message||'No se pudo cambiar la contraseña';await checkLink()}
 finally{busy.value=false}
}
onBeforeUnmount(()=>{token.value='';password.value='';confirmation.value=''})
</script>
