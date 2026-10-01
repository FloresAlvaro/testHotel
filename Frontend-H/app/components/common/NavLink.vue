<template>
  <NuxtLink :to="href" class="nav-link" :class="{ active }">
    <span class="nav-link-icon" aria-hidden="true">{{ icon }}</span>
    <span>{{ label }}</span>
  </NuxtLink>
</template>

<script setup lang="ts">
defineProps<{
  icon: string;
  label: string;
  href: string;
  active?: boolean;
}>();
</script>

<style scoped>
.nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  color: var(--text-primary);
  text-decoration: none;
  border-left: 3px solid transparent;
  transition: background-color 160ms ease, color 160ms ease;
}

.nav-link:hover {
  background: var(--bg-secondary);
}

.nav-link.active {
  color: #2563eb;
  background: rgba(37, 99, 235, 0.1);
  border-left-color: #2563eb;
  font-weight: 600;
}

.nav-link-icon {
  width: 1.5rem;
  flex: 0 0 1.5rem;
  text-align: center;
}
</style>