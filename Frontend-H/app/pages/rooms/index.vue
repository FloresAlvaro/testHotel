<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-slate-900 dark:text-white">
          Habitaciones
        </h1>
        <p class="text-slate-600 dark:text-slate-400 mt-1">
          Gestión de inventario de habitaciones
        </p>
      </div>
      <CButton variant="primary" @click="openAddModal">
        <Icon name="system-uicons:home" size="18" class="mr-2" />
        Nueva Habitación
      </CButton>
    </div>

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
            v-model="selectedStatus"
            class="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los Estados</option>
            <option value="available">Disponible</option>
            <option value="occupied">Ocupada</option>
            <option value="maintenance">Mantenimiento</option>
            <option value="reserved">Reservada</option>
          </select>

          <!-- Filtro por Piso -->
          <select
            v-model="selectedFloor"
            class="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los Pisos</option>
            <option value="1">Piso 1</option>
            <option value="2">Piso 2</option>
            <option value="3">Piso 3</option>
          </select>
        </div>

        <!-- Estadísticas de Filtros -->
        <div class="flex items-center justify-between">
          <p class="text-sm text-slate-600 dark:text-slate-400">
            Mostrando {{ filteredRooms.length }} de {{ totalRooms }} habitaciones
          </p>
          <CButton
            v-if="searchQuery || selectedStatus || selectedFloor"
            variant="secondary"
            size="sm"
            @click="clearFilters"
          >
            Limpiar Filtros
          </CButton>
        </div>
      </div>
    </CCard>

    <!-- Grid de Habitaciones -->
    <div v-if="!loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
    <div v-else class="text-center py-12">
      <Icon
        name="system-uicons:loading"
        size="32"
        class="mx-auto text-blue-500 animate-spin mb-4"
      />
      <p class="text-slate-600 dark:text-slate-400">
        Cargando habitaciones...
      </p>
    </div>

    <!-- Empty State -->
    <div
      v-if="!loading && filteredRooms.length === 0"
      class="text-center py-12"
    >
      <Icon
        name="system-uicons:home"
        size="48"
        class="mx-auto text-slate-400 mb-4"
      />
      <p class="text-slate-600 dark:text-slate-400 mb-4">
        {{ searchQuery || selectedStatus || selectedFloor
          ? 'No hay habitaciones que coincidan con los filtros'
          : 'No hay habitaciones registradas'
        }}
      </p>
      <CButton variant="primary" @click="openAddModal">
        <Icon name="system-uicons:home" size="18" class="mr-2" />
        Agregar Primera Habitación
      </CButton>
    </div>

    <!-- Modal de Habitación -->
    <FRoomForm
      :is-open="isModalOpen"
      :room="selectedRoom"
      :loading="isSubmitting"
      @submit="handleSubmit"
      @cancel="closeModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRoomsStore } from '~/stores/rooms'
import { useUIStore } from '~/stores/ui'
import { useRooms } from '~/composables/useRooms'
import type { CreateRoomRequest, Room } from '~/types'

definePageMeta({
  middleware: ['auth', 'manager']
})

const router = useRouter()
const roomsStore = useRoomsStore()
const uiStore = useUIStore()
const { fetchRooms } = useRooms()

const loading = ref(false)
const isSubmitting = ref(false)
const isModalOpen = ref(false)
const searchQuery = ref('')
const selectedStatus = ref('')
const selectedFloor = ref('')
const selectedRoom = ref<Room | null>(null)

const rooms = computed(() => roomsStore.rooms)
const totalRooms = computed(() => rooms.value.length)

const filteredRooms = computed(() => {
  return rooms.value.filter(room => {
    const matchesSearch = searchQuery.value
      ? room.number.toString().includes(searchQuery.value)
      : true
    const matchesStatus = selectedStatus.value
      ? room.status === selectedStatus.value
      : true
    const matchesFloor = selectedFloor.value
      ? room.floor != null && room.floor.toString() === selectedFloor.value
      : true

    return matchesSearch && matchesStatus && matchesFloor
  })
})

const openAddModal = () => {
  selectedRoom.value = null
  isModalOpen.value = true
}

const editRoom = (roomId: number) => {
  selectedRoom.value = rooms.value.find(r => r.id === roomId) || null
  isModalOpen.value = true
}

const viewRoom = (roomId: number) => {
  router.push(`/rooms/${roomId}`)
}

const closeModal = () => {
  isModalOpen.value = false
  selectedRoom.value = null
}

const handleSubmit = async (data: CreateRoomRequest) => {
  isSubmitting.value = true
  try {
    if (selectedRoom.value) {
      await roomsStore.updateRoom(selectedRoom.value.id, data)
      uiStore.success('Habitación actualizada exitosamente')
    } else {
      await roomsStore.createRoom(data)
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
    await roomsStore.updateRoom(roomId, { status: 'maintenance' })
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

onMounted(async () => {
  loading.value = true
  try {
    await fetchRooms()
  } finally {
    loading.value = false
  }
})
</script>