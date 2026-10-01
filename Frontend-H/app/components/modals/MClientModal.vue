<template>
  <CModal
    :is-open="isOpen"
    :title="client ? 'Editar Cliente' : 'Nuevo Cliente'"
    size="md"
    @close="handleCancel"
  >
    <FClientForm
      :client="client"
      :loading="loading"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />
  </CModal>
</template>

<script setup lang="ts">
import type { Client, CreateClientRequest } from '~/types';

interface Props {
  isOpen: boolean;
  client?: Client | null;
  loading?: boolean;
}

defineProps<Props>();
const emit = defineEmits<{
  submit: [data: CreateClientRequest];
  cancel: [];
}>();

const handleSubmit = (data: CreateClientRequest) => emit('submit', data);
const handleCancel = () => emit('cancel');
</script>