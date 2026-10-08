<template>
  <button
    type="button"
    :aria-busy="loading || undefined"
    :class="[
      'btn',
      `btn-${variant}`,
      `btn-${size}`,
      { 'btn-disabled': disabled || loading },
      customClass
    ]"
    :disabled="disabled || loading"
    v-bind="$attrs"
  >
    <span v-if="loading" class="btn-spinner"/>
    <span v-if="icon && !loading" class="btn-icon">{{ icon }}</span>
    <slot />
  </button>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  customClass?: string;
}

withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
  icon: '',
  customClass: ''
});
</script>

<style scoped lang="scss" src="~/assets/styles/components/common/CButton.scss"></style>