<template>
  <header class="header">
    <div class="header-left">
      <slot name="left">
        <button class="header-menu-btn" @click="$emit('toggle-sidebar')">☰</button>
        <h1 class="header-title">{{ title }}</h1>
      </slot>
    </div>

    <div class="header-right">
      <slot name="right" />
    </div>
  </header>
</template>

<script setup lang="ts">
interface Props {
  title?: string;
}

defineProps<Props>();
defineEmits<{
  'toggle-sidebar': [];
}>();
</script>

<style scoped lang="scss">
.header {
  background: var(--bg-secondary, #ffffff);
  border-bottom: 1px solid var(--border-color, #e0e0e0);
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-menu-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  display: none;

  @media (max-width: 768px) {
    display: block;
  }
}

.header-title {
  margin: 0;
  font-size: 1.5rem;
  color: var(--text-primary, #1a1a1a);
}
</style>