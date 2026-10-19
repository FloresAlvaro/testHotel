<template>
  <div class="space-y-6">
    <!-- Header -->
    <CPageHeader title="Reporte de Ocupación" description="Distribución actual y disponibilidad de habitaciones."><div class="flex gap-2">
        <CButton variant="secondary" :disabled="isLoading || !!errorMessage || filteredRoomDetails.length === 0" @click="downloadReport">
          <Icon name="system-uicons:download" size="18" class="mr-2" />
          Descargar
        </CButton>
      </div></CPageHeader>

    <!-- Filtros -->
    <CCard>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="text-sm font-medium text-slate-600 dark:text-slate-400 block mb-2">
            Tipo de Habitación
          </label>
          <select
            v-model="selectedRoomType" aria-label="Filtrar por tipo de habitación"
            class="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los Tipos</option>
            <option v-for="type in roomTypes" :key="type.name" :value="type.name">{{ type.name }}</option>
          </select>
        </div>
      </div>
    </CCard>

    <p v-if="errorMessage" role="alert" class="operation-error">{{ errorMessage }} <button class="underline" @click="loadReport">Reintentar</button></p>
    <p v-if="isLoading" role="status">Cargando ocupación…</p>
    <CButton v-if="selectedRoomType" variant="secondary" @click="selectedRoomType=''">Limpiar filtro de tipo</CButton>
    <!-- Estadísticas Principales -->
    <div class="stat-grid">
      <CCard class="metric-card">
        <div class="space-y-2">
          <p class="text-sm font-medium text-slate-600 dark:text-slate-400">
            Ocupación Actual
          </p>
          <p class="text-3xl font-bold text-green-600 dark:text-green-400">
            {{ averageOccupancy }}%
          </p>
          <p class="text-xs text-green-600 dark:text-green-400">
            {{ occupiedRooms }} de {{ totalRooms }} habitaciones
          </p>
        </div>
      </CCard>

      <CCard class="metric-card">
        <div class="space-y-2">
          <p class="text-sm font-medium text-slate-600 dark:text-slate-400">
            Habitaciones Disponibles
          </p>
          <p class="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {{ availableRooms }}
          </p>
          <p class="text-xs text-blue-600 dark:text-blue-400">
            Listas para vender
          </p>
        </div>
      </CCard>

      <CCard class="metric-card">
        <div class="space-y-2">
          <p class="text-sm font-medium text-slate-600 dark:text-slate-400">
            En Mantenimiento
          </p>
          <p class="text-3xl font-bold text-amber-600 dark:text-amber-400">
            {{ maintenanceRooms }}
          </p>
          <p class="text-xs text-amber-600 dark:text-amber-400">
            No disponibles
          </p>
        </div>
      </CCard>

      <CCard class="metric-card">
        <div class="space-y-2">
          <p class="text-sm font-medium text-slate-600 dark:text-slate-400">
            Reservadas
          </p>
          <p class="text-3xl font-bold text-purple-600 dark:text-purple-400">
            {{ reservedRooms }}
          </p>
          <p class="text-xs text-purple-600 dark:text-purple-400">
            Habitaciones con reserva
          </p>
        </div>
      </CCard>
    </div>

    <!-- Gráficos -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <CCard title="Distribución actual">
        <div class="report-distribution"><div v-for="state in [{ label: 'Disponibles', count: availableRooms, color: '#8abbac' }, { label: 'Ocupadas', count: occupiedRooms, color: '#6975dd' }, { label: 'Reservadas', count: reservedRooms, color: '#b9bfea' }, { label: 'Mantenimiento', count: maintenanceRooms, color: '#e1cda7' }]" :key="state.label"><div><span>{{ state.label }}</span><strong>{{ state.count }}</strong></div><div class="distribution-track"><span :style="{ width: `${totalRooms ? state.count / totalRooms * 100 : 0}%`, background: state.color }" /></div></div></div>
      </CCard>

      <!-- Ocupación por Tipo -->
      <CCard>
        <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Ocupación por Tipo de Habitación
        </h3>
        <div class="space-y-3">
          <div v-for="type in roomTypes" :key="type.name">
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm font-medium text-slate-600 dark:text-slate-400">
                {{ type.name }}
              </span>
              <span class="text-sm font-bold text-slate-900 dark:text-white">
                {{ type.occupancy }}%
              </span>
            </div>
            <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div
                class="bg-blue-500 h-2 rounded-full"
                :style="{ width: type.occupancy + '%' }"
              />
            </div>
          </div>
        </div>
      </CCard>
    </div>

    <p class="text-sm">La ocupación refleja huéspedes alojados actualmente. Una reserva futura no cuenta como ocupación.</p>
    <!-- Tabla de Ocupación por Habitación -->
    <CCard>
      <h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
        Detalle de Ocupación por Habitación
      </h2>

      <CTableHint /><div v-if="!isLoading && !errorMessage" class="overflow-x-auto" tabindex="0" role="region" aria-label="Resultados">
        <table class="table-data-centered w-full text-sm">
          <thead class="border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th scope="col" class="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">
                Habitación
              </th>
              <th scope="col" class="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">
                Tipo
              </th>
              <th scope="col" class="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">
                Piso
              </th>
              <th scope="col" class="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">
                Estado
              </th>
              <th scope="col" class="text-center py-3 px-4 font-semibold text-slate-900 dark:text-white">
                Ocupación
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
            <tr
              v-for="room in visibleRoomDetails"
              :key="room.id"
              class="hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
              <td class="py-3 px-4 font-medium text-slate-900 dark:text-white">
                #{{ room.number }}
              </td>
              <td class="py-3 px-4 text-slate-600 dark:text-slate-400">
                {{ room.room_type_name || 'Sin tipo' }}
              </td>
              <td class="py-3 px-4 text-slate-600 dark:text-slate-400">
                {{ room.floor }}
              </td>
              <td class="py-3 px-4">
                <span
                  :class="getStatusBadgeColor(room.status)"
                  class="px-2 py-1 rounded text-xs font-medium"
                >
                  {{ getStatusLabel(room.status) }}
                </span>
              </td>
              <td class="py-3 px-4 text-center">
                <div class="flex items-center gap-2 justify-center">
                  <div class="w-20 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div
                      class="bg-blue-500 h-2 rounded-full"
                      :style="{ width: room.occupancy + '%' }"
                    />
                  </div>
                  <span class="text-xs font-medium">{{ room.occupancy }}%</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <CEmptyState v-if="!isLoading && !errorMessage && !filteredRoomDetails.length" title="No hay habitaciones para este filtro" />
      <CTablePagination :pagination="pagination" :loading="isLoading" @change="page=$event" />
    </CCard>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import type { Room } from '~/types';
import { useApiClient } from '~/services/api';
import { getTodayDateOnly } from '~/utils/dates';

const { settings: operatingSettings } = useHotelSettings();

definePageMeta({ middleware: ['auth', 'manager'] });

const api = useApiClient();
const rooms = ref<Room[]>([]);
const occupancy = ref<{ total_rooms: string; occupied: string; available: string; maintenance: string; reserved: string } | null>(null);
const selectedRoomType = ref('');
const isLoading = ref(true);
const errorMessage = ref('');

const totalRooms = computed(() => Number(occupancy.value?.total_rooms || 0));
const occupiedRooms = computed(() => Number(occupancy.value?.occupied || 0));
const availableRooms = computed(() => Number(occupancy.value?.available || 0));
const maintenanceRooms = computed(() => Number(occupancy.value?.maintenance || 0));
const reservedRooms = computed(() => Number(occupancy.value?.reserved || 0));
const averageOccupancy = computed(() => totalRooms.value
  ? Math.round(occupiedRooms.value / totalRooms.value * 100)
  : 0
);

const roomDetails = computed(() => rooms.value.map(room => ({
  ...room,
  occupancy: room.status === 'occupied' ? 100 : 0
})));
const page=ref(1);
const filteredRoomDetails = computed(() => roomDetails.value.filter(room =>
  !selectedRoomType.value || room.room_type_name === selectedRoomType.value
));
const visibleRoomDetails=computed(()=>filteredRoomDetails.value.slice((page.value-1)*20,page.value*20));
const pagination=computed(()=>({page:page.value,pageSize:20,total:filteredRoomDetails.value.length,totalPages:Math.ceil(filteredRoomDetails.value.length/20)}));
watch(selectedRoomType,()=>{page.value=1});
const roomTypes = computed(() => {
  const groups = new Map<string, { name: string; count: number; occupied: number }>();
  for (const room of roomDetails.value) {
    const name = room.room_type_name || 'Sin tipo';
    const group = groups.get(name) || { name, count: 0, occupied: 0 };
    group.count += 1;
    if (room.status === 'occupied') group.occupied += 1;
    groups.set(name, group);
  }
  return [...groups.values()].map(group => ({
    name: group.name,
    occupancy: group.count ? Math.round(group.occupied / group.count * 100) : 0
  }));
});

const loadReport = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const today = getTodayDateOnly(operatingSettings.value.timezone);
    const [summary, roomResponse] = await Promise.all([
      api.getDashboardSummary(today, today),
      (async()=>{const data:Room[]=[];let page=1,totalPages=1;do{const response=await api.getRooms(page++,100);data.push(...(response.data||[]));totalPages=response.pagination.totalPages}while(page<=totalPages);return {data}})()
    ]);
    occupancy.value = summary.data?.occupancy || null;
    rooms.value = roomResponse.data || [];
  } catch {
    errorMessage.value = 'No se pudo cargar el estado de ocupación.';
  } finally {
    isLoading.value = false;
  }
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    available: 'Disponible',
    occupied: 'Ocupada',
    maintenance: 'Mantenimiento',
    reserved: 'Reservada'
  }
  return labels[status] || status
}

const getStatusBadgeColor = (status: string) => {
  const colors: Record<string, string> = {
    available: 'status-badge status-available',
    occupied: 'status-badge status-occupied',
    maintenance: 'status-badge status-maintenance',
    reserved: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
  }
  return colors[status] || colors.available
}

const downloadReport = () => {
  const rows = [
    ['Habitación', 'Tipo', 'Piso', 'Estado', 'Ocupación'],
    ...filteredRoomDetails.value.map(room => [
      room.number, room.room_type_name || '', String(room.floor ?? ''), room.status, `${room.occupancy}%`
    ])
  ];
  const csv = rows.map(row => row.map(value => `"${value.replaceAll('"', '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `reporte-ocupacion-${getTodayDateOnly(operatingSettings.value.timezone)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

onMounted(loadReport);
</script>