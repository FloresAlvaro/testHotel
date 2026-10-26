import { RESERVATION_STATUS_LABELS,PAYMENT_STATUS_LABELS } from '~/utils/constants'
import { useApiClient } from '~/services/api'
import type { ApiResponse, PaginatedApiResponse } from '~/types'
import type { PortalProfile, PortalReservation, PortalReservationDetail, GuestAvailability, GuestBookingRequest, GuestBookingResult } from '~/types/portal'
import type { Receipt } from '~/types/operations'
export const useCustomerPortal = () => {
  const api=useApiClient()
  const error=ref(''),loading=ref(false)
  const run=async(work:()=>Promise<void>)=>{
    loading.value=true;error.value=''
    try { await work() }
    catch(e:unknown){const failure=e as {data?:{message?:string}};error.value=failure.data?.message||'No pudimos cargar tu información. Intenta nuevamente.'}
    finally{loading.value=false}
  }
  const profile=()=>api.request<ApiResponse<PortalProfile>>('/portal/profile')
  const nextStay=()=>api.request<ApiResponse<PortalReservation|null>>('/portal/next-stay')
  const reservations=(page=1,status='')=>api.request<PaginatedApiResponse<PortalReservation>>('/portal/reservations',{query:{page,pageSize:10,status:status||undefined}})
  const reservation=(id:string)=>api.request<ApiResponse<PortalReservationDetail>>(`/portal/reservations/${id}`)
  const availability=(check_in:string,check_out:string,page=1,adults=1,children=0)=>api.request<ApiResponse<GuestAvailability>>('/portal/availability',{query:{check_in,check_out,page,pageSize:12,adults,children}})
  const book=(body:GuestBookingRequest)=>api.request<ApiResponse<GuestBookingResult>>('/portal/reservations',{method:'POST',body,retry:0})
  const receipt=(id:string)=>api.request<ApiResponse<Receipt>>(`/portal/receipts/${id}`)
  const states:Record<string,string>={...RESERVATION_STATUS_LABELS,...PAYMENT_STATUS_LABELS}
  const methods:Record<string,string>={cash:'Efectivo',credit_card:'Tarjeta de crédito',debit_card:'Tarjeta de débito',transfer:'Transferencia',check:'Cheque'}
  return {availability,book,profile,nextStay,reservations,reservation,receipt,run,error,loading,states,methods}
}
