<template>
  <div class="space-y-6">
    <!-- Header -->
    <CPageHeader title="Reservas" description="Organiza las estancias y consulta el estado de cada reserva."><CButton variant="primary" @click="openAddModal">
        <Icon name="system-uicons:calendar" size="18" class="mr-2" />
        Nueva Reserva
      </CButton></CPageHeader>

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
            v-model="selectedStatus" aria-label="Filtrar por estado"
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
            v-model="dateFilter" aria-label="Filtrar por fecha"
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
            {{ loading ? 'Consultando reservas…' : `Mostrando ${filteredReservations.length} de ${totalReservations} reservas` }}
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

    <p v-if="error" role="alert" class="operation-error">{{ error }} <button class="underline" @click="load">Reintentar</button></p>
    <!-- Tabla de Reservas -->
    <CCard>
      <div v-if="!loading && !error" class="reservation-mobile-list space-y-3">
        <article v-for="reservation in filteredReservations" :key="reservation.id" class="rounded-lg border p-4 space-y-3" :aria-label="`Reserva ${reservation.id}`">
          <p><strong>{{ reservation.client_name || 'Huésped' }}</strong></p><p>#{{ reservation.id }} · Habitación {{ reservation.room_number }}</p>
          <p>Entrada {{ formatDate(reservation.check_in) }} · Salida {{ formatDate(reservation.check_out) }}</p>
          <p><span class="status-badge" :class="`status-${reservation.status}`">{{ getStatusLabel(reservation.status) }}</span> · {{ hotelMoney(reservation.total_price) }}</p>
          <div class="flex flex-wrap gap-2"><CButton variant="secondary" size="sm" :aria-label="`Ver reserva ${reservation.id}`" @click="viewReservation(reservation.id)">Ver</CButton><CButton v-if="reservation.status==='confirmed'||reservation.status==='checked_in'" variant="secondary" size="sm" :aria-label="`Editar reserva ${reservation.id}`" @click="editReservation(reservation.id)">Editar</CButton></div>
        </article>
        <p v-if="!filteredReservations.length">No hay reservas para estos filtros.</p>
      </div>
      <div class="reservation-desktop-list"><CTableHint /><div v-if="!loading && !error" class="overflow-x-auto" tabindex="0" role="region" aria-label="Reservas">
        <table class="w-full table-with-actions reservations-table">
          <thead class="border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th scope="col" class="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">
                ID
              </th>
              <th scope="col" class="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">
                Huésped
              </th>
              <th scope="col" class="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">
                Habitación
              </th>
              <th scope="col" class="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">
                Check-in
              </th>
              <th scope="col" class="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">
                Check-out
              </th>
              <th scope="col" class="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">
                Estado
              </th>
              <th scope="col" class="text-right py-3 px-4 font-semibold text-slate-900 dark:text-white">
                Total
              </th>
              <th scope="col" class="text-center py-3 px-4 font-semibold text-slate-900 dark:text-white">
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
                {{ reservation.client_name || 'Huésped' }}
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
                {{ hotelMoney(reservation.total_price) }}
              </td>
              <td class="py-3 px-4 text-center">
                <div class="flex items-center justify-center gap-2">
                  <CButton
                    variant="ghost"
                    size="sm"
                    aria-label="Ver reserva" @click="viewReservation(reservation.id)"
                  >
                    <Icon name="system-uicons:eye" size="16" />Ver
                  </CButton>
                  <CButton
                    v-if="reservation.status === 'confirmed' || reservation.status === 'checked_in'"
                    variant="ghost"
                    size="sm" aria-label="Editar reserva" @click="editReservation(reservation.id)"
                  >
                    <Icon name="system-uicons:write" size="16" />Editar
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
          <CButton v-if="!searchQuery && !selectedStatus && !dateFilter" variant="primary" @click="openAddModal">
            <Icon name="system-uicons:calendar" size="18" class="mr-2" />
            Crear primera reserva
          </CButton>
        </div>
      </div>

      <!-- Loading -->
      <div v-else-if="loading" role="status" class="text-center py-12">
        <Icon
          name="system-uicons:loader"
          size="32"
          class="mx-auto text-blue-500 animate-spin mb-4"
        />
        <p class="text-slate-600 dark:text-slate-400">
          Cargando reservas...
        </p>
      </div>
      </div>
    </CCard>

    <CTablePagination :pagination="pagination" :loading="loading" @change="page=$event" />
    <!-- Modal de Reserva -->
    <CModal :is-open="isModalOpen" :title="selectedReservation ? 'Editar reserva' : 'Nueva reserva'" @close="closeModal">
    <FReservationForm
v-if="isModalOpen"
      :reservation="selectedReservation"
      :loading="isSubmitting"
      @submit="handleSubmit"
      @cancel="closeModal"
    />
    </CModal>
  </div>
</template>

<script setup lang="ts">
import {RESERVATION_STATUS_LABELS} from '~/utils/constants'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUIStore } from '~/stores/ui'
import { useReservations } from '~/composables/useReservations'
import { formatDate } from '~/utils/formatters'
import { getTodayDateOnly, reservationRange } from '~/utils/dates'
import type { CreateReservationRequest, Reservation } from '~/types'

const { money: hotelMoney, settings } = useHotelSettings()

definePageMeta({
  middleware: ['auth', 'receptionist']
})

const router = useRouter()
const uiStore = useUIStore()
const { createReservation, updateReservation } = useReservations()

const isSubmitting = ref(false)
const isModalOpen = ref(false)
const searchQuery = ref('')
const selectedStatus = ref('')
const dateFilter = ref('')
const selectedReservation = ref<Reservation | null>(null)

const range = computed(()=>reservationRange(dateFilter.value,getTodayDateOnly(settings.value.timezone)))
const {rows:reservations,loading,error,pagination,page,load} = useTableList<Reservation>('/reservations',()=>({q:searchQuery.value.trim(),status:selectedStatus.value,...range.value}))
const filteredReservations=reservations
const totalReservations=computed(()=>pagination.value.total)

const getStatusLabel = (status:string)=>RESERVATION_STATUS_LABELS[status] || 'Estado desconocido'

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    confirmed: 'status-badge status-confirmed',
    checked_in: 'status-badge status-checked_in',
    checked_out: 'status-badge status-checked_out',
    cancelled: 'status-badge status-cancelled'
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
      await updateReservation(selectedReservation.value.id, { check_in: data.check_in, check_out: data.check_out, notes: data.notes })
      uiStore.success('Reserva actualizada exitosamente')
    } else {
      await createReservation(data)
      uiStore.success('Reserva creada exitosamente')
    }
    closeModal()
    await load()
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

</script>

<style scoped>
.reservation-mobile-list{display:none}
@media(max-width:640px){.reservation-mobile-list{display:block}.reservation-desktop-list{display:none}}

.reservations-table tbody td { text-align: center; }
.reservations-table tbody td:nth-child(2) { text-align: left; }
.reservations-table tbody td:last-child > .flex { justify-content: center; }
</style>
