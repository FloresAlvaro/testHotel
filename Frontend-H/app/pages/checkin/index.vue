<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-slate-900 dark:text-white">
          Check-in Hoy
        </h1>
        <p class="text-slate-600 dark:text-slate-400 mt-1">
          Registrar entrada de huéspedes
        </p>
      </div>
      <CButton variant="primary" @click="refreshData">
        <Icon name="system-uicons:refresh" size="18" class="mr-2" />
        Actualizar
      </CButton>
    </div>

    <!-- Estadísticas -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <CCard class="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30">
        <div class="space-y-2">
          <p class="text-sm font-medium text-slate-600 dark:text-slate-400">
            Check-ins Pendientes
          </p>
          <p class="text-3xl font-bold text-slate-900 dark:text-white">
            {{ todayCheckIns.length }}
          </p>
        </div>
      </CCard>

      <CCard class="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30">
        <div class="space-y-2">
          <p class="text-sm font-medium text-slate-600 dark:text-slate-400">
            Check-ins Completados
          </p>
          <p class="text-3xl font-bold text-slate-900 dark:text-white">
            {{ completedCheckIns }}
          </p>
        </div>
      </CCard>

      <CCard class="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30">
        <div class="space-y-2">
          <p class="text-sm font-medium text-slate-600 dark:text-slate-400">
            No Shows
          </p>
          <p class="text-3xl font-bold text-slate-900 dark:text-white">
            {{ noShows }}
          </p>
        </div>
      </CCard>
    </div>

    <!-- Búsqueda -->
    <CCard>
      <CInput
        v-model="searchQuery"
        placeholder="Buscar por cliente, habitación o email..."
        type="text"
      >
        <template #prefixIcon>
          <Icon name="system-uicons:search" size="18" />
        </template>
      </CInput>
    </CCard>

    <!-- Lista de Check-ins -->
    <div class="space-y-3">
      <div
        v-for="checkIn in filteredCheckIns"
        :key="checkIn.id"
        class="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:shadow-md transition-shadow"
      >
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
            {{ checkIn.client_name || 'Cliente' }}
          </h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm">
            <div>
              <p class="text-slate-600 dark:text-slate-400">Habitación</p>
              <p class="font-medium text-slate-900 dark:text-white">
                #{{ checkIn.room_number }}
              </p>
            </div>
            <div>
              <p class="text-slate-600 dark:text-slate-400">Email</p>
              <p class="font-medium text-slate-900 dark:text-white">
                {{ checkIn.client_email || '—' }}
              </p>
            </div>
            <div>
              <p class="text-slate-600 dark:text-slate-400">Check-in</p>
              <p class="font-medium text-slate-900 dark:text-white">
                {{ formatDate(checkIn.check_in) }}
              </p>
            </div>
            <div>
              <p class="text-slate-600 dark:text-slate-400">Noches</p>
              <p class="font-medium text-slate-900 dark:text-white">
                {{ calculateNights(checkIn.check_in, checkIn.check_out) }}
              </p>
            </div>
          </div>
        </div>
        <div class="flex flex-col gap-2 ml-4">
          <CButton
            variant="success"
            :loading="processingId === checkIn.id"
            @click="performCheckIn(checkIn.id)"
          >
            <Icon name="system-uicons:enter" size="18" class="mr-2" />
            Registrar
          </CButton>
          <NuxtLink
            :to="`/reservations/${checkIn.id}`"
            class="text-blue-500 hover:text-blue-600 text-sm text-center"
          >
            Ver detalles
          </NuxtLink>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="filteredCheckIns.length === 0" class="text-center py-12">
        <Icon
          name="system-uicons:check"
          size="48"
          class="mx-auto text-slate-400 mb-4"
        />
        <p class="text-slate-600 dark:text-slate-400">
          {{ searchQuery
            ? 'No se encontraron check-ins'
            : 'No hay check-ins pendientes para hoy'
          }}
        </p>
      </div>
    </div>

    <!-- Modal de Check-in -->
    <MCheckInModal
      :is-open="isModalOpen"
      :reservation="selectedCheckIn"
      :loading="isSubmitting"
      @confirm="confirmCheckIn"
      @cancel="isModalOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUIStore } from '~/stores/ui'
import { useCheckIn } from '~/composables/useCheckIn'
import { useReservationsStore } from '~/stores/reservations'
import { getTodayDateOnly } from '~/utils/dates'
import type { Reservation, CheckInLogData } from '~/types'
import { formatDate } from '~/utils/formatters'

definePageMeta({
  middleware: ['auth', 'receptionist']
})

const uiStore = useUIStore()
const checkInApi = useCheckIn()
const reservationsStore = useReservationsStore()
const todayCheckIns = computed(() => {
  const today = getTodayDateOnly()
  return reservationsStore.reservations.filter(
    reservation => reservation.status === 'confirmed' && reservation.check_in <= today
  )
})
const completedCheckInLogs = ref<CheckInLogData[]>([])

const searchQuery = ref('')
const isModalOpen = ref(false)
const isSubmitting = ref(false)
const processingId = ref<number | null>(null)
const selectedCheckIn = ref<Reservation | null>(null)
const completedCheckIns = computed(() => completedCheckInLogs.value.length)
const noShows = computed(() => {
  const today = getTodayDateOnly()
  return reservationsStore.reservations.filter(
    reservation => reservation.status === 'confirmed' && reservation.check_in < today
  ).length
})

const filteredCheckIns = computed(() => {
  if (!searchQuery.value) return todayCheckIns.value

  const query = searchQuery.value.toLowerCase()
  return todayCheckIns.value.filter(
    reservation =>
      reservation.client_name?.toLowerCase().includes(query) ||
      reservation.room_number?.toLowerCase().includes(query) ||
      reservation.client_email?.toLowerCase().includes(query)
  )
})

const calculateNights = (checkIn: string, checkOut: string) => {
  const start = new Date(checkIn)
  const end = new Date(checkOut)
  return Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  )
}

const performCheckIn = async (reservationId: number) => {
  selectedCheckIn.value = todayCheckIns.value.find(reservation => reservation.id === reservationId) || null
  isModalOpen.value = true
}

const confirmCheckIn = async (notes: string) => {
  isSubmitting.value = true
  const reservation = selectedCheckIn.value
  if (!reservation) return
  processingId.value = reservation.id

  try {
    await checkInApi.checkIn(reservation.id, notes)
    uiStore.success('Check-in registrado exitosamente')
    isModalOpen.value = false
    await Promise.all([
      reservationsStore.fetchReservations(1, 100),
      checkInApi.getTodayCheckIns().then((response) => {
        completedCheckInLogs.value = response.data || []
      })
    ])
  } catch (error: unknown) {
    uiStore.error(error instanceof Error ? error.message : 'Error al registrar el check-in')
  } finally {
    isSubmitting.value = false
    processingId.value = null
  }
}

const refreshData = async () => {
  try {
    await Promise.all([
      reservationsStore.fetchReservations(1, 100),
      checkInApi.getTodayCheckIns().then((response) => {
        completedCheckInLogs.value = response.data || []
      })
    ])
    uiStore.success('Datos actualizados')
  } catch {
    uiStore.error('Error al actualizar los datos')
  }
}

onMounted(async () => {
  try {
    const [logs] = await Promise.all([
      checkInApi.getTodayCheckIns(),
      reservationsStore.fetchReservations(1, 100)
    ])
    completedCheckInLogs.value = logs.data || []
  } catch {
    uiStore.error('Error al cargar los check-ins')
  }
})
</script>