<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <NuxtLink
          to="/payments"
          class="text-blue-500 hover:text-blue-600 flex items-center gap-2"
        >
          <Icon name="system-uicons:chevron-left" size="20" />
          Volver
        </NuxtLink>
        <h1 class="text-3xl font-bold text-slate-900 dark:text-white">
          Pago #{{ payment?.id }}
        </h1>
      </div>
    </div>

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
                {{ payment.status }}
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
                    <Icon name="system-uicons:edit" size="20" class="text-amber-500 mt-1" />
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
        <CCard class="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30">
          <div class="space-y-4">
            <div>
              <p class="text-sm font-medium text-slate-600 dark:text-slate-400">
                Monto Pagado
              </p>
              <p class="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                Bs. {{ payment?.amount }}
              </p>
            </div>

          </div>
        </CCard>

        <!-- Acciones -->
        <CCard v-if="payment?.status === 'pending'">
          <div class="space-y-2">
            <CButton variant="success" class="w-full" :loading="isUpdating" @click="markCompleted">
              <Icon name="system-uicons:check" size="18" class="mr-2" />
              Marcar como Completado
            </CButton>
          </div>
        </CCard>

        <CCard v-if="payment?.status === 'completed'">
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

definePageMeta({
  middleware: ['auth', 'receptionist']
})

const route = useRoute()
const paymentsStore = usePaymentsStore()
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