<template>
  <form class="form" @submit.prevent="handleSubmit">
    <div class="form-row-2">
      <CInput
        v-model="form.client_id"
        label="Cliente"
        type="number"
        placeholder="ID cliente"
        required
      />

      <CInput
        v-model="form.room_id"
        label="Habitación"
        type="number"
        placeholder="ID habitación"
        required
      />
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
        <strong>Precio Total:</strong> {{ formatCurrency(totalPrice) }}
      </p>
    </div>

    <div class="form-actions">
      <CButton variant="secondary" type="button" @click="handleCancel">
        Cancelar
      </CButton>
      <CButton variant="primary" type="submit" :loading="loading">
        Crear Reserva
      </CButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import type { Reservation, CreateReservationRequest } from '~/types';
import { formatCurrency } from '~/utils/formatters';

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
        check_in: reservation.check_in,
        check_out: reservation.check_out,
        notes: reservation.notes || ''
      }
    : { client_id: '', room_id: '', check_in: '', check_out: '', notes: '' };
}, { immediate: true });

const nights = computed(() => {
  if (form.value.check_in && form.value.check_out) {
    return calculateNights(form.value.check_in, form.value.check_out);
  }
  return 0;
});

const totalPrice = computed(() => {
  // Esto dependerá de la lógica de precios
  return 0;
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
  background: #f0f9ff;
  border-left: 4px solid #3b82f6;
  padding: 12px 16px;
  border-radius: 4px;

  p {
    margin: 6px 0;
    color: #1e3a8a;

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