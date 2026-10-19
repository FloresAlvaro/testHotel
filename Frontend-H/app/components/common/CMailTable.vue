<template>
  <section class="space-y-4" aria-label="Listado de correos">
    <div class="operation-form"><label>Buscar destinatario o asunto<input v-model="query" type="search" maxlength="200"></label><label>Estado<select v-model="status"><option value="">Todos</option><option value="sent">Entregado a SMTP</option><option value="queued">En cola</option><option value="failed">Con error</option></select></label><CButton variant="secondary" :loading="loading" @click="load">Actualizar correos</CButton><CButton v-if="query||status" variant="secondary" @click="query='';status=''">Limpiar filtros</CButton></div>
    <p v-if="error||actionError" role="alert" class="operation-error">{{ error||actionError }}</p><p v-if="loading" role="status">Cargando correos…</p><p v-if="message" role="status">{{ message }}</p>
    <CTableHint /><div v-if="!error" class="operation-scroll" tabindex="0" role="region" aria-label="Correos" :aria-busy="loading"><table class="operation-table table-with-actions"><thead><tr><th>Fecha</th><th>Destinatario</th><th>Asunto</th><th>Estado</th><th>Acción</th></tr></thead><tbody><tr v-for="m in rows" :key="m.id"><td>{{ dateTime(m.created_at) }}</td><td>{{ m.recipient }}</td><td>{{ m.subject }}</td><td>{{ m.sent_at?'Entregado a SMTP':m.last_error?'Error de entrega':'En cola' }}<small v-if="m.last_error && !m.sent_at" class="block">Revisa la configuración de correo o vuelve a intentar.</small></td><td><CButton v-if="!m.sent_at" variant="secondary" size="sm" :disabled="busy||loading" @click="retry(m.id)">Reintentar</CButton><span v-else>—</span></td></tr></tbody></table></div>
    <CEmptyState v-if="!loading && !error && !rows.length" title="No hay correos con estos filtros" description="Los mensajes enviados por el sistema aparecerán aquí." />
    <CTablePagination :pagination="pagination" :loading="loading||busy" @change="page=$event" />
  </section>
</template>
<script setup lang="ts">
import type {MailStatus} from '~/types/guestServices'
const query=ref(''),status=ref(''),message=ref(''),{dateTime}=useHotelSettings()
const {rows,loading,error,pagination,page,load}=useTableList<MailStatus['messages'][number]>('/operations/email-status',()=>({q:query.value.trim(),status:status.value}))
const {post,run,error:actionError,busy}=useOperations()
const retry=(id:number)=>run(async()=>{await post(`email-status/${id}/retry`,{});message.value='Correo puesto en cola para un nuevo intento.';await load()})
</script>
