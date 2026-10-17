<template>
  <header class="page-heading">
    <div class="page-heading-copy"><NuxtLink v-if="backTo" :to="backTo" class="page-back"><Icon name="system-uicons:arrow-left" />Volver</NuxtLink><p v-if="eyebrow" class="page-eyebrow">{{ eyebrow }}</p><h1>{{ title }}</h1><p v-if="description" class="page-description">{{ description }}</p></div>
    <div v-if="$slots.default" class="page-heading-actions"><slot /></div>
  </header>
</template>
<script setup lang="ts">
defineProps<{ title: string; description?: string; eyebrow?: string; backTo?: string }>();
</script>
