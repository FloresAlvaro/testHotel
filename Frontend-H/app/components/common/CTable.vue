<template>
  <div class="table-wrapper" :aria-busy="loading || undefined">
    <div v-if="$slots['toolbar']" class="table-toolbar">
      <slot name="toolbar" />
    </div>

    <div class="table-scroll">
    <table class="table">
      <thead>
        <tr>
          <th v-for="col in columns" :key="col.key" scope="col" :style="{ width: col.width }">
            <div class="th-content">
              <span>{{ col.label }}</span>
              <button v-if="col.sortable" type="button" :aria-label="`Ordenar por ${col.label}`" class="sort-btn" @click="handleSort(col.key)">
                📊
              </button>
            </div>
          </th>
          <th v-if="$slots['actions']" class="actions-col">Acciones</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="row in rows" :key="getRowKey(row)" class="table-row">
          <td v-for="col in columns" :key="col.key">
            <slot :name="`cell-${col.key}`" :row="row" :value="getCellValue(row, col.key)">
              {{ getCellValue(row, col.key) }}
            </slot>
          </td>
          <td v-if="$slots['actions']" class="actions-cell">
            <slot name="actions" :row="row" />
          </td>
        </tr>

        <tr v-if="loading"><td :colspan="columns.length + ($slots['actions'] ? 1 : 0)" role="status">Cargando…</td></tr>
        <tr v-else-if="error"><td :colspan="columns.length + ($slots['actions'] ? 1 : 0)" role="alert">{{ error }}</td></tr>
        <tr v-else-if="rows.length === 0" class="empty-row">
          <td :colspan="columns.length + ($slots['actions'] ? 1 : 0)">
            <div class="empty-state">
              <p>{{ emptyText }}</p>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    </div>

    <div v-if="showPagination && pagination" class="table-pagination">
      <span class="pagination-info">
        Mostrando {{ pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1 }}
        -
        {{ Math.min(pagination.page * pagination.pageSize, pagination.total) }}
        de {{ pagination.total }}
      </span>

      <div class="pagination-controls">
        <button
          :disabled="loading || pagination.page <= 1"
          class="pagination-btn"
          @click="$emit('prev-page')"
        >
          ← Anterior
        </button>

        <span class="pagination-pages">
          Página {{ pagination.page }} de {{ Math.max(1, pagination.totalPages) }}
        </span>

        <button
          :disabled="loading || pagination.page >= pagination.totalPages"
          class="pagination-btn"
          @click="$emit('next-page')"
        >
          Siguiente →
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends object">
interface Column {
  key: string;
  label: string;
  width?: string;
  sortable?: boolean;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface Props {
  columns: Column[];
  rows: T[];
  rowKey?: string | ((row: T) => string | number);
  loading?: boolean;
  error?: string;
  emptyText?: string;
  showPagination?: boolean;
  pagination?: Pagination | null;
}

const props = withDefaults(defineProps<Props>(), {
  rowKey: 'id',
  loading: false,
  error: '',
  emptyText: 'No hay datos disponibles',
  showPagination: false,
  pagination: null
});

const emit = defineEmits<{
  sort: [column: string];
  'prev-page': [];
  'next-page': [];
}>();

const getRowKey = (row: T): string | number => {
  const key = typeof props.rowKey === 'function' ? props.rowKey(row) : (row as Record<string, unknown>)[props.rowKey];
  if (typeof key !== 'string' && typeof key !== 'number') throw new Error('CTable requiere una clave unica por fila');
  return key;
};
const handleSort = (column: string) => {
  emit('sort', column);
};

const getCellValue = (row: T, key: string): string | number | boolean | null | undefined => {
  return (row as Record<string, string | number | boolean | null | undefined>)[key];
};
</script>

<style scoped lang="scss" src="~/assets/styles/components/common/CTable.scss"></style>