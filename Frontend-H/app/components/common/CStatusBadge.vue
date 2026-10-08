<template>
  <span class="status-badge" :data-tone="tone"><slot /></span>
</template>

<script setup lang="ts">
const props = defineProps<{ status: string }>();
const tones: Record<string, string> = {
  available: 'success', checked_in: 'success', completed: 'success',
  occupied: 'info', confirmed: 'info', maintenance: 'warning', pending: 'warning',
  cancelled: 'danger', failed: 'danger', reserved: 'orange',
  checked_out: 'neutral', refunded: 'neutral',
};
const tone = computed(() => tones[props.status] || 'neutral');
</script>

<style scoped src="~/assets/styles/components/common/status-badge.css"></style>
