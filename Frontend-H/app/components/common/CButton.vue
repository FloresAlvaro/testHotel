<template>
  <button
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

<style scoped>

.btn { display: inline-flex; align-items: center; justify-content: center; gap: 7px; min-height: 38px; padding: 9px 15px; font-size: 12px; font-weight: 500; line-height: 1.4; border: 1px solid transparent; border-radius: 7px; transition: background .15s, border-color .15s; white-space: nowrap; }
.btn-primary { background: #535ed6; color: #fff; border-color: #535ed6; }
.btn-primary:hover:not(:disabled) { background: #424ebf; border-color: #424ebf; }
.btn-secondary { background: var(--bg-secondary); color: var(--text-primary); border-color: var(--border-color); }
.btn-secondary:hover:not(:disabled), .btn-ghost:hover:not(:disabled) { background: var(--surface-subtle); }
.btn-ghost { background: transparent; color: var(--text-secondary); }
.btn-danger { background: var(--danger-soft); color: var(--danger); border-color: transparent; }
.btn-danger:hover:not(:disabled) { border-color: var(--danger); }
.btn-success { background: #27765a; color: white; }
.btn-success:hover:not(:disabled) { background: #1f6149; }
.btn-warning { background: var(--warning-soft); color: var(--warning); }
.btn-sm { min-height: 30px; padding: 6px 10px; font-size: 11px; border-radius: 6px; }
.btn-lg { min-height: 44px; padding: 12px 20px; font-size: 13px; }
.btn-disabled { opacity: .5; cursor: not-allowed; }
.btn-spinner { width: 13px; height: 13px; border: 2px solid currentColor; border-right-color: transparent; border-radius: 50%; animation: spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

</style>
