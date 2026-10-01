<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-slate-900 dark:text-white">
          Reporte de Ocupación
        </h1>
        <p class="text-slate-600 dark:text-slate-400 mt-1">
          Análisis de disponibilidad y ocupancia
        </p>
      </div>
      <div class="flex gap-2">
        <CButton variant="secondary" :disabled="isLoading || roomDetails.length === 0" @click="downloadReport">
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
            Tipo de Habitación
          </label>
          <select
            v-model="selectedRoomType"
            class="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los Tipos</option>
            <option v-for="type in roomTypes" :key="type.name" :value="type.name">{{ type.name }}</option>
          </select>
        </div>
      </div>
    </CCard>

    <!-- Estadísticas Principales -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <CCard class="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30">
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

      <CCard class="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30">
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

      <CCard class="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30">
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

      <CCard class="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30">
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
      <!-- Ocupación por Día -->
      <CCard>
        <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Ocupación por Día
        </h3>
        <div class="h-80 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
          <div class="text-center">
            <Icon
              name="system-uicons:chart"
              size="48"
              class="mx-auto text-slate-400 mb-2"
            />
            <p class="text-slate-500 dark:text-slate-400">
              Gráfico de ocupación por día
            </p>
          </div>
        </div>
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

    <!-- Estados de Habitaciones -->
    <CCard>
      <h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
        Resumen por Estado
      </h2>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-700">
          <p class="text-sm font-medium text-green-700 dark:text-green-300">
            Disponibles
          </p>
          <p class="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
            {{ availableRooms }}
          </p>
        </div>

        <div class="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
          <p class="text-sm font-medium text-blue-700 dark:text-blue-300">
            Ocupadas
          </p>
          <p class="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">
            {{ occupiedRooms }}
          </p>
        </div>

        <div class="p-4 bg-amber-50 dark:bg-amber-900/30 rounded-lg border border-amber-200 dark:border-amber-700">
          <p class="text-sm font-medium text-amber-700 dark:text-amber-300">
            Mantenimiento
          </p>
          <p class="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">
            {{ maintenanceRooms }}
          </p>
        </div>

        <div class="p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-700">
          <p class="text-sm font-medium text-purple-700 dark:text-purple-300">
            Reservadas
          </p>
          <p class="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-2">
            {{ reservedRooms }}
          </p>
        </div>
      </div>
    </CCard>

    <!-- Tabla de Ocupación por Habitación -->
    <CCard>
      <h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
        Detalle de Ocupación por Habitación
      </h2>

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th class="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">
                Habitación
              </th>
              <th class="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">
                Tipo
              </th>
              <th class="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">
                Piso
              </th>
              <th class="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">
                Estado
              </th>
              <th class="text-center py-3 px-4 font-semibold text-slate-900 dark:text-white">
                Ocupación
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
            <tr
              v-for="room in filteredRoomDetails"
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
    </CCard>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import type { Room } from '~/types';
import { useApiClient } from '~/services/api';
import { getTodayDateOnly } from '~/utils/dates';

definePageMeta({ middleware: ['auth', 'manager'] });

const api = useApiClient();
const rooms = ref<Room[]>([]);
const occupancy = ref<{ total_rooms: string; occupied: string; available: string; maintenance: string; reserved: string } | null>(null);
const selectedRoomType = ref('');
const isLoading = ref(false);
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
  occupancy: room.status === 'occupied' ? 100 : room.status === 'reserved' ? 100 : 0
})));
const filteredRoomDetails = computed(() => roomDetails.value.filter(room =>
  !selectedRoomType.value || room.room_type_name === selectedRoomType.value
));
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
    const today = getTodayDateOnly();
    const [summary, roomResponse] = await Promise.all([
      api.getDashboardSummary(today, today),
      api.getRooms(1, 100)
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
    available: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    occupied: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    maintenance: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
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
  link.download = `reporte-ocupacion-${getTodayDateOnly()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

onMounted(loadReport);
</script>