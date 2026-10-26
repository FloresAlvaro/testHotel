<template>
  <div class="space-y-6">
    <!-- Header -->
    <CPageHeader title="Habitaciones" description="Disponibilidad, estado y detalles de tus habitaciones."><CButton variant="primary" @click="openAddModal">
        <Icon name="system-uicons:home" size="18" class="mr-2" />
        Nueva Habitación
      </CButton></CPageHeader>

    <!-- Filtros -->
    <CCard>
      <div class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Búsqueda -->
          <CInput
            v-model="searchQuery"
            placeholder="Buscar habitación #..."
            type="text"
          >
            <template #prefixIcon>
              <Icon name="system-uicons:search" size="18" />
            </template>
          </CInput>

          <!-- Filtro por Estado -->
          <select
            v-model="selectedStatus" aria-label="Filtrar por estado"
            class="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los Estados</option>
            <option value="available">Disponible</option>
            <option value="occupied">Ocupada</option>
            <option value="maintenance">Mantenimiento</option>
            <option value="reserved">Reservada</option>
          </select>

          <!-- Filtro por Piso -->
          <label class="text-sm">Piso <input v-model="selectedFloor" type="number" min="0" step="1" placeholder="Todos los pisos" class="operation-filter w-full" aria-label="Filtrar por piso"></label>
        </div>

        <!-- Estadísticas de Filtros -->
        <div class="flex items-center justify-between">
          <p class="text-sm text-slate-600 dark:text-slate-400">
            Mostrando {{ filteredRooms.length }} de {{ totalRooms }} habitaciones
          </p>
          <CButton
            v-if="hasFilters"
            variant="secondary"
            size="sm"
            @click="clearFilters"
          >
            Limpiar Filtros
          </CButton>
        </div>
      </div>
    </CCard>

    <p v-if="error" role="alert" class="operation-error">{{ error }} <button class="underline" @click="fetchRooms">Reintentar</button></p>
    <!-- Grid de Habitaciones -->
    <div v-if="!loading && !error" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <CardRoom
        v-for="room in filteredRooms"
        :key="room.id"
        :room="room"
        @edit="editRoom"
        @view="viewRoom"
        @maintenance="sendToMaintenance"
      />
    </div>

    <!-- Loading -->
    <div v-else-if="loading" class="text-center py-12">
      <Icon
        name="system-uicons:loader"
        size="32"
        class="mx-auto text-blue-500 animate-spin mb-4"
      />
      <p class="text-slate-600 dark:text-slate-400">
        Cargando habitaciones...
      </p>
    </div>

    <!-- Empty State -->
    <div
      v-if="!loading && !error && filteredRooms.length === 0"
      class="text-center py-12"
    >
      <Icon
        name="system-uicons:home"
        size="48"
        class="mx-auto text-slate-400 mb-4"
      />
      <p class="text-slate-600 dark:text-slate-400 mb-4">
        {{ hasFilters
          ? 'No hay habitaciones que coincidan con los filtros'
          : 'No hay habitaciones registradas'
        }}
      </p>
      <CButton v-if="hasFilters" variant="secondary" @click="clearFilters">Limpiar filtros</CButton>
      <CButton v-else variant="primary" @click="openAddModal">
        <Icon name="system-uicons:home" size="18" class="mr-2" />
        Agregar Primera Habitación
      </CButton>
    </div>

    <CTablePagination :pagination="pagination" :loading="loading" @change="page=$event" />

    <CModal :is-open="!!detailRoom" :title="`Habitación ${detailRoom?.number || ''}`" @close="detailRoom = null">
      <dl v-if="detailRoom" class="room-detail-grid"><div><dt>Tipo</dt><dd>{{ detailRoom.room_type_name }}</dd></div><div><dt>Piso</dt><dd>{{ detailRoom.floor ?? '—' }}</dd></div><div><dt>Precio por noche</dt><dd>{{ hotelMoney(Number(detailRoom.price || 0).toFixed(2)) }}</dd></div><div><dt>Estado</dt><dd>{{ { available: 'Disponible', occupied: 'Ocupada', reserved: 'Reservada', maintenance: 'Mantenimiento' }[detailRoom.status] }}</dd></div></dl>
    </CModal>

    <!-- Modal de Habitación -->
    <CModal :is-open="isModalOpen" :title="selectedRoom ? 'Editar habitación' : 'Nueva habitación'" @close="closeModal">
    <FRoomForm
v-if="isModalOpen"
      :room="selectedRoom"
      :loading="isSubmitting"
      @submit="handleSubmit"
      @cancel="closeModal"
    />
    </CModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

import { useUIStore } from '~/stores/ui'
import { useRooms } from '~/composables/useRooms'
import type { CreateRoomRequest, Room } from '~/types'

const { money: hotelMoney } = useHotelSettings()

definePageMeta({
  middleware: ['auth', 'manager']
})


const uiStore = useUIStore()
const { createRoom, updateRoom } = useRooms()


const isSubmitting = ref(false)
const isModalOpen = ref(false)
const searchQuery = ref('')
const selectedStatus = ref('')
const selectedFloor = ref<string|number>('')
const hasFilters=computed(()=>!!searchQuery.value||!!selectedStatus.value||selectedFloor.value!=='')
const selectedRoom = ref<Room | null>(null)
const detailRoom = ref<Room | null>(null)

const {rows:rooms,loading,error,pagination,page,load:fetchRooms}=useTableList<Room>('/rooms',()=>({q:searchQuery.value.trim(),status:selectedStatus.value,floor:selectedFloor.value===''?undefined:selectedFloor.value}))
const totalRooms = computed(() => pagination.value.total)

const filteredRooms = computed(() => rooms.value)

const openAddModal = () => {
  selectedRoom.value = null
  isModalOpen.value = true
}

const editRoom = (roomId: number) => {
  selectedRoom.value = rooms.value.find(r => r.id === roomId) || null
  isModalOpen.value = true
}

const viewRoom = (roomId: number) => {
  detailRoom.value = rooms.value.find(room => room.id === roomId) || null
}

const closeModal = () => {
  isModalOpen.value = false
  selectedRoom.value = null
}

const handleSubmit = async (data: CreateRoomRequest) => {
  isSubmitting.value = true
  try {
    if (selectedRoom.value) {
      await updateRoom(selectedRoom.value.id, data)
      uiStore.success('Habitación actualizada exitosamente')
    } else {
      await createRoom(data)
      uiStore.success('Habitación creada exitosamente')
    }
    closeModal()
    await fetchRooms()
  } catch (error: unknown) {
    uiStore.error(error instanceof Error ? error.message : 'Error al guardar la habitación')
  } finally {
    isSubmitting.value = false
  }
}

const sendToMaintenance = async (roomId: number) => {
  try {
    await updateRoom(roomId, { status: 'maintenance' })
    uiStore.success('Habitación enviada a mantenimiento')
    await fetchRooms()
  } catch (error: unknown) {
    uiStore.error(error instanceof Error ? error.message : 'Error al actualizar la habitación')
  }
}

const clearFilters = () => {
  searchQuery.value = ''
  selectedStatus.value = ''
  selectedFloor.value = ''
}

</script>