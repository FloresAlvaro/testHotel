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

<style scoped lang="scss" src="~/assets/styles/components/cards/CardRoom.scss"></style>