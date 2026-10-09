import type { components } from './generated/api';
/**
 * Tipos de habitaciones
 */

export type RoomStatus = components['schemas']['RoomStatus'];

export type RoomType = components['schemas']['RoomType'];

export type CreateRoomTypeRequest = components['schemas']['CreateRoomTypeRequest'];

export type UpdateRoomTypeRequest = components['schemas']['UpdateRoomTypeRequest'];

export type Room = components['schemas']['Room'];

export type CreateRoomRequest = components['schemas']['CreateRoomRequest'];

export type UpdateRoomRequest = components['schemas']['UpdateRoomRequest'];

export type UpdateRoomStatusRequest = components['schemas']['UpdateRoomStatusRequest'];

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
