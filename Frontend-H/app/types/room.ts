/**
 * Tipos de habitaciones
 */

export type RoomStatus = "available" | "occupied" | "maintenance" | "reserved";

export interface RoomType {
  id: number;
  name: string;
  description: string | null;
  price: string;
  capacity: number;
  amenities: string | null;
  image: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateRoomTypeRequest {
  name: string;
  description?: string;
  price: number;
  capacity: number;
  amenities?: string;
  image?: string;
}

export interface UpdateRoomTypeRequest {
  name?: string;
  description?: string;
  price?: number;
  capacity?: number;
  amenities?: string;
  image?: string;
  is_active?: boolean;
}

export interface Room {
  id: number;
  number: string;
  room_type_id: number;
  room_type_name?: string;
  floor: number | null;
  status: RoomStatus;
  price?: string;
  capacity?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateRoomRequest {
  number: string;
  room_type_id: number;
  floor?: number;
}

export interface UpdateRoomRequest {
  number?: string;
  room_type_id?: number;
  floor?: number;
  status?: RoomStatus;
}

export interface UpdateRoomStatusRequest {
  status: RoomStatus;
}

export interface OccupancyStats {
  total_rooms: string;
  available: string;
  occupied: string;
  maintenance: string;
  reserved: string;
  byFloor?: Record<string, number>;
}

export interface AvailabilityStats {
  id: number;
  name: string;
  total_rooms: string;
  available_rooms: string;
  occupied_rooms: string;
}

export interface RoomState {
  rooms: Room[];
  roomTypes: RoomType[];
  currentRoom: Room | null;
  loading: boolean;
  error: string | null;
  occupancyStats: OccupancyStats | null;
}
