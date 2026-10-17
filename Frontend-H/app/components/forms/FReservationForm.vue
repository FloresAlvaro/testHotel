<template>
  <form class="form" @submit.prevent="handleSubmit">
    <div class="form-row-2">
      <label class="select-field"><span>Huésped</span><select v-model="form.client_id" required :disabled="optionsLoading || !!reservation"><option value="" disabled>Seleccionar huésped</option><option v-for="client in clients" :key="client.id" :value="String(client.id)">{{ client.name }} · {{ client.document }}</option></select></label>

      <label class="select-field"><span>Habitación</span><select v-model="form.room_id" required :disabled="optionsLoading || !!reservation"><option value="" disabled>Seleccionar habitación</option><option v-for="room in rooms" :key="room.id" :value="String(room.id)" :disabled="room.status === 'maintenance'">{{ room.number }} · {{ room.room_type_name }}{{ room.status === 'maintenance' ? ' (mantenimiento)' : '' }}</option></select></label>
    </div>

    <div class="form-row-2">
      <CInput
        v-model="form.check_in"
        label="Check-in"
        type="date"
        required
      />

      <CInput
        v-model="form.check_out"
        label="Check-out"
        type="date"
        required
      />
    </div>

    <div class="form-row">
      <CInput
        v-model="form.notes"
        label="Requerimientos Especiales"
        placeholder="Notas adicionales"
      />
    </div>

    <div class="info-box">
      <p>
        <strong>Noches:</strong> {{ nights }}
      </p>
      <p>
        <strong>{{ reservation ? 'Total registrado:' : 'Total estimado:' }}</strong> {{ reservation ? formatCurrency(Number(reservation.total_price)) : totalPrice ? formatCurrency(totalPrice) : 'Selecciona habitación y fechas' }}
      </p>
    </div>

    <p v-if="optionsError" class="form-error" role="alert">{{ optionsError }}</p>
    <div class="form-actions">
      <CButton variant="secondary" type="button" @click="handleCancel">
        Cancelar
      </CButton>
      <CButton variant="primary" type="submit" :loading="loading" :disabled="optionsLoading || !!optionsError">
        {{ reservation ? 'Guardar cambios' : 'Crear reserva' }}
      </CButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useApiClient } from '~/services/api';
import type { Client, Room, Reservation, CreateReservationRequest } from '~/types';
const { money: formatCurrency } = useHotelSettings();

interface Props {
  reservation?: Reservation | null;
  loading?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  submit: [data: CreateReservationRequest];
  cancel: [];
}>();

const { calculateNights } = useReservations();

const form = ref({
  client_id: '',
  room_id: '',
  check_in: '',
  check_out: '',
  notes: ''
});

watch(() => props.reservation, (reservation) => {
  form.value = reservation
    ? {
        client_id: String(reservation.client_id),
        room_id: String(reservation.room_id),
        check_in: reservation.check_in.slice(0, 10),
        check_out: reservation.check_out.slice(0, 10),
        notes: reservation.notes || ''
      }
    : { client_id: '', room_id: '', check_in: '', check_out: '', notes: '' };
}, { immediate: true });

const api = useApiClient();
const clients = ref<Client[]>([]);
const rooms = ref<Room[]>([]);
const optionsLoading = ref(true);
const optionsError = ref('');
onMounted(async () => {
  try {
    const [clientResponse, roomResponse] = await Promise.all([api.getClients(1, 100), api.getRooms(1, 100)]);
    clients.value = clientResponse.data || [];
    rooms.value = roomResponse.data || [];
  } catch { optionsError.value = 'No se pudieron cargar las opciones. Cierra la ventana y vuelve a intentar.'; }
  finally { optionsLoading.value = false; }
});

const nights = computed(() => {
  if (form.value.check_in && form.value.check_out) {
    return calculateNights(form.value.check_in, form.value.check_out);
  }
  return 0;
});

const totalPrice = computed(() => {
  const room = rooms.value.find(room => String(room.id) === form.value.room_id);
  return Number(room?.price || 0) * nights.value;
});

const handleSubmit = () => {
  const clientId = Number(form.value.client_id);
  const roomId = Number(form.value.room_id);
  if (!Number.isInteger(clientId) || clientId <= 0 || !Number.isInteger(roomId) || roomId <= 0) return;

  const data: CreateReservationRequest = {
    client_id: clientId,
    room_id: roomId,
    check_in: form.value.check_in,
    check_out: form.value.check_out,
    notes: form.value.notes.trim() || undefined
  };
  emit('submit', data);
};

const handleCancel = () => {
  emit('cancel');
};
</script>

<style scoped lang="scss">
.form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-row {
  display: flex;
  gap: 16px;

  > :deep(div) {
    flex: 1;
  }
}

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}

.info-box {
  background: var(--surface-subtle);
  border: 1px solid var(--border-color);
  padding: 12px 16px;
  border-radius: 4px;

  p {
    margin: 6px 0;
    color: var(--text-secondary);

    &:first-child {
      margin-top: 0;
    }

    &:last-child {
      margin-bottom: 0;
    }
  }
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
</style>