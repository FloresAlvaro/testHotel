<template>
  <div class="sr-only">Redirigiendo al dashboard...</div>
</template>

<script setup lang="ts">
const authStore = useAuthStore();
if (import.meta.client) {
  await navigateTo(getDefaultRouteForRole(authStore.user?.role), { replace: true });
}
</script>
