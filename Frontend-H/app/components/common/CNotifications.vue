<template>
  <Teleport to="body"><div class="notification-stack" aria-label="Avisos del sistema"><div v-for="notice in uiStore.notifications.slice(-3)" :key="notice.id" class="notification-toast" :class="`notice-${notice.type}`" :role="notice.type === 'error' ? 'alert' : 'status'"><Icon :name="notice.type === 'error' ? 'system-uicons:warning-circle' : 'system-uicons:check-circle'" /><p>{{ notice.message }}</p><button class="icon-button" aria-label="Descartar aviso" @click="uiStore.removeNotification(notice.id)"><Icon name="system-uicons:cross" /></button></div></div></Teleport>
</template>
<script setup lang="ts">
const uiStore = useUiStore();
</script>
<style scoped>
.notification-stack { position: fixed; right: 24px; bottom: 24px; width: min(380px, calc(100% - 32px)); display: flex; flex-direction: column; gap: 10px; z-index: 3000; pointer-events: none; }
.notification-toast { display: flex; align-items: center; gap: 11px; padding: 12px 10px 12px 16px; background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 9px; box-shadow: 0 8px 30px #11182715; pointer-events: auto; }
.notification-toast > :first-child { color: var(--success); font-size: 19px; flex-shrink: 0; }
.notification-toast.notice-error > :first-child { color: var(--danger); }
.notification-toast p { flex: 1; font-size: 12px; margin: 0; }
</style>
