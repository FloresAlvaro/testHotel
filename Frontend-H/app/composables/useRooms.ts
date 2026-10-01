import { useRoomsService } from "../services/rooms";
import type { Room, CreateRoomRequest, UpdateRoomRequest } from "~/types";

export const useRooms = () => {
  const roomsStore = useRoomsStore();
  const roomsService = useRoomsService();
  const uiStore = useUiStore();

  // ==================== STATE ====================
  const rooms = computed(() => roomsStore.rooms);
  const currentRoom = computed(() => roomsStore.currentRoom);
  const loading = computed(() => roomsStore.loading);
  const error = computed(() => roomsStore.error);
  const occupancyStats = computed(() => roomsStore.occupancyStats);
  const availableRooms = computed(() => roomsStore.availableRooms);
  const occupiedRooms = computed(() => roomsStore.occupiedRooms);
  const maintenanceRooms = computed(() => roomsStore.maintenanceRooms);

  // ==================== FILTROS ====================
  const selectedFloor = ref<number | null>(null);
  const selectedStatus = ref<string | null>(null);
  const selectedRoomType = ref<number | null>(null);

  const filteredRooms = computed(() => {
    return rooms.value.filter((room) => {
      if (selectedFloor.value && room.floor !== selectedFloor.value)
        return false;
      if (selectedStatus.value && room.status !== selectedStatus.value)
        return false;
      if (
        selectedRoomType.value &&
        room.room_type_id !== selectedRoomType.value
      )
        return false;
      return true;
    });
  });

  // ==================== DISPONIBILIDAD ====================
  const checkInDate = ref<string>("");
  const checkOutDate = ref<string>("");
  const availableRoomsFiltered = ref<Room[]>([]);

  // ==================== MÉTODOS ====================

  /**
   * Cargar todas las habitaciones
   */
  const fetchRooms = async (page = 1, pageSize = 10) => {
    try {
      await roomsStore.fetchRooms(page, pageSize);
    } catch (error) {
      console.error("Error cargando habitaciones:", error);
      throw error;
    }
  };

  /**
   * Cargar habitación por ID
   */
  const fetchRoom = async (id: number) => {
    try {
      await roomsStore.fetchRoom(id);
    } catch (error) {
      console.error("Error cargando habitación:", error);
      throw error;
    }
  };

  /**
   * Buscar habitaciones disponibles por fechas
   */
  const searchAvailableRooms = async (checkIn: string, checkOut: string) => {
    checkInDate.value = checkIn;
    checkOutDate.value = checkOut;

    try {
      const response = await roomsService.getAvailableRooms(checkIn, checkOut);
      if (response.success && response.data) {
        availableRoomsFiltered.value = response.data;
      }
    } catch (error) {
      console.error("Error buscando habitaciones disponibles:", error);
      throw error;
    }
  };

  /**
   * Crear habitación
   */
  const createRoom = async (data: CreateRoomRequest) => {
    try {
      const response = await roomsStore.createRoom(data);
      uiStore.success(`Habitación ${data.number} creada exitosamente`);
      return response;
    } catch {
      uiStore.error("Error al crear habitación");
      throw error;
    }
  };

  /**
   * Actualizar habitación
   */
  const updateRoom = async (id: number, data: UpdateRoomRequest) => {
    try {
      const response = await roomsStore.updateRoom(id, data);
      uiStore.success("Habitación actualizada exitosamente");
      return response;
    } catch {
      uiStore.error("Error al actualizar habitación");
      throw error;
    }
  };

  /**
   * Marcar habitación para mantenimiento
   */
  const sendToMaintenance = async (roomId: number) => {
    try {
      await roomsService.markForMaintenance(roomId);
      await roomsStore.updateRoomStatus(roomId, "maintenance");
      uiStore.success("Habitación marcada para mantenimiento");
    } catch {
      uiStore.error("Error al marcar para mantenimiento");
      throw error;
    }
  };

  /**
   * Marcar habitación como disponible
   */
  const markAsAvailable = async (roomId: number) => {
    try {
      await roomsService.markAsAvailable(roomId);
      await roomsStore.updateRoomStatus(roomId, "available");
      uiStore.success("Habitación marcada como disponible");
    } catch {
      uiStore.error("Error al marcar como disponible");
      throw error;
    }
  };

  /**
   * Cargar estadísticas de ocupación
   */
  const fetchOccupancyStats = async () => {
    try {
      await roomsStore.fetchOccupancyStatus();
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
      throw error;
    }
  };

  /**
   * Filtrar por piso
   */
  const filterByFloor = (floor: number | null) => {
    selectedFloor.value = floor;
  };

  /**
   * Filtrar por estado
   */
  const filterByStatus = (status: string | null) => {
    selectedStatus.value = status;
  };

  /**
   * Filtrar por tipo de habitación
   */
  const filterByRoomType = (typeId: number | null) => {
    selectedRoomType.value = typeId;
  };

  /**
   * Limpiar filtros
   */
  const clearFilters = () => {
    selectedFloor.value = null;
    selectedStatus.value = null;
    selectedRoomType.value = null;
  };

  /**
   * Obtener información de disponibilidad
   */
  const checkAvailability = async (
    roomId: number,
    checkIn: string,
    checkOut: string,
  ) => {
    try {
      const response = await roomsService.getRoomAvailability(
        roomId,
        checkIn,
        checkOut,
      );
      return response;
    } catch (error) {
      console.error("Error verificando disponibilidad:", error);
      throw error;
    }
  };

  return {
    // State
    rooms,
    currentRoom,
    loading,
    error,
    occupancyStats,
    availableRooms,
    occupiedRooms,
    maintenanceRooms,
    filteredRooms,
    availableRoomsFiltered,

    // Filters
    selectedFloor: readonly(selectedFloor),
    selectedStatus: readonly(selectedStatus),
    selectedRoomType: readonly(selectedRoomType),
    checkInDate: readonly(checkInDate),
    checkOutDate: readonly(checkOutDate),

    // Methods
    fetchRooms,
    fetchRoom,
    searchAvailableRooms,
    createRoom,
    updateRoom,
    sendToMaintenance,
    markAsAvailable,
    fetchOccupancyStats,
    filterByFloor,
    filterByStatus,
    filterByRoomType,
    clearFilters,
    checkAvailability,
  };
};
