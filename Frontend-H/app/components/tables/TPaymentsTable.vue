<template>
  <CCard title="Pagos">
    <CTable
      :columns="columns"
      :rows="payments"
      :pagination="pagination"
      :show-pagination="true"
      @prev-page="$emit('prev-page')"
      @next-page="$emit('next-page')"
    >
      <template #cell-amount="{ value }">
        {{ formatCurrency(Number(value || 0)) }}
      </template>

      <template #cell-status="{ value }">
        <CStatusBadge :status="String(value || '')">
          {{ PAYMENT_STATUS_LABELS[String(value)] || value }}
        </CStatusBadge>
      </template>

      <template #cell-created_at="{ value }">
        {{ formatDate(String(value || ''), 'DD/MM/YYYY HH:mm') }}
      </template>

      <template #actions="{ row }">
        <CButton variant="secondary" size="sm" icon="👁️" @click="$emit('view', row.id)">
          Ver
        </CButton>
        <CButton
          v-if="row.status === 'pending'"
          variant="success"
          size="sm"
          icon="✓"
          @click="$emit('complete', row.id)"
        >
          Completar
        </CButton>
      </template>
    </CTable>
  </CCard>
</template>

<script setup lang="ts">
import type { Payment, Pagination } from '~/types';
import { PAYMENT_STATUS_LABELS } from '~/utils/constants';
import { formatCurrency, formatDate } from '~/utils/formatters';

interface Props {
  payments: Payment[];
  pagination: Pick<Pagination, 'page' | 'pageSize' | 'total' | 'totalPages'>;
}

defineProps<Props>();
defineEmits<{
  view: [id: number];
  complete: [id: number];
  'prev-page': [];
  'next-page': [];
}>();

const columns = [
  { key: 'reservation_id', label: 'Reserva' },
  { key: 'amount', label: 'Monto' },
  { key: 'method', label: 'Método' },
  { key: 'status', label: 'Estado' },
  { key: 'created_at', label: 'Fecha' }
];
</script>
