<template>
  <div class="space-y-6">
    <!-- Header con Botón Atrás -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <NuxtLink
          to="/clients"
          class="text-blue-500 hover:text-blue-600 flex items-center gap-2"
        >
          <Icon name="system-uicons:chevron-left" size="20" />
          Volver
        </NuxtLink>
        <h1 class="text-3xl font-bold text-slate-900 dark:text-white">
          Detalle del Cliente
        </h1>
      </div>
      <div class="flex gap-2">
        <CButton variant="secondary" @click="editClient">
          <Icon name="system-uicons:edit" size="18" class="mr-2" />
          Editar
        </CButton>
        <CButton variant="danger" @click="confirmDelete">
          <Icon name="system-uicons:trash" size="18" class="mr-2" />
          Eliminar
        </CButton>
      </div>
    </div>

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
                Bs. {{ totalSpent }}
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
            <CButton variant="secondary" class="w-full">
              <Icon name="system-uicons:envelope" size="18" class="mr-2" />
              Enviar Email
            </CButton>
          </div>
        </CCard>
      </div>
    </div>

    <!-- Historial de Reservas -->
    <CCard>
      <h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
        Historial de Reservas
      </h2>

      <div v-if="reservationHistory.length > 0" class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th class="text-left py-2 px-4 font-semibold text-slate-900 dark:text-white">
                ID
              </th>
              <th class="text-left py-2 px-4 font-semibold text-slate-900 dark:text-white">
                Habitación
              </th>
              <th class="text-left py-2 px-4 font-semibold text-slate-900 dark:text-white">
                Fechas
              </th>
              <th class="text-left py-2 px-4 font-semibold text-slate-900 dark:text-white">
                Estado
              </th>
              <th class="text-right py-2 px-4 font-semibold text-slate-900 dark:text-white">
                Monto
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
            <tr
              v-for="res in reservationHistory"
              :key="res.id"
              class="hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
              <td class="py-2 px-4">
                <code class="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                  #{{ res.id }}
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
                  {{ res.status }}
                </span>
              </td>
              <td class="py-2 px-4 text-right font-medium">
                Bs. {{ res.total_price }}
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
import { formatDate } from '~/utils/formatters'
import type { CreateClientRequest, Reservation } from '~/types'

definePageMeta({
  middleware: ['auth', 'receptionist']
})

const router = useRouter()
const route = useRoute()
const clientsStore = useClientsStore()
const uiStore = useUIStore()
const { fetchClient, deleteClient, updateClient, getClientReservations } = useClients()

const clientId = Number(route.params.id)
const loading = ref(false)
const isSubmitting = ref(false)
const isDeleting = ref(false)
const isEditModalOpen = ref(false)
const isDeleteModalOpen = ref(false)

const client = computed(() => clientsStore.currentClient)
const reservationHistory = ref<Reservation[]>([])

const totalReservations = computed(() => reservationHistory.value.length)
const totalSpent = computed(() => {
  return reservationHistory.value
    .reduce((sum, reservation) => sum + Number(reservation.total_price || 0), 0)
    .toFixed(2)
})

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    confirmed: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    checked_in: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    checked_out: 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300',
    cancelled: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
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
    const history = await getClientReservations(clientId)
    reservationHistory.value = history.data || []
  } finally {
    loading.value = false
  }
})
</script>