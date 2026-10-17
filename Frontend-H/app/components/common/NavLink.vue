<template>
  <NuxtLink :to="href" class="workspace-navlink" :class="{ 'is-current': active }" :aria-current="active ? 'page' : undefined">
    <Icon :name="icon" class="workspace-navlink-icon" aria-hidden="true" /><span>{{ label }}</span><span v-if="active" class="workspace-navlink-marker" aria-hidden="true" />
  </NuxtLink>
</template>

<script setup lang="ts">
defineProps<{ icon: string; label: string; href: string; active?: boolean }>();
</script>

<style scoped>
.workspace-navlink { min-height: 39px; display: flex; align-items: center; gap: 10px; padding: 9px 12px; margin: 3px 0; border-radius: 7px; color: var(--text-secondary); font-size: 12px; line-height: 1.4; text-decoration: none; transition: color .15s, background .15s; }
.workspace-navlink:hover { background: var(--surface-subtle); color: var(--text-primary); }
.workspace-navlink.is-current { background: var(--accent-soft); color: var(--accent); font-weight: 600; }
.workspace-navlink-icon { width: 18px; height: 18px; flex-shrink: 0; }
.workspace-navlink-marker { width: 5px; height: 5px; border-radius: 50%; background: currentColor; margin-left: auto; }
</style>
