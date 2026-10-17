<template>
  <section class="dashboard-page">
    <CPageHeader title="Vista general" :description="`Hola, ${user?.name?.split(' ')[0] || 'bienvenido'}. Esto es lo que sucede en tu hotel.`">
      <span class="dashboard-date"><Icon name="system-uicons:calendar" />{{ currentDate }}</span>
      <CButton @click="navigateTo('/reservations')"><Icon name="system-uicons:calendar" />Ver reservas</CButton>
    </CPageHeader>
    <p v-if="hasLoadError" class="dashboard-error" role="alert">Algunos datos no se pudieron cargar. <button @click="loadDashboard">Volver a intentar</button></p>
    <div v-if="isLoading" class="dashboard-loading" role="status">Cargando el resumen del hotel…</div>
    <template v-else>
      <div class="stat-grid">
        <CStatCard label="Llegadas pendientes" :value="todayCheckIns.length" :detail="`${pendingCheckOuts.length} salidas por registrar`" icon="system-uicons:enter" />
        <CStatCard label="Habitaciones disponibles" :value="availableRooms.length" :detail="`De ${totalRooms} habitaciones en total`" icon="system-uicons:home" />
        <CStatCard label="Ocupación actual" :value="`${occupancyRate}%`" :detail="`${occupiedRooms.length} habitaciones ocupadas`" icon="system-uicons:pie-half" />
        <CStatCard label="Ingresos de hoy" :value="hotelMoney(todayRevenue)" :detail="`${completedPayments} pagos completados hoy`" icon="system-uicons:coin" />
      </div>
      <div class="dashboard-columns">
        <div class="dashboard-primary">
          <CCard title="Llegadas por recibir">
            <template #header-action><NuxtLink to="/checkin" class="section-link">Ver entradas <Icon name="system-uicons:arrow-right" /></NuxtLink></template>
            <div v-if="todayCheckIns.length" class="arrival-list">
              <NuxtLink v-for="arrival in todayCheckIns.slice(0, 5)" :key="arrival.id" :to="`/reservations/${arrival.id}`" class="arrival-row">
                <span class="guest-avatar">{{ (arrival.client_name || 'H').slice(0, 1) }}</span><span class="arrival-copy"><strong>{{ arrival.client_name || 'Huésped' }}</strong><span>Habitación {{ arrival.room_number }} · {{ formatDate(arrival.check_in) }}</span></span><span class="status-badge status-confirmed">Confirmada</span><Icon name="system-uicons:chevron-right" class="row-arrow" />
              </NuxtLink>
            </div>
            <CEmptyState v-else title="Todo al día" description="No hay llegadas pendientes por recibir." icon="system-uicons:check-circle" />
          </CCard>
          <CCard title="Próximas reservas">
            <template #header-action><NuxtLink to="/reservations" class="section-link">Ver todas <Icon name="system-uicons:arrow-right" /></NuxtLink></template>
            <div v-if="upcomingReservations.length" class="upcoming-list">
              <NuxtLink v-for="reservation in upcomingReservations.slice(0, 5)" :key="reservation.id" :to="`/reservations/${reservation.id}`" class="upcoming-row"><span class="reservation-date"><Icon name="system-uicons:calendar" /></span><span class="arrival-copy"><strong>{{ reservation.client_name || 'Huésped' }}</strong><span>{{ formatDate(reservation.check_in) }} — {{ formatDate(reservation.check_out) }}</span></span><span class="room-reference">Hab. {{ reservation.room_number }}</span></NuxtLink>
            </div>
            <CEmptyState v-else title="Sin próximas reservas" description="Las reservas de los próximos días aparecerán aquí." icon="system-uicons:calendar" />
          </CCard>
        </div>
        <div class="dashboard-secondary">
          <CCard title="Estado del hotel">
            <div class="occupancy-total"><strong>{{ totalRooms }}</strong><span>habitaciones</span></div>
            <div v-if="totalRooms" class="occupancy-bar" role="img" :aria-label="`${occupiedRooms.length} ocupadas, ${availableRooms.length} disponibles de ${totalRooms} habitaciones`"><span v-for="state in roomStates" :key="state.label" :style="{ width: `${state.count / totalRooms * 100}%`, background: state.color }" /></div>
            <div class="occupancy-legend"><div v-for="state in roomStates" :key="state.label"><span class="legend-dot" :style="{ background: state.color }" /><span>{{ state.label }}</span><strong>{{ state.count }}</strong></div></div>
          </CCard>
          <CCard title="Accesos rápidos"><div class="quick-actions"><NuxtLink v-for="action in quickActions" :key="action.to" :to="action.to"><span class="quick-action-icon"><Icon :name="action.icon" /></span><span><strong>{{ action.label }}</strong><small>{{ action.detail }}</small></span><Icon name="system-uicons:chevron-right" /></NuxtLink></div></CCard>
        </div>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useRoomsStore } from '~/stores/rooms'
import { useReservationsStore } from '~/stores/reservations'
import { usePaymentsStore } from '~/stores/payments'
import { useCheckIn } from '~/composables/useCheckIn'
import { useReservations } from '~/composables/useReservations'
import { usePayments } from '~/composables/usePayments'
import { formatDate } from '~/utils/formatters'
import { getTodayDateOnly, reservationDateOnly, localDateOnly } from '~/utils/dates'

const { money: hotelMoney } = useHotelSettings()

const { settings: operatingSettings } = useHotelSettings();

definePageMeta({
  middleware: 'auth'
})

const authStore = useAuthStore()
const roomsStore = useRoomsStore()
const reservationsStore = useReservationsStore()
const paymentsStore = usePaymentsStore()
const { pendingCheckOuts, getPendingCheckOuts } = useCheckIn()
const { fetchUpcoming } = useReservations()
const { fetchPayments } = usePayments()

const user = computed(() => authStore.user)
const currentDate = ref('')
const currentTime = ref('')
const isLoading = ref(true)
const hasLoadError = ref(false)
const quickActions = [
  { to: '/checkin/pending', label: 'Registrar salidas', detail: 'Revisar check-outs pendientes', icon: 'system-uicons:exit-right' },
  { to: '/clients/create', label: 'Nuevo huésped', detail: 'Registrar datos del cliente', icon: 'system-uicons:user-add' },
  { to: '/payments', label: 'Revisar pagos', detail: 'Cobros y saldos pendientes', icon: 'system-uicons:coin' }
]
const roomStates = computed(() => [
  { label: 'Ocupadas', count: occupiedRooms.value.length, color: '#6975dd' },
  { label: 'Disponibles', count: availableRooms.value.length, color: '#8abbac' },
  { label: 'Reservadas', count: roomsStore.rooms.filter(r => r.status === 'reserved').length, color: '#c3c7ee' },
  { label: 'Mantenimiento', count: roomsStore.rooms.filter(r => r.status === 'maintenance').length, color: '#e1cda7' }
])

const availableRooms = computed(() =>
  roomsStore.rooms.filter(r => r.status === 'available')
)
const occupiedRooms = computed(() =>
  roomsStore.rooms.filter(r => r.status === 'occupied')
)
const totalRooms = computed(() => roomsStore.rooms.length)

const occupancyRate = computed(() => {
  if (totalRooms.value === 0) return 0
  return Math.round(
    (occupiedRooms.value.length / totalRooms.value) * 100
  )
})

const upcomingReservations = computed(() =>
  reservationsStore.upcomingReservations
)

const todayCheckIns = computed(() => {
  const today = getTodayDateOnly(operatingSettings.value.timezone)
  return reservationsStore.reservations.filter(
    reservation => reservation.status === 'confirmed' && reservationDateOnly(reservation.check_in) <= today
  )
})

const todayRevenue = computed(() => {
  const today = getTodayDateOnly(operatingSettings.value.timezone)
  return paymentsStore.payments
    .filter(payment => payment.status === 'completed' && localDateOnly(payment.created_at, operatingSettings.value.timezone) === today)
    .reduce((sum, payment) => sum + Number(payment.amount), 0)
    .toFixed(2)
})

const completedPayments = computed(() =>
  paymentsStore.payments.filter(payment => payment.status === 'completed' && localDateOnly(payment.created_at, operatingSettings.value.timezone) === getTodayDateOnly(operatingSettings.value.timezone)).length
)
let dateTimer: ReturnType<typeof setInterval> | undefined

const loadDashboard = async () => {
  isLoading.value = true
  hasLoadError.value = false
  const loadTasks = await Promise.allSettled([
    roomsStore.fetchRooms(1, 100),
    reservationsStore.fetchReservations(1, 100),
    fetchUpcoming(),
    fetchPayments(1, 100),
    getPendingCheckOuts()
  ])
  hasLoadError.value = loadTasks.some(task => task.status === 'rejected')
  isLoading.value = false
}

onMounted(() => {
  loadDashboard()

  // Actualizar hora y fecha en tiempo real
  const updateDateTime = () => {
    const now = new Date()
    currentDate.value = now.toLocaleDateString('es-ES', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    })
    currentTime.value = now.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  updateDateTime()
  dateTimer = setInterval(updateDateTime, 60000)
})

onBeforeUnmount(() => {
  if (dateTimer) clearInterval(dateTimer)
})
</script>


<style scoped>
.dashboard-date { display: inline-flex; align-items: center; gap: 8px; color: var(--text-secondary); font-size: 11px; padding: 9px 12px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 7px; }
.dashboard-date :first-child { font-size: 16px; }
.dashboard-columns { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 24px; }
.dashboard-primary, .dashboard-secondary { display: flex; flex-direction: column; gap: 24px; min-width: 0; }
.section-link { display: flex; gap: 6px; align-items: center; text-decoration: none; font-size: 11px; color: var(--text-secondary); }
.section-link:hover { color: var(--accent); }
.arrival-row, .upcoming-row { display: flex; align-items: center; gap: 12px; padding: 16px 0; text-decoration: none; color: var(--text-primary); border-bottom: 1px solid var(--border-color); }
.arrival-row:first-child, .upcoming-row:first-child { padding-top: 0; }
.arrival-row:last-child, .upcoming-row:last-child { border-bottom: 0; padding-bottom: 0; }
.guest-avatar { display: grid; place-items: center; background: var(--accent-soft); color: var(--accent); width: 36px; height: 36px; font-size: 13px; border-radius: 50%; flex-shrink: 0; }
.arrival-copy { flex: 1; min-width: 0; }
.arrival-copy strong { display: block; font-size: 12px; font-weight: 500; }
.arrival-copy > span { display: block; color: var(--text-secondary); font-size: 11px; margin-top: 5px; }
.row-arrow { color: var(--text-tertiary); }
.reservation-date { display: grid; place-items: center; width: 35px; height: 38px; background: var(--surface-subtle); color: var(--text-secondary); border: 1px solid var(--border-color); border-radius: 7px; font-size: 19px; }
.room-reference { font-size: 11px; color: var(--text-secondary); }
.occupancy-total { display: flex; align-items: baseline; gap: 8px; }
.occupancy-total strong { font-size: 32px; font-weight: 600; letter-spacing: -.8px; }
.occupancy-total span { color: var(--text-secondary); font-size: 11px; }
.occupancy-bar { display: flex; height: 7px; gap: 3px; margin: 20px 0 24px; border-radius: 3px; overflow: hidden; }
.occupancy-legend { display: flex; flex-direction: column; gap: 13px; }
.occupancy-legend > div { display: flex; align-items: center; gap: 9px; font-size: 11px; color: var(--text-secondary); }
.legend-dot { width: 7px; height: 7px; border-radius: 2px; }
.occupancy-legend strong { margin-left: auto; color: var(--text-primary); font-size: 12px; font-weight: 500; }
.quick-actions { display: flex; flex-direction: column; gap: 20px; }
.quick-actions a { display: flex; align-items: center; gap: 10px; color: var(--text-primary); text-decoration: none; }
.quick-actions a:hover strong { color: var(--accent); }
.quick-action-icon { display: grid; place-items: center; background: var(--surface-subtle); border-radius: 8px; width: 33px; height: 33px; color: var(--text-secondary); font-size: 18px; flex-shrink: 0; }
.quick-actions strong { display: block; font-size: 11px; font-weight: 500; }
.quick-actions small { display: block; font-size: 10px; color: var(--text-secondary); margin-top: 4px; }
.quick-actions a > :last-child { margin-left: auto; color: var(--text-tertiary); }
.dashboard-error { padding: 12px 16px; background: var(--warning-soft); color: var(--warning); border-radius: 8px; margin-bottom: 20px; }
.dashboard-error button { text-decoration: underline; margin-left: 8px; }
.dashboard-loading { padding: 80px 24px; color: var(--text-secondary); text-align: center; }
@media(max-width:1100px) { .dashboard-columns { grid-template-columns: minmax(0,1fr); } .dashboard-secondary { display: grid; grid-template-columns: 1fr 1fr; } }
@media(max-width:600px) { .dashboard-secondary { display: flex; } .arrival-row .status-badge { display: none; } .dashboard-date { font-size: 10px; } }
</style>
