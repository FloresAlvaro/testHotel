<template>
  <div class="space-y-6">
    <!-- Header con Botón Atrás -->
    <CPageHeader title="Ficha del huésped" back-to="/clients"><div class="flex gap-2">
        <CButton variant="secondary" @click="editClient">
          <Icon name="system-uicons:write" size="18" class="mr-2" />
          Editar
        </CButton>
        <CButton variant="danger" @click="confirmDelete">
          <Icon name="system-uicons:trash" size="18" class="mr-2" />
          Eliminar
        </CButton>
      </div></CPageHeader>

    <CGuestAccess v-if="authStore.isAdmin && client" :client-id="client.id" :email="client.email" />

    <!-- Información Principal -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Tarjeta Principal -->
      <div class="lg:col-span-2">
        <CCard v-if="client">
          <div class="space-y-6">
            <!-- Datos Personales -->
            <div>
              <h2 class="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                Información Personal
              </h2>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Nombre
                  </label>
                  <p class="text-slate-900 dark:text-white mt-1">
                    {{ client.name }}
                  </p>
                </div>
                <div>
                  <label class="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Email
                  </label>
                  <p class="text-slate-900 dark:text-white mt-1">
                    {{ client.email }}
                  </p>
                </div>
                <div>
                  <label class="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Teléfono
                  </label>
                  <p class="text-slate-900 dark:text-white mt-1">
                    {{ client.phone }}
                  </p>
                </div>
                <div>
                  <label class="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Género
                  </label>
                  <p class="text-slate-900 dark:text-white mt-1">
                    {{ client.gender || 'No especificado' }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Documentación -->
            <div class="pt-6 border-t border-slate-200 dark:border-slate-700">
              <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Documentación
              </h3>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Tipo de Documento
                  </label>
                  <p class="text-slate-900 dark:text-white mt-1">
                    {{ client.document_type }}
                  </p>
                </div>
                <div>
                  <label class="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Número
                  </label>
                  <p class="text-slate-900 dark:text-white mt-1">
                    {{ client.document }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Dirección -->
            <div class="pt-6 border-t border-slate-200 dark:border-slate-700">
              <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Dirección
              </h3>
              <div class="grid grid-cols-2 gap-4">
                <div class="col-span-2">
                  <label class="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Dirección
                  </label>
                  <p class="text-slate-900 dark:text-white mt-1">
                    {{ client.address || 'No especificada' }}
                  </p>
                </div>
                <div>
                  <label class="text-sm font-medium text-slate-600 dark:text-slate-400">
                    País
                  </label>
                  <p class="text-slate-900 dark:text-white mt-1">
                    {{ client.country || 'No especificado' }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CCard>

        <!-- Skeletons mientras carga -->
        <div v-else class="space-y-4">
          <div class="h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-1/3" />
          <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        </div>
      </div>

      <!-- Sidebar -->
      <div class="space-y-4">
        <!-- Stats -->
        <CCard>
          <div class="space-y-4">
            <div>
              <p class="text-sm font-medium text-slate-600 dark:text-slate-400">
                Reservas
              </p>
              <p class="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {{ totalReservations }}
              </p>
            </div>
            <div class="pt-4 border-t border-slate-200 dark:border-slate-700">
              <p class="text-sm font-medium text-slate-600 dark:text-slate-400">
                Gasto Total
              </p>
              <p class="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {{ hotelMoney(totalSpent) }}
              </p>
            </div>
            <div class="pt-4 border-t border-slate-200 dark:border-slate-700">
              <p class="text-sm font-medium text-slate-600 dark:text-slate-400">
                Cliente Desde
              </p>
              <p class="text-slate-900 dark:text-white mt-1">
                {{ client ? formatDate(client.created_at) : '—' }}
              </p>
            </div>
          </div>
        </CCard>

        <!-- Acciones Rápidas -->
        <CCard>
          <div class="space-y-2">
            <CButton variant="primary" class="w-full" @click="newReservation">
              <Icon name="system-uicons:calendar" size="18" class="mr-2" />
              Nueva Reserva
            </CButton>
            <a v-if="client?.email" :href="`mailto:${client.email}`" class="button-link justify-center">Enviar correo a {{ client?.name }}</a>
          </div>
        </CCard>
      </div>
    </div>

    <p v-if="historyError" role="alert" class="operation-error">{{ historyError }}</p>
    <!-- Historial de Reservas -->
    <CCard>
      <h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
        Historial de Reservas
      </h2>

      <CTablePagination :pagination="historyPagination" :loading="loading" @change="historyPage=$event" /><CTableHint /><div v-if="reservationHistory.length > 0" class="overflow-x-auto" tabindex="0" role="region" aria-label="Historial de reservas">
        <table class="w-full text-sm">
          <thead class="border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th scope="col" class="text-left py-2 px-4 font-semibold text-slate-900 dark:text-white">
                ID
              </th>
              <th scope="col" class="text-left py-2 px-4 font-semibold text-slate-900 dark:text-white">
                Habitación
              </th>
              <th scope="col" class="text-left py-2 px-4 font-semibold text-slate-900 dark:text-white">
                Fechas
              </th>
              <th scope="col" class="text-left py-2 px-4 font-semibold text-slate-900 dark:text-white">
                Estado
              </th>
              <th scope="col" class="text-right py-2 px-4 font-semibold text-slate-900 dark:text-white">
                Monto
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
            <tr
              v-for="res in visibleHistory"
              :key="res.id"
              class="hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
              <td class="py-2 px-4">
                <code class="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                  <NuxtLink :to="`/reservations/${res.id}`" class="underline">#{{ res.id }}</NuxtLink>
                </code>
              </td>
              <td class="py-2 px-4">
                #{{ res.room_number }}
              </td>
              <td class="py-2 px-4 text-xs">
                {{ formatDate(res.check_in) }} → {{ formatDate(res.check_out) }}
              </td>
              <td class="py-2 px-4">
                <span
                  class="px-2 py-1 rounded text-xs font-medium"
                  :class="getStatusColor(res.status)"
                >
                  {{ RESERVATION_STATUS_LABELS[res.status] || res.status }}
                </span>
              </td>
              <td class="py-2 px-4 text-right font-medium">
                {{ hotelMoney(res.total_price) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="text-center py-8">
        <Icon
          name="system-uicons:calendar"
          size="32"
          class="mx-auto text-slate-400 mb-2"
        />
        <p class="text-slate-600 dark:text-slate-400">
          No hay reservas para este cliente
        </p>
      </div>
    </CCard>

    <!-- Modal de Edición -->
    <MClientModal
      :is-open="isEditModalOpen"
      :client="client"
      :loading="isSubmitting"
      @submit="handleSubmit"
      @cancel="closeModal"
    />

    <!-- Modal de Confirmación -->
    <MConfirmModal
      :is-open="isDeleteModalOpen"
      message="¿Está seguro que desea eliminar este cliente? Esta acción no se puede deshacer."
      confirm-text="Eliminar"
      danger
      :loading="isDeleting"
      @confirm="confirmDeleteAction"
      @cancel="isDeleteModalOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useClientsStore } from '~/stores/clients'
import { useUIStore } from '~/stores/ui'
import { useClients } from '~/composables/useClients'
import { useApiClient } from '~/services/api'
import { RESERVATION_STATUS_LABELS } from '~/utils/constants'
import { formatDate } from '~/utils/formatters'
import type { CreateClientRequest, Reservation } from '~/types'

const { money: hotelMoney } = useHotelSettings()

definePageMeta({
  middleware: ['auth', 'receptionist']
})

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const clientsStore = useClientsStore()
const uiStore = useUIStore()
const { fetchClient, deleteClient, updateClient } = useClients()

const clientId = Number(route.params.id)
const loading = ref(false)
const isSubmitting = ref(false)
const isDeleting = ref(false)
const isEditModalOpen = ref(false)
const isDeleteModalOpen = ref(false)

const client = computed(() => clientsStore.currentClient)
const reservationHistory = ref<Reservation[]>([])
const historyPage=ref(1)
const visibleHistory=computed(()=>reservationHistory.value.slice((historyPage.value-1)*10,historyPage.value*10))
const historyPagination=computed(()=>({page:historyPage.value,pageSize:10,total:reservationHistory.value.length,totalPages:Math.ceil(reservationHistory.value.length/10)}))
const historyError=ref(''),api=useApiClient()

const totalReservations = computed(() => reservationHistory.value.length)
const totalSpent = computed(() => {
  return reservationHistory.value
    .reduce((sum, reservation) => sum + Number(reservation.total_price || 0), 0)
    .toFixed(2)
})

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    confirmed: 'status-badge status-confirmed',
    checked_in: 'status-badge status-checked_in',
    checked_out: 'status-badge status-checked_out',
    cancelled: 'status-badge status-cancelled'
  }
  return colors[status] || colors.confirmed
}

const editClient = () => {
  isEditModalOpen.value = true
}

const closeModal = () => {
  isEditModalOpen.value = false
}

const handleSubmit = async (data: CreateClientRequest) => {
  isSubmitting.value = true
  try {
    await updateClient(clientId, data)
    uiStore.success('Cliente actualizado exitosamente')
    closeModal()
    await fetchClient(clientId)
  } catch (error: unknown) {
    uiStore.error(error instanceof Error ? error.message : 'Error al actualizar el cliente')
  } finally {
    isSubmitting.value = false
  }
}

const confirmDelete = () => {
  isDeleteModalOpen.value = true
}

const confirmDeleteAction = async () => {
  isDeleting.value = true
  try {
    await deleteClient(clientId)
    uiStore.success('Cliente eliminado exitosamente')
    await router.push('/clients')
  } catch (error: unknown) {
    uiStore.error(error instanceof Error ? error.message : 'Error al eliminar el cliente')
  } finally {
    isDeleting.value = false
    isDeleteModalOpen.value = false
  }
}

const newReservation = () => {
  router.push('/reservations')
}

onMounted(async () => {
  loading.value = true
  try {
    await fetchClient(clientId)
    let page=1,totalPages=1;
    const history:Reservation[]=[];
    do{const response=await api.request<import('~/types').PaginatedApiResponse<Reservation>>('/reservations',{query:{clientId,page:page++,pageSize:100}});history.push(...(response.data||[]));totalPages=response.pagination.totalPages}while(page<=totalPages)
    reservationHistory.value=history
  } catch {historyError.value='No se pudo cargar la ficha completa del huésped. Vuelve a intentar.'} finally {
    loading.value = false
  }
})
</script>