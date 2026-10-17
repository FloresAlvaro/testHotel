<template>
  <UApp>
    <div>
      <NuxtRouteAnnouncer />
      <CNotifications />
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </div>
  </UApp>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';

const uiStore = useUiStore();
onMounted(() => uiStore.loadTheme());
watch(() => uiStore.theme, (theme) => {
  if (import.meta.client) document.documentElement.classList.toggle('dark', theme === 'dark');
}, { immediate: true });
</script>
