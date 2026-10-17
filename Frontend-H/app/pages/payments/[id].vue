<template>
  <div class="space-y-6">
    <!-- Header -->
    <CPageHeader :title="`Pago #${payment?.id ?? ''}`" back-to="/payments"/>

    <div v-if="payment && ['completed','refunded'].includes(payment.status)"><NuxtLink :to="`/payments/receipt/${payment.id}`" class="btn btn-secondary">Ver comprobante</NuxtLink></div>
    <p class="text-sm text-slate-500">Para completar o reembolsar un pago, abre tu turno en <NuxtLink to="/operations/cash" class="underline">Caja</NuxtLink>.</p>
    <!-- Contenido Principal -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Información del Pago -->
      <div class="lg:col-span-2">
        <CCard v-if="payment">
          <div class="space-y-6">
            <!-- Estado del Pago -->
            <div class="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <div>
                <p class="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Estado del Pago
                </p>
                <p class="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {{ getStatusLabel(payment.status) }}
                </p>
              </div>
              <span
                :class="getStatusColor(payment.status)"
                class="px-4 py-2 rounded-lg font-medium"
              >
                {{ getStatusLabel(payment.status) }}
              </span>
            </div>

            <!-- Información de Reserva -->
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
                    {{ payment.client_name || 'Cliente' }}
                  </p>
                  <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Reserva #{{ payment.reservation_id }}
                  </p>
                </div>
                <div v-if="payment.check_in">
                  <label class="text-sm font-medium text-slate-600 dark:text-slate-400">Check-in</label>
                  <p class="text-slate-900 dark:text-white mt-1">{{ formatDate(payment.check_in) }}</p>
                </div>
              </div>
            </div>

            <!-- Detalles de Pago -->
            <div class="pt-6 border-t border-slate-200 dark:border-slate-700">
              <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Detalles del Pago
              </h3>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Método de Pago
                  </label>
                  <p class="text-slate-900 dark:text-white mt-1">
                    {{ getMethodLabel(payment.method) }}
                  </p>
                </div>
                <div>
                  <label class="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Tipo de Pago
                  </label>
                  <p class="text-slate-900 dark:text-white mt-1">
                    {{ getTypeLabel(payment.type) }}
                  </p>
                </div>
                <div class="col-span-2">
                  <label class="text-sm font-medium text-slate-600 dark:text-slate-400">
                    ID de Transacción
                  </label>
                  <p class="text-slate-900 dark:text-white mt-1 font-mono">
                    {{ payment.transaction_id || 'N/A' }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Notas -->
            <div class="pt-6 border-t border-slate-200 dark:border-slate-700">
              <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Notas
              </h3>
              <p class="text-slate-700 dark:text-slate-300">
                {{ payment.notes || 'Sin notas adicionales' }}
              </p>
            </div>

            <!-- Cronología -->
            <div class="pt-6 border-t border-slate-200 dark:border-slate-700">
              <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Cronología
              </h3>
              <div class="space-y-3">
                <div class="flex items-start gap-4">
                  <div class="flex-shrink-0">
                    <Icon name="system-uicons:plus" size="20" class="text-blue-500 mt-1" />
                  </div>
                  <div>
                    <p class="font-medium text-slate-900 dark:text-white">
                      Pago Creado
                    </p>
                    <p class="text-sm text-slate-600 dark:text-slate-400">
                      {{ formatDate(payment.created_at) }}
                    </p>
                  </div>
                </div>
                <div
                  v-if="payment.updated_at"
                  class="flex items-start gap-4"
                >
                  <div class="flex-shrink-0">
                    <Icon name="system-uicons:write" size="20" class="text-amber-500 mt-1" />
                  </div>
                  <div>
                    <p class="font-medium text-slate-900 dark:text-white">
                      Última Actualización
                    </p>
                    <p class="text-sm text-slate-600 dark:text-slate-400">
                      {{ formatDate(payment.updated_at) }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CCard>
      </div>

      <!-- Sidebar - Monto -->
      <div class="space-y-4">
        <CCard class="metric-card">
          <div class="space-y-4">
            <div>
              <p class="text-sm font-medium text-slate-600 dark:text-slate-400">
                Monto Pagado
              </p>
              <p class="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                {{ hotelMoney(payment?.amount) }}
              </p>
            </div>

          </div>
        </CCard>

        <!-- Acciones -->
        <CCard v-if="canManagePayments && payment?.status === 'pending'">
          <div class="space-y-2">
            <CButton variant="success" class="w-full" :loading="isUpdating" @click="markCompleted">
              <Icon name="system-uicons:check" size="18" class="mr-2" />
              Marcar como Completado
            </CButton>
          </div>
        </CCard>

        <CCard v-if="canManagePayments && payment?.status === 'completed'">
          <div class="space-y-2">
            <CButton variant="warning" class="w-full" :loading="isUpdating" @click="refund">
              <Icon name="system-uicons:undo" size="18" class="mr-2" />
              Reembolsar
            </CButton>
          </div>
        </CCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePaymentsStore } from '~/stores/payments'
import { usePayments } from '~/composables/usePayments'
import { formatDate } from '~/utils/formatters'

const { money: hotelMoney } = useHotelSettings()

definePageMeta({
  middleware: ['auth', 'receptionist']
})

const route = useRoute()
const paymentsStore = usePaymentsStore()
const authStore = useAuthStore()
const canManagePayments = computed(() => authStore.isAdmin || authStore.isManager)
const { fetchPayment, completePayment, refundPayment } = usePayments()

const paymentId = Number(route.params.id)
const loading = ref(false)
const isUpdating = ref(false)

const payment = computed(() => paymentsStore.currentPayment)

const markCompleted = async () => {
  if (!payment.value) return;
  isUpdating.value = true;
  try {
    await completePayment(payment.value.id);
  } finally {
    isUpdating.value = false;
  }
};

const refund = async () => {
  if (!payment.value) return;
  isUpdating.value = true;
  try {
    await refundPayment(payment.value.id);
  } finally {
    isUpdating.value = false;
  }
};

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
    pending: 'status-badge status-pending',
    completed: 'status-badge status-completed',
    failed: 'status-badge status-failed',
    refunded: 'status-badge status-refunded'
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

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    full: 'Pago Completo',
    partial: 'Pago Parcial',
    advance: 'Pago Anticipado'
  }
  return labels[type] || type
}

onMounted(async () => {
  loading.value = true
  try {
    await fetchPayment(paymentId)
  } finally {
    loading.value = false
  }
})
</script>