<template>
  <UApp>
    <div>
      <NuxtRouteAnnouncer />
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
</script>
