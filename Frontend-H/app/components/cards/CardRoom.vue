<template>
  <article class="room-card">
    <header class="room-card-heading"><span class="room-icon"><Icon name="system-uicons:home" /></span><span :class="['status-badge', `status-${room.status}`]">{{ ROOM_STATUS_LABELS[room.status] }}</span></header>
    <p class="room-card-number">{{ room.number }}</p><p class="room-card-type">{{ room.room_type_name || 'Habitación' }}</p>
    <div class="room-card-meta"><span>Piso {{ room.floor ?? '—' }}</span><span v-if="room.price">{{ hotelMoney(Number(room.price).toFixed(2)) }} <small>/ noche</small></span></div>
    <footer class="room-card-actions"><button class="room-detail-link" @click="$emit('view', room.id)">Ver habitación<Icon name="system-uicons:arrow-right" /></button><details class="room-action-menu"><summary :aria-label="`Acciones de la habitación ${room.number}`"><Icon name="system-uicons:menu-vertical" /></summary><div><button @click="$emit('edit', room.id)">Editar habitación</button><button v-if="room.status !== 'maintenance'" @click="$emit('maintenance', room.id)">Enviar a mantenimiento</button></div></details></footer>
  </article>
</template>
<script setup lang="ts">
import type { Room } from '~/types';
import { ROOM_STATUS_LABELS } from '~/utils/constants';
const { money: hotelMoney } = useHotelSettings()

defineProps<{ room: Room }>();
defineEmits<{ view: [id: number]; edit: [id: number]; maintenance: [id: number] }>();
</script>
<style scoped>
.room-card { background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 10px; padding: 22px; }
.room-card-heading { display: flex; align-items: center; justify-content: space-between; }
.room-icon { font-size: 21px; color: var(--text-tertiary); }
.room-card-number { margin: 20px 0 4px; font-size: 30px; font-weight: 600; letter-spacing: -1px; color: var(--text-primary); }
.room-card-type { color: var(--text-secondary); margin: 0; font-size: 12px; }
.room-card-meta { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 11px; color: var(--text-secondary); margin-top: 22px; }
.room-card-meta small { color: var(--text-tertiary); }
.room-card-actions { display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--border-color); padding-top: 14px; margin-top: 18px; }
.room-detail-link { display: inline-flex; align-items: center; gap: 8px; font-size: 11px; color: var(--text-primary); background: transparent; border: 0; padding: 4px 0; }
.room-detail-link:hover { color: var(--accent); }
.room-action-menu { position: relative; }
.room-action-menu summary { display: flex; list-style: none; cursor: pointer; color: var(--text-secondary); padding: 4px; font-size: 18px; border-radius: 4px; }
.room-action-menu summary::-webkit-details-marker { display: none; }
.room-action-menu > div { position: absolute; right: 0; top: 28px; z-index: 4; width: 190px; padding: 5px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; box-shadow: 0 8px 30px #11182712; }
.room-action-menu button { display: block; border: 0; background: transparent; color: var(--text-primary); padding: 10px; font-size: 11px; width: 100%; text-align: left; border-radius: 4px; }
.room-action-menu button:hover { background: var(--surface-subtle); }
</style>
