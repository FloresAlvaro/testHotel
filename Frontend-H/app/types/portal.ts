import type { PaymentMethod, PaymentStatus, PaymentType, ReservationStatus } from '~/types'
export interface PortalProfile { name:string; email:string|null; phone:string|null }
export interface PortalPayment { id:number; amount:string; method:PaymentMethod; type:PaymentType; status:PaymentStatus; created_at:string; has_receipt:boolean }
export interface PortalReservation { id:number; check_in:string; check_out:string; status:ReservationStatus; total_price:string; paid_amount:string; can_request:boolean; adults:number;children:number;arrival_time:string|null;special_requests:string; room_number:string; room_type_name:string }
export interface PortalReservationDetail extends PortalReservation { payments:PortalPayment[] }
export interface CustomerAccount { id:number; name:string; email:string; is_active:boolean; created_at:string }

export interface AvailableGuestRoom { id:number;number:string;room_type_name:string;capacity:number;price:string;description?:string;image_url?:string;total_price:string }
export interface GuestAvailability { rooms:AvailableGuestRoom[];total:number;nights:number;currency:string }
export interface GuestBookingRequest { check_in:string;check_out:string;adults?:number;children?:number;arrival_time?:string;special_requests?:string;room_id:number;expected_total:number;expected_currency:string }
export interface GuestBookingResult { id:number;status:ReservationStatus;check_in:string;check_out:string;total_price:string;currency:string }
