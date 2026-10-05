import { defineStore } from "pinia";
import { useApiClient } from "../services/api";
import { getErrorMessage } from "~/utils/errors";
import type {
  OccupancyStats,
  Room,
  RoomStatus,
  RoomType,
  CreateRoomRequest,
  UpdateRoomRequest,
} from "~/types";

export const useRoomsStore = defineStore("rooms", () => {
  const api = useApiClient();

  // State
  const rooms = ref<Room[]>([]);
  const roomTypes = ref<RoomType[]>([]);
  const currentRoom = ref<Room | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const occupancyStats = ref<OccupancyStats | null>(null);
  const pagination = ref({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });

  // Computed
  const availableRooms = computed(() =>
    rooms.value.filter((r) => r.status === "available"),
  );
  const occupiedRooms = computed(() =>
    rooms.value.filter((r) => r.status === "occupied"),
  );
  const maintenanceRooms = computed(() =>
    rooms.value.filter((r) => r.status === "maintenance"),
  );

  // Actions
  const fetchRooms = async (page = 1, pageSize = 10) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.getRooms(page, pageSize);

      if (response.data) {
        rooms.value = response.data;
      }

      if (response.pagination) {
        pagination.value = response.pagination;
      }
    } catch (err: unknown) {
      error.value = getErrorMessage(err, "Error cargando habitaciones");
      console.error("Error fetchRooms:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchRoom = async (id: number) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.getRoom(id);

      if (response.data) {
        currentRoom.value = response.data;
      }
    } catch (err: unknown) {
      error.value = getErrorMessage(err, "Error cargando habitación");
      console.error("Error fetchRoom:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchAvailableRooms = async (checkIn: string, checkOut: string) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.getAvailableRooms(checkIn, checkOut);

      if (response.data) {
        rooms.value = response.data;
      }
    } catch (err: unknown) {
      error.value = getErrorMessage(
        err,
        "Error cargando habitaciones disponibles",
      );
      console.error("Error fetchAvailableRooms:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchOccupancyStatus = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.getOccupancyStatus();

      if (response.data) {
        occupancyStats.value = response.data;
      }
    } catch (err: unknown) {
      error.value = getErrorMessage(err, "Error cargando ocupación");
      console.error("Error fetchOccupancyStatus:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const createRoom = async (data: CreateRoomRequest) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.createRoom(data);

      if (response.data) {
        rooms.value.push(response.data);
        return response.data;
      }
    } catch (err: unknown) {
      error.value = getErrorMessage(err, "Error creando habitación");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateRoom = async (id: number, data: UpdateRoomRequest) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.updateRoom(id, data);

      if (response.data) {
        const index = rooms.value.findIndex((r) => r.id === id);
        if (index !== -1) {
          rooms.value[index] = response.data;
        }
        if (currentRoom.value?.id === id) {
          currentRoom.value = response.data;
        }
        return response.data;
      }
    } catch (err: unknown) {
      error.value = getErrorMessage(err, "Error actualizando habitación");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchRoomTypes = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.getRoomTypes(1, 100);
      if (response.data) {
        roomTypes.value = response.data;
      }
    } catch (err: unknown) {
      error.value = getErrorMessage(err, "Error cargando tipos de habitación");
      console.error("Error fetchRoomTypes:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateRoomStatus = async (id: number, status: RoomStatus) => {
    return updateRoom(id, { status });
  };

  const clearError = () => {
    error.value = null;
  };

  const reset = () => {
    rooms.value = [];
    currentRoom.value = null;
    occupancyStats.value = null;
    loading.value = false;
    error.value = null;
  };

  return {
    // State
    rooms,
    roomTypes,
    currentRoom,
    loading,
    error,
    occupancyStats,
    pagination,

    // Computed
    availableRooms,
    occupiedRooms,
    maintenanceRooms,

    // Methods
    fetchRooms,
    fetchRoom,
    fetchAvailableRooms,
    fetchRoomTypes,
    fetchOccupancyStatus,
    createRoom,
    updateRoom,
    updateRoomStatus,
    clearError,
    reset,
  };
});
