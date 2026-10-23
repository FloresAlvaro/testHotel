<template>
  <CCard>
    <div class="operation-heading"><div><h2>Acceso al portal del huésped</h2><p class="access-note">Vinculado exclusivamente a esta ficha. No da acceso al panel del hotel.</p></div></div>
    <p v-if="error" role="alert" class="operation-error">{{ error }} <button type="button" class="underline" @click="load">Reintentar</button></p>
    <p v-if="loading" role="status">Consultando acceso…</p>
    <div v-else-if="account"><p>{{ account.email }}</p><p class="access-note">{{ account.is_active?'Acceso activo':'Acceso desactivado' }}</p><CButton class="mt-4" variant="secondary" :loading="saving" @click="toggle">{{ account.is_active?'Desactivar acceso':'Activar acceso' }}</CButton></div>
    <div v-else-if="!error" class="space-y-5">
      <form class="space-y-4" @submit.prevent="invite">
        <CInput v-model="form.email" label="Correo de acceso del huésped" type="email" autocomplete="off" required :disabled="saving" />
        <p class="access-note">El huésped recibirá un enlace válido durante 48 horas para elegir su contraseña.</p>
        <CButton type="submit" :loading="saving">Enviar invitación por correo</CButton>
      </form>
      <details class="access-note"><summary class="cursor-pointer">Crear acceso con contraseña inicial</summary>
        <form class="space-y-4 mt-4" @submit.prevent="create">
          <CInput v-model="form.password" label="Contraseña inicial del huésped" type="password" autocomplete="new-password" minlength="8" maxlength="72" required :disabled="saving" />
          <p>Se usará el correo indicado arriba. Comparte las credenciales por un medio seguro.</p>
          <CButton type="submit" variant="secondary" :loading="saving">Crear acceso del huésped</CButton>
        </form>
      </details>
    </div>
    <p v-if="invitationSent" role="status">Invitación enviada. El huésped podrá elegir su contraseña desde el correo.</p>
    <CInvitationList :key="invitationVersion" :client-id="clientId" class="mt-5" />
  </CCard>
</template>
<script setup lang="ts">
import { isValidPasswordLength } from '~/utils/validators'
import { useApiClient } from '~/services/api'
import type { CustomerInvitationInput } from '~/types/generated/api'
import type { ApiResponse } from '~/types'
import type { CustomerAccount } from '~/types/portal'
const props=defineProps<{clientId:number;email?:string|null}>(),api=useApiClient(),ui=useUiStore()
const account=ref<CustomerAccount|null>(null),loading=ref(true),saving=ref(false),error=ref(''),form=reactive({email:props.email||'',password:''})
const message=(e:unknown)=>{const failure=e as {data?:{message?:string}};return failure.data?.message||'No se pudo actualizar el acceso del huésped'}
const load=async()=>{loading.value=true;error.value='';try{account.value=(await api.request<ApiResponse<CustomerAccount|null>>(`/clients/${props.clientId}/account`)).data||null}catch(e){error.value=message(e)}finally{loading.value=false}}
const invitationSent=ref(false),invitationVersion=ref(0)
const invite=async()=>{saving.value=true;error.value='';try{const client=await api.getClient(props.clientId);if(!client.data)throw new Error('Huésped no encontrado');const body:CustomerInvitationInput={name:client.data.name,email:form.email,role:'customer',client_id:props.clientId};await api.request('/users/invitations',{method:'POST',body,retry:0});invitationSent.value=true;invitationVersion.value++}catch(e){error.value=message(e)}finally{saving.value=false}}
const create=async()=>{error.value='';if(!isValidPasswordLength(form.password)){error.value='Usa al menos 8 caracteres y como máximo 72 bytes UTF-8';return}saving.value=true;try{account.value=(await api.request<ApiResponse<CustomerAccount>>(`/clients/${props.clientId}/account`,{method:'POST',body:form})).data||null;form.password='';ui.success('Acceso del huésped creado')}catch(e){error.value=message(e)}finally{saving.value=false}}
const toggle=async()=>{if(!account.value)return;saving.value=true;error.value='';try{account.value=(await api.request<ApiResponse<CustomerAccount>>(`/clients/${props.clientId}/account`,{method:'PATCH',body:{is_active:!account.value.is_active}})).data||null;ui.success('Acceso actualizado')}catch(e){error.value=message(e)}finally{saving.value=false}}
onMounted(load)
</script>
<style scoped>.access-note{font-size:12px;color:var(--text-secondary);margin-top:8px;line-height:1.8}</style>
