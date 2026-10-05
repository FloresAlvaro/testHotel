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

<style scoped lang="scss" src="./FReservationForm.scss"></style>