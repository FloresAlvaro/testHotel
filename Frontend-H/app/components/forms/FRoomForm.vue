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
      <label class="select-field"><span>Tipo de habitación</span><select v-model="form.room_type_id" required :disabled="optionsLoading"><option value="" disabled>{{ optionsLoading ? 'Cargando tipos…' : 'Seleccionar tipo' }}</option><option v-for="type in roomTypes" :key="type.id" :value="String(type.id)">{{ type.name }} · {{ hotelMoney(type.price) }} / noche</option></select></label>
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
const roomTypes = ref<RoomType[]>([]);
const optionsLoading = ref(true);
const optionsError = ref('');
onMounted(async () => {
  try { roomTypes.value = (await api.getRoomTypes(1, 100)).data?.filter(type => type.is_active) || []; }
  catch { optionsError.value = 'No se pudieron cargar los tipos de habitación. Cierra la ventana y vuelve a intentar.'; }
  finally { optionsLoading.value = false; }
});

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

const handleSubmit = () => {
  const roomTypeId = Number(form.value.room_type_id);
  const floor = Number(form.value.floor);
  if (!form.value.number.trim() || !Number.isInteger(roomTypeId) || roomTypeId <= 0) return;

  const data: CreateRoomRequest = {
    number: form.value.number.trim(),
    room_type_id: roomTypeId,
    ...(form.value.floor.trim() && Number.isInteger(floor) ? { floor } : {})
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
</style>