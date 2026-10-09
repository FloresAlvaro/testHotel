import type { components } from './generated/api';
/**
 * Tipos de reservas
 */

export type ReservationStatus = components['schemas']['ReservationStatus'];

export type Reservation = components['schemas']['Reservation'];

export type CreateReservationRequest = components['schemas']['CreateReservationRequest'];

export type UpdateReservationRequest = components['schemas']['UpdateReservationRequest'];

export type CheckInLogData = components['schemas']['CheckInLogData'];

export interface ReservationWithDetails extends Reservation {
  checkInLog?: CheckInLogData;
}

export interface ReservationStats {
  total_reservations: number;
  active_reservations: number;
  completed_reservations: number;
  cancelled_reservations: number;
  average_stay_days?: number;
}

export interface ReservationState {
  reservations: Reservation[];
  currentReservation: Reservation | null;
  activeReservations: Reservation[];
  upcomingReservations: Reservation[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
