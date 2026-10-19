<template>
  <nav v-if="pagination.total > 0" class="table-pager" :aria-label="label">
    <span>{{ start }}–{{ Math.min(pagination.page*pagination.pageSize,pagination.total) }} de {{ pagination.total }} resultados</span>
    <div><CButton variant="secondary" :disabled="loading||pagination.page<=1" @click="$emit('change',pagination.page-1)">Anterior</CButton><span aria-live="polite">Página {{ pagination.page }} de {{ Math.max(1,pagination.totalPages) }}</span><CButton variant="secondary" :disabled="loading||pagination.page>=pagination.totalPages" @click="$emit('change',pagination.page+1)">Siguiente</CButton></div>
  </nav>
</template>
<script setup lang="ts">
const props=withDefaults(defineProps<{pagination:{page:number;pageSize:number;total:number;totalPages:number};loading?:boolean;label?:string}>(),{loading:false,label:'Paginación de resultados'})
defineEmits<{change:[page:number]}>()
const start=computed(()=>(props.pagination.page-1)*props.pagination.pageSize+1)
</script>
<style scoped>.table-pager,.table-pager>div{display:flex;align-items:center;flex-wrap:wrap;gap:12px}.table-pager{justify-content:space-between;margin-top:18px;font-size:13px}.table-pager>span{color:var(--text-secondary)}</style>
