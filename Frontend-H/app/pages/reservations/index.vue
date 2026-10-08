<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-slate-900 dark:text-white">
          Reservas
        </h1>
        <p class="text-slate-600 dark:text-slate-400 mt-1">
          Gestión de reservaciones
        </p>
      </div>
      <CButton variant="primary" @click="openAddModal">
        <Icon name="system-uicons:calendar" size="18" class="mr-2" />
        Nueva Reserva
      </CButton>
    </div>

    <!-- Filtros -->
    <CCard>
      <div class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Búsqueda -->
          <CInput
            v-model="searchQuery"
            placeholder="Buscar cliente o habitación..."
            type="text"
          >
            <template #prefixIcon>
              <Icon name="system-uicons:search" size="18" />
            </template>
          </CInput>

          <!-- Filtro por Estado -->
          <select
            v-model="selectedStatus"
            class="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los Estados</option>
            <option value="confirmed">Confirmada</option>
            <option value="checked_in">Check-in</option>
            <option value="checked_out">Check-out</option>
            <option value="cancelled">Cancelada</option>
          </select>

          <!-- Rango de Fechas -->
          <select
            v-model="dateFilter"
            class="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas las Fechas</option>
            <option value="today">Hoy</option>
            <option value="week">Esta Semana</option>
            <option value="month">Este Mes</option>
            <option value="upcoming">Próximas</option>
          </select>
        </div>

        <div class="flex items-center justify-between">
          <p class="text-sm text-slate-600 dark:text-slate-400">
            Mostrando {{ filteredReservations.length }} de {{ totalReservations }} reservas
          </p>
          <CButton
            v-if="searchQuery || selectedStatus || dateFilter"
            variant="secondary"
            size="sm"
            @click="clearFilters"
          >
            Limpiar Filtros
          </CButton>
        </div>
      </div>
    </CCard>

    <!-- Tabla de Reservas -->
    <CCard>
      <div v-if="!loading" class="overflow-x-auto">
        <table class="w-full">
          <thead class="border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th class="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">
                ID
              </th>
              <th class="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">
                Cliente
              </th>
              <th class="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">
                Habitación
              </th>
              <th class="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">
                Check-in
              </th>
              <th class="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">
                Check-out
              </th>
              <th class="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">
                Estado
              </th>
              <th class="text-right py-3 px-4 font-semibold text-slate-900 dark:text-white">
                Total
              </th>
              <th class="text-center py-3 px-4 font-semibold text-slate-900 dark:text-white">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
            <tr
              v-for="reservation in filteredReservations"
              :key="reservation.id"
              class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <td class="py-3 px-4 text-xs">
                <code class="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                  #{{ reservation.id }}
                </code>
              </td>
              <td class="py-3 px-4 text-slate-900 dark:text-white font-medium">
                {{ reservation.client_name || 'Cliente' }}
              </td>
              <td class="py-3 px-4 text-slate-600 dark:text-slate-400">
                #{{ reservation.room_number }}
              </td>
              <td class="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                {{ formatDate(reservation.check_in) }}
              </td>
              <td class="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                {{ formatDate(reservation.check_out) }}
              </td>
              <td class="py-3 px-4">
                <span
                  :class="getStatusColor(reservation.status)"
                  class="px-2 py-1 rounded text-xs font-medium"
                >
                  {{ getStatusLabel(reservation.status) }}
                </span>
              </td>
              <td class="py-3 px-4 text-right font-medium text-slate-900 dark:text-white">
                Bs. {{ reservation.total_price }}
              </td>
              <td class="py-3 px-4 text-center">
                <div class="flex items-center justify-center gap-2">
                  <CButton
                    variant="ghost"
                    size="sm"
                    @click="viewReservation(reservation.id)"
                  >
                    <Icon name="system-uicons:eye" size="16" />
                  </CButton>
                  <CButton
                    variant="ghost"
                    size="sm"
                    @click="editReservation(reservation.id)"
                  >
                    <Icon name="system-uicons:edit" size="16" />
                  </CButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="filteredReservations.length === 0" class="text-center py-12">
          <Icon
            name="system-uicons:calendar"
            size="48"
            class="mx-auto text-slate-400 mb-4"
          />
          <p class="text-slate-600 dark:text-slate-400 mb-4">
            {{ searchQuery || selectedStatus || dateFilter
              ? 'No se encontraron reservas'
              : 'No hay reservas registradas'
            }}
          </p>
          <CButton variant="primary" @click="openAddModal">
            <Icon name="system-uicons:calendar" size="18" class="mr-2" />
            Crear Primera Reserva
          </CButton>
        </div>
      </div>

      <!-- Loading -->
      <div v-else class="text-center py-12">
        <Icon
          name="system-uicons:loading"
          size="32"
          class="mx-auto text-blue-500 animate-spin mb-4"
        />
        <p class="text-slate-600 dark:text-slate-400">
          Cargando reservas...
        </p>
      </div>
    </CCard>

    <!-- Modal de Reserva -->
    <FReservationForm
      :is-open="isModalOpen"
      :reservation="selectedReservation"
      :loading="isSubmitting"
      @submit="handleSubmit"
      @cancel="closeModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useReservationsStore } from '~/stores/reservations'
import { useUIStore } from '~/stores/ui'
import { useReservations } from '~/composables/useReservations'
import { formatDate } from '~/utils/formatters'
import type { CreateReservationRequest, Reservation } from '~/types'

definePageMeta({
  middleware: ['auth', 'receptionist']
})

const router = useRouter()
const reservationsStore = useReservationsStore()
const uiStore = useUIStore()
const { fetchReservations } = useReservations()

const loading = ref(false)
const isSubmitting = ref(false)
const isModalOpen = ref(false)
const searchQuery = ref('')
const selectedStatus = ref('')
const dateFilter = ref('')
const selectedReservation = ref<Reservation | null>(null)

const reservations = computed(() => reservationsStore.reservations)
const totalReservations = computed(() => reservations.value.length)

const filteredReservations = computed(() => {
  let filtered = reservations.value

  // Búsqueda
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      r =>
        r.client_name?.toLowerCase().includes(query) ||
        r.room_number?.toLowerCase().includes(query)
    )
  }

  // Estado
  if (selectedStatus.value) {
    filtered = filtered.filter(r => r.status === selectedStatus.value)
  }

  // Fechas
  if (dateFilter.value) {
    const today = new Date()
    filtered = filtered.filter(r => {
      const checkIn = new Date(r.check_in)
      switch (dateFilter.value) {
        case 'today':
          return checkIn.toDateString() === today.toDateString()
        case 'week':
          {
          const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
          return checkIn >= today && checkIn <= nextWeek
          }
        case 'month':
          return checkIn.getMonth() === today.getMonth()
        case 'upcoming':
          return checkIn > today
        default:
          return true
      }
    })
  }

  return filtered
})

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    confirmed: 'Confirmada',
    checked_in: 'Check-in',
    checked_out: 'Check-out',
    cancelled: 'Cancelada'
  }
  return labels[status] || status
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    confirmed: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    checked_in: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    checked_out: 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300',
    cancelled: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
  }
  return colors[status] || colors.confirmed
}

const openAddModal = () => {
  selectedReservation.value = null
  isModalOpen.value = true
}

const editReservation = (id: number) => {
  selectedReservation.value = reservations.value.find(r => r.id === id) || null
  isModalOpen.value = true
}

const viewReservation = (id: number) => {
  router.push(`/reservations/${id}`)
}

const closeModal = () => {
  isModalOpen.value = false
  selectedReservation.value = null
}

const handleSubmit = async (data: CreateReservationRequest) => {
  isSubmitting.value = true
  try {
    if (selectedReservation.value) {
      await reservationsStore.updateReservation(selectedReservation.value.id, data)
      uiStore.success('Reserva actualizada exitosamente')
    } else {
      await reservationsStore.createReservation(data)
      uiStore.success('Reserva creada exitosamente')
    }
    closeModal()
    await fetchReservations()
  } catch (error: unknown) {
    uiStore.error(error instanceof Error ? error.message : 'Error al guardar la reserva')
  } finally {
    isSubmitting.value = false
  }
}

const clearFilters = () => {
  searchQuery.value = ''
  selectedStatus.value = ''
  dateFilter.value = ''
}

onMounted(async () => {
  loading.value = true
  try {
    await fetchReservations()
  } finally {
    loading.value = false
  }
})
</script>