<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-slate-900 dark:text-white">
          Check-out Pendientes
        </h1>
        <p class="text-slate-600 dark:text-slate-400 mt-1">
          Registrar salida de huéspedes
        </p>
      </div>
      <CButton variant="primary" @click="refreshData">
        <Icon name="system-uicons:refresh" size="18" class="mr-2" />
        Actualizar
      </CButton>
    </div>

    <!-- Filtros -->
    <CCard>
      <div class="flex flex-col md:flex-row gap-4">
        <CInput
          v-model="searchQuery"
          placeholder="Buscar por cliente o habitación..."
          type="text"
          class="flex-1"
        >
          <template #prefixIcon>
            <Icon name="system-uicons:search" size="18" />
          </template>
        </CInput>

        <select
          v-model="sortBy"
          class="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        >
          <option value="checkout_time">Por hora de check-out</option>
          <option value="room_number">Por número de habitación</option>
          <option value="client_name">Por nombre de cliente</option>
        </select>
      </div>
    </CCard>

    <!-- Alertas -->
    <CCard v-if="overdueCheckOuts.length > 0" class="bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700">
      <div class="flex items-start gap-3">
        <Icon
          name="system-uicons:warning"
          size="24"
          class="text-red-600 dark:text-red-400 flex-shrink-0 mt-1"
        />
        <div>
          <h3 class="font-semibold text-red-900 dark:text-red-200">
            {{ overdueCheckOuts.length }} Check-outs Vencidos
          </h3>
          <p class="text-sm text-red-800 dark:text-red-300 mt-1">
            Estos huéspedes debieron salir hace más de 2 horas
          </p>
        </div>
      </div>
    </CCard>

    <!-- Lista de Check-outs -->
    <div class="space-y-3">
      <!-- Check-outs Vencidos -->
      <div v-if="overdueCheckOuts.length > 0">
        <h2 class="text-lg font-semibold text-red-600 dark:text-red-400 mb-3">
          Vencidos
        </h2>
        <div
          v-for="checkOutItem in overdueCheckOuts"
          :key="checkOutItem.id"
          class="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-600 rounded-r-lg hover:shadow-md transition-shadow"
        >
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-red-900 dark:text-red-200">
              {{ checkOutItem.client_name || 'Cliente' }}
            </h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm">
              <div>
                <p class="text-red-700 dark:text-red-300">Habitación</p>
                <p class="font-medium text-red-900 dark:text-red-100">
                  #{{ checkOutItem.room_number }}
                </p>
              </div>
              <div>
                <p class="text-red-700 dark:text-red-300">Vencido hace</p>
                <p class="font-medium text-red-900 dark:text-red-100">
                  {{ getHoursOverdue(checkOutItem.scheduled_checkout_date || '') }} horas
                </p>
              </div>
              <div>
                <p class="text-red-700 dark:text-red-300">Check-out</p>
                <p class="font-medium text-red-900 dark:text-red-100">
                  {{ formatDate(checkOutItem.scheduled_checkout_date || '') }}
                </p>
              </div>
            </div>
          </div>
          <div class="flex flex-col gap-2 ml-4">
            <CButton
              variant="danger"
              :loading="processingId === checkOutItem.id"
              @click="performCheckOut(checkOutItem.reservation_id, checkOutItem.id)"
            >
              <Icon name="system-uicons:exit" size="18" class="mr-2" />
              Registrar
            </CButton>
          </div>
        </div>
      </div>

      <!-- Check-outs Próximos -->
      <div v-if="upcomingCheckOuts.length > 0">
        <h2 class="text-lg font-semibold text-amber-600 dark:text-amber-400 mb-3 mt-6">
          Próximos
        </h2>
        <div
          v-for="checkOutItem in upcomingCheckOuts"
          :key="checkOutItem.id"
          class="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:shadow-md transition-shadow"
        >
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
              {{ checkOutItem.client_name || 'Cliente' }}
            </h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm">
              <div>
                <p class="text-slate-600 dark:text-slate-400">Habitación</p>
                <p class="font-medium text-slate-900 dark:text-white">
                  #{{ checkOutItem.room_number }}
                </p>
              </div>
              <div>
                <p class="text-slate-600 dark:text-slate-400">Check-out en</p>
                <p class="font-medium text-slate-900 dark:text-white">
                  {{ getTimeUntilCheckOut(checkOutItem.scheduled_checkout_date || '') }}
                </p>
              </div>
              <div>
                <p class="text-slate-600 dark:text-slate-400">Hora</p>
                <p class="font-medium text-slate-900 dark:text-white">
                  {{ formatDate(checkOutItem.scheduled_checkout_date || '') }}
                </p>
              </div>
            </div>
          </div>
          <div class="flex flex-col gap-2 ml-4">
            <CButton
              variant="primary"
              :loading="processingId === checkOutItem.id"
              @click="performCheckOut(checkOutItem.reservation_id, checkOutItem.id)"
            >
              <Icon name="system-uicons:exit" size="18" class="mr-2" />
              Registrar
            </CButton>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="sortedCheckOuts.length === 0" class="text-center py-12">
        <Icon
          name="system-uicons:check"
          size="48"
          class="mx-auto text-slate-400 mb-4"
        />
        <p class="text-slate-600 dark:text-slate-400">
          {{ searchQuery
            ? 'No se encontraron check-outs'
            : 'No hay check-outs pendientes'
          }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUIStore } from '~/stores/ui'
import { useCheckIn } from '~/composables/useCheckIn'
import { formatDate } from '~/utils/formatters'

definePageMeta({
  middleware: ['auth', 'receptionist']
})

const uiStore = useUIStore()
const { pendingCheckOuts, getPendingCheckOuts, checkOut } = useCheckIn()

const searchQuery = ref('')
const sortBy = ref('checkout_time')
const processingId = ref<number | null>(null)

const filteredCheckOuts = computed(() => {
  if (!searchQuery.value) return pendingCheckOuts.value

  const query = searchQuery.value.toLowerCase()
  return pendingCheckOuts.value.filter(
    checkOut =>
      checkOut.client_name?.toLowerCase().includes(query) ||
      checkOut.room_number?.toLowerCase().includes(query)
  )
})

const sortedCheckOuts = computed(() => {
  const list = [...filteredCheckOuts.value]

  switch (sortBy.value) {
    case 'room_number':
      return list.sort((a, b) => (a.room_number || '').localeCompare(b.room_number || '', undefined, { numeric: true }))
    case 'client_name':
      return list.sort((a, b) =>
        (a.client_name || '').localeCompare(b.client_name || '')
      )
    case 'checkout_time':
    default:
      return list.sort(
        (a, b) =>
          new Date(a.scheduled_checkout_date || '').getTime() - new Date(b.scheduled_checkout_date || '').getTime()
      )
  }
})

const overdueCheckOuts = computed(() => {
  const now = new Date()
  return sortedCheckOuts.value.filter(c => {
    const checkOutTime = new Date(c.scheduled_checkout_date || '')
    const hoursOverdue = (now.getTime() - checkOutTime.getTime()) / (1000 * 60 * 60)
    return hoursOverdue > 0
  })
})

const upcomingCheckOuts = computed(() => {
  const now = new Date()
  return sortedCheckOuts.value.filter(c => {
    const checkOutTime = new Date(c.scheduled_checkout_date || '')
    return checkOutTime > now
  })
})

const getHoursOverdue = (checkOutTime: string) => {
  const now = new Date()
  const checkout = new Date(checkOutTime)
  const hours = Math.floor((now.getTime() - checkout.getTime()) / (1000 * 60 * 60))
  return hours
}

const getTimeUntilCheckOut = (checkOutTime: string) => {
  const now = new Date()
  const checkout = new Date(checkOutTime)
  const minutes = Math.floor((checkout.getTime() - now.getTime()) / (1000 * 60))

  if (minutes < 60) {
    return `${minutes} minutos`
  }

  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  return `${hours}h ${mins}m`
}

const performCheckOut = async (reservationId: number, checkInLogId: number) => {
  processingId.value = checkInLogId

  try {
    await checkOut(reservationId)
    uiStore.success('Check-out registrado exitosamente')
    await getPendingCheckOuts()
  } catch (error: unknown) {
    uiStore.error(error instanceof Error ? error.message : 'Error al registrar el check-out')
  } finally {
    processingId.value = null
  }
}

const refreshData = async () => {
  try {
    await getPendingCheckOuts()
    uiStore.success('Datos actualizados')
  } catch {
    uiStore.error('Error al actualizar los datos')
  }
}

onMounted(async () => {
  try {
    await getPendingCheckOuts()
  } catch {
    uiStore.error('Error al cargar los check-outs')
  }
})
</script>