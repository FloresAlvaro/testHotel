<template>
  <CModal
    :is-open="isOpen"
    title="Realizar Check-in"
    size="md"
    @close="handleCancel"
  >
    <div v-if="reservation" class="checkin-info">
      <p><strong>Cliente:</strong> {{ reservation.client_name }}</p>
      <p><strong>Habitación:</strong> {{ reservation.room_number }}</p>
      <p><strong>Check-in:</strong> {{ formatDate(reservation.check_in, 'DD/MM/YYYY') }}</p>
    </div>

    <div class="form-group">
      <label class="label">Notas adicionales</label>
      <textarea
        v-model="notes"
        class="textarea"
        placeholder="Observaciones sobre el check-in"
        rows="4"
      />
    </div>

    <template #footer>
      <CButton variant="secondary" @click="handleCancel">
        Cancelar
      </CButton>
      <CButton variant="primary" :loading="loading" @click="handleConfirm">
        Registrar Check-in
      </CButton>
    </template>
  </CModal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Reservation } from '~/types';
import { formatDate } from '~/utils/formatters';

interface Props {
  isOpen: boolean;
  reservation?: Reservation | null;
  loading?: boolean;
}

defineProps<Props>();
const emit = defineEmits<{
  confirm: [notes: string];
  cancel: [];
}>();

const notes = ref('');

const handleConfirm = () => emit('confirm', notes.value);
const handleCancel = () => emit('cancel');
</script>

<style scoped lang="scss" src="~/assets/styles/components/modals/MCheckInModal.scss"></style>