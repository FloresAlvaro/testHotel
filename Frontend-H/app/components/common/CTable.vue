<template>
  <div class="table-wrapper">
    <div v-if="$slots['toolbar']" class="table-toolbar">
      <slot name="toolbar" />
    </div>

    <div class="table-scroll" tabindex="0" role="region" aria-label="Tabla de resultados">
    <table class="table">
      <thead>
        <tr>
          <th v-for="col in columns" :key="col.key" :style="{ width: col.width }">
            <div class="th-content">
              <span>{{ col.label }}</span>
              <button v-if="col.sortable" :aria-label="`Ordenar por ${col.label}`" class="sort-btn" @click="handleSort(col.key)">
                <Icon name="system-uicons:sort" aria-hidden="true" />
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
    </div>

    <div v-if="showPagination && pagination" class="table-pagination">
      <span class="pagination-info">
        Mostrando {{ pagination.total === 0 ? 0 : pagination.page * pagination.pageSize - pagination.pageSize + 1 }}
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
          Página {{ pagination.page }} de {{ Math.max(1, pagination.totalPages) }}
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

<style scoped>

.table-wrapper { border: 1px solid var(--border-color); border-radius: 10px; background: var(--bg-secondary); overflow: hidden; }
.table-scroll { overflow-x: auto; }
.table { min-width: 560px; }
.table-toolbar { padding: 16px 20px; border-bottom: 1px solid var(--border-color); }
.th-content { display: flex; align-items: center; justify-content: center; gap: 6px; }
.sort-btn { display: inline-flex; border: 0; background: transparent; color: var(--text-tertiary); font-size: 16px; }
.actions-col, .actions-cell { text-align: center; }
.empty-state { padding: 36px 16px; text-align: center; color: var(--text-secondary); }
.table-pagination { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; border-top: 1px solid var(--border-color); padding: 14px 18px; font-size: 11px; color: var(--text-secondary); }
.pagination-controls { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
.pagination-btn { border: 1px solid var(--border-color); border-radius: 6px; background: var(--bg-secondary); color: var(--text-primary); padding: 6px 10px; }
.pagination-btn:disabled { opacity: .4; }

</style>
