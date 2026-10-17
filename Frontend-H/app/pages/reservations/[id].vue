<template>
  <div class="space-y-6">
    <!-- Header -->
    <CPageHeader :title="`Reserva #${reservation?.id ?? ''}`" back-to="/reservations"><div v-if="reservation?.status === 'confirmed'" class="flex gap-2">
        <CButton variant="success" @click="performCheckIn">
          <Icon name="system-uicons:enter" size="18" class="mr-2" />
          Check-in
        </CButton>
      </div>
      <div v-if="reservation?.status === 'checked_in'" class="flex gap-2">
        <CButton variant="primary" @click="performCheckOut">
          <Icon name="system-uicons:exit-right" size="18" class="mr-2" />
          Check-out
        </CButton>
      </div></CPageHeader>

    <!-- Contenido Principal -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Información Principal -->
      <div class="lg:col-span-2">
        <CCard v-if="reservation">
          <div class="space-y-6">
            <!-- Estado -->
            <div class="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <div>
                <p class="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Estado
                </p>
                <p class="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {{ getStatusLabel(reservation.status) }}
                </p>
              </div>
              <span
                :class="getStatusColor(reservation.status)"
                class="px-4 py-2 rounded-lg font-medium"
              >
                {{ reservation.status }}
              </span>
            </div>

            <!-- Cliente y Habitación -->
            <div class="pt-6 border-t border-slate-200 dark:border-slate-700">
              <h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Información de Reserva
              </h2>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Cliente
                  </label>
                  <p class="text-slate-900 dark:text-white mt-1">
                    {{ reservation.client_name || 'Cliente' }}
                  </p>
                  <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {{ reservation.client_email || '—' }}
                  </p>
                </div>
                <div>
                  <label class="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Habitación
                  </label>
                  <p class="text-slate-900 dark:text-white mt-1">
                    #{{ reservation.room_number }}
                  </p>
                  <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {{ reservation.room_type_name }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Fechas -->
            <div class="pt-6 border-t border-slate-200 dark:border-slate-700">
              <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Fechas
              </h3>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Check-in
                  </label>
                  <p class="text-slate-900 dark:text-white mt-1">
                    {{ formatDate(reservation.check_in) }}
                  </p>
                </div>
                <div>
                  <label class="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Check-out
                  </label>
                  <p class="text-slate-900 dark:text-white mt-1">
                    {{ formatDate(reservation.check_out) }}
                  </p>
                </div>
                <div class="col-span-2">
                  <label class="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Noches
                  </label>
                  <p class="text-slate-900 dark:text-white mt-1">
                    {{ calculateNights }}
                  </p>
                </div>
              </div>
            </div>

            <div class="pt-6 border-t border-slate-200 dark:border-slate-700 space-y-3"><h3 class="text-lg font-semibold">Ocupación y llegada</h3><p>{{ reservation.adults ?? 1 }} adultos · {{ reservation.children ?? 0 }} niños</p><p v-if="reservation.arrival_time">Hora estimada de llegada: {{ reservation.arrival_time.slice(0,5) }}</p><p v-if="reservation.special_requests">Solicitud del huésped: {{ reservation.special_requests }}</p></div>
            <!-- Solicitudes Especiales -->
            <div class="pt-6 border-t border-slate-200 dark:border-slate-700">
              <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Notas internas
              </h3>
              <p class="text-slate-700 dark:text-slate-300">
                {{ reservation.notes || 'Sin notas adicionales' }}
              </p>
            </div>
          </div>
        </CCard>
      </div>

      <!-- Sidebar - Precios -->
      <div class="space-y-4">
        <CCard class="metric-card">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Resumen de Precios
          </h3>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-slate-600 dark:text-slate-400">
                Total de la reserva
              </span>
              <span class="font-medium text-slate-900 dark:text-white">
                {{ hotelMoney(reservation?.total_price || '0.00') }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-600 dark:text-slate-400">
                Noches
              </span>
              <span class="font-medium text-slate-900 dark:text-white">
                {{ calculateNights }}
              </span>
            </div>
            <div class="pt-3 border-t border-blue-200 dark:border-blue-700">
              <div class="flex items-center justify-between">
                <span class="font-semibold text-slate-900 dark:text-white">
                  Total
                </span>
                <span class="text-xl font-bold text-slate-900 dark:text-white">
                  {{ hotelMoney(reservation?.total_price || '0.00') }}
                </span>
              </div>
            </div>
          </div>
        </CCard>

        <!-- Pagos -->
        <CCard>
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Pagos
          </h3>
          <div class="space-y-2">
            <p class="text-sm text-slate-600 dark:text-slate-400">
              Total Pagado
            </p>
            <p class="text-2xl font-bold text-green-600 dark:text-green-400">
              {{ hotelMoney(totalPaid) }}
            </p>
            <p class="text-sm text-slate-600 dark:text-slate-400">
              Pendiente: {{ hotelMoney(pendingAmount) }}
            </p>
            <CButton variant="primary" class="w-full mt-4" @click="goToPayments">
              <Icon name="system-uicons:coin" size="18" class="mr-2" />
              Registrar Pago
            </CButton>
          </div>
        </CCard>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useReservationsStore } from '~/stores/reservations'
import { useUIStore } from '~/stores/ui'
import { useReservations } from '~/composables/useReservations'
import { useCheckIn } from '~/composables/useCheckIn'
import { usePaymentsStore } from '~/stores/payments'
import { usePayments } from '~/composables/usePayments'
import { formatDate } from '~/utils/formatters'

const { money: hotelMoney } = useHotelSettings()

definePageMeta({
  middleware: ['auth', 'receptionist']
})

const router = useRouter()
const route = useRoute()
const reservationsStore = useReservationsStore()
const paymentsStore = usePaymentsStore()
const uiStore = useUIStore()
const { fetchReservation } = useReservations()
const { checkIn, checkOut } = useCheckIn()
const { fetchPayments } = usePayments()

const reservationId = Number(route.params.id)
const loading = ref(false)

const reservation = computed(() => reservationsStore.currentReservation)

const calculateNights = computed(() => {
  if (!reservation.value) return 0
  const checkIn = new Date(reservation.value.check_in)
  const checkOut = new Date(reservation.value.check_out)
  return Math.ceil(
    (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
  )
})

const totalPaid = computed(() => {
  if (!reservation.value) return '0.00'
  return paymentsStore.payments
    .filter(payment => payment.reservation_id === reservation.value?.id && payment.status === 'completed')
    .reduce((sum, payment) => sum + Number(payment.amount), 0)
    .toFixed(2)
})

const pendingAmount = computed(() => {
  const total = parseFloat(reservation.value?.total_price || '0')
  const paid = parseFloat(totalPaid.value)
  return (total - paid).toFixed(2)
})

const goToPayments = () => {
  if (reservation.value) {
    router.push({ path: '/payments', query: { reservationId: String(reservation.value.id) } })
  }
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    confirmed: 'Confirmada',
    checked_in: 'En la Propiedad',
    checked_out: 'Completada',
    cancelled: 'Cancelada'
  }
  return labels[status] || status
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    confirmed: 'status-badge status-confirmed',
    checked_in: 'status-badge status-checked_in',
    checked_out: 'status-badge status-checked_out',
    cancelled: 'status-badge status-cancelled'
  }
  return colors[status] || colors.confirmed
}

const performCheckIn = async () => {
  try {
    await checkIn(reservationId)
    uiStore.success('Check-in realizado exitosamente')
    await fetchReservation(reservationId)
  } catch (error: unknown) {
    uiStore.error(error instanceof Error ? error.message : 'Error al realizar check-in')
  }
}

const performCheckOut = async () => {
  try {
    await checkOut(reservationId)
    uiStore.success('Check-out realizado exitosamente')
    await fetchReservation(reservationId)
  } catch (error: unknown) {
    uiStore.error(error instanceof Error ? error.message : 'Error al realizar check-out')
  }
}

onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([fetchReservation(reservationId), fetchPayments(1, 100)])
  } finally {
    loading.value = false
  }
})
</script>