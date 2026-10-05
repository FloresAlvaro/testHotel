<template>
  <CModal :is-open="isOpen" title="Confirmar Acción" size="sm" @close="handleCancel">
    <p class="confirm-message">{{ message }}</p>

    <template #footer>
      <CButton variant="secondary" @click="handleCancel">
        Cancelar
      </CButton>
      <CButton
        :variant="danger ? 'danger' : 'primary'"
        :loading="loading"
        @click="handleConfirm"
      >
        {{ confirmText || 'Confirmar' }}
      </CButton>
    </template>
  </CModal>
</template>

<script setup lang="ts">
interface Props {
  isOpen: boolean;
  message: string;
  confirmText?: string;
  danger?: boolean;
  loading?: boolean;
}

defineProps<Props>();
const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();

const handleConfirm = () => emit('confirm');
const handleCancel = () => emit('cancel');
</script>

<style scoped lang="scss" src="./MConfirmModal.scss"></style>