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

<style scoped lang="scss" src="~/assets/styles/components/common/CHeader.scss"></style>