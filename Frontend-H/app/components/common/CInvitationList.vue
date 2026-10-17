<template>
  <section class="space-y-4" aria-label="Invitaciones">
    <div class="flex flex-wrap items-center justify-between gap-3"><h3 class="font-semibold">Invitaciones enviadas</h3><CButton variant="secondary" size="sm" :loading="loading" @click="load">Actualizar invitaciones</CButton></div>
    <p v-if="error" role="alert" class="operation-error">{{ error }}</p>
    <p v-if="!loading && !items.length" class="text-sm">No hay invitaciones enviadas.</p>
    <ul class="space-y-3">
      <li v-for="item in items" :key="item.id" class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--border-color)] p-4">
        <div class="min-w-0"><p class="font-medium break-all">{{ item.name }} · {{ item.email }}</p><p class="text-sm">{{ status(item) }} · {{ roles[item.role] }} · vence {{ new Date(item.expires_at).toLocaleString('es-BO') }}</p></div>
        <CButton v-if="!item.used_at && Date.parse(item.expires_at)>Date.now()" variant="secondary" size="sm" :disabled="loading" @click="revoke(item.id)">Revocar invitación</CButton>
      </li>
    </ul>
  </section>
</template>
<script setup lang="ts">
import type {Invitation} from '~/types/generated/api'
import {useApiClient} from '~/services/api'
const api=useApiClient(),items=ref<Invitation[]>([]),loading=ref(false),error=ref('')
const props=defineProps<{clientId?:number}>()
const roles={admin:'Administrador',manager:'Gerente',receptionist:'Recepcionista',customer:'Huésped'}
const status=(item:Invitation)=>item.used_at?'Finalizada o revocada':Date.parse(item.expires_at)<=Date.now()?'Vencida':'Pendiente de aceptación'
const load=async()=>{loading.value=true;error.value='';try{const r=await api.request<{data:Invitation[]}>('/users/invitations');items.value=r.data.filter(i=>props.clientId?i.client_id===props.clientId:!i.client_id)}catch{error.value='No se pudieron cargar las invitaciones.'}finally{loading.value=false}}
const revoke=async(id:string)=>{loading.value=true;try{await api.request(`/users/invitations/${id}`,{method:'DELETE',retry:0});await load()}catch{error.value='No se pudo revocar la invitación.'}finally{loading.value=false}}
onMounted(load)
</script>
