<template>
  <CCard v-if="true" title="Clientes">
    <template #header-action>
      <CButton variant="primary" size="sm" icon="➕" @click="$emit('add')">
        Nuevo
      </CButton>
    </template>

    <CTable
      :columns="columns"
      :rows="clients"
      :pagination="pagination"
      :show-pagination="true"
      @sort="handleSort"
      @prev-page="$emit('prev-page')"
      @next-page="$emit('next-page')"
    >
      <template #cell-document="{ value }">
        {{ formatDocument(String(value || '')) }}
      </template>

      <template #cell-created_at="{ value }">
        {{ formatDate(String(value || ''), 'DD/MM/YYYY') }}
      </template>

      <template #actions="{ row }">
        <CButton
          variant="secondary"
          size="sm"
          icon="✏️"
          @click="$emit('edit', row.id)"
        >
          Editar
        </CButton>
        <CButton
          variant="danger"
          size="sm"
          icon="🗑️"
          @click="$emit('delete', row.id)"
        >
          Eliminar
        </CButton>
      </template>
    </CTable>
  </CCard>
</template>

<script setup lang="ts">
import type { Client, Pagination } from '~/types';
import { formatDocument, formatDate } from '~/utils/formatters';

interface Props {
  clients: Client[];
  pagination: Pick<Pagination, 'page' | 'pageSize' | 'total' | 'totalPages'>;
  loading?: boolean;
}

defineProps<Props>();
const emit = defineEmits<{
  add: [];
  edit: [id: number];
  delete: [id: number];
  'prev-page': [];
  'next-page': [];
  sort: [column: string];
}>();

const columns = [
  { key: 'name', label: 'Nombre', sortable: true },
  { key: 'email', label: 'Email', width: '200px' },
  { key: 'phone', label: 'Teléfono' },
  { key: 'document', label: 'Documento' },
  { key: 'created_at', label: 'Registrado' }
];

const handleSort = (column: string) => emit('sort', column);
</script>