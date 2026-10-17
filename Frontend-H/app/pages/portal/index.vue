<template>
  <div class="space-y-6">
    <CPageHeader :title="profile ? `Hola, ${profile.name.split(' ')[0]}` : 'Mis estancias'" description="Tus reservas, pagos y comprobantes, en un solo lugar."><NuxtLink to="/portal/book" class="button-link">Reservar habitación</NuxtLink></CPageHeader>
    <p v-if="error" class="operation-error" role="alert">{{ error }} <button class="underline" @click="load">Volver a intentar</button></p>
    <section class="guest-welcome" aria-label="Tu próxima estancia">
      <div class="welcome-copy">
        <p class="guest-eyebrow">{{ nextStay?.status==='checked_in'?'YA ESTÁS EN CASA':'TU PRÓXIMA ESCAPADA' }}</p>
        <template v-if="nextStay">
          <h2>{{ nextStay.status==='checked_in'?'Disfruta cada momento.':'Tu descanso empieza aquí.' }}</h2>
          <p>{{ hotel.settings.value.hotel_name }} · {{ nextStay.room_type_name }}</p>
          <div class="welcome-dates"><div><span>Llegada</span><strong>{{ formatDateOnly(nextStay.check_in) }}</strong></div><Icon name="system-uicons:arrow-right" aria-hidden="true" /><div><span>Salida</span><strong>{{ formatDateOnly(nextStay.check_out) }}</strong></div></div>
          <NuxtLink :to="`/portal/reservations/${nextStay.id}`" class="welcome-action">Ver mi reserva <Icon name="system-uicons:arrow-right" aria-hidden="true" /></NuxtLink>
        </template>
        <template v-else><h2>Haz espacio para tu próximo viaje.</h2><p>{{ loading?'Estamos consultando tus estancias…':'Elige tus fechas y encuentra un lugar para descansar.' }}</p><NuxtLink to="/portal/book" class="welcome-action">Explorar habitaciones <Icon name="system-uicons:arrow-right" aria-hidden="true" /></NuxtLink></template>
      </div>
      <div class="welcome-visual"><img :src="coverImage || '/images/room-placeholder.svg'" alt="Presentación del hotel"><span>{{ hotel.settings.value.city || hotel.settings.value.hotel_name }}</span></div>
    </section>
    <div class="guest-essentials" aria-label="Información para tu visita">
      <div><Icon name="system-uicons:enter" aria-hidden="true" /><p><span>Tu llegada</span><strong>Desde las {{ hotel.settings.value.check_in_time.slice(0,5) }}</strong></p></div>
      <div><Icon name="system-uicons:exit-right" aria-hidden="true" /><p><span>Tu salida</span><strong>Hasta las {{ hotel.settings.value.check_out_time.slice(0,5) }}</strong></p></div>
      <a v-if="hotel.settings.value.phone" :href="`tel:${hotel.settings.value.phone.replace(/[^+0-9]/g,'')}`"><Icon name="system-uicons:speech-bubble" aria-hidden="true" /><p><span>¿Necesitas ayuda?</span><strong>Contacta con recepción</strong></p><Icon name="system-uicons:arrow-right" aria-hidden="true" /></a>
    </div>    <CCard>
      <div class="operation-heading"><div><h2>Mis reservas</h2><p class="guest-muted">{{ total }} {{ total===1?'reserva vinculada a tu cuenta':'reservas vinculadas a tu cuenta' }}</p></div><label class="guest-filter">Estado <select v-model="status" class="operation-filter" :disabled="loading" @change="page=1;loadReservations()"><option value="">Todas</option><option value="confirmed">Confirmadas</option><option value="checked_in">En estancia</option><option value="checked_out">Finalizadas</option><option value="cancelled">Canceladas</option></select></label></div>
      <p v-if="loading" role="status" class="guest-muted">Cargando tus reservas…</p>
      <div v-else-if="reservations.length" class="guest-reservations"><article v-for="r in reservations" :key="r.id" class="guest-reservation"><div><div class="stay-card-top"><span class="stay-number">Reserva #{{ r.id }}</span><span class="status-badge" :class="`status-${r.status}`">{{ states[r.status] }}</span></div><h3>{{ r.room_type_name }} · Habitación {{ r.room_number }}</h3><p class="stay-card-dates"><Icon name="system-uicons:calendar" aria-hidden="true" />{{ formatDateOnly(r.check_in) }} — {{ formatDateOnly(r.check_out) }}</p></div><div class="guest-reservation-total"><small>Total de la estancia</small><strong>{{ money(r.total_price) }}</strong><span>{{ r.status==='cancelled'?'Reserva cancelada':`Saldo pendiente: ${money(Math.max(0,Number(r.total_price)-Number(r.paid_amount)))}` }}</span><NuxtLink :to="`/portal/reservations/${r.id}`" class="stay-details">Ver detalles <Icon name="system-uicons:arrow-right" aria-hidden="true" /></NuxtLink></div></article></div>
      <CEmptyState v-else title="Sin reservas para mostrar" description="Si esperabas encontrar una estancia, contacta con recepción para revisar su vinculación." />
      <div class="operation-pager"><CButton variant="secondary" :disabled="page===1||loading" @click="page--;loadReservations()">Anterior</CButton><span>{{ page }} / {{ Math.max(1,pages) }}</span><CButton variant="secondary" :disabled="page>=pages||loading" @click="page++;loadReservations()">Siguiente</CButton></div>
    </CCard>
    <CHotelPresentation @loaded="coverImage=$event.hotel.cover_image" />
    <div class="guest-contact"><div><h2>Estamos para ayudarte</h2><p>Reserva tu próxima visita desde el portal. Solicita cambios de fechas o cancelaciones desde el detalle de tu reserva.</p></div><div><p v-if="hotel.settings.value.phone">{{ hotel.settings.value.phone }}</p><p v-if="hotel.settings.value.email">{{ hotel.settings.value.email }}</p><p>Entrada desde {{ hotel.settings.value.check_in_time.slice(0,5) }} · Salida hasta {{ hotel.settings.value.check_out_time.slice(0,5) }}</p></div></div>
  </div>
</template>
<script setup lang="ts">
import type { PortalProfile,PortalReservation } from '~/types/portal'
import { formatDateOnly } from '~/utils/dates'
definePageMeta({layout:'guest',middleware:'auth'})
const portal=useCustomerPortal(),{run,error,loading,states}=portal,hotel=useHotelSettings(),{money}=hotel
const coverImage=ref('')
const profile=ref<PortalProfile>(),reservations=ref<PortalReservation[]>([]),nextStay=ref<PortalReservation>(),status=ref(''),page=ref(1),pages=ref(1),total=ref(0)
const fetchReservations=async()=>{const r=await portal.reservations(page.value,status.value);reservations.value=r.data||[];pages.value=r.pagination.totalPages;total.value=r.pagination.total}
const loadReservations=()=>run(fetchReservations)
const load=()=>run(async()=>{await Promise.all([fetchReservations(),portal.profile().then(r=>{profile.value=r.data}),portal.nextStay().then(r=>{nextStay.value=r.data||undefined})])})
onMounted(load)
</script>
<style scoped>.guest-welcome{display:grid;grid-template-columns:1.1fr 1fr;overflow:hidden;border-radius:20px;border:1px solid var(--border-color);background:var(--bg-secondary)}
.welcome-copy{padding:38px;align-self:center}.guest-eyebrow{font-size:10px;font-weight:600;letter-spacing:2px;color:var(--accent);margin-bottom:16px}
.welcome-copy h2{font-size:34px;line-height:1.15;letter-spacing:-1.2px;max-width:350px;font-weight:500;margin:0 0 16px}
.welcome-copy>p:not(.guest-eyebrow){font-size:13px;color:var(--text-secondary);line-height:1.8}
.welcome-dates{display:flex;align-items:center;gap:14px;margin:26px 0}.welcome-dates div{display:flex;flex-direction:column;gap:6px}.welcome-dates span{font-size:11px;color:var(--text-secondary)}.welcome-dates strong{font-size:12px;font-weight:500}.welcome-dates>.iconify{color:var(--text-tertiary)}
.welcome-action{display:inline-flex;align-items:center;gap:18px;padding:12px 18px;border-radius:8px;background:var(--accent);color:var(--bg-secondary);font-size:12px;font-weight:600;margin-top:10px}
.welcome-visual{position:relative;min-height:340px}.welcome-visual img{width:100%;height:100%;position:absolute;object-fit:cover}.welcome-visual>span{position:absolute;bottom:20px;left:20px;border-radius:20px;background:#fffef2ee;color:#252a36;padding:8px 14px;font-size:11px}
.guest-essentials{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.guest-essentials>div,.guest-essentials>a{display:flex;align-items:center;gap:12px;padding:18px 20px;border:1px solid var(--border-color);border-radius:12px;background:var(--bg-secondary);color:var(--text-primary)}.guest-essentials .iconify{font-size:22px;color:var(--accent);flex-shrink:0}.guest-essentials p{display:flex;flex-direction:column;gap:4px}.guest-essentials span{font-size:11px;color:var(--text-secondary)}.guest-essentials strong{font-size:12px;font-weight:500}
.guest-muted{font-size:12px;color:var(--text-secondary);margin-top:5px}.guest-filter{display:flex;align-items:center;gap:10px;font-size:12px}
.guest-reservations{display:grid;gap:14px}.guest-reservation{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:24px;border:1px solid var(--border-color);border-radius:12px;background:var(--bg-secondary)}
.stay-card-top{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.stay-number{font-size:11px;color:var(--text-secondary)}.guest-reservation h3{font-size:16px;font-weight:500;margin:14px 0 10px}.stay-card-dates{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text-secondary);flex-wrap:wrap}
.guest-reservation-total{display:flex;flex-direction:column;gap:8px;text-align:right;min-width:180px}.guest-reservation-total small{font-size:10px;color:var(--text-secondary)}.guest-reservation-total strong{font-size:22px;font-weight:500}.guest-reservation-total span{font-size:11px;color:var(--text-secondary)}.stay-details{display:inline-flex;align-items:center;justify-content:center;gap:12px;border:1px solid var(--border-color);border-radius:7px;padding:9px 14px;font-size:12px;color:var(--accent);margin-top:5px}
.guest-contact{display:flex;justify-content:space-between;gap:24px;padding:26px;border:1px solid var(--border-color);border-radius:14px;background:var(--bg-secondary);font-size:12px;color:var(--text-secondary);line-height:1.9}.guest-contact h2{font-size:17px;color:var(--text-primary);margin-bottom:8px}.guest-contact>div:first-child{max-width:500px}
@media(max-width:760px){.welcome-copy{padding:26px}.welcome-copy h2{font-size:28px}.welcome-dates{align-items:flex-start;flex-direction:column;gap:10px}.welcome-dates>.iconify{display:none}.guest-essentials{gap:8px}.guest-essentials>div,.guest-essentials>a{padding:14px;gap:8px}}
@media(max-width:600px){.guest-welcome{grid-template-columns:1fr}.welcome-visual{min-height:190px;grid-row:1}.welcome-copy{padding:26px}.welcome-dates{flex-direction:row;gap:20px;flex-wrap:wrap}.guest-essentials{grid-template-columns:1fr}.guest-essentials>div,.guest-essentials>a{padding:14px 18px}.guest-reservation{align-items:stretch;flex-direction:column;gap:18px;padding:20px}.guest-reservation-total{text-align:left;min-width:0;border-top:1px solid var(--border-color);padding-top:16px}.guest-contact{flex-direction:column;gap:14px}.guest-filter{flex-wrap:wrap}}</style>
