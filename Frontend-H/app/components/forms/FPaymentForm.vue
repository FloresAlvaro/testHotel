<template>
  <CModal :is-open="isOpen" title="Registrar pago" size="md" :dirty="dirty" :busy="loading" @close="emit('cancel')">
    <form class="form" @submit.prevent="handleSubmit">
    <div class="form-row-2">
      <CRecordSelect v-model="form.reservation_id" label="Reserva" :fetch-options="findReservations" :resolve-option="resolveReservation" :disabled="!!reservationId" />

      <CInput
        v-model="form.amount"
        step="0.01"
        min="0.01"
        :max="balance || undefined"
        label="Monto"
        type="number"
        placeholder="0.00"
        required
      />
    </div>

    <div v-if="selectedReservation" class="rounded-lg border p-4 space-y-2" aria-label="Resumen del saldo" aria-live="polite">
      <p>Reserva #{{ selectedReservation.id }} · {{ selectedReservation.client_name }} · Hab. {{ selectedReservation.room_number }}</p>
      <p>Total: {{ money(selectedReservation.total_price) }}</p>
      <template v-if="!optionsLoading && !optionsError"><p>Cobrado: {{ money(paid) }}</p><p><strong>Saldo pendiente: {{ money(balance) }}</strong></p><p v-if="pending>0">Pagos pendientes de confirmar: {{ money(pending) }}. Revisa los pagos existentes antes de registrar otro.</p><CButton type="button" size="sm" variant="secondary" @click="refreshBalance">Actualizar saldo</CButton></template>
      <p v-else role="status">Consultando saldo…</p>
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

    <p v-if="optionsError" class="form-error" role="alert">{{ optionsError }} <button type="button" class="underline" @click="refreshBalance">Actualizar saldo</button></p>
    <div class="form-actions">
      <CButton variant="secondary" type="button" @click="handleCancel">
        Cancelar
      </CButton>
      <CButton variant="primary" type="submit" :loading="loading" :disabled="optionsLoading || !!optionsError || !selectedReservation || balance<=0">
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
const {money}=useHotelSettings()
const reservationOption=(r:Reservation)=>({id:r.id,label:`#${r.id} · ${r.client_name} · Hab. ${r.room_number}`,disabled:r.status==='cancelled'})
const findReservations=async(page:number,q:string)=>{const response=await api.getReservations(page,20,undefined,q);return {options:(response.data||[]).map(reservationOption),pagination:response.pagination}}
const resolveReservation=async(id:number)=>{const response=await api.getReservation(id);if(!response.data)throw new Error('Reserva no disponible');return reservationOption(response.data)}
const selectedReservation=ref<Reservation>(),paid=ref(0),pending=ref(0),suggestedAmount=ref('')
const balance=computed(()=>Math.max(0,Math.round((Number(selectedReservation.value?.total_price||0)-paid.value)*100)/100))
let balanceVersion=0
const refreshBalance=async()=>{
 const version=++balanceVersion,id=Number(form.value.reservation_id)
 selectedReservation.value=undefined;optionsError.value='';paid.value=0;pending.value=0
 if(!id){optionsLoading.value=false;return}
 optionsLoading.value=true
 try{
  const [reservation,payments]=await Promise.all([api.getReservation(id),api.request<import('~/types').ApiResponse<import('~/types').Payment[]>>(`/payments/reservation/${id}`)])
  if(version!==balanceVersion)return
  if(!reservation.data || reservation.data.status==='cancelled')throw new Error('Reserva cancelada o no disponible')
  selectedReservation.value=reservation.data
  const sum=(status:string)=>(payments.data||[]).filter(p=>p.status===status).reduce((total,p)=>total+Math.round(Number(p.amount)*100),0)/100
  paid.value=sum('completed');pending.value=sum('pending')
  if(!form.value.amount){suggestedAmount.value=balance.value>0?String(balance.value):'';form.value.amount=suggestedAmount.value}
 }catch{if(version===balanceVersion)optionsError.value='No se pudo confirmar el saldo. Selecciona otra reserva o pulsa Actualizar saldo.'}
 finally{if(version===balanceVersion)optionsLoading.value=false}
}
watch(()=>form.value.reservation_id,()=>{form.value.amount='';refreshBalance()})
onBeforeUnmount(()=>{balanceVersion++})
const optionsLoading = ref(false);
const optionsError = ref('');
watch(() => props.isOpen, async (open) => {
  if (!open) return;
  form.value = { reservation_id: props.reservationId ? String(props.reservationId) : '', amount: '', payment_method: 'cash', payment_type: 'full', transaction_id: '', notes: '' };
  refreshBalance();
}, { immediate: true });

watch(() => props.reservationId, (reservationId) => {
  if (reservationId) form.value.reservation_id = String(reservationId);
}, { immediate: true });

const {requestDiscard,markSaved,dirty}=useUnsavedChanges(()=>({...form.value,amount:String(form.value.amount)===suggestedAmount.value?'':form.value.amount}),()=>!!props.loading)
watch(()=>props.isOpen,()=>nextTick(markSaved))
const handleSubmit = () => {
  if(props.loading)return;
  if(optionsLoading.value || optionsError.value || !selectedReservation.value)return;
  const reservationId = Number(form.value.reservation_id);
  const amount = Number(form.value.amount);
  if (!Number.isInteger(reservationId) || reservationId <= 0 || !Number.isFinite(amount) || amount <= 0 || amount > balance.value) return;

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
  if(requestDiscard()) { markSaved(); emit('cancel'); }
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