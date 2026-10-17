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

<style scoped>

.card { background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 10px; min-width: 0; overflow: hidden; }
.card-bordered { border-color: var(--text-tertiary); }
.card-header { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 19px 22px; border-bottom: 1px solid var(--border-color); }
.card-title { margin: 0; font-size: 13px; font-weight: 600; color: var(--text-primary); }
.card-body { padding: 22px; }
.card-footer { border-top: 1px solid var(--border-color); padding: 16px 22px; display: flex; justify-content: flex-end; gap: 10px; flex-wrap: wrap; }
@media(max-width:640px) { .card-body, .card-header { padding: 18px; } }

</style>
