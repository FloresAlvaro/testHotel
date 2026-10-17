<template>
  <div class="stat-card"><div class="stat-card-heading"><span>{{ label }}</span><Icon v-if="icon" :name="icon" aria-hidden="true" /></div><p class="stat-card-value">{{ value }}</p><p v-if="detail" class="stat-card-detail">{{ detail }}</p><slot /></div>
</template>
<script setup lang="ts">
defineProps<{ label: string; value: string | number; detail?: string; icon?: string }>();
</script>
