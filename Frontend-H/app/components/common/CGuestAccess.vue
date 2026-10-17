<template>
  <CCard>
    <div class="operation-heading"><div><h2>Acceso al portal del huésped</h2><p class="access-note">Vinculado exclusivamente a esta ficha. No da acceso al panel del hotel.</p></div></div>
    <p v-if="error" role="alert" class="operation-error">{{ error }} <button type="button" class="underline" @click="load">Reintentar</button></p>
    <p v-if="loading" role="status">Consultando acceso…</p>
    <div v-else-if="account"><p>{{ account.email }}</p><p class="access-note">{{ account.is_active?'Acceso activo':'Acceso desactivado' }}</p><CButton class="mt-4" variant="secondary" :loading="saving" @click="toggle">{{ account.is_active?'Desactivar acceso':'Activar acceso' }}</CButton></div>
    <form v-else-if="!error" class="space-y-4" @submit.prevent="create">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4"><CInput v-model="form.email" label="Correo de acceso del huésped" type="email" autocomplete="off" required :disabled="saving" /><CInput v-model="form.password" label="Contraseña inicial del huésped" type="password" autocomplete="new-password" minlength="8" maxlength="128" required :disabled="saving" /></div>
      <p class="access-note">Comparte las credenciales con el huésped por un medio seguro. El sistema no envía correos de activación.</p><CButton type="submit" :loading="saving">Crear acceso del huésped</CButton>
    </form>
  </CCard>
</template>
<script setup lang="ts">
import { useApiClient } from '~/services/api'
import type { ApiResponse } from '~/types'
import type { CustomerAccount } from '~/types/portal'
const props=defineProps<{clientId:number;email?:string|null}>(),api=useApiClient(),ui=useUiStore()
const account=ref<CustomerAccount|null>(null),loading=ref(true),saving=ref(false),error=ref(''),form=reactive({email:props.email||'',password:''})
const message=(e:unknown)=>{const failure=e as {data?:{message?:string}};return failure.data?.message||'No se pudo actualizar el acceso del huésped'}
const load=async()=>{loading.value=true;error.value='';try{account.value=(await api.request<ApiResponse<CustomerAccount|null>>(`/clients/${props.clientId}/account`)).data||null}catch(e){error.value=message(e)}finally{loading.value=false}}
const create=async()=>{saving.value=true;error.value='';try{account.value=(await api.request<ApiResponse<CustomerAccount>>(`/clients/${props.clientId}/account`,{method:'POST',body:form})).data||null;form.password='';ui.success('Acceso del huésped creado')}catch(e){error.value=message(e)}finally{saving.value=false}}
const toggle=async()=>{if(!account.value)return;saving.value=true;error.value='';try{account.value=(await api.request<ApiResponse<CustomerAccount>>(`/clients/${props.clientId}/account`,{method:'PATCH',body:{is_active:!account.value.is_active}})).data||null;ui.success('Acceso actualizado')}catch(e){error.value=message(e)}finally{saving.value=false}}
onMounted(load)
</script>
<style scoped>.access-note{font-size:12px;color:var(--text-secondary);margin-top:8px;line-height:1.8}</style>
