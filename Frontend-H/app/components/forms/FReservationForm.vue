<template>
  <form class="form" @submit.prevent="handleSubmit">
    <div class="form-row-2">
      <CInput v-model="form.check_in" label="Check-in" type="date" required />
      <CInput v-model="form.check_out" label="Check-out" type="date" :min="form.check_in || undefined" required />
    </div>
    <p v-if="!reservation" class="text-sm" role="status">{{ availabilityMessage }}</p>
    <div class="form-row-2">
      <CRecordSelect v-model="form.client_id" label="Huésped" :fetch-options="findClients" :resolve-option="resolveClient" :disabled="!!reservation" />
      <label class="select-field"><span>Habitación</span><select v-model="form.room_id" required :disabled="optionsLoading || !validDates || !!reservation"><option value="" disabled>Seleccionar habitación disponible</option><option v-for="room in rooms" :key="room.id" :value="String(room.id)" :disabled="room.status === 'maintenance'">{{ room.number }} · {{ room.room_type_name }}{{ room.status === 'maintenance' ? ' (mantenimiento)' : '' }}</option></select></label>
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
      <CButton variant="primary" type="submit" :loading="loading" :disabled="optionsLoading || !!optionsError || !validDates || !form.room_id || !form.client_id">
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
const clientOption=(client:Client)=>({id:client.id,label:`${client.name} · ${client.document}`})
const findClients=async(page:number,q:string)=>{const response=await api.getClients(page,20,q);return {options:(response.data||[]).map(clientOption),pagination:response.pagination}}
const resolveClient=async(id:number)=>{const response=await api.getClient(id);if(!response.data)throw new Error('Huésped no disponible');return clientOption(response.data)}
const rooms = ref<Room[]>([]);
const optionsLoading = ref(false);
const optionsError = ref('');
const availabilityMessage=ref('Elige las fechas para consultar habitaciones disponibles.')
const validDates=computed(()=>!!form.value.check_in && !!form.value.check_out && form.value.check_in<form.value.check_out)
let availabilityVersion=0
watch(()=>[form.value.check_in,form.value.check_out],async()=>{
 const version=++availabilityVersion
 optionsError.value=''
 if(props.reservation){
  try{const response=await api.getRoom(props.reservation.room_id);if(version===availabilityVersion)rooms.value=response.data?[response.data]:[]}
  catch{if(version===availabilityVersion)optionsError.value='No se pudo cargar la habitación.'}
  return
 }
 optionsLoading.value=false
 rooms.value=[]
 const previous=form.value.room_id
 form.value.room_id=''
 if(!validDates.value){availabilityMessage.value='Elige una salida posterior a la entrada para consultar disponibilidad.';return}
 optionsLoading.value=true
 availabilityMessage.value='Consultando disponibilidad…'
 try{
  const response=await api.getAvailableRooms(form.value.check_in,form.value.check_out)
  if(version!==availabilityVersion)return
  rooms.value=(response.data||[]).filter(room=>room.status!=='maintenance')
  if(rooms.value.some(room=>String(room.id)===previous))form.value.room_id=previous
  availabilityMessage.value=rooms.value.length?`${rooms.value.length} habitaciones disponibles para estas fechas. El total se confirma al guardar.`:'No hay habitaciones disponibles. Prueba otras fechas.'
 }catch{if(version===availabilityVersion){optionsError.value='No se pudo consultar la disponibilidad. Cambia las fechas para reintentar.';availabilityMessage.value='Disponibilidad sin confirmar.'}}
 finally{if(version===availabilityVersion)optionsLoading.value=false}
},{immediate:true})
onBeforeUnmount(()=>{availabilityVersion++})

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

const {requestDiscard,markSaved}=useUnsavedChanges(()=>form.value,()=>!!props.loading)
watch(()=>props.reservation,()=>nextTick(markSaved))
const handleSubmit = () => {
  if(props.loading)return;
  const clientId = Number(form.value.client_id);
  const roomId = Number(form.value.room_id);
  if (!validDates.value || optionsLoading.value || optionsError.value) return;
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