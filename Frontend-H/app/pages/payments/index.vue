<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-slate-900 dark:text-white">
          Pagos
        </h1>
        <p class="text-slate-600 dark:text-slate-400 mt-1">
          Gestión de transacciones
        </p>
      </div>
      <CButton variant="primary" @click="openAddModal">
        <Icon name="system-uicons:coin" size="18" class="mr-2" />
        Nuevo Pago
      </CButton>
    </div>

    <!-- Estadísticas -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <CCard class="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30">
        <div class="space-y-2">
          <p class="text-sm font-medium text-slate-600 dark:text-slate-400">
            Ingresos Totales
          </p>
          <p class="text-2xl font-bold text-slate-900 dark:text-white">
            Bs. {{ totalIncome }}
          </p>
          <p class="text-xs text-green-600 dark:text-green-400">
            {{ completedPayments }} transacciones
          </p>
        </div>
      </CCard>

      <CCard class="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30">
        <div class="space-y-2">
          <p class="text-sm font-medium text-slate-600 dark:text-slate-400">
            Pendiente de Cobro
          </p>
          <p class="text-2xl font-bold text-slate-900 dark:text-white">
            Bs. {{ pendingAmount }}
          </p>
          <p class="text-xs text-amber-600 dark:text-amber-400">
            {{ pendingPayments }} pagos
          </p>
        </div>
      </CCard>

      <CCard class="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30">
        <div class="space-y-2">
          <p class="text-sm font-medium text-slate-600 dark:text-slate-400">
            Reembolsos
          </p>
          <p class="text-2xl font-bold text-slate-900 dark:text-white">
            Bs. {{ refunds }}
          </p>
          <p class="text-xs text-blue-600 dark:text-blue-400">
            {{ refundedPayments }} transacciones
          </p>
        </div>
      </CCard>

      <CCard class="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/30 dark:to-slate-800/30">
        <div class="space-y-2">
          <p class="text-sm font-medium text-slate-600 dark:text-slate-400">
            Tasa de Conversión
          </p>
          <p class="text-2xl font-bold text-slate-900 dark:text-white">
            {{ conversionRate }}%
          </p>
          <p class="text-xs text-slate-600 dark:text-slate-400">
            Pagos completados / Total
          </p>
        </div>
      </CCard>
    </div>

    <!-- Filtros -->
    <CCard>
      <div class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CInput
            v-model="searchQuery"
            placeholder="Buscar por reserva o cliente..."
            type="text"
          >
            <template #prefixIcon>
              <Icon name="system-uicons:search" size="18" />
            </template>
          </CInput>

          <select
            v-model="selectedStatus"
            class="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los Estados</option>
            <option value="pending">Pendiente</option>
            <option value="completed">Completado</option>
            <option value="failed">Fallido</option>
            <option value="refunded">Reembolsado</option>
          </select>

          <select
            v-model="selectedMethod"
            class="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los Métodos</option>
            <option value="cash">Efectivo</option>
            <option value="credit_card">Tarjeta Crédito</option>
            <option value="debit_card">Tarjeta Débito</option>
            <option value="transfer">Transferencia</option>
          </select>
        </div>
      </div>
    </CCard>

    <!-- Tabla de Pagos -->
    <CCard>
      <div v-if="!loading" class="overflow-x-auto">
        <table class="w-full">
          <thead class="border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th class="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">
                Reserva
              </th>
              <th class="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">
                Cliente
              </th>
              <th class="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">
                Método
              </th>
              <th class="text-right py-3 px-4 font-semibold text-slate-900 dark:text-white">
                Monto
              </th>
              <th class="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">
                Estado
              </th>
              <th class="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">
                Fecha
              </th>
              <th class="text-center py-3 px-4 font-semibold text-slate-900 dark:text-white">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
            <tr
              v-for="payment in filteredPayments"
              :key="payment.id"
              class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <td class="py-3 px-4">
                <code class="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                  #{{ payment.reservation_id }}
                </code>
              </td>
              <td class="py-3 px-4 text-slate-900 dark:text-white font-medium">
                {{ payment.client_name || 'Cliente' }}
              </td>
              <td class="py-3 px-4 text-slate-600 dark:text-slate-400">
                {{ getMethodLabel(payment.method) }}
              </td>
              <td class="py-3 px-4 text-right font-medium text-slate-900 dark:text-white">
                Bs. {{ payment.amount }}
              </td>
              <td class="py-3 px-4">
                <span
                  :class="getStatusColor(payment.status)"
                  class="px-2 py-1 rounded text-xs font-medium"
                >
                  {{ getStatusLabel(payment.status) }}
                </span>
              </td>
              <td class="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                {{ formatDate(payment.created_at) }}
              </td>
              <td class="py-3 px-4 text-center">
                <div class="flex items-center justify-center gap-2">
                  <CButton
                    variant="ghost"
                    size="sm"
                    @click="viewPayment(payment.id)"
                  >
                    <Icon name="system-uicons:eye" size="16" />
                  </CButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="filteredPayments.length === 0" class="text-center py-12">
          <Icon
            name="system-uicons:coin"
            size="48"
            class="mx-auto text-slate-400 mb-4"
          />
          <p class="text-slate-600 dark:text-slate-400">
            No hay pagos registrados
          </p>
        </div>
      </div>

      <div v-else class="text-center py-12">
        <Icon
          name="system-uicons:loading"
          size="32"
          class="mx-auto text-blue-500 animate-spin mb-4"
        />
      </div>
    </CCard>

    <!-- Modal de Pago -->
    <FPaymentForm
      :is-open="isModalOpen"
      :reservation-id="reservationId"
      :loading="isSubmitting"
      @submit="handleSubmit"
      @cancel="closeModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { usePaymentsStore } from '~/stores/payments'
import { useUIStore } from '~/stores/ui'
import { usePayments } from '~/composables/usePayments'
import { formatDate } from '~/utils/formatters'
import type { CreatePaymentRequest } from '~/types'

definePageMeta({
  middleware: ['auth', 'receptionist']
})

const router = useRouter()
const route = useRoute()
const paymentsStore = usePaymentsStore()
const uiStore = useUIStore()
const { fetchPayments } = usePayments()

const loading = ref(false)
const isSubmitting = ref(false)
const isModalOpen = ref(false)
const searchQuery = ref('')
const selectedStatus = ref('')
const selectedMethod = ref('')
const reservationId = computed(() => {
  const value = Number(route.query.reservationId)
  return Number.isInteger(value) && value > 0 ? value : undefined
})

const payments = computed(() => paymentsStore.payments)

const filteredPayments = computed(() => {
  let filtered = payments.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      p =>
        String(p.reservation_id).includes(query) ||
        p.client_name?.toLowerCase().includes(query)
    )
  }

  if (selectedStatus.value) {
    filtered = filtered.filter(p => p.status === selectedStatus.value)
  }

  if (selectedMethod.value) {
    filtered = filtered.filter(p => p.method === selectedMethod.value)
  }

  return filtered
})

const totalIncome = computed(() => {
  return payments.value
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0)
    .toFixed(2)
})

const pendingAmount = computed(() => {
  return payments.value
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0)
    .toFixed(2)
})

const refunds = computed(() => {
  return payments.value
    .filter(p => p.status === 'refunded')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0)
    .toFixed(2)
})

const completedPayments = computed(() =>
  payments.value.filter(p => p.status === 'completed').length
)

const pendingPayments = computed(() =>
  payments.value.filter(p => p.status === 'pending').length
)

const refundedPayments = computed(() =>
  payments.value.filter(p => p.status === 'refunded').length
)

const conversionRate = computed(() => {
  if (payments.value.length === 0) return 0
  return Math.round((completedPayments.value / payments.value.length) * 100)
})

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: 'Pendiente',
    completed: 'Completado',
    failed: 'Fallido',
    refunded: 'Reembolsado'
  }
  return labels[status] || status
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    completed: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    failed: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    refunded: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
  }
  return colors[status] || colors.pending
}

const getMethodLabel = (method: string) => {
  const labels: Record<string, string> = {
    cash: 'Efectivo',
    credit_card: 'Tarjeta Crédito',
    debit_card: 'Tarjeta Débito',
    transfer: 'Transferencia',
    check: 'Cheque'
  }
  return labels[method] || method
}

const openAddModal = () => {
  isModalOpen.value = true
}

const viewPayment = (id: number) => {
  router.push(`/payments/${id}`)
}

const closeModal = () => {
  isModalOpen.value = false
}

const handleSubmit = async (data: CreatePaymentRequest) => {
  isSubmitting.value = true
  try {
    await paymentsStore.createPayment(data)
    uiStore.success('Pago registrado exitosamente')
    closeModal()
    await fetchPayments(1, 100)
  } catch (error: unknown) {
    uiStore.error(error instanceof Error ? error.message : 'Error al registrar el pago')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(async () => {
  loading.value = true
  try {
    await fetchPayments(1, 100)
  } finally {
    loading.value = false
  }
})
</script>