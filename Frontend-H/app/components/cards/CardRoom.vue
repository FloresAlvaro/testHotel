<template>
  <div class="card-room">
    <div class="card-header">
      <span class="room-number">Hab. {{ room.number }}</span>
      <span :class="['status-badge', `status-${room.status}`]">
        {{ getRoomStatusLabel(room.status) }}
      </span>
    </div>

    <div class="card-body">
      <p class="room-type">{{ room.room_type_name || 'Tipo sin asignar' }}</p>
      <p class="room-floor">📍 Piso {{ room.floor }}</p>

      <div class="card-footer">
        <CButton variant="ghost" size="sm" @click="$emit('view', room.id)">
          Ver
        </CButton>
        <CButton variant="secondary" size="sm" @click="$emit('edit', room.id)">
          Editar
        </CButton>
        <CButton variant="ghost" size="sm" @click="$emit('maintenance', room.id)">
          Mantenimiento
        </CButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Room } from '~/types';
import { ROOM_STATUS_LABELS } from '~/utils/constants';

interface Props {
  room: Room;
}

defineProps<Props>();
defineEmits<{
  view: [id: number];
  edit: [id: number];
  maintenance: [id: number];
}>();

const getRoomStatusLabel = (status: string) => ROOM_STATUS_LABELS[status] || status;
</script>

<style scoped lang="scss">
.card-room {
  background: var(--bg-secondary, #ffffff);
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
}

.card-header {
  padding: 12px 16px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.room-number {
  font-weight: 600;
  font-size: 1.1rem;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.card-body {
  padding: 16px;
}

.room-type {
  margin: 0;
  font-weight: 600;
  color: var(--text-primary, #1a1a1a);
}

.room-floor {
  margin: 6px 0 12px;
  color: var(--text-secondary, #999999);
}

.card-footer {
  display: flex;
  gap: 8px;
}
</style>