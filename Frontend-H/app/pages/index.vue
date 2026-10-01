<template>
  <div class="sr-only">Redirigiendo al dashboard...</div>
</template>

<script setup lang="ts">
await navigateTo('/dashboard', { replace: true });
</script>
