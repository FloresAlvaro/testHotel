/**
 * Tipos de reservas
 */

export type ReservationStatus =
  | "confirmed"
  | "checked_in"
  | "checked_out"
  | "cancelled";

export interface Reservation {
  id: number;
  check_in: string; // Date formato YYYY-MM-DD
  check_out: string; // Date formato YYYY-MM-DD
  client_id: number;
  client_name?: string;
  client_document?: string | null;
  client_phone?: string | null;
  client_email?: string | null;
  room_id: number;
  room_number?: string;
  room_type_name?: string;
  user_id: number;
  receptionist_name?: string;
  total_price: string;
  status: ReservationStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateReservationRequest {
  check_in: string;
  check_out: string;
  client_id: number;
  room_id: number;
  notes?: string;
}

export interface UpdateReservationRequest {
  check_in?: string;
  check_out?: string;
  total_price?: number;
  status?: ReservationStatus;
  notes?: string;
}

export interface CheckInLogData {
  id: number;
  reservation_id: number;
  user_id: number;
  check_in_time: string | null;
  check_out_time: string | null;
  notes: string | null;
  client_name?: string;
  room_number?: string;
  room_type_name?: string;
  scheduled_checkout_date?: string;
  total_price?: string;
  created_at: string;
  updated_at: string;
}

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
