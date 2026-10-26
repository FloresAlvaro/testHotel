<template>
  <section aria-labelledby="own-sessions-title" class="space-y-3">
    <h3 id="own-sessions-title" class="font-medium">Mis sesiones de navegador</h3>
    <p class="text-sm">Puedes cerrar tus otras sesiones. Las integraciones con token no aparecen en esta lista.</p>
    <CButton variant="secondary" size="sm" :loading="loading" @click="load">Actualizar sesiones</CButton>
    <p v-if="error" class="operation-error" role="alert">{{ error }}</p>
    <p v-if="message" role="status">{{ message }}</p>
    <p v-if="!loading && !error && !sessions.length">No hay sesiones de navegador vigentes.</p>
    <ul class="space-y-3">
      <li v-for="session in sessions" :key="session.id" class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div><p>{{ session.current ? 'Sesión actual' : 'Otra sesión' }}</p><p class="text-sm">Inicio: {{ format(session.created_at) }} · Vence: {{ format(session.expires_at) }}</p></div>
        <CButton v-if="!session.current" variant="danger" size="sm" :disabled="closing !== null" :loading="closing === session.id" @click="revoke(session.id)">Cerrar sesión</CButton>
      </li>
    </ul>
  </section>
</template>
<script setup lang="ts">
import { useApiClient } from '~/services/api'
import type { OwnSession, OwnSessionsResponse } from '~/types/generated/api'
const api=useApiClient()
const sessions=ref<OwnSession[]>([])
const loading=ref(false),closing=ref<string|null>(null),error=ref(''),message=ref('')
const format=(value:string)=>new Intl.DateTimeFormat('es-BO',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value))
async function load(){
 loading.value=true;error.value=''
 try{sessions.value=(await api.request<OwnSessionsResponse>('/users/sessions')).data}
 catch(e){error.value=e instanceof Error?e.message:'No se pudieron consultar las sesiones.'}
 finally{loading.value=false}
}
async function revoke(id:string){
 closing.value=id;error.value='';message.value=''
 try{await api.request(`/users/sessions/${id}`,{method:'DELETE',retry:0});sessions.value=sessions.value.filter(s=>s.id!==id);message.value='La sesión se cerró.'}
 catch(e){error.value=e instanceof Error?e.message:'No se pudo cerrar la sesión. Actualiza e inténtalo de nuevo.'}
 finally{closing.value=null}
}
onMounted(load)
</script>
