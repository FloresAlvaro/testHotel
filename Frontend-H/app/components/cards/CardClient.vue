<template>
  <div class="card-client">
    <div class="card-header">
      <div>
        <h3>{{ client.name }}</h3>
        <p>{{ client.email }}</p>
      </div>
      <span class="avatar">{{ getInitials(client.name) }}</span>
    </div>

    <div class="card-body">
      <div class="info-row">
        <span class="label">Teléfono:</span>
        <span>{{ client.phone }}</span>
      </div>
      <div class="info-row">
        <span class="label">Documento:</span>
        <span>{{ client.document }}</span>
      </div>

      <div class="card-footer">
        <CButton variant="secondary" size="sm" @click="$emit('edit')">
          Editar
        </CButton>
        <CButton variant="danger" size="sm" @click="$emit('delete')">
          Eliminar
        </CButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Client } from '~/types';

interface Props {
  client: Client;
}

defineProps<Props>();
defineEmits<{
  edit: [];
  delete: [];
}>();

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};
</script>

<style scoped lang="scss" src="./CardClient.scss"></style>