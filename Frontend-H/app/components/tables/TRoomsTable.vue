<template>
  <CCard title="Habitaciones">
    <template #header-action>
      <CButton variant="primary" size="sm" icon="➕" @click="$emit('add')">
        Nueva
      </CButton>
    </template>

    <CTable
      :columns="columns"
      :rows="rooms"
      :pagination="pagination"
      :show-pagination="true"
      @sort="handleSort"
      @prev-page="$emit('prev-page')"
      @next-page="$emit('next-page')"
    >
      <template #cell-status="{ value }">
        <span :class="['status-badge', `status-${value}`]">
          {{ getRoomStatusLabel(String(value || '')) }}
        </span>
      </template>

      <template #actions="{ row }">
        <CButton variant="secondary" size="sm" icon="✏️" @click="$emit('edit', row.id)">
          Editar
        </CButton>
        <CButton variant="ghost" size="sm" icon="⚙️" @click="$emit('maintenance', row.id)">
          Mantenimiento
        </CButton>
      </template>
    </CTable>
  </CCard>
</template>

<script setup lang="ts">
import type { Pagination, Room } from '~/types';
import { ROOM_STATUS_LABELS } from '~/utils/constants';

interface Props {
  rooms: Room[];
  pagination: Pick<Pagination, 'page' | 'pageSize' | 'total' | 'totalPages'>;
}

defineProps<Props>();
const emit = defineEmits<{
  add: [];
  edit: [id: number];
  maintenance: [id: number];
  sort: [column: string];
  'prev-page': [];
  'next-page': [];
}>();

const columns = [
  { key: 'number', label: 'Número', sortable: true },
  { key: 'floor', label: 'Piso' },
  { key: 'status', label: 'Estado' },
  { key: 'room_type_name', label: 'Tipo' }
];

const getRoomStatusLabel = (status: string) => {
  return ROOM_STATUS_LABELS[status] || status;
};

const handleSort = (column: string) => emit('sort', column);
</script>

<style scoped lang="scss" src="./TRoomsTable.scss"></style>