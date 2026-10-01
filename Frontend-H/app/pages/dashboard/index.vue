<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-slate-900 dark:text-white">
          Dashboard
        </h1>
        <p class="text-slate-600 dark:text-slate-400 mt-1">
          Bienvenido, {{ user?.name || 'Usuario' }}
        </p>
      </div>
      <div class="text-right">
        <p class="text-2xl font-bold text-slate-900 dark:text-white">
          {{ currentDate }}
        </p>
        <p class="text-slate-600 dark:text-slate-400">
          {{ currentTime }}
        </p>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <!-- Huéspedes Hoy -->
      <CCard class="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-200 dark:border-blue-700">
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <h3 class="text-slate-600 dark:text-slate-300 font-medium">
              Check-ins Hoy
            </h3>
            <Icon
              name="system-uicons:enter"
              size="24"
              class="text-blue-500"
            />
          </div>
          <p class="text-3xl font-bold text-slate-900 dark:text-white">
            {{ todayCheckIns.length }}
          </p>
          <p class="text-sm text-slate-600 dark:text-slate-400">
            {{ pendingCheckOuts.length }} check-outs pendientes
          </p>
        </div>
      </CCard>

      <!-- Habitaciones Disponibles -->
      <CCard class="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-green-200 dark:border-green-700">
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <h3 class="text-slate-600 dark:text-slate-300 font-medium">
              Disponibles
            </h3>
            <Icon
              name="system-uicons:home"
              size="24"
              class="text-green-500"
            />
          </div>
          <p class="text-3xl font-bold text-slate-900 dark:text-white">
            {{ availableRooms.length }}
          </p>
          <p class="text-sm text-slate-600 dark:text-slate-400">
            de {{ totalRooms }} habitaciones
          </p>
        </div>
      </CCard>

      <!-- Ocupación -->
      <CCard class="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border-purple-200 dark:border-purple-700">
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <h3 class="text-slate-600 dark:text-slate-300 font-medium">
              Ocupación
            </h3>
            <Icon
              name="system-uicons:graph-bar"
              size="24"
              class="text-purple-500"
            />
          </div>
          <p class="text-3xl font-bold text-slate-900 dark:text-white">
            {{ occupancyRate }}%
          </p>
          <p class="text-sm text-slate-600 dark:text-slate-400">
            {{ occupiedRooms.length }} habitaciones ocupadas
          </p>
        </div>
      </CCard>

      <!-- Ingresos Hoy -->
      <CCard class="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 border-amber-200 dark:border-amber-700">
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <h3 class="text-slate-600 dark:text-slate-300 font-medium">
              Ingresos Hoy
            </h3>
            <Icon
              name="system-uicons:coin"
              size="24"
              class="text-amber-500"
            />
          </div>
          <p class="text-3xl font-bold text-slate-900 dark:text-white">
            Bs. {{ todayRevenue }}
          </p>
          <p class="text-sm text-slate-600 dark:text-slate-400">
            {{ completedPayments }} pagos completados
          </p>
        </div>
      </CCard>
    </div>

    <!-- Contenido Principal -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Check-ins Pendientes -->
      <div class="lg:col-span-2">
        <CCard>
          <template #header-action>
            <NuxtLink
              to="/checkin"
              class="text-blue-500 hover:text-blue-600 text-sm font-medium"
            >
              Ver todos →
            </NuxtLink>
          </template>

          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
              Check-ins Pendientes
            </h3>

            <div
              v-if="todayCheckIns.length > 0"
              class="space-y-3 max-h-96 overflow-y-auto"
            >
              <div
                v-for="checkIn in todayCheckIns.slice(0, 5)"
                :key="checkIn.id"
                class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <div class="flex-1">
                  <p class="font-medium text-slate-900 dark:text-white">
                    {{ checkIn.client_name || 'Cliente' }}
                  </p>
                  <p class="text-sm text-slate-600 dark:text-slate-400">
                    Habitación {{ checkIn.room_number }}
                  </p>
                </div>
                <CButton variant="ghost" size="sm">
                  <Icon name="system-uicons:enter" size="16" />
                </CButton>
              </div>
            </div>
            <div v-else class="text-center py-8">
              <Icon
                name="system-uicons:info-circle"
                size="32"
                class="mx-auto text-slate-400 mb-2"
              />
              <p class="text-slate-600 dark:text-slate-400">
                No hay check-ins pendientes
              </p>
            </div>
          </div>
        </CCard>
      </div>

      <!-- Próximas Reservas -->
      <div>
        <CCard>
          <template #header-action>
            <NuxtLink
              to="/reservations"
              class="text-blue-500 hover:text-blue-600 text-sm font-medium"
            >
              Ver todas →
            </NuxtLink>
          </template>

          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
              Próximas Reservas
            </h3>

            <div
              v-if="upcomingReservations.length > 0"
              class="space-y-3 max-h-96 overflow-y-auto"
            >
              <div
                v-for="res in upcomingReservations.slice(0, 5)"
                :key="res.id"
                class="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
              >
                <p class="font-medium text-slate-900 dark:text-white text-sm">
                  {{ res.client_name || 'Cliente' }}
                </p>
                <p class="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {{ formatDate(res.check_in) }} - {{ formatDate(res.check_out) }}
                </p>
              </div>
            </div>
            <div v-else class="text-center py-8">
              <Icon
                name="system-uicons:calendar"
                size="32"
                class="mx-auto text-slate-400 mb-2"
              />
              <p class="text-slate-600 dark:text-slate-400">
                No hay reservas próximas
              </p>
            </div>
          </div>
        </CCard>
      </div>
    </div>

    <!-- Acceso Rápido -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <NuxtLink
        to="/clients"
        class="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
      >
        <Icon
          name="system-uicons:user"
          size="24"
          class="text-slate-600 dark:text-slate-400"
        />
        <div>
          <p class="font-medium text-slate-900 dark:text-white text-sm">
            Clientes
          </p>
          <p class="text-xs text-slate-600 dark:text-slate-400">
            Gestionar
          </p>
        </div>
      </NuxtLink>

      <NuxtLink
        to="/rooms"
        class="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
      >
        <Icon
          name="system-uicons:home"
          size="24"
          class="text-slate-600 dark:text-slate-400"
        />
        <div>
          <p class="font-medium text-slate-900 dark:text-white text-sm">
            Habitaciones
          </p>
          <p class="text-xs text-slate-600 dark:text-slate-400">
            Gestionar
          </p>
        </div>
      </NuxtLink>

      <NuxtLink
        to="/reservations"
        class="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
      >
        <Icon
          name="system-uicons:calendar"
          size="24"
          class="text-slate-600 dark:text-slate-400"
        />
        <div>
          <p class="font-medium text-slate-900 dark:text-white text-sm">
            Reservas
          </p>
          <p class="text-xs text-slate-600 dark:text-slate-400">
            Gestionar
          </p>
        </div>
      </NuxtLink>

      <NuxtLink
        to="/payments"
        class="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
      >
        <Icon
          name="system-uicons:coin"
          size="24"
          class="text-slate-600 dark:text-slate-400"
        />
        <div>
          <p class="font-medium text-slate-900 dark:text-white text-sm">
            Pagos
          </p>
          <p class="text-xs text-slate-600 dark:text-slate-400">
            Gestionar
          </p>
        </div>
      </NuxtLink>
    </div>
  </div>
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
import { getTodayDateOnly } from '~/utils/dates'

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
  const today = getTodayDateOnly()
  return reservationsStore.reservations.filter(
    reservation => reservation.status === 'confirmed' && reservation.check_in <= today
  )
})

const todayRevenue = computed(() => {
  const today = getTodayDateOnly()
  return paymentsStore.payments
    .filter(payment => payment.status === 'completed' && payment.created_at.startsWith(today))
    .reduce((sum, payment) => sum + Number(payment.amount), 0)
    .toFixed(2)
})

const completedPayments = computed(() =>
  paymentsStore.payments.filter(payment => payment.status === 'completed').length
)
let dateTimer: ReturnType<typeof setInterval> | undefined

onMounted(async () => {
  const loadTasks = await Promise.allSettled([
    roomsStore.fetchRooms(1, 100),
    reservationsStore.fetchReservations(1, 100),
    fetchUpcoming(),
    fetchPayments(1, 100),
    getPendingCheckOuts()
  ])
  if (loadTasks.some(task => task.status === 'rejected')) {
    useUiStore().error('No se pudieron cargar algunos datos del dashboard')
  }

  // Actualizar hora y fecha en tiempo real
  const updateDateTime = () => {
    const now = new Date()
    currentDate.value = now.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    currentTime.value = now.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  updateDateTime()
  dateTimer = setInterval(updateDateTime, 1000)
})

onBeforeUnmount(() => {
  if (dateTimer) clearInterval(dateTimer)
})
</script>