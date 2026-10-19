<template>
  <div class="space-y-6">
    <CPageHeader title="Solicitudes de huéspedes" description="Gestiona cambios de fechas y cancelaciones desde un solo lugar." />
    <p v-if="notice" role="status" class="request-notice">{{ notice }}</p>
    <p v-if="error && !selected" role="alert" class="operation-error">{{ error }}</p>
    <CCard>
      <div class="request-toolbar">
        <div><h2>Bandeja de solicitudes</h2><p>Selecciona una solicitud para consultar el detalle y responder al huésped.</p></div>
        <div class="request-filters">
          <label>Estado<select v-model="status" class="operation-filter" :disabled="busy" @change="page=1;load()"><option value="pending">Pendientes</option><option value="approved">Aprobadas</option><option value="rejected">Rechazadas</option></select></label>
          <CButton variant="secondary" :loading="busy" @click="load">Actualizar</CButton>
        </div>
      </div>
      <p v-if="busy && !requests.length" role="status" class="request-loading">Cargando solicitudes…</p>
      <div v-if="requests.length" class="request-list" :aria-busy="busy">
        <article v-for="r in requests" :key="r.id" class="request-row">
          <span class="request-icon" aria-hidden="true"><Icon :name="r.kind==='dates'?'system-uicons:calendar':'system-uicons:cross'" /></span>
          <div class="request-copy">
            <div class="request-title"><h3>{{ r.client_name || 'Huésped' }}</h3><span class="request-badge" :data-status="r.status">{{ stateLabels[r.status] }}</span></div>
            <p class="request-kind">{{ r.kind==='dates'?'Cambio de fechas':'Cancelación' }} · Reserva #{{ r.reservation_id }}</p>
            <p v-if="r.check_in && r.check_out" class="request-dates">{{ dateOnly(r.check_in) }} → {{ dateOnly(r.check_out) }}</p>
            <p class="request-reason">{{ r.reason }}</p>
            <p class="request-date">Recibida el {{ dateTime(r.created_at) }}</p>
          </div>
          <CButton variant="secondary" :disabled="busy" :aria-label="`Ver solicitud de ${r.client_name || 'huésped'}, reserva ${r.reservation_id}`" @click="open(r)">{{ r.status==='pending' && manager?'Revisar solicitud':'Ver detalle' }}</CButton>
        </article>
      </div>
      <CEmptyState v-if="!requests.length && !busy && !error" title="No hay solicitudes" description="Las solicitudes de este estado aparecerán aquí." icon="system-uicons:inbox" />
      <CTablePagination :pagination="pagination" :loading="busy" @change="page=$event;load()" />
    </CCard>
    <CModal :is-open="!!selected" :title="selected?.kind==='dates'?'Cambio de fechas':'Solicitud de cancelación'" size="lg" :close-on-overlay="!busy" @close="close">
      <template v-if="selected">
        <div class="request-modal-heading"><div><h3>{{ selected.client_name || 'Huésped' }}</h3><p>{{ dateTime(selected.created_at) }}</p></div><NuxtLink :to="`/reservations/${selected.reservation_id}`">Ver reserva #{{ selected.reservation_id }}</NuxtLink></div>
        <div class="request-detail">
          <p v-if="selected.check_in && selected.check_out"><strong>Fechas solicitadas</strong><br>{{ dateOnly(selected.check_in) }} → {{ dateOnly(selected.check_out) }}</p>
          <p><strong>Motivo del huésped</strong><br>{{ selected.reason }}</p>
        </div>
        <p v-if="error" role="alert" class="operation-error">{{ error }}</p>
        <form v-if="selected.status==='pending' && manager" id="request-review" class="request-review" @submit.prevent="review(selected)">
          <div class="request-form-grid">
            <label>Decisión<select v-model="decisions[selected.id]" class="operation-filter" :disabled="busy"><option value="approved">Aprobar solicitud</option><option value="rejected">Rechazar solicitud</option></select></label>
            <label v-if="selected.kind==='dates' && decisions[selected.id]==='approved'">Total acordado ({{ settings.currency }})<input v-model.number="totals[selected.id]" class="operation-filter" type="number" min="0" max="99999999.99" step="0.01" required :disabled="busy"><small>Total completo de la estancia, incluidos los pagos realizados.</small></label>
          </div>
          <label>Respuesta al huésped<textarea v-model="responses[selected.id]" class="operation-filter" rows="4" minlength="5" maxlength="1000" required :disabled="busy" placeholder="Explica la decisión y las condiciones acordadas." /></label>
          <p v-if="selected.kind==='cancel' && decisions[selected.id]==='approved'" class="request-warning">Al aprobar se cancelará la reserva. Los reembolsos se gestionan por separado desde el pago original o Pagos en línea.</p>
          <p v-else class="request-hint">Al guardar se registrará la decisión y se pondrá en cola el correo al huésped.</p>
        </form>
        <div v-else class="request-detail"><p><strong>Estado</strong><br>{{ stateLabels[selected.status] }}</p><p v-if="selected.response"><strong>Respuesta del hotel</strong><br>{{ selected.response }}</p><p v-if="selected.status==='pending'">Un administrador o gerente puede resolver esta solicitud.</p></div>
      </template>
      <template #footer><CButton variant="secondary" :disabled="busy" @click="close">Cerrar</CButton><CButton v-if="selected?.status==='pending' && manager" form="request-review" type="submit" :loading="busy">Guardar decisión y notificar</CButton></template>
    </CModal>
  </div>
</template>
<script setup lang="ts">
import type {ReservationRequest} from '~/types/guestServices'
definePageMeta({middleware:'auth'})
const {list,post,run,error,busy}=useOperations()
const {dateTime,settings}=useHotelSettings()
const auth=useAuthStore()
const manager=computed(()=>auth.isAdmin||auth.isManager)
const status=ref('pending'),page=ref(1),requests=ref<ReservationRequest[]>([])
const pagination=ref({page:1,pageSize:20,total:0,totalPages:0})
const selected=ref<ReservationRequest|null>(null),notice=ref('')
const responses=reactive<Record<number,string>>({}),decisions=reactive<Record<number,string>>({}),totals=reactive<Record<number,number>>({})
const stateLabels={pending:'Pendiente',approved:'Aprobada',rejected:'Rechazada'}
const dateOnly=(value:string)=>value.slice(0,10).split('-').reverse().join('/')
const open=(request:ReservationRequest)=>{error.value='';notice.value='';selected.value=request}
const close=()=>{if(!busy.value){selected.value=null;error.value=''}}
const fetchRequests=async()=>{const result=await list<ReservationRequest>('reservation-requests',{status:status.value,page:page.value,pageSize:20});requests.value=result.data||[];pagination.value=result.pagination;if(page.value>1&&!requests.value.length&&result.pagination.total>0){page.value=Math.max(1,result.pagination.totalPages);await fetchRequests();return};for(const r of requests.value){decisions[r.id]??='approved';totals[r.id]??=Number(r.total_price)}}
const load=()=>run(fetchRequests)
const review=(r:ReservationRequest)=>run(async()=>{
 await post(`reservation-requests/${r.id}/review`,{decision:decisions[r.id],response:responses[r.id],...(r.kind==='dates'&&decisions[r.id]==='approved'?{total_price:totals[r.id]}:{})})
 selected.value=null
 notice.value='Decisión guardada. La notificación al huésped se puso en cola.'
 await fetchRequests()
})
onMounted(load)
</script>
<style scoped>
.request-toolbar,.request-filters,.request-row,.request-title,.request-modal-heading{display:flex;align-items:center;gap:16px}
.request-toolbar,.request-modal-heading{justify-content:space-between;flex-wrap:wrap}
.request-toolbar{padding-bottom:20px}.request-toolbar h2{font-size:15px;margin:0 0 6px}
.request-toolbar p,.request-modal-heading p,.request-date,.request-hint{font-size:12px;color:var(--text-secondary)}
.request-filters{align-items:flex-end}.request-filters label,.request-review label{display:flex;flex-direction:column;gap:8px;font-size:12px}
.request-list{border-top:1px solid var(--border-color)}.request-row{padding:22px 0;border-bottom:1px solid var(--border-color)}
.request-icon{display:grid;place-items:center;width:40px;height:40px;flex-shrink:0;border-radius:10px;background:var(--surface-subtle);font-size:22px;color:var(--accent)}
.request-copy{flex:1;min-width:0}.request-title{gap:10px;flex-wrap:wrap}.request-title h3,.request-modal-heading h3{font-size:14px;margin:0}
.request-badge{border-radius:5px;padding:3px 8px;font-size:10px;background:var(--accent-soft);color:var(--accent)}
.request-badge[data-status=approved]{background:var(--success-soft);color:var(--success)}.request-badge[data-status=rejected]{background:var(--danger-soft);color:var(--danger)}
.request-kind,.request-dates,.request-reason{font-size:12px;margin-top:6px}.request-reason{overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;color:var(--text-secondary)}
.request-date{margin-top:8px}.request-modal-heading a{font-size:12px;color:var(--accent);text-decoration:underline}
.request-detail{padding:16px;margin:20px 0;border:1px solid var(--border-color);border-radius:8px;background:var(--surface-subtle);font-size:12px;white-space:pre-wrap;overflow-wrap:anywhere}
.request-detail p+p{margin-top:14px}.request-review{display:flex;flex-direction:column;gap:20px}.request-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.request-review textarea,.request-review input,.request-review select{width:100%}.request-review small{color:var(--text-secondary);font-size:11px}
.request-warning{padding:12px;border-radius:7px;background:var(--warning-soft);color:var(--text-primary);font-size:12px}
.request-notice{color:var(--success);font-size:13px}.request-loading{padding:24px;color:var(--text-secondary)}
@media(max-width:640px){.request-row{flex-wrap:wrap;align-items:flex-start}.request-row>.btn{margin-left:56px}.request-form-grid{grid-template-columns:1fr}.request-toolbar{align-items:flex-start}.request-filters{flex-wrap:wrap}}
</style>