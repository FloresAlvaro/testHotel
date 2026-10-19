<template>
  <div class="space-y-6">
    <!-- Header -->
    <CPageHeader title="Reporte de Ingresos" description="Un resumen claro de los ingresos del hotel."><div class="flex gap-2">
        <CButton variant="secondary" :disabled="isLoading || exporting || !!errorMessage || pagination.total === 0" :loading="exporting" @click="downloadReport">
          <Icon name="system-uicons:download" size="18" class="mr-2" />
          Descargar
        </CButton>
      </div></CPageHeader>

    <!-- Filtros -->
    <CCard>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="text-sm font-medium text-slate-600 dark:text-slate-400 block mb-2">
            Fecha Inicio
          </label>
          <input
            v-model="dateRange.start" aria-label="Fecha de inicio"
            type="date"
            class="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
        </div>
        <div>
          <label class="text-sm font-medium text-slate-600 dark:text-slate-400 block mb-2">
            Fecha Fin
          </label>
          <input
            v-model="dateRange.end" aria-label="Fecha de fin"
            type="date"
            class="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
        </div>
        <div>
          <label class="text-sm font-medium text-slate-600 dark:text-slate-400 block mb-2">
            Método de Pago
          </label>
          <select
            v-model="selectedMethod" aria-label="Filtrar por método de pago"
            class="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los Métodos</option>
            <option value="cash">Efectivo</option>
            <option value="credit_card">Tarjeta Crédito</option>
            <option value="debit_card">Tarjeta Débito</option>
            <option value="transfer">Transferencia</option><option value="check">Cheque</option>
          </select>
        </div>
      </div>
    </CCard>

    <p v-if="errorMessage" role="alert" class="operation-error">{{ errorMessage }} <button class="underline" @click="loadReport">Reintentar</button></p>
    <p v-if="isLoading" role="status">Cargando informe…</p>
    <CButton v-if="selectedMethod" variant="secondary" @click="selectedMethod=''">Limpiar filtro de método</CButton>
    <!-- Estadísticas Principales -->
    <div class="stat-grid">
      <CCard class="metric-card">
        <div class="space-y-2">
          <p class="text-sm font-medium text-slate-600 dark:text-slate-400">
            Ingresos Totales
          </p>
          <p class="text-3xl font-bold text-green-600 dark:text-green-400">
            {{ hotelMoney(totalRevenue) }}
          </p>
          <p class="text-xs text-green-600 dark:text-green-400">
            {{ transactionCount }} transacciones
          </p>
        </div>
      </CCard>

      <CCard class="metric-card">
        <div class="space-y-2">
          <p class="text-sm font-medium text-slate-600 dark:text-slate-400">
            Promedio por cobro completado
          </p>
          <p class="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {{ hotelMoney(averageTransaction) }}
          </p>
          <p class="text-xs text-blue-600 dark:text-blue-400">
            {{ completedCount }} cobros completados
          </p>
        </div>
      </CCard>

      <CCard class="metric-card">
        <div class="space-y-2">
          <p class="text-sm font-medium text-slate-600 dark:text-slate-400">
            Ingreso Máximo
          </p>
          <p class="text-3xl font-bold text-purple-600 dark:text-purple-400">
            {{ hotelMoney(maxTransaction) }}
          </p>
          <p class="text-xs text-purple-600 dark:text-purple-400">
            Mayor transacción
          </p>
        </div>
      </CCard>

      <CCard class="metric-card">
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
      <CCard title="Ingresos por día">
        <div v-if="dailyRevenue.length" class="revenue-chart" role="img" aria-label="Ingresos diarios del período seleccionado"><div v-for="day in [...dailyRevenue].reverse()" :key="day.date" class="revenue-column"><span>{{ Number(day.total_amount || 0).toFixed(0) }}</span><div :style="{ height: `${Math.max(2, Number(day.total_amount || 0) / maxDailyRevenue * 150)}px` }" :title="`${day.date}: ${hotelMoney(day.total_amount || 0)}`" /><small>{{ day.date.slice(5, 10) }}</small></div></div>
        <CEmptyState v-else title="Sin ingresos en este período" description="Prueba otro rango de fechas para consultar los cobros." icon="system-uicons:graph-bar" />
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
                {{ hotelMoney(method.amount) }}
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

      <CTableHint /><div v-if="!errorMessage && !isLoading" class="overflow-x-auto" tabindex="0" role="region" aria-label="Resultados">
        <table class="table-data-centered table-client-left w-full text-sm">
          <thead class="border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th scope="col" class="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">
                Fecha
              </th>
              <th scope="col" class="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">
                Cliente
              </th>
              <th scope="col" class="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">
                Reserva
              </th>
              <th scope="col" class="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">
                Método
              </th>
              <th scope="col" class="text-right py-3 px-4 font-semibold text-slate-900 dark:text-white">
                Monto
              </th>
              <th scope="col" class="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">
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
              <td class="py-3 px-4 text-slate-900 dark:text-white font-medium table-text-left">
                {{ payment.client_name }}
              </td>
              <td class="py-3 px-4">
                <code class="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                  #{{ payment.reservation_id }}
                </code>
              </td>
              <td class="py-3 px-4 text-slate-600 dark:text-slate-400">
                {{ PAYMENT_METHOD_LABELS[payment.method] || payment.method }}
              </td>
              <td class="py-3 px-4 text-right font-medium text-slate-900 dark:text-white">
                {{ hotelMoney(payment.amount) }}
              </td>
              <td class="py-3 px-4">
                <span
                  :class="getStatusColor(payment.status)"
                  class="px-2 py-1 rounded text-xs font-medium"
                >
                  {{ PAYMENT_STATUS_LABELS[payment.status] || payment.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <CEmptyState v-if="!isLoading && !errorMessage && !transactions.length" title="No hay transacciones para este período" description="Prueba otras fechas o limpia el filtro de método." />
      <CTablePagination :pagination="pagination" :loading="isLoading" @change="page=$event" />
    </CCard>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import type { Payment, PaymentMethod, RevenueByMethod, RevenueReport } from '~/types';
import { useApiClient } from '~/services/api';
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from '~/utils/constants';
import { getTodayDateOnly, addDateDays } from '~/utils/dates';
import { formatDate } from '~/utils/formatters';
const { money: hotelMoney } = useHotelSettings()


const { settings: operatingSettings } = useHotelSettings();

definePageMeta({ middleware: ['auth', 'manager'] });

const api = useApiClient();
const today = getTodayDateOnly(operatingSettings.value.timezone);
const dateRange = ref({
  start: addDateDays(today,-29),
  end: today
});
const selectedMethod = ref<PaymentMethod | ''>('');
const page=ref(1), pagination=ref({page:1,pageSize:20,total:0,totalPages:0})
const summary=ref<import('~/composables/useTableList').PaymentSummary>()
const allTransactions = ref<Payment[]>([]);
const exporting=ref(false)
const reportFilters=()=>({startDate:dateRange.value.start,endDate:dateRange.value.end,method:selectedMethod.value||undefined})
const dailyRevenue = ref<RevenueReport[]>([]);
const methods = ref<RevenueByMethod[]>([]);
const isLoading = ref(true);
const errorMessage = ref('');

const transactions = allTransactions;
const totalRevenue = computed(()=>summary.value?.income||'0');
const transactionCount = computed(()=>summary.value?.total||0);
const completedCount = computed(()=>summary.value?.completed_count||0);
const averageTransaction = computed(()=>completedCount.value?(Number(totalRevenue.value)/completedCount.value).toFixed(2):'0.00');
const maxTransaction = computed(()=>summary.value?.max_income||'0');
const conversionRate = computed(()=>transactionCount.value?Math.round(completedCount.value/transactionCount.value*100):0);
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

let reportVersion=0;
const loadReport = async () => {
  const version=++reportVersion;
  if (dateRange.value.start > dateRange.value.end) {
    isLoading.value=false;
    errorMessage.value = 'La fecha inicial debe ser anterior o igual a la fecha final.';
    return;
  }
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const [revenueResponse, methodResponse, paymentsResponse] = await Promise.all([
      api.getRevenueByPeriod(dateRange.value.start, dateRange.value.end,selectedMethod.value),
      api.getRevenueByMethod(dateRange.value.start, dateRange.value.end,selectedMethod.value),
      api.getPayments(page.value,20,undefined,reportFilters())
    ]);
    if(version!==reportVersion)return;
    dailyRevenue.value = revenueResponse.data || [];
    methods.value = methodResponse.data || [];
    allTransactions.value=paymentsResponse.data||[];
    pagination.value=paymentsResponse.pagination;
    summary.value=paymentsResponse.summary;
  } catch {
    if(version===reportVersion)errorMessage.value = 'No se pudieron cargar los datos del informe.';
  } finally {
    if(version===reportVersion)isLoading.value = false;
  }
};

const getStatusColor = (status: string) => ({
  completed: 'status-badge status-completed',
  pending: 'status-badge status-pending',
  failed: 'status-badge status-failed',
  refunded: 'status-badge status-refunded'
}[status] || 'bg-slate-100 text-slate-700');

const downloadReport = async () => {
  exporting.value=true;errorMessage.value='';
  const filters={...reportFilters()};
  try {
  const data:Payment[]=[];
  let current=1,totalPages=1;
  do {const response=await api.getPayments(current,100,undefined,filters);data.push(...(response.data||[]));totalPages=response.pagination.totalPages;current++}while(current<=totalPages);
  const rows = [
    ['Fecha', 'Cliente', 'Reserva', 'Método', 'Monto', 'Estado'],
    ...data.map(payment => [
      payment.created_at, payment.client_name || '', String(payment.reservation_id), payment.method,
      payment.amount, payment.status
    ])
  ];
  const csv = rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `reporte-ingresos-${filters.startDate}-${filters.endDate}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  }catch{errorMessage.value='No se pudo completar la exportación. Intenta de nuevo.'}finally{exporting.value=false}
};

watch([() => dateRange.value.start, () => dateRange.value.end,selectedMethod],()=>{if(page.value===1)loadReport();else page.value=1});
watch(page,loadReport);
onMounted(loadReport);
</script>