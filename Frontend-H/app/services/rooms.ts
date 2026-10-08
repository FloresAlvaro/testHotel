import { useApiClient } from "./api";
import type {
  Room,
  RoomStatus,
  CreateRoomRequest,
  UpdateRoomRequest,
} from "~/types";

export const useRoomsService = () => {
  const api = useApiClient();

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
    return await api.getRooms(page, pageSize, status);
  };

  const getRoom = async (id: number) => {
    return await api.getRoom(id);
  };

  const createRoom = async (data: CreateRoomRequest) => {
    return await api.createRoom(data);
  };

  const updateRoom = async (id: number, data: UpdateRoomRequest) => {
    return await api.updateRoom(id, data);
  };

  const updateRoomStatus = async (
    id: number,
    status: "available" | "occupied" | "maintenance" | "reserved",
  ) => {
    return await api.updateRoom(id, { status });
  };

  // ==================== DISPONIBILIDAD ====================

  const getAvailableRooms = async (checkIn: string, checkOut: string) => {
    return await api.getAvailableRooms(checkIn, checkOut);
  };

  const getAvailableRoomsByType = async (
    roomTypeId: number,
    checkIn: string,
    checkOut: string,
  ) => {
    const response = await api.getAvailableRooms(checkIn, checkOut);

    if (response.success && response.data) {
      const filtered = response.data.filter(
        (room: Room) => room.room_type_id === roomTypeId,
      );
      return { ...response, data: filtered };
    }

    return response;
  };

  // ==================== OCUPACIÓN Y ESTADÍSTICAS ====================

  const getOccupancyStatus = async () => {
    return await api.getOccupancyStatus();
  };

  const getOccupancyStats = async () => {
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
  };

  // ==================== TIPOS DE HABITACIÓN ====================

  const getRoomTypes = async (page = 1, pageSize = 100) => {
    return await api.getRoomTypes(page, pageSize);
  };

  const getRoomTypeById = async (id: number) => {
    return await api.getRoomType(id);
  };

  // ==================== BÚSQUEDA Y FILTRADO ====================

  const searchRooms = async (query: string) => {
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
  };

  const getRoomsByFloor = async (floor: number) => {
    const response = await getAllRooms();

    if (response.success && response.data) {
      const filtered = response.data.filter(
        (room: Room) => room.floor === floor,
      );
      return { success: true, data: filtered };
    }

    return response;
  };

  const getRoomsByStatus = async (status: RoomStatus) => {
    return await getAllRooms(status);
  };

  // ==================== MANTENIMIENTO ====================

  const markForMaintenance = async (id: number) => {
    return await api.updateRoom(id, { status: "maintenance" });
  };

  const markAsAvailable = async (id: number) => {
    return await api.updateRoom(id, { status: "available" });
  };

  // ==================== INFORMACIÓN DETALLADA ====================

  const getRoomDetails = async (id: number) => {
    return await api.getRoom(id);
  };

  const getRoomAvailability = async (
    id: number,
    checkIn: string,
    checkOut: string,
  ) => {
    const availableRooms = await api.getAvailableRooms(checkIn, checkOut);

    if (availableRooms.success && availableRooms.data) {
      const isAvailable = availableRooms.data.some(
        (room: Room) => room.id === id,
      );
      return { success: true, data: { roomId: id, isAvailable } };
    }

    return availableRooms;
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
