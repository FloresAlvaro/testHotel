import { useApiClient } from "./api";
import type {
  Room,
  RoomStatus,
  CreateRoomRequest,
  UpdateRoomRequest,
} from "~/types";

export const useRoomsService = () => {
  const api = useApiClient();
  const uiStore = useUiStore();

  const getAllRooms = async (status?: RoomStatus) => {
    const firstPage = await api.getRooms(1, 100, status);
    const totalPages = firstPage.pagination?.totalPages ?? 1;

    if (!firstPage.data || totalPages <= 1) {
      return firstPage;
    }

    const remainingPages = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, index) =>
        api.getRooms(index + 2, 100, status),
      ),
    );

    return {
      ...firstPage,
      data: [
        ...firstPage.data,
        ...remainingPages.flatMap((response) => response.data ?? []),
      ],
    };
  };

  // ==================== HABITACIONES ====================

  const getRooms = async (page = 1, pageSize = 10, status?: RoomStatus) => {
    try {
      return await api.getRooms(page, pageSize, status);
    } catch (error) {
      console.error("Error cargando habitaciones:", error);
      throw error;
    }
  };

  const getRoom = async (id: number) => {
    try {
      return await api.getRoom(id);
    } catch (error) {
      console.error("Error cargando habitación:", error);
      throw error;
    }
  };

  const createRoom = async (data: CreateRoomRequest) => {
    try {
      const response = await api.createRoom(data);
      uiStore.success("Habitación creada correctamente");
      return response;
    } catch (error: unknown) {
      uiStore.error("Error al crear habitación");
      throw error;
    }
  };

  const updateRoom = async (id: number, data: UpdateRoomRequest) => {
    try {
      const response = await api.updateRoom(id, data);
      uiStore.success("Habitación actualizada correctamente");
      return response;
    } catch (error: unknown) {
      uiStore.error("Error al actualizar habitación");
      throw error;
    }
  };

  const updateRoomStatus = async (
    id: number,
    status: "available" | "occupied" | "maintenance" | "reserved",
  ) => {
    try {
      const response = await api.updateRoom(id, { status });
      uiStore.success(`Estado de habitación actualizado a: ${status}`);
      return response;
    } catch (error: unknown) {
      uiStore.error("Error al actualizar estado de habitación");
      throw error;
    }
  };

  // ==================== DISPONIBILIDAD ====================

  const getAvailableRooms = async (checkIn: string, checkOut: string) => {
    try {
      return await api.getAvailableRooms(checkIn, checkOut);
    } catch (error) {
      console.error("Error cargando habitaciones disponibles:", error);
      throw error;
    }
  };

  const getAvailableRoomsByType = async (
    roomTypeId: number,
    checkIn: string,
    checkOut: string,
  ) => {
    try {
      const response = await api.getAvailableRooms(checkIn, checkOut);

      if (response.success && response.data) {
        const filtered = response.data.filter(
          (room: Room) => room.room_type_id === roomTypeId,
        );
        return { ...response, data: filtered };
      }

      return response;
    } catch (error) {
      console.error("Error cargando habitaciones disponibles por tipo:", error);
      throw error;
    }
  };

  // ==================== OCUPACIÓN Y ESTADÍSTICAS ====================

  const getOccupancyStatus = async () => {
    try {
      return await api.getOccupancyStatus();
    } catch (error) {
      console.error("Error cargando estado de ocupación:", error);
      throw error;
    }
  };

  const getOccupancyStats = async () => {
    try {
      const response = await api.getOccupancyStatus();

      if (response.success && response.data) {
        // Calcular estadísticas desde los datos
        const stats = {
          total: Number(response.data.total_rooms) || 0,
          available: Number(response.data.available) || 0,
          occupied: Number(response.data.occupied) || 0,
          maintenance: Number(response.data.maintenance) || 0,
          reserved: Number(response.data.reserved) || 0,
          occupancyRate: response.data.total_rooms
            ? (Number(response.data.occupied) /
                Number(response.data.total_rooms)) *
              100
            : 0,
          byFloor: response.data.byFloor || {},
        };

        return { success: true, data: stats };
      }

      return response;
    } catch (error) {
      console.error("Error calculando estadísticas de ocupación:", error);
      throw error;
    }
  };

  // ==================== TIPOS DE HABITACIÓN ====================

  const getRoomTypes = async (page = 1, pageSize = 100) => {
    try {
      return await api.getRoomTypes(page, pageSize);
    } catch (error) {
      console.error("Error cargando tipos de habitación:", error);
      throw error;
    }
  };

  const getRoomTypeById = async (id: number) => {
    try {
      return await api.getRoomType(id);
    } catch (error) {
      console.error("Error cargando tipo de habitación:", error);
      throw error;
    }
  };

  // ==================== BÚSQUEDA Y FILTRADO ====================

  const searchRooms = async (query: string) => {
    try {
      const response = await getAllRooms();

      if (response.success && response.data) {
        const filtered = response.data.filter((room: Room) => {
          const searchLower = query.toLowerCase();
          return (
            room.number.toString().includes(searchLower) ||
            room.room_type_name?.toLowerCase().includes(searchLower) ||
            room.floor?.toString().includes(searchLower)
          );
        });

        return { success: true, data: filtered };
      }

      return response;
    } catch (error) {
      console.error("Error buscando habitaciones:", error);
      throw error;
    }
  };

  const getRoomsByFloor = async (floor: number) => {
    try {
      const response = await getAllRooms();

      if (response.success && response.data) {
        const filtered = response.data.filter(
          (room: Room) => room.floor === floor,
        );
        return { success: true, data: filtered };
      }

      return response;
    } catch (error) {
      console.error("Error cargando habitaciones del piso:", error);
      throw error;
    }
  };

  const getRoomsByStatus = async (status: RoomStatus) => {
    try {
      return await getAllRooms(status);
    } catch (error) {
      console.error("Error cargando habitaciones por estado:", error);
      throw error;
    }
  };

  // ==================== MANTENIMIENTO ====================

  const markForMaintenance = async (id: number) => {
    try {
      const response = await api.updateRoom(id, { status: "maintenance" });
      uiStore.success("Habitación marcada para mantenimiento");
      return response;
    } catch (error: unknown) {
      uiStore.error("Error al marcar habitación para mantenimiento");
      throw error;
    }
  };

  const markAsAvailable = async (id: number) => {
    try {
      const response = await api.updateRoom(id, { status: "available" });
      uiStore.success("Habitación marcada como disponible");
      return response;
    } catch (error: unknown) {
      uiStore.error("Error al marcar habitación como disponible");
      throw error;
    }
  };

  // ==================== INFORMACIÓN DETALLADA ====================

  const getRoomDetails = async (id: number) => {
    try {
      return await api.getRoom(id);
    } catch (error) {
      console.error("Error cargando detalles de habitación:", error);
      throw error;
    }
  };

  const getRoomAvailability = async (
    id: number,
    checkIn: string,
    checkOut: string,
  ) => {
    try {
      const availableRooms = await api.getAvailableRooms(checkIn, checkOut);

      if (availableRooms.success && availableRooms.data) {
        const isAvailable = availableRooms.data.some(
          (room: Room) => room.id === id,
        );
        return { success: true, data: { roomId: id, isAvailable } };
      }

      return availableRooms;
    } catch (error) {
      console.error("Error verificando disponibilidad:", error);
      throw error;
    }
  };

  return {
    // Habitaciones
    getRooms,
    getRoom,
    getRoomDetails,
    createRoom,
    updateRoom,
    updateRoomStatus,

    // Disponibilidad
    getAvailableRooms,
    getAvailableRoomsByType,
    getRoomAvailability,

    // Ocupación
    getOccupancyStatus,
    getOccupancyStats,

    // Tipos
    getRoomTypes,
    getRoomTypeById,

    // Búsqueda
    searchRooms,
    getRoomsByFloor,
    getRoomsByStatus,

    // Mantenimiento
    markForMaintenance,
    markAsAvailable,
  };
};
