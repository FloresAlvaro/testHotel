<template>
  <CModal :is-open="isOpen" title="Registrar pago" size="md" @close="handleCancel">
    <form class="form" @submit.prevent="handleSubmit">
    <div class="form-row-2">
      <label class="select-field"><span>Reserva</span><select v-model="form.reservation_id" required :disabled="optionsLoading || !!reservationId"><option value="" disabled>Seleccionar reserva</option><option v-for="reservation in reservations" :key="reservation.id" :value="String(reservation.id)">#{{ reservation.id }} · {{ reservation.client_name }} · Hab. {{ reservation.room_number }}</option></select></label>

      <CInput
        v-model="form.amount"
        step="0.01"
        min="0.01"
        label="Monto"
        type="number"
        placeholder="0.00"
        required
      />
    </div>

    <div class="form-row-2">
      <label class="field-label">
        Método de pago
        <select v-model="form.payment_method" required>
          <option value="cash">Efectivo</option>
          <option value="credit_card">Tarjeta de crédito</option>
          <option value="debit_card">Tarjeta de débito</option>
          <option value="transfer">Transferencia</option>
          <option value="check">Cheque</option>
        </select>
      </label>

      <label class="field-label">
        Tipo de pago
        <select v-model="form.payment_type" required>
          <option value="full">Completo</option>
          <option value="partial">Parcial</option>
          <option value="advance">Anticipo</option>
        </select>
      </label>
    </div>

    <div class="form-row">
      <CInput
        v-model="form.transaction_id"
        label="ID Transacción"
        placeholder="TRANS123456"
      />
    </div>

    <div class="form-row">
      <CInput
        v-model="form.notes"
        label="Notas"
        placeholder="Observaciones del pago"
      />
    </div>

    <p v-if="optionsError" class="form-error" role="alert">{{ optionsError }}</p>
    <div class="form-actions">
      <CButton variant="secondary" type="button" @click="handleCancel">
        Cancelar
      </CButton>
      <CButton variant="primary" type="submit" :loading="loading" :disabled="optionsLoading || !!optionsError">
        Registrar Pago
      </CButton>
    </div>
    </form>
  </CModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useApiClient } from '~/services/api';
import type { Reservation, CreatePaymentRequest, PaymentMethod, PaymentType } from '~/types';

interface Props {
  isOpen: boolean;
  loading?: boolean;
  reservationId?: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  submit: [data: CreatePaymentRequest];
  cancel: [];
}>();

const form = ref({
  reservation_id: '',
  amount: '',
  payment_method: 'cash',
  payment_type: 'full',
  transaction_id: '',
  notes: ''
});

const api = useApiClient();
const reservations = ref<Reservation[]>([]);
const optionsLoading = ref(false);
const optionsError = ref('');
watch(() => props.isOpen, async (open) => {
  if (!open) return;
  form.value = { reservation_id: props.reservationId ? String(props.reservationId) : '', amount: '', payment_method: 'cash', payment_type: 'full', transaction_id: '', notes: '' };
  optionsLoading.value = true;
  optionsError.value = '';
  try { reservations.value = (await api.getReservations(1, 100)).data?.filter(r => r.status !== 'cancelled') || []; }
  catch { optionsError.value = 'No se pudieron cargar las reservas. Cierra la ventana y vuelve a intentar.'; }
  finally { optionsLoading.value = false; }
}, { immediate: true });

watch(() => props.reservationId, (reservationId) => {
  if (reservationId) form.value.reservation_id = String(reservationId);
}, { immediate: true });

const handleSubmit = () => {
  const reservationId = Number(form.value.reservation_id);
  const amount = Number(form.value.amount);
  if (!Number.isInteger(reservationId) || reservationId <= 0 || !Number.isFinite(amount) || amount <= 0) return;

  const data: CreatePaymentRequest = {
    reservation_id: reservationId,
    amount,
    method: form.value.payment_method as PaymentMethod,
    type: form.value.payment_type as PaymentType,
    transaction_id: form.value.transaction_id.trim() || undefined,
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

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.field-label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: var(--text-primary, #1a1a1a);
}

.field-label select {
  min-height: 42px;
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: 6px;
  padding: 8px 12px;
  background: var(--bg-secondary, #fff);
  color: inherit;
}
</style>