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

<style scoped lang="scss">
.checkin-info {
  background: #f0f9ff;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;

  p {
    margin: 6px 0;
    color: #1e3a8a;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.label {
  font-weight: 600;
  color: var(--text-primary, #1a1a1a);
}

.textarea {
  padding: 10px;
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.95rem;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
}
</style>