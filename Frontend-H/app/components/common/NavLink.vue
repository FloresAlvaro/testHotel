<template>
  <NuxtLink
    :to="href"
    class="nav-link"
    :class="{ active, compact }"
    :title="compact ? label : undefined"
    :aria-label="compact ? label : undefined"
    :aria-current="active ? 'page' : undefined"
  >
    <Icon :name="icon" class="nav-link-icon" aria-hidden="true" />
    <span class="nav-link-label">{{ label }}</span>
  </NuxtLink>
</template>

<script setup lang="ts">
interface Props {
  icon: string;
  label: string;
  href: string;
  active?: boolean;
  compact?: boolean;
}

withDefaults(defineProps<Props>(), {
  active: false,
  compact: false,
});
</script>

<style scoped src="~/assets/styles/components/common/NavLink.css"></style>
