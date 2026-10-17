<template><div class="empty-state-panel"><span class="empty-state-icon"><Icon :name="icon || 'system-uicons:inbox'" /></span><h3>{{ title }}</h3><p v-if="description">{{ description }}</p><slot /></div></template>
<script setup lang="ts">
defineProps<{ title: string; description?: string; icon?: string }>();
</script>
