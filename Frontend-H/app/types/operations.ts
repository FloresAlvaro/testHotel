export interface HotelSettings { hotel_name:string; city:string; email:string; phone:string; address:string; check_in_time:string; check_out_time:string; currency:string; timezone:string; version:number }
export interface CashTotal { method:string; total:string; movements:number }
export interface CashShift { id:number; user_id:number; user_name:string; opening_amount:string; currency:string; opened_at:string; closed_at:string|null; counted_amount:string|null; expected_amount:string|null; notes:string; totals:CashTotal[] }
export interface OperationTask { id:number; room_id:number; room_number:string; kind:string; title:string; notes:string; status:string; assigned_to:number|null; assigned_name:string|null }
export interface StaffOption { id:number; name:string }
export interface CalendarRoom { id:number; number:string; status:string; room_type_name:string }
export interface CalendarReservation { id:number; room_id:number; status:string; check_in:string; check_out:string; client_name:string }
export interface CalendarData { rooms:CalendarRoom[]; reservations:CalendarReservation[]; total:number; page:number; pageSize:number }
export interface AuditEntry { id:number; user_name:string|null; action:string; table_name:string; record_id:number; created_at:string; old_value:Record<string,unknown>|null; new_value:Record<string,unknown>|null }
export interface Receipt { number:string; issued_at:string; payment_status:string; snapshot:{hotel:Pick<HotelSettings,'hotel_name'|'city'|'email'|'phone'|'address'|'currency'|'timezone'>; payment:{id:number; amount:string|number; method:string}; client_name:string; room_number:string; reservation_id:number; historical?:boolean} }
