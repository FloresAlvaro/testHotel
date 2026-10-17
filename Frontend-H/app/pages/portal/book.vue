<template>
  <div class="space-y-6">
    <CPageHeader title="Nueva reserva" description="Elige tus fechas, encuentra una habitación y confirma tu próxima estancia." back-to="/portal" />
    <p v-if="error" class="operation-error" role="alert">{{ error }}</p>
    <p v-if="!ready" role="status">Preparando tu reserva… <button v-if="error" class="underline" @click="initialize">Reintentar</button></p>
    <CCard>
      <h2 class="booking-dates-title">1. Fechas y huéspedes</h2>
      <form class="operation-form booking-date-form" @submit.prevent="search(1)">
        <label>Llegada <input v-model="arrival" type="date" :min="today" required :disabled="!ready||loading||saving"></label>
        <label>Salida <input v-model="departure" type="date" :min="nextDay(arrival||today)" required :disabled="!ready||loading||saving"></label>
        <label>Adultos <input v-model.number="adults" type="number" min="1" max="20" required :disabled="!ready||loading||saving"></label>
        <label>Niños <input v-model.number="children" type="number" min="0" :max="Math.min(19,20-adults)" required :disabled="!ready||loading||saving"></label>
        <CButton class="booking-search-button" type="submit" :loading="loading" :disabled="!ready||saving">Consultar disponibilidad</CButton>
      </form>
      <p class="booking-note booking-date-help"><span>Entrada desde {{ hotel.settings.value.check_in_time.slice(0,5) }}</span><span>Salida hasta {{ hotel.settings.value.check_out_time.slice(0,5) }}</span><span>Estancias de 1 a 365 noches.</span><span>Los niños cuentan para la capacidad de la habitación.</span></p>
    </CCard>
    <CCard v-if="quote && !loading">
      <div class="operation-heading"><div><h2>2. Elige tu habitación</h2><p class="booking-note">{{ quote.nights }} {{ quote.nights===1?'noche':'noches' }} · {{ quote.total }} habitaciones disponibles</p></div><span>{{ quote.currency }}</span></div>
      <fieldset v-if="quote.rooms.length" :disabled="saving"><legend class="sr-only">Habitaciones disponibles</legend><div class="booking-rooms"><label v-for="room in quote.rooms" :key="room.id" class="booking-room" :class="{'is-selected':selectedId===room.id}"><img class="booking-room-image" :src="room.image_url || '/images/room-placeholder.svg'" :alt="room.image_url ? room.room_type_name : 'Ilustración de habitación de ejemplo'" loading="lazy"><small v-if="room.image_url==='/images/demo-bedroom.webp'">Imagen generada de ejemplo</small><div class="booking-room-heading"><h3>{{ room.room_type_name }} · {{ room.number }}</h3><input v-model="selectedId" type="radio" name="room" :value="room.id" :aria-label="`Seleccionar habitación ${room.number}`"></div><p v-if="room.description">{{ room.description }}</p><p>Hasta {{ room.capacity }} {{ room.capacity===1?'persona':'personas' }}</p><p>{{ money(room.price,quote.currency) }} por noche</p><strong>{{ money(room.total_price,quote.currency) }}</strong><small>Total por {{ quote.nights }} noches</small></label></div></fieldset>
      <CEmptyState v-else title="No hay habitaciones disponibles" description="Prueba otras fechas para encontrar una estancia." />
      <div class="operation-pager"><CButton variant="secondary" :disabled="page===1||saving" @click="search(page-1)">Anterior</CButton><span>{{ page }} / {{ Math.max(1,Math.ceil(quote.total/12)) }}</span><CButton variant="secondary" :disabled="page*12>=quote.total||saving" @click="search(page+1)">Siguiente</CButton></div>
    </CCard>
    <CCard v-if="selected && quote && !loading">
      <h2 class="mb-4">3. Confirma tu reserva</h2><dl class="booking-summary"><div><dt>Huésped</dt><dd>{{ auth.user?.name }}</dd></div><div><dt>Huéspedes</dt><dd>{{ adults }} {{ adults===1?'adulto':'adultos' }} · {{ children }} {{ children===1?'niño':'niños' }}</dd></div><div><dt>Correo de contacto</dt><dd>{{ auth.user?.email }}</dd></div><div><dt>Habitación</dt><dd>{{ selected.room_type_name }} · {{ selected.number }}</dd></div><div><dt>Llegada</dt><dd>{{ formatDateOnly(arrival) }}</dd></div><div><dt>Salida</dt><dd>{{ formatDateOnly(departure) }}</dd></div><div><dt>Total de la estancia</dt><dd><strong>{{ money(selected.total_price,quote.currency) }}</strong></dd></div></dl>
      <div class="booking-extras operation-form"><label>Hora estimada de llegada (opcional)<input v-model="arrivalTime" type="time" :disabled="saving"></label><label class="booking-special">Solicitudes especiales (opcional)<textarea v-model="specialRequests" rows="3" maxlength="1000" placeholder="Por ejemplo, preferencia de cuna o accesibilidad." :disabled="saving" /></label></div>
      <p class="booking-note">La tarifa es por habitación. Las solicitudes especiales están sujetas a disponibilidad y no garantizan servicios adicionales.</p>
      <p class="booking-note">La reserva quedará confirmada a tu nombre. Después podrás pagar el anticipo o el saldo desde el detalle de tu reserva, si el hotel tiene habilitada su pasarela.</p>
      <div class="booking-actions"><CButton :loading="saving" @click="confirm">Confirmar reserva</CButton><NuxtLink to="/portal">Ver mis reservas</NuxtLink></div>
    </CCard>
  </div>
</template>
<script setup lang="ts">
import type { GuestAvailability } from '~/types/portal'
import { formatDateOnly,getTodayDateOnly } from '~/utils/dates'
definePageMeta({layout:'guest',middleware:'auth'})
const portal=useCustomerPortal(),hotel=useHotelSettings(),{money}=hotel,auth=useAuthStore(),ui=useUiStore()
const arrival=ref(''),departure=ref(''),today=ref(''),ready=ref(false),loading=ref(false),saving=ref(false),error=ref(''),page=ref(1),selectedId=ref<number>(),quote=ref<GuestAvailability>()
const adults=ref(2),children=ref(0),arrivalTime=ref(''),specialRequests=ref('')
const selected=computed(()=>quote.value?.rooms.find(room=>room.id===selectedId.value))
const nextDay=(date:string)=>{if(!date)return '';const d=new Date(`${date}T12:00:00Z`);if(!Number.isFinite(d.getTime()))return '';d.setUTCDate(d.getUTCDate()+1);return d.toISOString().slice(0,10)}
const failureMessage=(e:unknown)=>{const failure=e as {data?:{message?:string}};return failure.data?.message||'No pudimos completar la operación. Intenta nuevamente.'}
const initialize=async()=>{try{await hotel.load();today.value=getTodayDateOnly(hotel.settings.value.timezone);arrival.value=today.value;departure.value=nextDay(today.value);ready.value=true;error.value=''}catch(e){error.value=failureMessage(e)}}
// Una consulta anterior nunca puede sustituir resultados de otras fechas.
let searchVersion=0
watch([arrival,departure,adults,children],()=>{searchVersion++;quote.value=undefined;selectedId.value=undefined})
const search=async(requestedPage:number)=>{
  if(loading.value||saving.value)return
  const version=++searchVersion
  error.value='';quote.value=undefined;selectedId.value=undefined;loading.value=true
  try{const response=await portal.availability(arrival.value,departure.value,requestedPage,adults.value,children.value);if(version===searchVersion){quote.value=response.data;page.value=requestedPage}}
  catch(e){if(version===searchVersion)error.value=failureMessage(e)}finally{loading.value=false}
}
const confirm=async()=>{
  if(!selected.value||!quote.value||saving.value)return
  saving.value=true;error.value=''
  try{
    const result=await portal.book({check_in:arrival.value,check_out:departure.value,adults:adults.value,children:children.value,arrival_time:arrivalTime.value,special_requests:specialRequests.value,room_id:selected.value.id,expected_total:Number(selected.value.total_price),expected_currency:quote.value.currency})
    if(!result.data)throw new Error('Reserva no disponible')
    ui.success(`Reserva #${result.data.id} confirmada`)
    await navigateTo(`/portal/reservations/${result.data.id}`)
  }catch(e){error.value=failureMessage(e);quote.value=undefined;selectedId.value=undefined}finally{saving.value=false}
}
onMounted(initialize)
</script>
<style scoped>
.booking-extras{margin-top:24px;align-items:start;gap:20px}
.booking-extras label{flex:1;min-width:180px}
.booking-special{flex:2!important}
.booking-special textarea{border:1px solid var(--border-color);border-radius:8px;background:var(--bg-secondary);color:var(--text-primary);padding:12px;width:100%;resize:vertical}
@media(max-width:520px){.booking-extras{flex-direction:column}.booking-extras label{width:100%;min-width:0}.booking-actions .btn{width:100%}}

.booking-room-image{width:100%;aspect-ratio:16/10;object-fit:cover;border-radius:7px}

.booking-dates-title{text-align:center;margin-bottom:24px}
.booking-date-form{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,1.4fr) minmax(0,.7fr) minmax(0,.7fr);align-items:end;gap:16px;max-width:900px;margin-inline:auto}
.booking-date-form label{min-width:0}
.booking-date-form input{width:100%;min-width:0;height:44px;box-sizing:border-box}
.booking-search-button{min-height:44px;grid-column:1/-1;justify-self:center;width:min(100%,300px);margin-top:8px}
.booking-date-help{display:flex;flex-wrap:wrap;justify-content:center;gap:4px 20px;text-align:center}
@media(max-width:760px){.booking-date-form{grid-template-columns:repeat(2,minmax(0,1fr));max-width:480px}.booking-search-button{grid-column:1/-1;width:100%}}
@media(max-width:360px){.booking-date-form{grid-template-columns:minmax(0,1fr)}}

.booking-note{font-size:12px;color:var(--text-secondary);line-height:1.8;margin-top:18px}.booking-rooms{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.booking-room{padding:20px;border:1px solid var(--border-color);border-radius:10px;cursor:pointer;display:flex;flex-direction:column;gap:12px}.booking-room.is-selected{border-color:#535ed6;box-shadow:0 0 0 1px #535ed6;background:var(--accent-soft)}.booking-room-heading{display:flex;justify-content:space-between;align-items:center;gap:12px}.booking-room h3{font-size:14px;font-weight:500}.booking-room p,.booking-room small{font-size:12px;color:var(--text-secondary)}.booking-room strong{font-size:22px;font-weight:500;margin-top:auto}.booking-room input{accent-color:#535ed6;width:18px;height:18px;flex-shrink:0}.booking-summary{display:grid;grid-template-columns:1fr 1fr;gap:20px}.booking-summary dt{font-size:12px;color:var(--text-secondary);margin-bottom:6px}.booking-summary dd{font-size:14px;overflow-wrap:anywhere}.booking-actions{display:flex;align-items:center;gap:20px;margin-top:24px;font-size:12px}.booking-actions a{color:#535ed6}@media(max-width:760px){.booking-rooms{grid-template-columns:1fr 1fr}}@media(max-width:520px){.booking-rooms,.booking-summary{grid-template-columns:1fr}.booking-actions{align-items:flex-start;flex-direction:column}}
</style>
