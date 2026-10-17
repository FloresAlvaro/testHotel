<template>
  <CCard class="management-card">
    <div><h2>Gestionar mi reserva</h2><p class="stay-help">Puedes solicitar un cambio o una cancelación hasta {{ presentation?.hotel.request_notice_hours ?? 24 }} horas antes de la llegada. El hotel debe aprobarlo; mientras tanto, tu reserva sigue vigente.</p></div>
    <p v-if="message" role="status">{{ message }}</p><p v-if="error" class="operation-error" role="alert">{{ error }}</p>
    <form v-if="status==='confirmed' && canRequest && !requests.some(r=>r.status==='pending')" class="space-y-4" @submit.prevent="submit">
      <div class="operation-form"><label>Solicitud <select v-model="kind" :disabled="busy"><option value="dates">Cambiar fechas</option><option value="cancel">Cancelar reserva</option></select></label><template v-if="kind==='dates'"><label>Nueva llegada <input v-model="arrival" type="date" required :disabled="busy"></label><label>Nueva salida <input v-model="departure" type="date" required :min="arrival" :disabled="busy"></label></template></div>
      <label class="request-reason">Cuéntanos el motivo <textarea v-model="reason" required minlength="5" maxlength="1000" rows="3" :disabled="busy" /></label>
      <p class="stay-help">Los cambios pueden modificar la tarifa. La respuesta del hotel indicará las nuevas condiciones. Una cancelación aprobada no reembolsa automáticamente los pagos; el hotel debe gestionar el reembolso.</p>
      <CButton type="submit" :loading="busy">Enviar solicitud</CButton>
    </form>
    <article v-for="r in requests" :key="r.id" class="request-item"><strong>{{ r.kind==='cancel'?'Cancelación':'Cambio de fechas' }} · {{ labels[r.status] }}</strong><p v-if="r.check_in">{{ r.check_in }} → {{ r.check_out }}</p><p>{{ r.reason }}</p><p v-if="r.response">Respuesta del hotel: {{ r.response }}</p></article>
    <p v-if="(status!=='confirmed' || !canRequest) && !requests.length" class="stay-help">Esta reserva ya no admite solicitudes desde el portal. Contacta con recepción para revisar las opciones.</p>
  </CCard>
  <CCard v-if="['confirmed','checked_in'].includes(status) && balance>0" class="management-card">
    <h2>Pagar mi reserva</h2><p class="stay-help">Anticipo: {{ presentation?.hotel.deposit_percent ?? 30 }} % del total. Los enlaces vencen en {{ presentation?.hotel.payment_due_hours ?? 24 }} horas. El vencimiento del enlace no cancela la reserva. Los reembolsos se solicitan al hotel y se procesan por el mismo medio de pago.</p>
    <p v-if="presentation?.payments?.demo" role="note" class="demo-notice">Modo demostración: los pagos son simulados y no mueven dinero.</p>
    <div v-if="presentation?.payments?.enabled" class="flex flex-wrap gap-3"><CButton :loading="busy" @click="checkout('deposit')">Pagar anticipo</CButton><CButton variant="secondary" :loading="busy" @click="checkout('balance')">Pagar saldo</CButton></div>
    <p v-else class="stay-help">El hotel aún no habilitó su pasarela. Puedes coordinar el pago con recepción.</p>
  </CCard>
</template>
<script setup lang="ts">
import {useApiClient} from '~/services/api'
import type {ApiResponse} from '~/types'
import type {ReservationRequest,Presentation,OnlinePayment} from '~/types/guestServices'
const props=defineProps<{id:number;status:string;balance:number;canRequest:boolean}>()
const api=useApiClient(),busy=ref(false),error=ref(''),message=ref(''),requests=ref<ReservationRequest[]>([]),presentation=ref<Presentation>(),kind=ref<'dates'|'cancel'>('dates'),arrival=ref(''),departure=ref(''),reason=ref('')
const labels={pending:'En revisión',approved:'Aprobada',rejected:'Rechazada'}
const run=async(fn:()=>Promise<void>)=>{busy.value=true;error.value='';try{await fn()}catch(e){error.value=(e as {data?:{message?:string}}).data?.message||'No se pudo completar la operación. Intenta nuevamente.'}finally{busy.value=false}}
const load=async()=>{requests.value=(await api.request<ApiResponse<ReservationRequest[]>>(`/portal/reservations/${props.id}/requests`)).data||[]}
const submit=()=>run(async()=>{await api.request(`/portal/reservations/${props.id}/requests`,{method:'POST',body:{kind:kind.value,reason:reason.value,...(kind.value==='dates'?{check_in:arrival.value,check_out:departure.value}:{})},retry:0});message.value='Solicitud enviada. Te avisaremos por correo cuando el hotel responda.';reason.value='';await load()})
const checkout=(mode:string)=>run(async()=>{const p=(await api.request<ApiResponse<OnlinePayment>>(`/portal/reservations/${props.id}/checkout`,{method:'POST',body:{mode},retry:0})).data;if(p?.checkout_url)await navigateTo(p.checkout_url,{external:p.provider==='stripe'})})
onMounted(()=>run(async()=>{await Promise.all([load(),api.request<ApiResponse<Presentation>>('/portal/presentation').then(r=>{presentation.value=r.data})])}))
</script>
<style scoped>
.management-card :deep(input),.management-card :deep(select){min-height:44px;max-width:100%}
.management-card :deep(.card-body){display:flex;flex-direction:column;gap:20px}

.stay-help{font-size:13px;line-height:1.8;color:var(--text-secondary);margin-top:8px}.request-reason{display:flex;flex-direction:column;gap:8px;font-size:12px}.request-reason textarea{border:1px solid var(--border-color);border-radius:8px;padding:12px;background:var(--bg-secondary);color:var(--text-primary);resize:vertical}.request-item{padding-top:18px;border-top:1px solid var(--border-color);font-size:13px;line-height:1.8}.request-item strong{font-weight:500}.demo-notice{padding:12px 16px;background:var(--accent-soft);border-radius:8px;font-size:13px}
</style>
