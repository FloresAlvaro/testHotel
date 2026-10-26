<template>
  <form class="form" @submit.prevent="handleSubmit">
    <div class="form-row-2">
      <CInput
        v-model="form.number"
        label="Número de Habitación"
        type="number"
        placeholder="101"
        required
      />

      <CInput
        v-model="form.floor"
        label="Piso"
        type="number"
        placeholder="1"
        required
      />
    </div>

    <div class="form-row">
      <CRecordSelect v-model="form.room_type_id" label="Tipo de habitación" :fetch-options="findRoomTypes" :resolve-option="resolveRoomType" />
    </div>

    <p v-if="optionsError" class="form-error" role="alert">{{ optionsError }}</p>
    <div class="form-actions">
      <CButton variant="secondary" type="button" @click="handleCancel">
        Cancelar
      </CButton>
      <CButton variant="primary" type="submit" :loading="loading" :disabled="optionsLoading || !!optionsError">
        {{ isEditing ? 'Actualizar' : 'Guardar' }} Habitación
      </CButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useApiClient } from '~/services/api';
import type { RoomType, Room, CreateRoomRequest } from '~/types';
const { money: hotelMoney } = useHotelSettings()


interface Props {
  room?: Room | null;
  loading?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  submit: [data: CreateRoomRequest];
  cancel: [];
}>();

const form = ref({
  number: '',
  floor: '',
  room_type_id: ''
});

const api = useApiClient();
const typeOption=(type:RoomType)=>({id:type.id,label:`${type.name} · ${hotelMoney(type.price)} / noche`,disabled:!type.is_active})
const findRoomTypes=async(page:number,q:string)=>{const response=await api.getRoomTypes(page,20,q);return {options:(response.data||[]).map(typeOption),pagination:response.pagination}}
const resolveRoomType=async(id:number)=>{const response=await api.getRoomType(id);if(!response.data)throw new Error('Tipo no disponible');return typeOption(response.data)}
const optionsLoading = ref(false);
const optionsError = ref('');


const isEditing = computed(() => !!props.room);

watch(
  () => props.room,
  (room) => {
    if (room) {
      form.value = {
        number: room.number,
        floor: room.floor == null ? '' : String(room.floor),
        room_type_id: String(room.room_type_id)
      };
    } else {
      form.value = { number: '', floor: '', room_type_id: '' };
    }
  },
  { immediate: true }
);

const {requestDiscard,markSaved}=useUnsavedChanges(()=>form.value,()=>!!props.loading)
watch(()=>props.room,()=>nextTick(markSaved))
const handleSubmit = () => {
  if(props.loading)return;
  const roomTypeId = Number(form.value.room_type_id);
  const floorText=String(form.value.floor).trim();
  const number=String(form.value.number).trim();
  const floor = Number(floorText);
  if (!number || !Number.isInteger(roomTypeId) || roomTypeId <= 0) return;

  const data: CreateRoomRequest = {
    number,
    room_type_id: roomTypeId,
    ...(floorText && Number.isInteger(floor) ? { floor } : {})
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
</style>