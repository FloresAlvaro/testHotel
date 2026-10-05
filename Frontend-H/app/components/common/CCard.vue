<template>
  <div :class="['card', { 'card-elevated': elevated, 'card-bordered': bordered }]">
    <div v-if="title" class="card-header">
      <h3 class="card-title">{{ title }}</h3>
      <slot name="header-action" />
    </div>

    <div class="card-body">
      <slot />
    </div>

    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title?: string;
  elevated?: boolean;
  bordered?: boolean;
}

withDefaults(defineProps<Props>(), {
  elevated: true,
  bordered: false,
  title: ''
});
</script>

<style scoped lang="scss" src="./CCard.scss"></style>