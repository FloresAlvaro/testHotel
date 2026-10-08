<template>
  <Teleport to="body">
    <section class="notification-stack" aria-label="Notificaciones">
      <div
v-for="notice in uiStore.notifications" :key="notice.id" class="notification" :data-type="notice.type"
        :role="notice.type === 'error' ? 'alert' : 'status'">
        <p>{{ notice.message }}</p>
        <button type="button" aria-label="Descartar notificación" @click="uiStore.removeNotification(notice.id)">✕</button>
      </div>
    </section>
  </Teleport>
</template>

<script setup lang="ts">
const uiStore = useUiStore();
</script>

<style scoped src="~/assets/styles/components/common/notifications.css"></style>
