<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-slate-900 dark:text-white">
          Reporte de Ingresos
        </h1>
        <p class="text-slate-600 dark:text-slate-400 mt-1">
          Análisis de revenue y transacciones
        </p>
      </div>
      <div class="flex gap-2">
        <CButton variant="secondary" :disabled="isLoading || transactions.length === 0" @click="downloadReport">
          <Icon name="system-uicons:download" size="18" class="mr-2" />
          Descargar
        </CButton>
      </div>
    </div>

    <!-- Filtros -->
    <CCard>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="text-sm font-medium text-slate-600 dark:text-slate-400 block mb-2">
            Fecha Inicio
          </label>
          <input
            v-model="dateRange.start"
            type="date"
            class="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
        </div>
        <div>
          <label class="text-sm font-medium text-slate-600 dark:text-slate-400 block mb-2">
            Fecha Fin
          </label>
          <input
            v-model="dateRange.end"
            type="date"
            class="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
        </div>
        <div>
          <label class="text-sm font-medium text-slate-600 dark:text-slate-400 block mb-2">
            Método de Pago
          </label>
          <select
            v-model="selectedMethod"
            class="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
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

    <!-- Estadísticas Principales -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <CCard class="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30">
        <div class="space-y-2">
          <p class="text-sm font-medium text-slate-600 dark:text-slate-400">
            Ingresos Totales
          </p>
          <p class="text-3xl font-bold text-green-600 dark:text-green-400">
            Bs. {{ totalRevenue }}
          </p>
          <p class="text-xs text-green-600 dark:text-green-400">
            {{ transactionCount }} transacciones
          </p>
        </div>
      </CCard>

      <CCard class="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30">
        <div class="space-y-2">
          <p class="text-sm font-medium text-slate-600 dark:text-slate-400">
            Promedio por Transacción
          </p>
          <p class="text-3xl font-bold text-blue-600 dark:text-blue-400">
            Bs. {{ averageTransaction }}
          </p>
          <p class="text-xs text-blue-600 dark:text-blue-400">
            {{ transactionCount }} transacciones
          </p>
        </div>
      </CCard>

      <CCard class="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30">
        <div class="space-y-2">
          <p class="text-sm font-medium text-slate-600 dark:text-slate-400">
            Ingreso Máximo
          </p>
          <p class="text-3xl font-bold text-purple-600 dark:text-purple-400">
            Bs. {{ maxTransaction }}
          </p>
          <p class="text-xs text-purple-600 dark:text-purple-400">
            Mayor transacción
          </p>
        </div>
      </CCard>

      <CCard class="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30">
        <div class="space-y-2">
          <p class="text-sm font-medium text-slate-600 dark:text-slate-400">
            Tasa de Conversión
          </p>
          <p class="text-3xl font-bold text-amber-600 dark:text-amber-400">
            {{ conversionRate }}%
          </p>
          <p class="text-xs text-amber-600 dark:text-amber-400">
            Pagos completados
          </p>
        </div>
      </CCard>
    </div>

    <!-- Gráficos -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Ingresos por Día -->
      <CCard>
        <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Ingresos por Día
        </h3>
        <div class="h-80 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
          <div class="text-center">
            <Icon
              name="system-uicons:chart"
              size="48"
              class="mx-auto text-slate-400 mb-2"
            />
            <div v-if="dailyRevenue.length" class="flex h-full w-full items-end gap-2 overflow-x-auto px-4 pb-4">
              <div v-for="day in dailyRevenue" :key="day.date" class="flex min-w-8 flex-1 flex-col items-center justify-end gap-2">
                <span class="text-xs text-slate-600 dark:text-slate-300">{{ Number(day.total_amount || 0).toFixed(0) }}</span>
                <div class="w-full rounded-t bg-emerald-600" :style="{ height: `${Math.max(4, Number(day.total_amount || 0) / maxDailyRevenue * 180)}px` }" :title="`${day.date}: Bs. ${day.total_amount || 0}`" />
                <span class="text-xs text-slate-500">{{ day.date.slice(5) }}</span>
              </div>
            </div>
            <p v-else class="text-slate-500 dark:text-slate-400">Sin ingresos para el período</p>
          </div>
        </div>
      </CCard>

      <!-- Ingresos por Método -->
      <CCard>
        <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Ingresos por Método de Pago
        </h3>
        <div class="space-y-3">
          <div v-for="method in paymentMethods" :key="method.name">
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm font-medium text-slate-600 dark:text-slate-400">
                {{ method.name }}
              </span>
              <span class="text-sm font-bold text-slate-900 dark:text-white">
                Bs. {{ method.amount }}
              </span>
            </div>
            <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div
                class="bg-blue-500 h-2 rounded-full"
                :style="{ width: method.percentage + '%' }"
              />
            </div>
          </div>
        </div>
      </CCard>
    </div>

    <!-- Tabla de Detalles -->
    <CCard>
      <h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
        Detalles de Transacciones
      </h2>

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th class="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">
                Fecha
              </th>
              <th class="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">
                Cliente
              </th>
              <th class="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">
                Reserva
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
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
            <tr
              v-for="payment in transactions"
              :key="payment.id"
              class="hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
              <td class="py-3 px-4 text-slate-600 dark:text-slate-400">
                {{ formatDate(payment.created_at) }}
              </td>
              <td class="py-3 px-4 text-slate-900 dark:text-white font-medium">
                {{ payment.client_name }}
              </td>
              <td class="py-3 px-4">
                <code class="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                  #{{ payment.reservation_id }}
                </code>
              </td>
              <td class="py-3 px-4 text-slate-600 dark:text-slate-400">
                {{ payment.method }}
              </td>
              <td class="py-3 px-4 text-right font-medium text-slate-900 dark:text-white">
                Bs. {{ payment.amount }}
              </td>
              <td class="py-3 px-4">
                <span
                  :class="getStatusColor(payment.status)"
                  class="px-2 py-1 rounded text-xs font-medium"
                >
                  {{ payment.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </CCard>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import type { Payment, PaymentMethod, RevenueByMethod, RevenueReport } from '~/types';
import { useApiClient } from '~/services/api';
import { formatDate } from '~/utils/formatters';

definePageMeta({ middleware: ['auth', 'manager'] });

const api = useApiClient();
const today = new Date().toISOString().slice(0, 10);
const dateRange = ref({
  start: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  end: today
});
const selectedMethod = ref<PaymentMethod | ''>('');
const allTransactions = ref<Payment[]>([]);
const dailyRevenue = ref<RevenueReport[]>([]);
const methods = ref<RevenueByMethod[]>([]);
const isLoading = ref(false);
const errorMessage = ref('');

const filteredTransactions = computed(() => allTransactions.value.filter(payment =>
  !selectedMethod.value || payment.method === selectedMethod.value
));
const transactions = computed(() => filteredTransactions.value);
const totalRevenue = computed(() => dailyRevenue.value.reduce((sum, row) => sum + Number(row.total_amount || 0), 0).toFixed(2));
const transactionCount = computed(() => dailyRevenue.value.reduce((sum, row) => sum + Number(row.total_payments), 0));
const completedCount = computed(() => dailyRevenue.value.reduce((sum, row) => sum + Number(row.completed_payments), 0));
const averageTransaction = computed(() => transactionCount.value ? (Number(totalRevenue.value) / transactionCount.value).toFixed(2) : '0.00');
const maxTransaction = computed(() => Math.max(0, ...filteredTransactions.value.map(payment => Number(payment.amount))).toFixed(2));
const conversionRate = computed(() => transactionCount.value ? Math.round(completedCount.value / transactionCount.value * 100) : 0);
const maxDailyRevenue = computed(() => Math.max(1, ...dailyRevenue.value.map(row => Number(row.total_amount || 0))));
const paymentMethods = computed(() => {
  const labels: Record<PaymentMethod, string> = {
    cash: 'Efectivo', credit_card: 'Tarjeta Crédito', debit_card: 'Tarjeta Débito', transfer: 'Transferencia', check: 'Cheque'
  };
  const max = Math.max(1, ...methods.value.map(method => Number(method.total_amount)));
  return methods.value.map(method => ({
    name: labels[method.method],
    amount: Number(method.total_amount).toFixed(2),
    percentage: Math.round(Number(method.total_amount) / max * 100)
  }));
});

const loadReport = async () => {
  if (dateRange.value.start > dateRange.value.end) {
    errorMessage.value = 'La fecha inicial debe ser anterior o igual a la fecha final.';
    return;
  }
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const [revenueResponse, methodResponse, paymentsResponse] = await Promise.all([
      api.getRevenueByPeriod(dateRange.value.start, dateRange.value.end),
      api.getRevenueByMethod(dateRange.value.start, dateRange.value.end),
      api.getPayments(1, 100)
    ]);
    dailyRevenue.value = revenueResponse.data || [];
    methods.value = methodResponse.data || [];
    allTransactions.value = (paymentsResponse.data || []).filter(payment =>
      payment.created_at.slice(0, 10) >= dateRange.value.start &&
      payment.created_at.slice(0, 10) <= dateRange.value.end
    );
  } catch {
    errorMessage.value = 'No se pudieron cargar los datos del informe.';
  } finally {
    isLoading.value = false;
  }
};

const getStatusColor = (status: string) => ({
  completed: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  pending: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  failed: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  refunded: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
}[status] || 'bg-slate-100 text-slate-700');

const downloadReport = () => {
  const rows = [
    ['Fecha', 'Cliente', 'Reserva', 'Método', 'Monto', 'Estado'],
    ...filteredTransactions.value.map(payment => [
      payment.created_at, payment.client_name || '', String(payment.reservation_id), payment.method,
      payment.amount, payment.status
    ])
  ];
  const csv = rows.map(row => row.map(value => `"${value.replaceAll('"', '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `reporte-ingresos-${dateRange.value.start}-${dateRange.value.end}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

watch([() => dateRange.value.start, () => dateRange.value.end], loadReport);
onMounted(loadReport);
</script>