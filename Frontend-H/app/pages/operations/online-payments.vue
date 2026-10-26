<template>
  <div class="space-y-6">
    <CPageHeader title="Pagos en línea" description="Consulta cobros y reembolsos. Los registros demo no representan dinero real." />
    <p v-if="error || actionError" role="alert" class="operation-error">{{ error || actionError }} <button class="underline" @click="load">Reintentar</button></p>
    <p v-if="message" role="status">{{ message }}</p>
    <CCard>
      <div class="operation-form mb-4"><label>Buscar huésped, reserva o ID del pago<input v-model="query" type="search" maxlength="200"></label><label>Estado<select v-model="status"><option value="">Todos</option><option v-for="(label,key) in states" :key="key" :value="key">{{ label }}</option></select></label><label>Desde<input v-model="startDate" type="date"></label><label>Hasta<input v-model="endDate" type="date"></label><CButton variant="secondary" :loading="loading" @click="load">Actualizar</CButton><CButton v-if="query||status||startDate||endDate" variant="secondary" @click="clear">Limpiar filtros</CButton></div>
      <p v-if="loading" role="status">Cargando pagos en línea…</p>
      <CTableHint />
      <div v-if="!error" class="operation-scroll" tabindex="0" role="region" aria-label="Pagos en línea" :aria-busy="loading"><table class="operation-table table-with-actions online-payments-table"><thead><tr><th scope="col">Pago / huésped</th><th scope="col">Reserva</th><th scope="col">Fecha</th><th scope="col">Pasarela</th><th class="text-right">Importe</th><th scope="col">Estado</th><th scope="col">Acción</th></tr></thead><tbody><tr v-for="p in payments" :key="p.id"><td>{{ p.client_name }}<small class="block break-all">{{ p.id }}</small></td><td><NuxtLink :to="`/reservations/${p.reservation_id}`">#{{ p.reservation_id }}</NuxtLink></td><td>{{ dateTime(p.created_at) }}</td><td>{{ p.provider==='demo'?'DEMO · sin dinero real':p.provider }}</td><td class="text-right">{{ money(p.amount,p.currency) }}</td><td><span class="status-badge" :class="statusClasses[p.status]">{{ states[p.status] || 'Estado desconocido' }}</span></td><td><CButton v-if="['paid','refund_pending'].includes(p.status)" variant="secondary" size="sm" :disabled="busy || loading" @click="selected=p">{{ p.status==='refund_pending'?'Consultar reembolso':'Reembolsar' }}</CButton><span v-else>—</span></td></tr></tbody></table></div>
      <CEmptyState v-if="!loading && !error && !payments.length" title="No hay pagos en línea con estos filtros" description="Prueba otra búsqueda o limpia los filtros." />
      <CTablePagination :pagination="pagination" :loading="loading||busy" @change="page=$event" />
    </CCard>
    <CModal :is-open="!!selected" title="Reembolsar pago" :close-on-overlay="!busy" @close="!busy && (selected=undefined)"><p v-if="selected">{{ selected.client_name }} · Reserva #{{ selected.reservation_id }}. Se devolverá el importe completo de {{ money(selected.amount,selected.currency) }} por el mismo medio. {{ selected.provider==='demo'?'Es una simulación sin dinero real.':'La operación se enviará a la pasarela.' }}</p><p v-if="actionError" role="alert" class="operation-error">{{ actionError }}</p><template #footer><CButton variant="secondary" :disabled="busy" @click="selected=undefined">Volver</CButton><CButton :loading="busy" @click="refund">Confirmar reembolso</CButton></template></CModal>
  </div>
</template>
<script setup lang="ts">
import {ONLINE_PAYMENT_STATUS_LABELS} from '~/utils/constants'
import type {OnlinePayment} from '~/types/guestServices'
definePageMeta({middleware:['auth','manager']})
const {post,run,error:actionError,busy}=useOperations(),{money,dateTime}=useHotelSettings()
const query=ref(''),status=ref(''),startDate=ref(''),endDate=ref(''),selected=ref<OnlinePayment>(),message=ref('')
const states=ONLINE_PAYMENT_STATUS_LABELS
const statusClasses:Record<string,string>={pending:'status-pending',paid:'status-completed',expired:'status-cancelled',refunded:'status-refunded',refund_pending:'status-pending',failed:'status-failed'}
const {rows:payments,loading,error,pagination,page,load}=useTableList<OnlinePayment>('/operations/online-payments',()=>({q:query.value.trim(),status:status.value,startDate:startDate.value||undefined,endDate:endDate.value||undefined}))
const clear=()=>{query.value='';status.value='';startDate.value='';endDate.value=''}
const refund=()=>run(async()=>{if(!selected.value)return;await post(`online-payments/${selected.value.id}/refund`,{});selected.value=undefined;message.value='Reembolso enviado. Su estado se actualizará al confirmarlo la pasarela.';await load()})
</script>

<style scoped>
.online-payments-table tbody td { text-align: center; }
.online-payments-table tbody td:first-child { text-align: left; }
</style>
