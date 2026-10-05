<template>
  <CCard title="Reservas">
    <template #header-action>
      <CButton variant="primary" size="sm" icon="➕" @click="$emit('add')">
        Nueva
      </CButton>
    </template>

    <CTable
      :columns="columns"
      :rows="reservations"
      :pagination="pagination"
      :show-pagination="true"
      @prev-page="$emit('prev-page')"
      @next-page="$emit('next-page')"
    >
      <template #cell-status="{ value }">
        <span :class="['status-badge', `status-${value}`]">
          {{ RESERVATION_STATUS_LABELS[String(value)] || value }}
        </span>
      </template>

      <template #cell-check_in="{ value }">
        {{ formatDate(String(value || ''), 'DD/MM/YYYY') }}
      </template>

      <template #cell-check_out="{ value }">
        {{ formatDate(String(value || ''), 'DD/MM/YYYY') }}
      </template>

      <template #actions="{ row }">
        <CButton variant="primary" size="sm" icon="🔑" @click="$emit('checkin', row.id)">
          Check-in
        </CButton>
        <CButton variant="ghost" size="sm" icon="✏️" @click="$emit('edit', row.id)">
          Ver
        </CButton>
      </template>
    </CTable>
  </CCard>
</template>

<script setup lang="ts">
import type { Pagination, Reservation } from '~/types';
import { RESERVATION_STATUS_LABELS } from '~/utils/constants';
import { formatDate } from '~/utils/formatters';

interface Props {
  reservations: Reservation[];
  pagination: Pick<Pagination, 'page' | 'pageSize' | 'total' | 'totalPages'>;
}

defineProps<Props>();
defineEmits<{
  add: [];
  edit: [id: number];
  checkin: [id: number];
  'prev-page': [];
  'next-page': [];
}>();

const columns = [
  { key: 'client_name', label: 'Cliente' },
  { key: 'room_number', label: 'Habitación' },
  { key: 'check_in', label: 'Check-in' },
  { key: 'check_out', label: 'Check-out' },
  { key: 'status', label: 'Estado' }
];
</script>

<style scoped lang="scss" src="./TReservationsTable.scss"></style>