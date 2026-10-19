<template>
  <div class="space-y-6">
    <CPageHeader :title="reservation?`Reserva #${reservation.id}`:'Detalle de mi estancia'" back-to="/portal" description="Información de tu reserva y movimientos de pago." />
    <p v-if="error" role="alert" class="operation-error">{{ error }} <button class="underline" @click="load">Volver a intentar</button></p>
    <p v-if="loading" role="status">Cargando tu estancia…</p>
    <template v-else-if="reservation">
      <CCard><div class="operation-heading"><h2>{{ reservation.room_type_name }} · Habitación {{ reservation.room_number }}</h2><span class="status-badge" :class="`status-${reservation.status}`">{{ states[reservation.status] }}</span></div><div class="stay-facts"><div><span>Llegada</span><strong>{{ formatDateOnly(reservation.check_in) }}</strong><small>Desde {{ hotel.settings.value.check_in_time.slice(0,5) }}</small></div><div><span>Salida</span><strong>{{ formatDateOnly(reservation.check_out) }}</strong><small>Hasta {{ hotel.settings.value.check_out_time.slice(0,5) }}</small></div><div><span>Huéspedes</span><strong>{{ reservation.adults }} {{ reservation.adults===1?'adulto':'adultos' }} · {{ reservation.children }} {{ reservation.children===1?'niño':'niños' }}</strong><small v-if="reservation.arrival_time">Llegada estimada: {{ reservation.arrival_time }}</small></div><div v-if="reservation.special_requests"><span>Solicitudes especiales</span><strong>{{ reservation.special_requests }}</strong></div><div><span>Total de la reserva</span><strong>{{ money(reservation.total_price) }}</strong></div><div><span>Pagado</span><strong>{{ money(reservation.paid_amount) }}</strong><small v-if="reservation.status!=='cancelled'">Saldo pendiente: {{ money(Math.max(0,Number(reservation.total_price)-Number(reservation.paid_amount))) }}</small></div></div></CCard>
      <CCard><h2 class="mb-4">Pagos y comprobantes</h2><CTableHint /><div v-if="reservation.payments.length" class="operation-scroll" tabindex="0" role="region" aria-label="Pagos y comprobantes"><table class="operation-table table-with-actions"><thead><tr><th scope="col">Pago</th><th scope="col">Fecha</th><th scope="col">Medio</th><th scope="col" class="text-right">Importe</th><th scope="col">Estado</th><th scope="col">Comprobante</th></tr></thead><tbody><tr v-for="p in reservation.payments" :key="p.id"><td>#{{ p.id }}</td><td>{{ dateTime(p.created_at) }}</td><td>{{ methods[p.method] }}</td><td class="text-right">{{ money(p.amount) }}</td><td>{{ states[p.status] }}</td><td><NuxtLink v-if="p.has_receipt" :to="`/portal/receipts/${p.id}`">Ver comprobante</NuxtLink><span v-else>Sin emitir</span></td></tr></tbody></table></div><CEmptyState v-else title="Aún no hay pagos registrados" description="Los pagos que registre el hotel aparecerán aquí." /><p class="stay-note">Los pagos pendientes no descuentan tu saldo. Puedes gestionar solicitudes y pagos desde las opciones de esta página.</p></CCard>
      <CStayManagement :id="reservation.id" :status="reservation.status" :can-request="reservation.can_request" :balance="Math.max(0,Number(reservation.total_price)-Number(reservation.paid_amount))" />
    </template>
  </div>
</template>
<script setup lang="ts">
import type { PortalReservationDetail } from '~/types/portal'
import { formatDateOnly } from '~/utils/dates'
definePageMeta({layout:'guest',middleware:'auth'})
const route=useRoute(),portal=useCustomerPortal(),{run,error,loading,states,methods}=portal,hotel=useHotelSettings(),{money,dateTime}=hotel
const reservation=ref<PortalReservationDetail>()
const load=()=>run(async()=>{reservation.value=undefined;reservation.value=(await portal.reservation(String(route.params.id))).data})
onMounted(load)
</script>
<style scoped>.stay-facts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:30px}.stay-facts div{display:flex;flex-direction:column;gap:8px}.stay-facts span,.stay-facts small{font-size:12px;color:var(--text-secondary)}.stay-facts strong{overflow-wrap:anywhere;font-weight:500;font-size:16px}.stay-note{font-size:12px;color:var(--text-secondary);margin-top:24px;line-height:1.8}@media(max-width:540px){.stay-facts{gap:22px 16px}.stay-facts strong{font-size:14px}}@media(max-width:360px){.stay-facts{grid-template-columns:1fr}}.stay-facts{grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.stay-facts>div{padding:20px;border:1px solid var(--border-color);border-radius:10px;background:var(--surface-subtle)}
.stay-facts strong{font-size:18px}.stay-facts>div:nth-child(1),.stay-facts>div:nth-child(2){border-top:3px solid var(--accent)}.stay-facts small{line-height:1.6}
@media(max-width:760px){.stay-facts{grid-template-columns:repeat(2,minmax(0,1fr))}.stay-facts>div{padding:16px}.stay-facts strong{font-size:15px}}
@media(max-width:420px){.stay-facts{grid-template-columns:1fr}}</style>
