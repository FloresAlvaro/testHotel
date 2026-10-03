<template>
  <NuxtLink :to="href" class="nav-link" :class="{ active }">
    <Icon :name="icon" class="nav-link-icon" aria-hidden="true" />
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
  gap: 10px;
  padding: 9px 16px;
  color: var(--text-secondary);
  text-decoration: none;
  border-left: 3px solid transparent;
  transition: background-color 160ms ease, color 160ms ease;
  font-size: 0.84rem;
}

.nav-link:hover {
  background: var(--bg-primary);
  color: var(--text-primary);
}

.nav-link.active {
  color: #2563eb;
  background: #eff6ff;
  border-left-color: #2563eb;
  font-weight: 600;
}

.nav-link-icon {
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
}

:global(.dark) .nav-link.active {
  background: rgba(37, 99, 235, 0.14);
}
</style>