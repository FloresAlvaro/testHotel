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

<style scoped lang="scss">
.card-client {
  background: var(--bg-secondary, #ffffff);
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.card-header {
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color, #e0e0e0);

  h3 {
    margin: 0 0 4px;
    color: var(--text-primary, #1a1a1a);
  }

  p {
    margin: 0;
    color: var(--text-secondary, #999999);
    font-size: 0.9rem;
  }
}

.avatar {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.95rem;
}

.card-body {
  padding: 16px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 0.9rem;

  .label {
    font-weight: 600;
    color: var(--text-primary, #1a1a1a);
  }

  span:last-child {
    color: var(--text-secondary, #999999);
  }
}

.card-footer {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color, #e0e0e0);
}
</style>