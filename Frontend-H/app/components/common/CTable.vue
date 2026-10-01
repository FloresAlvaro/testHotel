<template>
  <div class="table-wrapper">
    <div v-if="$slots['toolbar']" class="table-toolbar">
      <slot name="toolbar" />
    </div>

    <table class="table">
      <thead>
        <tr>
          <th v-for="col in columns" :key="col.key" :style="{ width: col.width }">
            <div class="th-content">
              <span>{{ col.label }}</span>
              <button v-if="col.sortable" class="sort-btn" @click="handleSort(col.key)">
                📊
              </button>
            </div>
          </th>
          <th v-if="$slots['actions']" class="actions-col">Acciones</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="(row, index) in rows" :key="index" class="table-row">
          <td v-for="col in columns" :key="col.key">
            <slot :name="`cell-${col.key}`" :row="row" :value="getCellValue(row, col.key)">
              {{ getCellValue(row, col.key) }}
            </slot>
          </td>
          <td v-if="$slots['actions']" class="actions-cell">
            <slot name="actions" :row="row" />
          </td>
        </tr>

        <tr v-if="rows.length === 0" class="empty-row">
          <td :colspan="columns.length + ($slots['actions'] ? 1 : 0)">
            <div class="empty-state">
              <p>{{ emptyText }}</p>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="showPagination && pagination" class="table-pagination">
      <span class="pagination-info">
        Mostrando {{ pagination.page * pagination.pageSize - pagination.pageSize + 1 }}
        -
        {{ Math.min(pagination.page * pagination.pageSize, pagination.total) }}
        de {{ pagination.total }}
      </span>

      <div class="pagination-controls">
        <button
          :disabled="pagination.page === 1"
          class="pagination-btn"
          @click="$emit('prev-page')"
        >
          ← Anterior
        </button>

        <span class="pagination-pages">
          Página {{ pagination.page }} de {{ pagination.totalPages }}
        </span>

        <button
          :disabled="pagination.page >= pagination.totalPages"
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
  emptyText?: string;
  showPagination?: boolean;
  pagination?: Pagination | null;
}

withDefaults(defineProps<Props>(), {
  emptyText: 'No hay datos disponibles',
  showPagination: false,
  pagination: null
});

const emit = defineEmits<{
  sort: [column: string];
  'prev-page': [];
  'next-page': [];
}>();

const handleSort = (column: string) => {
  emit('sort', column);
};

const getCellValue = (row: T, key: string): string | number | boolean | null | undefined => {
  return (row as Record<string, string | number | boolean | null | undefined>)[key];
};
</script>

<style scoped lang="scss">
.table-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 12px;
  overflow: hidden;
}

.table-toolbar {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color, #e0e0e0);
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

thead {
  background: var(--bg-primary, #f5f5f5);
  border-bottom: 2px solid var(--border-color, #e0e0e0);
}

th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: var(--text-primary, #1a1a1a);
  user-select: none;
}

.th-content {
  display: flex;
  align-items: center;
  gap: 8px;

  .sort-btn {
    background: none;
    border: none;
    cursor: pointer;
    opacity: 0.6;
    transition: opacity 0.2s;

    &:hover {
      opacity: 1;
    }
  }
}

.table-row {
  border-bottom: 1px solid var(--border-color, #e0e0e0);
  transition: background 0.2s;

  &:hover {
    background: rgba(59, 130, 246, 0.02);
  }
}

td {
  padding: 12px 16px;
  color: var(--text-primary, #1a1a1a);
}

.actions-col,
.actions-cell {
  text-align: right;
  width: 120px;
}

.empty-row {
  &:hover {
    background: transparent;
  }

  td {
    padding: 40px 16px;
  }
}

.empty-state {
  text-align: center;
  color: var(--text-secondary, #999999);

  p {
    margin: 0;
  }
}

.table-pagination {
  padding: 12px 16px;
  border-top: 1px solid var(--border-color, #e0e0e0);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  background: var(--bg-primary, #f5f5f5);
  font-size: 0.9rem;
}

.pagination-info {
  color: var(--text-secondary, #999999);
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pagination-btn {
  padding: 6px 12px;
  border: 1px solid var(--border-color, #e0e0e0);
  background: var(--bg-secondary, #ffffff);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.pagination-pages {
  color: var(--text-primary, #1a1a1a);
  font-weight: 500;
}
</style>